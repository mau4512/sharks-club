import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// API endpoint for public contact requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      apellidos,
      documentoIdentidad,
      fechaNacimiento,
      nombreApoderado,
      telefonoApoderado,
    } = body

    // Validar campos requeridos
    if (
      !nombre ||
      !apellidos ||
      !documentoIdentidad ||
      !fechaNacimiento ||
      !nombreApoderado ||
      !telefonoApoderado
    ) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados' },
        { status: 400 }
      )
    }

    // Crear el registro de la solicitud de contacto.
    // Por compatibilidad con el esquema actual, talla y numero de camiseta
    // se mantienen vacios hasta que el club formalice la inscripcion.
    const matricula = await prisma.matricula.create({
      data: {
        nombre,
        apellidos,
        documentoIdentidad,
        fechaNacimiento: new Date(fechaNacimiento),
        tallaCamiseta: '',
        numeroCamiseta: '',
        nombreApoderado,
        telefonoApoderado,
        estado: 'pendiente',
      }
    })

    // Aquí podrías agregar lógica adicional como:
    // - Enviar email de confirmación al usuario
    // - Enviar notificación al admin
    // - Integración con CRM

    return NextResponse.json(
      { 
        success: true, 
        message: 'Solicitud de contacto recibida correctamente',
        id: matricula.id 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error al procesar solicitud de contacto:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// Endpoint para obtener todas las solicitudes de contacto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')

    const where = estado ? { estado } : {}

    const matriculas = await prisma.matricula.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(matriculas)
  } catch (error) {
    console.error('Error al obtener solicitudes de contacto:', error)
    return NextResponse.json(
      { error: 'Error al obtener las solicitudes de contacto' },
      { status: 500 }
    )
  }
}
