import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    sesionEntrenamiento: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    deportista: {
      findUnique: vi.fn(),
    },
    planEntrenamiento: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { GET, POST } from '@/app/api/sesiones/route'

describe('/api/sesiones', () => {
  beforeEach(() => {
    prismaMock.sesionEntrenamiento.findMany.mockReset()
    prismaMock.sesionEntrenamiento.create.mockReset()
    prismaMock.deportista.findUnique.mockReset()
    prismaMock.planEntrenamiento.findUnique.mockReset()
  })

  it('obtiene sesiones filtradas por entrenadorId', async () => {
    prismaMock.sesionEntrenamiento.findMany.mockResolvedValue([{ id: 'ses-1' }])

    const request = new NextRequest('http://localhost:3000/api/sesiones?entrenadorId=ent-1')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual([{ id: 'ses-1' }])
    expect(prismaMock.sesionEntrenamiento.findMany).toHaveBeenCalledWith({
      where: {
        planEntrenamiento: {
          entrenadorId: 'ent-1',
        },
      },
      include: {
        deportista: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            photoUrl: true,
          },
        },
        planEntrenamiento: {
          select: {
            id: true,
            titulo: true,
            fecha: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    })
  })

  it('crea una sesión con duración numérica y resultados desde ejercicios', async () => {
    prismaMock.deportista.findUnique.mockResolvedValue({ id: 'dep-1' })
    prismaMock.planEntrenamiento.findUnique.mockResolvedValue({ id: 'plan-1' })
    prismaMock.sesionEntrenamiento.create.mockResolvedValue({ id: 'ses-2' })

    const request = new NextRequest('http://localhost:3000/api/sesiones', {
      method: 'POST',
      body: JSON.stringify({
        deportistaId: 'dep-1',
        planEntrenamientoId: 'plan-1',
        fecha: '2026-04-20T12:00:00.000Z',
        duracion: '45',
        observaciones: 'Buena intensidad',
        ejercicios: [
          { id: 'ej-1', titulo: 'Tiro', completado: true, notas: 'Bien' },
        ],
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(prismaMock.sesionEntrenamiento.create).toHaveBeenCalledTimes(1)
    expect(prismaMock.sesionEntrenamiento.create).toHaveBeenCalledWith({
      data: {
        deportistaId: 'dep-1',
        planEntrenamientoId: 'plan-1',
        fecha: new Date('2026-04-20T12:00:00.000Z'),
        duracion: 45,
        resultados: [{ id: 'ej-1', titulo: 'Tiro', completado: true, notas: 'Bien' }],
        observaciones: 'Buena intensidad',
      },
    })
  })

  it('devuelve 404 si el plan no existe', async () => {
    prismaMock.deportista.findUnique.mockResolvedValue({ id: 'dep-1' })
    prismaMock.planEntrenamiento.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/sesiones', {
      method: 'POST',
      body: JSON.stringify({
        deportistaId: 'dep-1',
        planEntrenamientoId: 'plan-x',
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe('Plan de entrenamiento no encontrado')
  })
})
