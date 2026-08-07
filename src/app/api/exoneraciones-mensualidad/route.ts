import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function parseMonth(value?: string | null) {
  if (!value) return null
  const normalized = /^\d{4}-\d{2}$/.test(value) ? `${value}-01T00:00:00.000Z` : value
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deportistaId = searchParams.get('deportistaId')

    const exoneraciones = await prisma.exoneracionMensualidad.findMany({
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
        mes: 'desc',
      },
    })

    return NextResponse.json(exoneraciones)
  } catch (error) {
    console.error('Error al obtener exoneraciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener las exoneraciones' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const mes = parseMonth(body.mes)

    if (!body.deportistaId || !mes || !body.motivo) {
      return NextResponse.json(
        { error: 'Deportista, mes y motivo son obligatorios' },
        { status: 400 }
      )
    }

    const exoneracion = await prisma.exoneracionMensualidad.upsert({
      where: {
        deportistaId_mes: {
          deportistaId: body.deportistaId,
          mes,
        },
      },
      update: {
        motivo: body.motivo,
        observacion: body.observacion?.trim() || null,
      },
      create: {
        deportistaId: body.deportistaId,
        mes,
        motivo: body.motivo,
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

    return NextResponse.json(exoneracion, { status: 201 })
  } catch (error) {
    console.error('Error al registrar exoneración:', error)
    return NextResponse.json(
      { error: 'Error al registrar la exoneración' },
      { status: 500 }
    )
  }
}
