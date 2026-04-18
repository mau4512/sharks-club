import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los turnos
export async function GET() {
  try {
    const turnos = await prisma.turno.findMany({
      include: {
        _count: {
          select: { deportistas: true }
        },
        deportistas: {
          select: {
            id: true,
            nombre: true,
            apellidos: true
          }
        },
        entrenador: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            especialidad: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(turnos)
  } catch (error) {
    console.error('Error al obtener turnos:', error)
    return NextResponse.json(
      { error: 'Error al obtener turnos' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo turno
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log('Datos recibidos:', body)
    
    const turno = await prisma.turno.create({
      data: {
        nombre: body.nombre,
        tipo: body.tipo,
        hora: body.hora,
        modalidad: body.modalidad,
        seccion: 'general',
        capacidadMaxima: 10,
        entrenadorId: body.entrenadorId || null,
        activo: body.activo !== false
      }
    })

    console.log('Turno creado:', turno)
    return NextResponse.json(turno, { status: 201 })
  } catch (error: any) {
    console.error('Error detallado al crear turno:', error)
    console.error('Stack:', error.stack)
    
    return NextResponse.json(
      { error: 'Error al crear turno', details: error.message },
      { status: 500 }
    )
  }
}
