import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { inferExpectedAmount } from '@/lib/pagos-config'

function parseCoverageMonth(value?: string | null) {
  if (!value) return null
  const normalized = /^\d{4}-\d{2}$/.test(value) ? `${value}-01T00:00:00.000Z` : value
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1)
}

function isRecurringConcept(concepto?: string | null) {
  return concepto === 'mensualidad' || concepto === 'anualidad'
}

function buildPagoData(body: Record<string, any>): Prisma.PagoDeportistaUncheckedCreateInput {
  if (!body.deportistaId || !body.concepto || !body.metodo || !body.monto) {
    throw new Error('Deportista, concepto, método y monto son obligatorios')
  }

  const monto = Number(body.monto)
  if (Number.isNaN(monto) || monto <= 0) {
    throw new Error('El monto debe ser mayor a 0')
  }

  let mesCoberturaInicio = null
  let mesCoberturaFin = null

  if (isRecurringConcept(body.concepto)) {
    mesCoberturaInicio = parseCoverageMonth(body.mesCoberturaInicio) || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    mesCoberturaFin = parseCoverageMonth(body.mesCoberturaFin) || mesCoberturaInicio

    if (mesCoberturaFin < mesCoberturaInicio) {
      throw new Error('El mes final no puede ser anterior al mes inicial')
    }
  }

  const montoEsperado = Number(body.montoEsperado) > 0
    ? Number(body.montoEsperado)
    : inferExpectedAmount({
        concepto: body.concepto,
        mesCoberturaInicio: body.mesCoberturaInicio,
        mesCoberturaFin: body.mesCoberturaFin,
        tarifaMensual: body.tarifaMensual,
      }) || null

  return {
    deportistaId: body.deportistaId,
    concepto: body.concepto,
    metodo: body.metodo,
    monto,
    montoEsperado,
    fechaPago: body.fechaPago ? new Date(body.fechaPago) : new Date(),
    mesCoberturaInicio,
    mesCoberturaFin,
    observacion: body.observacion?.trim() || null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const items = Array.isArray(body.items) ? body.items : []

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Agrega al menos un pago al carrito' },
        { status: 400 }
      )
    }

    const pagosData: Prisma.PagoDeportistaUncheckedCreateInput[] = items.map((item: Record<string, any>) =>
      buildPagoData(item)
    )

    const pagos = await prisma.$transaction(
      pagosData.map((data) =>
        prisma.pagoDeportista.create({
          data,
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
      )
    )

    return NextResponse.json(pagos, { status: 201 })
  } catch (error: any) {
    console.error('Error al registrar pagos en lote:', error)
    return NextResponse.json(
      { error: error.message || 'Error al registrar los pagos' },
      { status: 400 }
    )
  }
}
