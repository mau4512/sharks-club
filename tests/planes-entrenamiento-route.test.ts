import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    planEntrenamiento: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { GET, POST } from '@/app/api/planes-entrenamiento/route'

describe('/api/planes-entrenamiento', () => {
  beforeEach(() => {
    prismaMock.planEntrenamiento.findMany.mockReset()
    prismaMock.planEntrenamiento.create.mockReset()
  })

  it('filtra planes por entrenadorId', async () => {
    prismaMock.planEntrenamiento.findMany.mockResolvedValue([{ id: 'plan-1' }])

    const request = new NextRequest(
      'http://localhost:3000/api/planes-entrenamiento?entrenadorId=ent-1'
    )
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual([{ id: 'plan-1' }])
    expect(prismaMock.planEntrenamiento.findMany).toHaveBeenCalledWith({
      where: { entrenadorId: 'ent-1' },
      include: {
        turno: {
          select: {
            id: true,
            nombre: true,
            hora: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    })
  })

  it('crea un plan nuevo con ejercicios y fecha normalizada', async () => {
    prismaMock.planEntrenamiento.create.mockResolvedValue({ id: 'plan-2', titulo: 'Plan de tiro' })

    const request = new NextRequest('http://localhost:3000/api/planes-entrenamiento', {
      method: 'POST',
      body: JSON.stringify({
        titulo: 'Plan de tiro',
        fecha: '2026-04-20',
        turnoId: 'turno-1',
        entrenadorId: 'ent-1',
        notas: 'Trabajo progresivo',
        ejercicios: [
          {
            id: 'ej-1',
            titulo: 'Tiro desde codo',
            duracion: 15,
            meta: { tipo: 'conversiones', cantidad: 20, unidad: 'tiros', tipoTiro: '2puntos' },
            tipoRecurso: 'ninguno',
          },
        ],
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(prismaMock.planEntrenamiento.create).toHaveBeenCalledTimes(1)

    const payload = prismaMock.planEntrenamiento.create.mock.calls[0][0].data
    expect(payload.titulo).toBe('Plan de tiro')
    expect(payload.turnoId).toBe('turno-1')
    expect(payload.entrenadorId).toBe('ent-1')
    expect(payload.notas).toBe('Trabajo progresivo')
    expect(payload.ejercicios).toHaveLength(1)
    expect(payload.fecha).toBeInstanceOf(Date)
    expect(payload.fecha.toISOString()).toContain('2026-04-20')
  })
})
