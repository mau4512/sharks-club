import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    pagoDeportista: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { GET, POST } from '@/app/api/pagos/route'

describe('/api/pagos', () => {
  beforeEach(() => {
    prismaMock.pagoDeportista.findMany.mockReset()
    prismaMock.pagoDeportista.create.mockReset()
  })

  it('filters payments by athlete when deportistaId is present', async () => {
    prismaMock.pagoDeportista.findMany.mockResolvedValue([{ id: 'pago-1' }])

    const request = new NextRequest('http://localhost:3000/api/pagos?deportistaId=dep-1')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual([{ id: 'pago-1' }])
    expect(prismaMock.pagoDeportista.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deportistaId: 'dep-1' },
      })
    )
  })

  it('rejects invalid amounts', async () => {
    const request = new NextRequest('http://localhost:3000/api/pagos', {
      method: 'POST',
      body: JSON.stringify({
        deportistaId: 'dep-1',
        concepto: 'mensualidad',
        metodo: 'efectivo',
        monto: '0',
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('El monto debe ser mayor a 0')
  })

  it('creates a payment with normalized amount and trimmed note', async () => {
    prismaMock.pagoDeportista.create.mockResolvedValue({ id: 'pago-2', monto: 150 })

    const request = new NextRequest('http://localhost:3000/api/pagos', {
      method: 'POST',
      body: JSON.stringify({
        deportistaId: 'dep-1',
        concepto: 'mensualidad',
        metodo: 'yape',
        monto: '150.50',
        fechaPago: '2026-04-20',
        observacion: '  pago abril  ',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
    expect(prismaMock.pagoDeportista.create).toHaveBeenCalledTimes(1)

    const payload = prismaMock.pagoDeportista.create.mock.calls[0][0].data
    expect(payload.monto).toBe(150.5)
    expect(payload.observacion).toBe('pago abril')
  })
})
