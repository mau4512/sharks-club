import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    tarifaMensualDeportista: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

import { GET, POST } from '@/app/api/tarifas-mensuales/route'

describe('/api/tarifas-mensuales', () => {
  beforeEach(() => {
    prismaMock.tarifaMensualDeportista.findMany.mockReset()
    prismaMock.tarifaMensualDeportista.upsert.mockReset()
  })

  it('consulta la tarifa de un deportista por año', async () => {
    prismaMock.tarifaMensualDeportista.findMany.mockResolvedValue([{ id: 'tarifa-1', monto: 165 }])
    const response = await GET(new NextRequest('http://localhost/api/tarifas-mensuales?deportistaId=dep-1&anio=2026'))

    expect(response.status).toBe(200)
    expect(prismaMock.tarifaMensualDeportista.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deportistaId: 'dep-1', anio: 2026 } })
    )
  })

  it('actualiza la tarifa del mismo año sin duplicarla', async () => {
    prismaMock.tarifaMensualDeportista.upsert.mockResolvedValue({ id: 'tarifa-1', monto: 150 })
    const response = await POST(new NextRequest('http://localhost/api/tarifas-mensuales', {
      method: 'POST',
      body: JSON.stringify({ deportistaId: 'dep-1', anio: 2026, monto: 150, tipo: 'apoyo' }),
    }))

    expect(response.status).toBe(201)
    expect(prismaMock.tarifaMensualDeportista.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deportistaId_anio: { deportistaId: 'dep-1', anio: 2026 } } })
    )
  })
})
