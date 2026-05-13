import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener un plan específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.planEntrenamiento.findUnique({
      where: {
        id: params.id,
      },
      include: {
        turno: {
          select: {
            id: true,
            nombre: true,
            hora: true,
          },
        },
        reportesEntrenador: {
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error al obtener plan:', error);
    return NextResponse.json(
      { error: 'Error al obtener plan de entrenamiento' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un plan existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { titulo, fecha, turnoId, notas, ejercicios } = body;

    // Verificar que el plan existe
    const planExistente = await prisma.planEntrenamiento.findUnique({
      where: { id: params.id },
    });

    if (!planExistente) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    const planActualizado = await prisma.planEntrenamiento.update({
      where: {
        id: params.id,
      },
      data: {
        titulo: titulo || planExistente.titulo,
        fecha: fecha ? new Date(fecha + 'T12:00:00') : planExistente.fecha,
        turnoId: turnoId || planExistente.turnoId,
        notas: notas !== undefined ? notas : planExistente.notas,
        ejercicios: ejercicios || planExistente.ejercicios,
      },
      include: {
        turno: {
          select: {
            id: true,
            nombre: true,
            hora: true,
          },
        },
      },
    });

    return NextResponse.json(planActualizado);
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    return NextResponse.json(
      { error: 'Error al actualizar plan de entrenamiento' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el plan existe
    const planExistente = await prisma.planEntrenamiento.findUnique({
      where: { id: params.id },
    });

    if (!planExistente) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    await prisma.planEntrenamiento.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Plan eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar plan:', error);
    return NextResponse.json(
      { error: 'Error al eliminar plan de entrenamiento' },
      { status: 500 }
    );
  }
}
