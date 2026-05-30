import { prisma } from '@/lib/prisma'

type NotificacionAdminInput = {
  tipo: string
  titulo: string
  mensaje: string
  enlace?: string
  remitenteTipo: string
  remitenteId?: string | null
  remitenteNombre?: string | null
  metadata?: unknown
}

type NotificacionEntrenadorInput = NotificacionAdminInput & {
  entrenadorId: string
}

export async function notificarAdmins(input: NotificacionAdminInput) {
  const admins = await prisma.admin.findMany({
    select: { id: true },
  })

  if (admins.length === 0) return

  await prisma.notificacion.createMany({
    data: admins.map((admin) => ({
      tipo: input.tipo,
      titulo: input.titulo,
      mensaje: input.mensaje,
      enlace: input.enlace || null,
      remitenteTipo: input.remitenteTipo,
      remitenteId: input.remitenteId || null,
      remitenteNombre: input.remitenteNombre || null,
      destinatarioTipo: 'admin',
      adminDestinatarioId: admin.id,
      metadata: input.metadata ?? undefined,
    })),
  })
}

export async function notificarEntrenador(input: NotificacionEntrenadorInput) {
  await prisma.notificacion.create({
    data: {
      tipo: input.tipo,
      titulo: input.titulo,
      mensaje: input.mensaje,
      enlace: input.enlace || null,
      remitenteTipo: input.remitenteTipo,
      remitenteId: input.remitenteId || null,
      remitenteNombre: input.remitenteNombre || null,
      destinatarioTipo: 'entrenador',
      entrenadorDestinatarioId: input.entrenadorId,
      metadata: input.metadata ?? undefined,
    },
  })
}
