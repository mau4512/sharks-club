import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const reporte = await prisma.reporteEntrenador.update({
      where: { id: params.id },
      data: {
        completada: body.completada !== false,
        observaciones: body.observaciones?.trim() || null,
        motivoIncompleta: body.motivoIncompleta?.trim() || null,
        requerimientos: body.requerimientos?.trim() || null,
        detalleEjercicios: sanitizeDetalleEjercicios(body.detalleEjercicios) ?? Prisma.DbNull,
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

    return NextResponse.json(reporte)
  } catch (error: any) {
    console.error('Error al actualizar reporte del entrenador:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar reporte del entrenador' },
      { status: 500 }
    )
  }
}
