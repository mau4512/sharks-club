import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const destinatarioTipo = searchParams.get('destinatarioTipo')
    const destinatarioId = searchParams.get('destinatarioId')
    const soloNoLeidas = searchParams.get('soloNoLeidas') === '1'
    const limit = Number(searchParams.get('limit') || '20')

    if (!destinatarioTipo || !destinatarioId) {
      return NextResponse.json(
        { error: 'destinatarioTipo y destinatarioId son requeridos' },
        { status: 400 }
      )
    }

    const where =
      destinatarioTipo === 'admin'
        ? {
            destinatarioTipo: 'admin',
            adminDestinatarioId: destinatarioId,
            ...(soloNoLeidas ? { leida: false } : {}),
          }
        : {
            destinatarioTipo: 'entrenador',
            entrenadorDestinatarioId: destinatarioId,
            ...(soloNoLeidas ? { leida: false } : {}),
          }

    const notificaciones = await prisma.notificacion.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json(notificaciones)
  } catch (error) {
    console.error('Error al obtener notificaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    )
  }
}
