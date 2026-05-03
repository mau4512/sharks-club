import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function parseCoverageMonth(value?: string | null) {
  if (!value) return null
  const normalized = /^\d{4}-\d{2}$/.test(value) ? `${value}-01T00:00:00.000Z` : value
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deportistaId = searchParams.get('deportistaId')

    const pagos = await prisma.pagoDeportista.findMany({
      where: deportistaId ? { deportistaId } : undefined,
      include: {
        deportista: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            documentoIdentidad: true,
          },
        },
      },
      orderBy: {
        fechaPago: 'desc',
      },
    })

    return NextResponse.json(pagos)
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json(
      { error: 'Error al obtener los pagos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.deportistaId || !body.concepto || !body.metodo || !body.monto) {
      return NextResponse.json(
        { error: 'Deportista, concepto, método y monto son obligatorios' },
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

    let mesCoberturaInicio = null
    let mesCoberturaFin = null

    if (body.concepto === 'mensualidad') {
      mesCoberturaInicio = parseCoverageMonth(body.mesCoberturaInicio) || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      mesCoberturaFin = parseCoverageMonth(body.mesCoberturaFin) || mesCoberturaInicio

      if (mesCoberturaFin < mesCoberturaInicio) {
        return NextResponse.json(
          { error: 'El mes final no puede ser anterior al mes inicial' },
          { status: 400 }
        )
      }
    }

    const pago = await prisma.pagoDeportista.create({
      data: {
        deportistaId: body.deportistaId,
        concepto: body.concepto,
        metodo: body.metodo,
        monto,
        fechaPago: body.fechaPago ? new Date(body.fechaPago) : new Date(),
        mesCoberturaInicio,
        mesCoberturaFin,
        observacion: body.observacion?.trim() || null,
      },
      include: {
        deportista: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            documentoIdentidad: true,
          },
        },
      },
    })

    return NextResponse.json(pago, { status: 201 })
  } catch (error) {
    console.error('Error al registrar pago:', error)
    return NextResponse.json(
      { error: 'Error al registrar el pago' },
      { status: 500 }
    )
  }
}
