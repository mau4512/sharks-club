import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data: Record<string, any> = {}

    if (body.categoria !== undefined) data.categoria = String(body.categoria).trim()
    if (body.metodo !== undefined) data.metodo = String(body.metodo).trim()
    if (body.beneficiario !== undefined) data.beneficiario = String(body.beneficiario).trim()
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

    if (body.fechaEgreso !== undefined) {
      const fechaEgreso = new Date(body.fechaEgreso)
      if (Number.isNaN(fechaEgreso.getTime())) {
        return NextResponse.json(
          { error: 'La fecha de egreso no es válida' },
          { status: 400 }
        )
      }
      data.fechaEgreso = fechaEgreso
    }

    const egreso = await prisma.egresoCaja.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(egreso)
  } catch (error) {
    console.error('Error al actualizar egreso:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el egreso' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.egresoCaja.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al eliminar egreso:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el egreso' },
      { status: 500 }
    )
  }
}
