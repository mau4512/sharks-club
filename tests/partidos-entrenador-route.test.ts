import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    partidoEntrenador: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { GET, POST } from '@/app/api/partidos-entrenador/route'
import { PUT } from '@/app/api/partidos-entrenador/[id]/route'

describe('/api/partidos-entrenador', () => {
  beforeEach(() => {
    prismaMock.partidoEntrenador.findMany.mockReset()
    prismaMock.partidoEntrenador.findUnique.mockReset()
    prismaMock.partidoEntrenador.create.mockReset()
    prismaMock.partidoEntrenador.update.mockReset()
    prismaMock.partidoEntrenador.delete.mockReset()
  })

  it('lista partidos por entrenador', async () => {
    prismaMock.partidoEntrenador.findMany.mockResolvedValue([{ id: 'part-1' }])

    const request = new NextRequest(
      'http://localhost:3000/api/partidos-entrenador?entrenadorId=ent-1'
    )

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual([{ id: 'part-1' }])
  })

  it('crea un partido del entrenador', async () => {
    prismaMock.partidoEntrenador.create.mockResolvedValue({ id: 'part-2' })

    const request = new NextRequest('http://localhost:3000/api/partidos-entrenador', {
      method: 'POST',
      body: JSON.stringify({
        entrenadorId: 'ent-1',
        rival: 'Club Azul',
        categoria: 'U15',
        competencia: 'Liga',
        fechaPartido: '2026-05-16',
        horaPartido: '18:00',
        estado: 'programado',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
    expect(prismaMock.partidoEntrenador.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entrenadorId: 'ent-1',
          titulo: 'U15 · Liga · vs Club Azul',
          rival: 'Club Azul',
          horaPartido: '18:00',
        }),
      })
    )
  })

  it('actualiza un partido existente', async () => {
    prismaMock.partidoEntrenador.findUnique.mockResolvedValue({
      id: 'part-3',
      turnoId: null,
      titulo: 'Liga U17',
      rival: 'Club Rojo',
      competencia: null,
      categoria: null,
      sede: null,
      fechaPartido: new Date('2026-05-16T12:00:00'),
      horaPartido: '19:00',
      estado: 'programado',
      resultadoPropio: null,
      resultadoRival: null,
      analisisGeneral: null,
      erroresDeficiencias: null,
      correccionesProximaSemana: null,
      microcicloTrabajo: null,
    })
    prismaMock.partidoEntrenador.update.mockResolvedValue({ id: 'part-3' })

    const request = new NextRequest('http://localhost:3000/api/partidos-entrenador/part-3', {
      method: 'PUT',
      body: JSON.stringify({
        estado: 'jugado',
        resultadoPropio: 72,
        resultadoRival: 65,
        analisisGeneral: 'Buen cierre de partido.',
      }),
    })

    const response = await PUT(request, { params: { id: 'part-3' } })
    expect(response.status).toBe(200)
    expect(prismaMock.partidoEntrenador.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'part-3' },
        data: expect.objectContaining({
          titulo: 'Partido vs Club Rojo',
          estado: 'jugado',
          resultadoPropio: 72,
          resultadoRival: 65,
          analisisGeneral: 'Buen cierre de partido.',
        }),
      })
    )
  })
})
