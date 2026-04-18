import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener un ejercicio específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ejercicio = await prisma.ejercicioBiblioteca.findUnique({
      where: { id: params.id },
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
          },
        },
      },
    });

    if (!ejercicio) {
      return NextResponse.json(
        { error: 'Ejercicio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(ejercicio);
  } catch (error) {
    console.error('Error al obtener ejercicio:', error);
    return NextResponse.json(
      { error: 'Error al obtener ejercicio' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un ejercicio
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      nombre,
      descripcion,
      categoria,
      subcategoria,
      objetivos,
      materiales,
      duracion,
      intensidad,
      nivel,
      series,
      repeticiones,
      descanso,
      instrucciones,
      videoUrl,
      imagenUrl,
      consejos,
      variantes,
      esPublico,
    } = body;

    const ejercicioActualizado = await prisma.ejercicioBiblioteca.update({
      where: { id: params.id },
      data: {
        nombre,
        descripcion,
        categoria,
        subcategoria,
        objetivos,
        materiales,
        duracion: duracion ? parseInt(duracion) : null,
        intensidad,
        nivel,
        series: series ? parseInt(series) : null,
        repeticiones,
        descanso,
        instrucciones,
        videoUrl,
        imagenUrl,
        consejos,
        variantes,
        esPublico,
      },
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    });

    return NextResponse.json(ejercicioActualizado);
  } catch (error) {
    console.error('Error al actualizar ejercicio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar ejercicio' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un ejercicio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.ejercicioBiblioteca.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Ejercicio eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar ejercicio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar ejercicio' },
      { status: 500 }
    );
  }
}
