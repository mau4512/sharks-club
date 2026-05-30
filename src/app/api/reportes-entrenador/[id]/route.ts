import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { notificarAdmins, notificarEntrenador } from '@/lib/notificaciones'

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
    const reportePrevio = await prisma.reporteEntrenador.findUnique({
      where: { id: params.id },
      include: {
        planEntrenamiento: {
          select: {
            id: true,
            titulo: true,
          },
        },
        entrenador: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    })

    if (!reportePrevio) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      )
    }

    const data: Prisma.ReporteEntrenadorUpdateInput = {}

    if ('completada' in body) {
      data.completada = body.completada !== false
    }

    if ('observaciones' in body) {
      data.observaciones = body.observaciones?.trim() || null
    }

    if ('motivoIncompleta' in body) {
      data.motivoIncompleta = body.motivoIncompleta?.trim() || null
    }

    if ('requerimientos' in body) {
      data.requerimientos = body.requerimientos?.trim() || null
    }

    if ('detalleEjercicios' in body) {
      data.detalleEjercicios = sanitizeDetalleEjercicios(body.detalleEjercicios) ?? Prisma.DbNull
    }

    if ('feedbackAdmin' in body) {
      data.feedbackAdmin = body.feedbackAdmin?.trim() || null
    }

    const reporte = await prisma.reporteEntrenador.update({
      where: { id: params.id },
      data,
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

    if (body.actorType === 'entrenador') {
      const entrenadorNombre =
        body.entrenadorNombre?.trim() ||
        `${reportePrevio.entrenador.nombre} ${reportePrevio.entrenador.apellidos}`.trim() ||
        'Entrenador'

      await notificarAdmins({
        tipo: 'reporte_actualizado',
        titulo: 'Reporte actualizado',
        mensaje: `${entrenadorNombre} actualizó el reporte de ${reportePrevio.planEntrenamiento?.titulo || 'una sesión'}.`,
        enlace: '/admin/sesiones-entrenamiento',
        remitenteTipo: 'entrenador',
        remitenteId: reportePrevio.entrenadorId,
        remitenteNombre: entrenadorNombre,
        metadata: {
          reporteId: reporte.id,
          planEntrenamientoId: reporte.planEntrenamientoId,
        },
      })
    }

    if (body.actorType === 'admin' && 'feedbackAdmin' in body && body.feedbackAdmin?.trim()) {
      const adminNombre = body.adminNombre?.trim() || 'Administración Sharks'

      await notificarEntrenador({
        entrenadorId: reportePrevio.entrenadorId,
        tipo: 'feedback_admin',
        titulo: 'Nuevo feedback de administración',
        mensaje: `${adminNombre} dejó observaciones sobre ${reportePrevio.planEntrenamiento?.titulo || 'tu sesión de entrenamiento'}.`,
        enlace: '/entrenador/notificaciones',
        remitenteTipo: 'admin',
        remitenteId: body.adminId || null,
        remitenteNombre: adminNombre,
        metadata: {
          reporteId: reporte.id,
          planEntrenamientoId: reporte.planEntrenamientoId,
        },
      })
    }

    return NextResponse.json(reporte)
  } catch (error: any) {
    console.error('Error al actualizar reporte del entrenador:', error)

    return NextResponse.json(
      { error: 'Error al actualizar reporte del entrenador' },
      { status: 500 }
    )
  }
}
