import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    ejercicioBiblioteca: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    entrenador: {
      findUnique: vi.fn(),
    },
    planEntrenamiento: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { GET, POST } from '@/app/api/ejercicios-biblioteca/route'

describe('/api/ejercicios-biblioteca', () => {
  beforeEach(() => {
    prismaMock.ejercicioBiblioteca.findMany.mockReset()
    prismaMock.ejercicioBiblioteca.findFirst.mockReset()
    prismaMock.ejercicioBiblioteca.create.mockReset()
    prismaMock.entrenador.findUnique.mockReset()
    prismaMock.planEntrenamiento.findMany.mockReset()
  })

  it('combina la biblioteca con ejercicios alternos creados desde planes sin duplicar nombres', async () => {
    prismaMock.ejercicioBiblioteca.findMany.mockResolvedValue([
      {
        id: 'bib-1',
        nombre: 'Close Out',
        categoria: 'Defensa',
        esPublico: true,
        creadoPor: { id: 'ent-1', nombre: 'Martina', apellidos: 'Lopez' },
      },
    ])

    prismaMock.planEntrenamiento.findMany.mockResolvedValue([
      {
        id: 'plan-1',
        createdAt: '2026-04-20T10:00:00.000Z',
        entrenador: { id: 'ent-1', nombre: 'Martina', apellidos: 'Lopez' },
        ejercicios: [
          { titulo: 'Close Out', categoria: 'Defensa', descripcion: 'Duplicado del mismo entrenador' },
          { titulo: 'Tiro esquina', categoria: 'Tiro', descripcion: 'Serie de lanzamientos' },
        ],
      },
    ])

    const request = new NextRequest('http://localhost:3000/api/ejercicios-biblioteca')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toHaveLength(2)
    expect(json[0].source).toBe('biblioteca')
    expect(json[1]).toMatchObject({
      nombre: 'Tiro esquina',
      categoria: 'Tiro',
      source: 'plan',
    })
    expect(json.find((item: any) => item.nombre === 'Close Out' && item.source === 'plan')).toBeUndefined()
  })

  it('devuelve un ejercicio existente si el entrenador ya registró el mismo nombre', async () => {
    prismaMock.entrenador.findUnique.mockResolvedValue({ id: 'ent-1' })
    prismaMock.ejercicioBiblioteca.findFirst.mockResolvedValue({
      id: 'bib-9',
      nombre: 'Tiro libre',
      creadoPor: { id: 'ent-1', nombre: 'Martina', apellidos: 'Lopez' },
    })

    const request = new NextRequest('http://localhost:3000/api/ejercicios-biblioteca', {
      method: 'POST',
      body: JSON.stringify({
        nombre: '  tiro libre  ',
        categoria: 'Tiro',
        creadoPorId: 'ent-1',
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.id).toBe('bib-9')
    expect(prismaMock.ejercicioBiblioteca.create).not.toHaveBeenCalled()
  })

  it('crea un ejercicio nuevo con campos normalizados para la biblioteca', async () => {
    prismaMock.entrenador.findUnique.mockResolvedValue({ id: 'ent-1' })
    prismaMock.ejercicioBiblioteca.findFirst.mockResolvedValue(null)
    prismaMock.ejercicioBiblioteca.create.mockResolvedValue({
      id: 'bib-10',
      nombre: 'Tiro de media distancia',
    })

    const request = new NextRequest('http://localhost:3000/api/ejercicios-biblioteca', {
      method: 'POST',
      body: JSON.stringify({
        nombre: '  Tiro de media distancia  ',
        categoria: 'Tiro',
        materiales: ['Balon', 'Conos'],
        duracion: '15',
        series: '3',
        consejos: ['Base firme'],
        variantes: ['Con defensor'],
        esPublico: true,
        creadoPorId: 'ent-1',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(prismaMock.ejercicioBiblioteca.create).toHaveBeenCalledTimes(1)
    expect(prismaMock.ejercicioBiblioteca.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nombre: 'Tiro de media distancia',
          categoria: 'Tiro',
          materiales: ['Balon', 'Conos'],
          duracion: 15,
          series: 3,
          consejos: ['Base firme'],
          variantes: ['Con defensor'],
          esPublico: true,
          creadoPorId: 'ent-1',
        }),
      })
    )
  })
})
