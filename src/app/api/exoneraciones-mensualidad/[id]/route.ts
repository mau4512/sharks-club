import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.exoneracionMensualidad.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al eliminar exoneración:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la exoneración' },
      { status: 500 }
    )
  }
}
