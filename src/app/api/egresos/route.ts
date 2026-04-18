import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const egresos = await prisma.egresoCaja.findMany({
      orderBy: {
        fechaEgreso: 'desc',
      },
    })

    return NextResponse.json(egresos)
  } catch (error) {
    console.error('Error al obtener egresos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los egresos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.categoria || !body.metodo || !body.beneficiario || !body.monto) {
      return NextResponse.json(
        { error: 'Categoría, método, beneficiario y monto son obligatorios' },
        { status: 400 }
      )
    }

    const monto = Number(body.monto)
    if (Number.isNaN(monto) || monto <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    const egreso = await prisma.egresoCaja.create({
      data: {
        categoria: body.categoria,
        metodo: body.metodo,
        beneficiario: body.beneficiario.trim(),
        monto,
        fechaEgreso: body.fechaEgreso ? new Date(body.fechaEgreso) : new Date(),
        observacion: body.observacion?.trim() || null,
      },
    })

    return NextResponse.json(egreso, { status: 201 })
  } catch (error) {
    console.error('Error al registrar egreso:', error)
    return NextResponse.json(
      { error: 'Error al registrar el egreso' },
      { status: 500 }
    )
  }
}
