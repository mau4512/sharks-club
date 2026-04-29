import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { attachDeudaStatus } from '@/lib/deportista-finanzas'

// GET - Obtener todos los deportistas
export async function GET() {
  try {
    const deportistas = await prisma.deportista.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    const pagos = deportistas.length
      ? await prisma.pagoDeportista.findMany({
          where: {
            deportistaId: {
              in: deportistas.map((deportista) => deportista.id),
            },
          },
          select: {
            deportistaId: true,
            concepto: true,
            fechaPago: true,
          },
        })
      : []

    return NextResponse.json(attachDeudaStatus(deportistas, pagos))
  } catch (error) {
    console.error('Error al obtener deportistas:', error)
    return NextResponse.json(
      { error: 'Error al obtener deportistas' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo deportista
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const password = body.password ? await hashPassword(body.password) : null
    const email = typeof body.email === 'string' && body.email.trim()
      ? body.email.trim().toLowerCase()
      : null
    
    const deportista = await prisma.deportista.create({
      data: {
        nombre: body.nombre,
        apellidos: body.apellidos,
        documentoIdentidad: body.documentoIdentidad,
        email,
        password,
        celular: body.celular || null,
        nombreApoderado: body.nombreApoderado,
        telefonoApoderado: body.telefonoApoderado,
        fechaNacimiento: new Date(body.fechaNacimiento),
        altura: body.altura ? parseFloat(body.altura) : null,
        peso: body.peso ? parseFloat(body.peso) : null,
        posicion: body.posicion || null,
        tallaCamiseta: body.tallaCamiseta || null,
        numeroCamiseta: body.numeroCamiseta || null,
        planSesiones: body.planSesiones ? parseInt(body.planSesiones) : 12,
        turnoId: body.turnoId || null,
        activo: body.activo !== false
      }
    })

    return NextResponse.json(deportista, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear deportista:', error)
    
    // Verificar si es un error de unicidad
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El documento de identidad o email ya existe' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al crear deportista' },
      { status: 500 }
    )
  }
}
