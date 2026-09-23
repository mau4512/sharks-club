import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener asistencias (filtrado por turno o deportista)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const turnoId = searchParams.get('turnoId')
    const deportistaId = searchParams.get('deportistaId')
    const fecha = searchParams.get('fecha')

    const where: any = {}
    
    if (turnoId) where.turnoId = turnoId
    if (deportistaId) where.deportistaId = deportistaId
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      
      where.fecha = {
        gte: fechaInicio,
        lte: fechaFin
      }
    }

    const asistencias = await prisma.asistencia.findMany({
      where,
      include: {
        deportista: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true
          }
        },
        turno: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            hora: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    return NextResponse.json(asistencias)
  } catch (error) {
    console.error('Error al obtener asistencias:', error)
    return NextResponse.json(
      { error: 'Error al obtener asistencias' },
      { status: 500 }
    )
  }
}

// POST - Registrar o actualizar asistencias
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { turnoId, asistencias, fecha } = body

    if (!turnoId || !asistencias || !Array.isArray(asistencias)) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    const deportistaIds = asistencias
      .map((asistencia: any) => asistencia?.deportistaId)
      .filter((id: unknown): id is string => typeof id === 'string' && Boolean(id))
    const deportistasActivos = await prisma.deportista.findMany({
      where: {
        id: { in: deportistaIds },
        turnoId,
        activo: true,
      },
      select: { id: true },
    })
    const idsPermitidos = new Set(deportistasActivos.map((deportista) => deportista.id))
    const asistenciasValidas = asistencias.filter((asistencia: any) => idsPermitidos.has(asistencia?.deportistaId))

    // Fecha del día (sin hora)
    const fechaAsistencia = fecha ? new Date(fecha) : new Date()
    fechaAsistencia.setHours(0, 0, 0, 0)

    // Registrar cada asistencia
    const resultados = await Promise.all(
      asistenciasValidas.map(async (asistencia: any) => {
        return await prisma.asistencia.upsert({
          where: {
            deportistaId_turnoId_fecha: {
              deportistaId: asistencia.deportistaId,
              turnoId: turnoId,
              fecha: fechaAsistencia
            }
          },
          update: {
            presente: asistencia.presente,
            notas: asistencia.notas || null
          },
          create: {
            deportistaId: asistencia.deportistaId,
            turnoId: turnoId,
            fecha: fechaAsistencia,
            presente: asistencia.presente,
            notas: asistencia.notas || null
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      count: resultados.length,
      asistencias: resultados
    })
  } catch (error: any) {
    console.error('Error al registrar asistencias:', error)
    return NextResponse.json(
      { error: 'Error al registrar asistencias', details: error.message },
      { status: 500 }
    )
  }
}
