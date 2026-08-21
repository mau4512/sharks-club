import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deportistaId = searchParams.get('deportistaId')
    const anioParam = searchParams.get('anio')
    const anio = anioParam ? Number(anioParam) : undefined

    const tarifas = await prisma.tarifaMensualDeportista.findMany({
      where: {
        ...(deportistaId ? { deportistaId } : {}),
        ...(Number.isInteger(anio) ? { anio } : {}),
      },
      orderBy: [{ anio: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(tarifas)
  } catch (error) {
    console.error('Error al obtener tarifas mensuales:', error)
    return NextResponse.json({ error: 'Error al obtener tarifas mensuales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const anio = Number(body.anio)
    const monto = Number(body.monto)

    if (!body.deportistaId || !Number.isInteger(anio) || anio < 2000 || anio > 2200) {
      return NextResponse.json({ error: 'Deportista y año son obligatorios' }, { status: 400 })
    }
    if (!Number.isFinite(monto) || monto < 0) {
      return NextResponse.json({ error: 'El monto mensual no puede ser negativo' }, { status: 400 })
    }

    const tarifa = await prisma.tarifaMensualDeportista.upsert({
      where: { deportistaId_anio: { deportistaId: body.deportistaId, anio } },
      update: {
        monto,
        tipo: body.tipo || 'regular',
        observacion: body.observacion?.trim() || null,
      },
      create: {
        deportistaId: body.deportistaId,
        anio,
        monto,
        tipo: body.tipo || 'regular',
        observacion: body.observacion?.trim() || null,
      },
    })

    return NextResponse.json(tarifa, { status: 201 })
  } catch (error) {
    console.error('Error al guardar tarifa mensual:', error)
    return NextResponse.json({ error: 'Error al guardar tarifa mensual' }, { status: 500 })
  }
}
