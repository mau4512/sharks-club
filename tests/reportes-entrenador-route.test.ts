import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    reporteEntrenador: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { GET, POST } from '@/app/api/reportes-entrenador/route'
import { PUT } from '@/app/api/reportes-entrenador/[id]/route'

describe('/api/reportes-entrenador', () => {
  beforeEach(() => {
    prismaMock.reporteEntrenador.findMany.mockReset()
    prismaMock.reporteEntrenador.findUnique.mockReset()
    prismaMock.reporteEntrenador.create.mockReset()
    prismaMock.reporteEntrenador.update.mockReset()
  })

  it('lista reportes por entrenador y mes', async () => {
    prismaMock.reporteEntrenador.findMany.mockResolvedValue([{ id: 'rep-1' }])

    const request = new NextRequest(
      'http://localhost:3000/api/reportes-entrenador?entrenadorId=ent-1&month=2026-05'
    )

    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual([{ id: 'rep-1' }])
    expect(prismaMock.reporteEntrenador.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entrenadorId: 'ent-1',
          fechaSesion: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        }),
      })
    )
  })

  it('crea un reporte del entrenador', async () => {
    prismaMock.reporteEntrenador.create.mockResolvedValue({ id: 'rep-2' })

    const request = new NextRequest('http://localhost:3000/api/reportes-entrenador', {
      method: 'POST',
      body: JSON.stringify({
        entrenadorId: 'ent-1',
        turnoId: 'turno-1',
        planEntrenamientoId: 'plan-1',
        fechaSesion: '2026-05-13',
        completada: false,
        observaciones: 'La práctica se recortó por lluvia.',
        motivoIncompleta: 'La lluvia obligó a cerrar el coliseo.',
        requerimientos: 'Reprogramar el trabajo de finalización.',
        detalleEjercicios: [
          {
            ejercicioId: 'ej-1',
            titulo: 'Rueda de pases',
            completado: true,
            observaciones: 'Buena ejecución.',
            ajuste: 'Subir velocidad.',
          },
        ],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
    expect(prismaMock.reporteEntrenador.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entrenadorId: 'ent-1',
          turnoId: 'turno-1',
          planEntrenamientoId: 'plan-1',
          completada: false,
          observaciones: 'La práctica se recortó por lluvia.',
          detalleEjercicios: [
            {
              ejercicioId: 'ej-1',
              titulo: 'Rueda de pases',
              completado: true,
              observaciones: 'Buena ejecución.',
              ajuste: 'Subir velocidad.',
            },
          ],
        }),
      })
    )
  })

  it('actualiza un reporte existente', async () => {
    prismaMock.reporteEntrenador.findUnique.mockResolvedValue({
      id: 'rep-3',
      entrenadorId: 'ent-1',
      entrenador: { id: 'ent-1', nombre: 'Ivan', apellidos: 'Campos' },
      planEntrenamiento: { id: 'plan-1', titulo: 'Plan semanal' },
    })
    prismaMock.reporteEntrenador.update.mockResolvedValue({ id: 'rep-3' })

    const request = new NextRequest('http://localhost:3000/api/reportes-entrenador/rep-3', {
      method: 'PUT',
      body: JSON.stringify({
        completada: true,
        observaciones: 'Se completó según lo planificado.',
        motivoIncompleta: '',
        requerimientos: 'Solicitar 4 conos nuevos.',
        detalleEjercicios: [
          {
            ejercicioId: 'ej-1',
            titulo: '1c1 desde ala',
            completado: false,
            observaciones: 'Faltó lectura.',
            ajuste: 'Agregar pase previo.',
          },
        ],
      }),
    })

    const response = await PUT(request, { params: { id: 'rep-3' } })
    expect(response.status).toBe(200)
    expect(prismaMock.reporteEntrenador.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rep-3' },
        data: expect.objectContaining({
          completada: true,
          observaciones: 'Se completó según lo planificado.',
          motivoIncompleta: null,
          requerimientos: 'Solicitar 4 conos nuevos.',
          detalleEjercicios: [
            {
              ejercicioId: 'ej-1',
              titulo: '1c1 desde ala',
              completado: false,
              observaciones: 'Faltó lectura.',
              ajuste: 'Agregar pase previo.',
            },
          ],
        }),
      })
    )
  })
})
