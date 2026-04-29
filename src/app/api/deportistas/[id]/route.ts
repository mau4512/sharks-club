import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { buildDeudaStatus } from '@/lib/deportista-finanzas'

// GET - Obtener un deportista por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deportista = await prisma.deportista.findUnique({
      where: {
        id: params.id
      },
      include: {
        turno: {
          select: {
            id: true,
            nombre: true,
            hora: true,
            tipo: true
          }
        }
      }
    })

    if (!deportista) {
      return NextResponse.json(
        { error: 'Deportista no encontrado' },
        { status: 404 }
      )
    }

    const pagos = await prisma.pagoDeportista.findMany({
      where: { deportistaId: deportista.id },
      select: {
        deportistaId: true,
        concepto: true,
        fechaPago: true,
      },
    })

    return NextResponse.json({
      ...deportista,
      deudaStatus: buildDeudaStatus(pagos),
    })
  } catch (error) {
    console.error('Error al obtener deportista:', error)
    return NextResponse.json(
      { error: 'Error al obtener deportista' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un deportista
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Preparar data con campos opcionales
    const updateData: any = {}
    
    // Solo actualizar turnoId si está presente en el body
    if ('turnoId' in body) {
      updateData.turnoId = body.turnoId
    }
    
    // Actualizar contraseña solo si se proporciona
    if (body.password) {
      updateData.password = await hashPassword(body.password)
    }
    
    // Actualizar otros campos si están presentes
    if (body.nombre !== undefined) updateData.nombre = body.nombre
    if (body.apellidos !== undefined) updateData.apellidos = body.apellidos
    if (body.documentoIdentidad !== undefined) updateData.documentoIdentidad = body.documentoIdentidad
    if (body.email !== undefined) {
      updateData.email = typeof body.email === 'string' && body.email.trim()
        ? body.email.trim().toLowerCase()
        : null
    }
    if ('celular' in body) updateData.celular = body.celular || null
    if (body.nombreApoderado !== undefined) updateData.nombreApoderado = body.nombreApoderado
    if (body.telefonoApoderado !== undefined) updateData.telefonoApoderado = body.telefonoApoderado
    if (body.fechaNacimiento !== undefined) updateData.fechaNacimiento = new Date(body.fechaNacimiento)
    if ('altura' in body) updateData.altura = body.altura ? parseFloat(body.altura) : null
    if ('peso' in body) updateData.peso = body.peso ? parseFloat(body.peso) : null
    if ('posicion' in body) updateData.posicion = body.posicion || null
    if ('tallaCamiseta' in body) updateData.tallaCamiseta = body.tallaCamiseta || null
    if ('numeroCamiseta' in body) updateData.numeroCamiseta = body.numeroCamiseta || null
    if (body.planSesiones !== undefined) updateData.planSesiones = parseInt(body.planSesiones)
    if (body.activo !== undefined) updateData.activo = body.activo
    
    const deportista = await prisma.deportista.update({
      where: {
        id: params.id
      },
      data: updateData
    })

    return NextResponse.json(deportista)
  } catch (error: any) {
    console.error('Error al actualizar deportista:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El documento de identidad o email ya existe' },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Deportista no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar deportista' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un deportista
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.deportista.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar deportista:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Deportista no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar deportista' },
      { status: 500 }
    )
  }
}
