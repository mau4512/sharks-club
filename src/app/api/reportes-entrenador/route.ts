import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type DetalleEjercicioInput = {
  ejercicioId: string
  titulo: string
  completado: boolean
  observaciones: string
  ajuste: string
}

function sanitizeDetalleEjercicios(value: unknown) {
  if (!Array.isArray(value)) return null

  const detalle = value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null

      const record = item as Record<string, unknown>
      const titulo = typeof record.titulo === 'string' ? record.titulo.trim() : ''
      if (!titulo) return null

      return {
        ejercicioId:
          typeof record.ejercicioId === 'string' && record.ejercicioId.trim()
            ? record.ejercicioId.trim()
            : `ejercicio-${index + 1}`,
        titulo,
        completado: record.completado !== false,
        observaciones:
          typeof record.observaciones === 'string' && record.observaciones.trim()
            ? record.observaciones.trim()
            : '',
        ajuste:
          typeof record.ajuste === 'string' && record.ajuste.trim()
            ? record.ajuste.trim()
            : '',
      }
    })
    .filter((item): item is DetalleEjercicioInput => item !== null)

  return detalle.length > 0 ? detalle : null
}

function getMonthBounds(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)
  const start = new Date(year, monthIndex - 1, 1)
  const end = new Date(year, monthIndex, 1)
  return { start, end }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entrenadorId = searchParams.get('entrenadorId')
    const month = searchParams.get('month')

    if (!entrenadorId || !month) {
      return NextResponse.json(
        { error: 'entrenadorId y month son requeridos' },
        { status: 400 }
      )
    }

    const { start, end } = getMonthBounds(month)

    const reportes = await prisma.reporteEntrenador.findMany({
      where: {
        entrenadorId,
        fechaSesion: {
          gte: start,
          lt: end,
        },
      },
      include: {
        turno: {
          select: {
            id: true,
            nombre: true,
            hora: true,
          },
        },
        planEntrenamiento: {
          select: {
            id: true,
            titulo: true,
            fecha: true,
          },
        },
      },
      orderBy: [
        { fechaSesion: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(reportes)
  } catch (error) {
    console.error('Error al obtener reportes del entrenador:', error)
    return NextResponse.json(
      { error: 'Error al obtener reportes del entrenador' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.entrenadorId || !body.turnoId || !body.fechaSesion) {
      return NextResponse.json(
        { error: 'entrenadorId, turnoId y fechaSesion son requeridos' },
        { status: 400 }
      )
    }

    const fechaSesion = new Date(`${body.fechaSesion}T12:00:00`)

    const reporte = await prisma.reporteEntrenador.create({
      data: {
        fechaSesion,
        entrenadorId: body.entrenadorId,
        turnoId: body.turnoId,
        planEntrenamientoId: body.planEntrenamientoId || null,
        completada: body.completada !== false,
        observaciones: body.observaciones?.trim() || null,
        motivoIncompleta: body.motivoIncompleta?.trim() || null,
        requerimientos: body.requerimientos?.trim() || null,
        detalleEjercicios: sanitizeDetalleEjercicios(body.detalleEjercicios),
      },
      include: {
        turno: {
          select: {
            id: true,
            nombre: true,
            hora: true,
          },
        },
        planEntrenamiento: {
          select: {
            id: true,
            titulo: true,
            fecha: true,
          },
        },
      },
    })

    return NextResponse.json(reporte, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear reporte del entrenador:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un reporte para esta sesión. Actualiza el registro existente.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear reporte del entrenador' },
      { status: 500 }
    )
  }
}
