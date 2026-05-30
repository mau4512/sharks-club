import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const notificacion = await prisma.notificacion.update({
      where: { id: params.id },
      data: {
        leida: body.leida !== false,
      },
    })

    return NextResponse.json(notificacion)
  } catch (error: any) {
    console.error('Error al actualizar notificación:', error)
    return NextResponse.json(
      { error: 'Error al actualizar notificación' },
      { status: 500 }
    )
  }
}
