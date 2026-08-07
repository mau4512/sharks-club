import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data: Record<string, any> = {}

    if (body.nombre !== undefined) data.nombre = body.nombre.trim()
    if (body.categoria !== undefined) data.categoria = body.categoria
    if (body.metodo !== undefined) data.metodo = body.metodo || null
    if (body.activo !== undefined) data.activo = Boolean(body.activo)
    if (body.observacion !== undefined) data.observacion = body.observacion?.trim() || null

    if (body.monto !== undefined) {
      const monto = Number(body.monto)
      if (Number.isNaN(monto) || monto <= 0) {
        return NextResponse.json(
          { error: 'El monto debe ser mayor a 0' },
          { status: 400 }
        )
      }
      data.monto = monto
    }

    if (body.diaVencimiento !== undefined) {
      const diaVencimiento = body.diaVencimiento ? Number(body.diaVencimiento) : null
      data.diaVencimiento =
        diaVencimiento && diaVencimiento >= 1 && diaVencimiento <= 31
          ? diaVencimiento
          : null
    }

    const gasto = await prisma.gastoFijo.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(gasto)
  } catch (error) {
    console.error('Error al actualizar gasto fijo:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el gasto fijo' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.gastoFijo.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al eliminar gasto fijo:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el gasto fijo' },
      { status: 500 }
    )
  }
}
