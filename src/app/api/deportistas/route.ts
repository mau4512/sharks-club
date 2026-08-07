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
            monto: true,
            montoEsperado: true,
            fechaPago: true,
            mesCoberturaInicio: true,
            mesCoberturaFin: true,
          },
        })
      : []

    const exoneraciones = deportistas.length
      ? await prisma.exoneracionMensualidad.findMany({
          where: {
            deportistaId: {
              in: deportistas.map((deportista) => deportista.id),
            },
          },
          select: {
            deportistaId: true,
            mes: true,
            motivo: true,
            observacion: true,
          },
        })
      : []

    return NextResponse.json(attachDeudaStatus(deportistas, pagos, new Date(), exoneraciones))
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
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
    const apellidos = typeof body.apellidos === 'string' ? body.apellidos.trim() : ''
    const documentoIdentidad = typeof body.documentoIdentidad === 'string' && body.documentoIdentidad.trim()
      ? body.documentoIdentidad.trim()
      : null
    const nombreApoderado = typeof body.nombreApoderado === 'string' && body.nombreApoderado.trim()
      ? body.nombreApoderado.trim()
      : null
    const telefonoApoderado = typeof body.telefonoApoderado === 'string' && body.telefonoApoderado.trim()
      ? body.telefonoApoderado.trim()
      : null
    const fechaNacimiento = typeof body.fechaNacimiento === 'string' && body.fechaNacimiento.trim()
      ? new Date(body.fechaNacimiento)
      : null
    const password = body.password ? await hashPassword(body.password) : null
    const email = typeof body.email === 'string' && body.email.trim()
      ? body.email.trim().toLowerCase()
      : null

    if (!nombre || !apellidos) {
      return NextResponse.json(
        { error: 'Nombre y apellidos son requeridos' },
        { status: 400 }
      )
    }
    
    const deportista = await prisma.deportista.create({
      data: {
        nombre,
        apellidos,
        documentoIdentidad,
        email,
        password,
        celular: body.celular || null,
        nombreApoderado,
        telefonoApoderado,
        fechaNacimiento,
        altura: body.altura ? parseFloat(body.altura) : null,
        peso: body.peso ? parseFloat(body.peso) : null,
        posicion: body.posicion || null,
        tallaCamiseta: body.tallaCamiseta || null,
        numeroCamiseta: body.numeroCamiseta || null,
        planSesiones: body.planSesiones ? parseInt(body.planSesiones) : 12,
        turnoId: body.turnoId || null,
        becado: body.becado === true,
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
