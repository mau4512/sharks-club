import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function buildTituloPartido(body: Record<string, any>) {
  const rival = body.rival?.trim()
  const partes = [
    body.categoria?.trim(),
    body.competencia?.trim(),
    rival ? `vs ${rival}` : '',
  ].filter(Boolean)

  if (partes.length <= 1 && rival) {
    return `Partido vs ${rival}`
  }

  return partes.join(' · ')
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entrenadorId = searchParams.get('entrenadorId')

    if (!entrenadorId) {
      return NextResponse.json(
        { error: 'entrenadorId es requerido' },
        { status: 400 }
      )
    }

    const partidos = await prisma.partidoEntrenador.findMany({
      where: { entrenadorId },
      orderBy: [
        { fechaPartido: 'asc' },
        { horaPartido: 'asc' },
      ],
    })

    return NextResponse.json(partidos)
  } catch (error) {
    console.error('Error al obtener partidos del entrenador:', error)
    return NextResponse.json(
      { error: 'Error al obtener partidos del entrenador' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.entrenadorId || !body.rival || !body.fechaPartido || !body.horaPartido) {
      return NextResponse.json(
        { error: 'entrenadorId, rival, fechaPartido y horaPartido son requeridos' },
        { status: 400 }
      )
    }

    const partido = await prisma.partidoEntrenador.create({
      data: {
        entrenadorId: body.entrenadorId,
        turnoId: body.turnoId || null,
        titulo: buildTituloPartido(body),
        rival: body.rival.trim(),
        competencia: body.competencia?.trim() || null,
        categoria: body.categoria?.trim() || null,
        sede: body.sede?.trim() || null,
        localia: body.localia === 'visitante' ? 'visitante' : 'local',
        fechaPartido: new Date(`${body.fechaPartido}T12:00:00`),
        horaPartido: body.horaPartido,
        estado: body.estado || 'programado',
        resultadoPropio: Number.isFinite(body.resultadoPropio) ? body.resultadoPropio : null,
        resultadoRival: Number.isFinite(body.resultadoRival) ? body.resultadoRival : null,
        estadisticas: body.estadisticas || null,
        analisisGeneral: body.analisisGeneral?.trim() || null,
        erroresDeficiencias: body.erroresDeficiencias?.trim() || null,
        correccionesProximaSemana: body.correccionesProximaSemana?.trim() || null,
        microcicloTrabajo: body.microcicloTrabajo?.trim() || null,
      },
    })

    return NextResponse.json(partido, { status: 201 })
  } catch (error) {
    console.error('Error al crear partido del entrenador:', error)
    return NextResponse.json(
      { error: 'Error al crear partido del entrenador' },
      { status: 500 }
    )
  }
}
