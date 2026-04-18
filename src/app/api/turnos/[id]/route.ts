import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener un turno por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const turno = await prisma.turno.findUnique({
      where: { id: params.id },
      include: {
        deportistas: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            photoUrl: true
          }
        }
      }
    })

    if (!turno) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(turno)
  } catch (error) {
    console.error('Error al obtener turno:', error)
    return NextResponse.json(
      { error: 'Error al obtener turno' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un turno
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const turno = await prisma.turno.update({
      where: { id: params.id },
      data: {
        nombre: body.nombre,
        tipo: body.tipo,
        hora: body.hora,
        modalidad: body.modalidad,
        activo: body.activo
      }
    })

    return NextResponse.json(turno)
  } catch (error) {
    console.error('Error al actualizar turno:', error)
    return NextResponse.json(
      { error: 'Error al actualizar turno' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un turno
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.turno.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Turno eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar turno:', error)
    return NextResponse.json(
      { error: 'Error al eliminar turno' },
      { status: 500 }
    )
  }
}
