import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const emptyGameStats = {
  t2Convertidos: 0,
  t2Intentados: 0,
  t3Convertidos: 0,
  t3Intentados: 0,
  tlConvertidos: 0,
  tlIntentados: 0,
  rebotesOfensivos: 0,
  rebotesDefensivos: 0,
  asistencias: 0,
  perdidas: 0,
  robos: 0,
  bloqueos: 0,
  faltas: 0,
  puntosContraataque: 0,
  puntosSegundaOportunidad: 0,
}

function puntos(stats: typeof emptyGameStats) {
  return stats.t2Convertidos * 2 + stats.t3Convertidos * 3 + stats.tlConvertidos
}

function pct(convertidos: number, intentados: number) {
  return intentados ? Math.round((convertidos / intentados) * 100) : 0
}

function sumGameStats(total: typeof emptyGameStats, stats: any) {
  return Object.keys(emptyGameStats).reduce((acc, key) => ({
    ...acc,
    [key]: Number(acc[key as keyof typeof emptyGameStats]) + (Number(stats?.[key]) || 0),
  }), total)
}

// GET /api/estadisticas/deportista/[id] - Obtener estadísticas y promedios de un deportista
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deportistaId = params.id

    const partidos = await prisma.partidoEntrenador.findMany({
      where: {
        estado: 'jugado',
      },
      select: {
        id: true,
        titulo: true,
        rival: true,
        competencia: true,
        categoria: true,
        fechaPartido: true,
        resultadoPropio: true,
        resultadoRival: true,
        estadisticas: true,
      },
      orderBy: {
        fechaPartido: 'desc',
      },
    })

    const partidosJugador = partidos
      .map((partido) => {
        const estadisticas = partido.estadisticas as any
        const jugador = estadisticas?.jugadores?.find((item: any) => item.id === deportistaId)
        if (!jugador) return null

        const stats = { ...emptyGameStats, ...jugador }
        return {
          id: partido.id,
          titulo: partido.titulo,
          rival: partido.rival,
          competencia: partido.competencia,
          categoria: partido.categoria,
          fechaPartido: partido.fechaPartido,
          resultadoPropio: partido.resultadoPropio,
          resultadoRival: partido.resultadoRival,
          puntos: puntos(stats),
          estadisticas: stats,
        }
      })
      .filter(Boolean)

    const totalesPartidos = partidosJugador.reduce(
      (total, partido: any) => sumGameStats(total, partido.estadisticas),
      { ...emptyGameStats }
    )

    const resumenPartidos = {
      partidosJugados: partidosJugador.length,
      puntos: puntos(totalesPartidos),
      puntosPorPartido: partidosJugador.length ? Number((puntos(totalesPartidos) / partidosJugador.length).toFixed(1)) : 0,
      rebotesPorPartido: partidosJugador.length ? Number(((totalesPartidos.rebotesOfensivos + totalesPartidos.rebotesDefensivos) / partidosJugador.length).toFixed(1)) : 0,
      asistenciasPorPartido: partidosJugador.length ? Number((totalesPartidos.asistencias / partidosJugador.length).toFixed(1)) : 0,
      robosPorPartido: partidosJugador.length ? Number((totalesPartidos.robos / partidosJugador.length).toFixed(1)) : 0,
      bloqueosPorPartido: partidosJugador.length ? Number((totalesPartidos.bloqueos / partidosJugador.length).toFixed(1)) : 0,
      pct2: pct(totalesPartidos.t2Convertidos, totalesPartidos.t2Intentados),
      pct3: pct(totalesPartidos.t3Convertidos, totalesPartidos.t3Intentados),
      pctTl: pct(totalesPartidos.tlConvertidos, totalesPartidos.tlIntentados),
      puntosContraataque: totalesPartidos.puntosContraataque,
      puntosSegundaOportunidad: totalesPartidos.puntosSegundaOportunidad,
      totales: totalesPartidos,
      historial: partidosJugador,
    }

    // Obtener todas las sesiones del deportista
    const sesiones = await prisma.sesionEntrenamiento.findMany({
      where: {
        deportistaId
      },
      include: {
        planEntrenamiento: {
          select: {
            titulo: true,
            fecha: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    if (sesiones.length === 0) {
      return NextResponse.json({
        totalSesiones: 0,
        ejerciciosUnicos: 0,
        promedioCompletitud: 0,
        duracionTotal: 0,
        ejercicios: [],
        partidos: resumenPartidos,
      })
    }

    // Analizar ejercicios
    const ejerciciosMap = new Map<string, {
      titulo: string
      sesiones: number
      completados: number
      porcentajes: number[]
      ultimaSesion: Date
    }>()

    sesiones.forEach(sesion => {
      const resultados = sesion.resultados as any[]
      
      resultados.forEach((ejercicio: any) => {
        const key = ejercicio.titulo
        
        if (!ejerciciosMap.has(key)) {
          ejerciciosMap.set(key, {
            titulo: ejercicio.titulo,
            sesiones: 0,
            completados: 0,
            porcentajes: [],
            ultimaSesion: sesion.fecha
          })
        }

        const stats = ejerciciosMap.get(key)!
        stats.sesiones++
        
        if (ejercicio.completado) {
          stats.completados++
        }

        // Calcular porcentaje si tiene puntos de tiro
        if (ejercicio.puntosTiro && Array.isArray(ejercicio.puntosTiro)) {
          let totalConvertidos = 0
          let totalIntentos = 0

          ejercicio.puntosTiro.forEach((punto: any) => {
            if (punto.amboLados) {
              totalConvertidos += punto.cantidad * 2
              totalIntentos += (punto.realizadoIzq || 0) + (punto.realizadoDer || 0)
            } else {
              totalConvertidos += punto.cantidad
              totalIntentos += (punto.realizadoIzq || 0)
            }
          })

          if (totalIntentos > 0) {
            const porcentaje = Math.round((totalConvertidos / totalIntentos) * 100)
            stats.porcentajes.push(porcentaje)
          }
        }
      })
    })

    // Calcular estadísticas globales
    const ejercicios = Array.from(ejerciciosMap.values()).map(stats => {
      const promedioEfectividad = stats.porcentajes.length > 0
        ? Math.round(stats.porcentajes.reduce((a, b) => a + b, 0) / stats.porcentajes.length)
        : null

      const tendencia = stats.porcentajes.length >= 2
        ? stats.porcentajes[0] - stats.porcentajes[stats.porcentajes.length - 1]
        : null

      return {
        titulo: stats.titulo,
        sesiones: stats.sesiones,
        completados: stats.completados,
        porcentajeCompletitud: Math.round((stats.completados / stats.sesiones) * 100),
        promedioEfectividad,
        tendencia,
        ultimaSesion: stats.ultimaSesion
      }
    })

    // Ordenar por sesiones más recientes
    ejercicios.sort((a, b) => new Date(b.ultimaSesion).getTime() - new Date(a.ultimaSesion).getTime())

    const totalEjerciciosRealizados = sesiones.reduce((sum, s) => sum + (s.resultados as any[]).length, 0)
    const totalEjerciciosCompletados = sesiones.reduce((sum, s) => {
      return sum + (s.resultados as any[]).filter((e: any) => e.completado).length
    }, 0)

    return NextResponse.json({
      totalSesiones: sesiones.length,
      ejerciciosUnicos: ejerciciosMap.size,
      promedioCompletitud: Math.round((totalEjerciciosCompletados / totalEjerciciosRealizados) * 100),
      duracionTotal: sesiones.reduce((sum, s) => sum + s.duracion, 0),
      ejercicios,
      partidos: resumenPartidos,
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
