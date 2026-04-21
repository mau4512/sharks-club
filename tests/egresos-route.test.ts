import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    egresoCaja: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { GET, POST } from '@/app/api/egresos/route'

describe('/api/egresos', () => {
  beforeEach(() => {
    prismaMock.egresoCaja.findMany.mockReset()
    prismaMock.egresoCaja.create.mockReset()
  })

  it('returns expenses ordered by date', async () => {
    prismaMock.egresoCaja.findMany.mockResolvedValue([{ id: 'egreso-1' }])

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual([{ id: 'egreso-1' }])
    expect(prismaMock.egresoCaja.findMany).toHaveBeenCalledWith({
      orderBy: { fechaEgreso: 'desc' },
    })
  })

  it('requires the mandatory fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/egresos', {
      method: 'POST',
      body: JSON.stringify({ categoria: 'sueldos' }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('Categoría, método, beneficiario y monto son obligatorios')
  })

  it('creates an expense trimming the beneficiary and note', async () => {
    prismaMock.egresoCaja.create.mockResolvedValue({ id: 'egreso-2' })

    const request = new NextRequest('http://localhost:3000/api/egresos', {
      method: 'POST',
      body: JSON.stringify({
        categoria: 'alquiler',
        metodo: 'transferencia',
        beneficiario: '  Coliseo Central ',
        monto: '300',
        observacion: '  abril ',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    const payload = prismaMock.egresoCaja.create.mock.calls[0][0].data
    expect(payload.beneficiario).toBe('Coliseo Central')
    expect(payload.observacion).toBe('abril')
    expect(payload.monto).toBe(300)
  })
})
