import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizarTexto(valor: string | null | undefined) {
  return (valor || '').trim().toLowerCase()
}

// GET - Obtener todos los ejercicios de la biblioteca
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoria = searchParams.get('categoria');
    const nivel = searchParams.get('nivel');
    const entrenadorId = searchParams.get('entrenadorId');
    const esPublico = searchParams.get('esPublico');

    const whereClause: any = {};
    
    if (categoria) {
      whereClause.categoria = categoria;
    }
    
    if (nivel) {
      whereClause.nivel = nivel;
    }
    
    if (entrenadorId) {
      whereClause.creadoPorId = entrenadorId;
    }
    
    if (esPublico !== null && esPublico !== undefined) {
      whereClause.esPublico = esPublico === 'true';
    }

    const ejerciciosBiblioteca = await prisma.ejercicioBiblioteca.findMany({
      where: whereClause,
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const planes = await prisma.planEntrenamiento.findMany({
      where: entrenadorId ? { entrenadorId } : undefined,
      include: {
        entrenador: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const ejerciciosDesdePlanes = planes.flatMap((plan) => {
      if (!Array.isArray(plan.ejercicios)) return []

      return plan.ejercicios.map((ejercicio: any, index: number) => ({
        id: `plan-${plan.id}-${index}`,
        nombre: ejercicio.titulo || `Ejercicio ${index + 1}`,
        descripcion: ejercicio.descripcion || null,
        categoria: ejercicio.categoria || 'Técnico',
        subcategoria: null,
        objetivos: null,
        materiales: [],
        duracion: ejercicio.duracion || null,
        intensidad: null,
        nivel: null,
        series: ejercicio.meta?.tipo === 'repeticiones' ? ejercicio.meta?.cantidad || null : null,
        repeticiones: ejercicio.meta?.unidad || null,
        descanso: null,
        instrucciones: ejercicio.descripcion || null,
        videoUrl: ejercicio.videoUrl || null,
        imagenUrl: null,
        consejos: [],
        variantes: [],
        esPublico: true,
        creadoPor: plan.entrenador,
        createdAt: plan.createdAt,
        source: 'plan',
      }))
    })

    const ejerciciosFiltradosDesdePlanes = ejerciciosDesdePlanes.filter((ejercicio) => {
      if (categoria && ejercicio.categoria !== categoria) return false
      if (nivel && ejercicio.nivel !== nivel) return false
      if (esPublico !== null && esPublico !== undefined && esPublico !== 'true') return false
      return true
    })

    const clavesBiblioteca = new Set(
      ejerciciosBiblioteca.map((ejercicio) =>
        `${ejercicio.creadoPor.id}:${normalizarTexto(ejercicio.nombre)}`
      )
    )

    const ejerciciosAlternos = ejerciciosFiltradosDesdePlanes.filter((ejercicio) => {
      const clave = `${ejercicio.creadoPor.id}:${normalizarTexto(ejercicio.nombre)}`
      return !clavesBiblioteca.has(clave)
    })

    return NextResponse.json([
      ...ejerciciosBiblioteca.map((ejercicio) => ({ ...ejercicio, source: 'biblioteca' })),
      ...ejerciciosAlternos,
    ]);
  } catch (error) {
    console.error('Error al obtener ejercicios:', error);
    return NextResponse.json(
      { error: 'Error al obtener ejercicios de la biblioteca' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo ejercicio en la biblioteca
export async function POST(request: NextRequest) {
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
      creadoPorId,
    } = body;

    // Validaciones
    if (!nombre || !categoria || !creadoPorId) {
      return NextResponse.json(
        { error: 'Nombre, categoría y creador son requeridos' },
        { status: 400 }
      );
    }

    const entrenador = await prisma.entrenador.findUnique({
      where: { id: creadoPorId },
      select: { id: true },
    })

    if (!entrenador) {
      return NextResponse.json(
        { error: 'El entrenador creador no existe' },
        { status: 400 }
      )
    }

    const nombreNormalizado = nombre.trim()

    const ejercicioExistente = await prisma.ejercicioBiblioteca.findFirst({
      where: {
        creadoPorId,
        nombre: {
          equals: nombreNormalizado,
          mode: 'insensitive',
        },
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
    })

    if (ejercicioExistente) {
      return NextResponse.json(ejercicioExistente, { status: 200 })
    }

    const nuevoEjercicio = await prisma.ejercicioBiblioteca.create({
      data: {
        nombre: nombreNormalizado,
        descripcion: descripcion || null,
        categoria,
        subcategoria: subcategoria || null,
        objetivos: objetivos || null,
        materiales: materiales || [],
        duracion: duracion ? parseInt(duracion) : null,
        intensidad: intensidad || null,
        nivel: nivel || null,
        series: series ? parseInt(series) : null,
        repeticiones: repeticiones || null,
        descanso: descanso || null,
        instrucciones: instrucciones || null,
        videoUrl: videoUrl || null,
        imagenUrl: imagenUrl || null,
        consejos: consejos || [],
        variantes: variantes || [],
        esPublico: esPublico !== undefined ? esPublico : true,
        creadoPorId,
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

    return NextResponse.json(nuevoEjercicio, { status: 201 });
  } catch (error) {
    console.error('Error al crear ejercicio:', error);
    return NextResponse.json(
      { error: 'Error al crear ejercicio en la biblioteca' },
      { status: 500 }
    );
  }
}
