import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const gastos = await prisma.gastoFijo.findMany({
      orderBy: [
        { activo: 'desc' },
        { categoria: 'asc' },
        { nombre: 'asc' },
      ],
    })

    return NextResponse.json(gastos)
  } catch (error) {
    console.error('Error al obtener gastos fijos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los gastos fijos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.nombre || !body.categoria || !body.monto) {
      return NextResponse.json(
        { error: 'Nombre, categoría y monto son obligatorios' },
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

    const diaVencimiento = body.diaVencimiento ? Number(body.diaVencimiento) : null

    const gasto = await prisma.gastoFijo.create({
      data: {
        nombre: body.nombre.trim(),
        categoria: body.categoria,
        metodo: body.metodo || null,
        monto,
        diaVencimiento:
          diaVencimiento && diaVencimiento >= 1 && diaVencimiento <= 31
            ? diaVencimiento
            : null,
        activo: body.activo !== false,
        observacion: body.observacion?.trim() || null,
      },
    })

    return NextResponse.json(gasto, { status: 201 })
  } catch (error) {
    console.error('Error al crear gasto fijo:', error)
    return NextResponse.json(
      { error: 'Error al crear el gasto fijo' },
      { status: 500 }
    )
  }
}
