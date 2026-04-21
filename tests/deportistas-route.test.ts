import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    deportista: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { GET, POST } from '@/app/api/deportistas/route'

describe('/api/deportistas', () => {
  beforeEach(() => {
    prismaMock.deportista.findMany.mockReset()
    prismaMock.deportista.create.mockReset()
  })

  it('returns the list of athletes', async () => {
    prismaMock.deportista.findMany.mockResolvedValue([{ id: 'dep-1', nombre: 'Juan' }])

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual([{ id: 'dep-1', nombre: 'Juan' }])
    expect(prismaMock.deportista.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    })
  })

  it('creates an athlete and hashes the password', async () => {
    prismaMock.deportista.create.mockResolvedValue({ id: 'dep-2', nombre: 'Ana' })

    const request = new Request('http://localhost:3000/api/deportistas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Ana',
        apellidos: 'Perez',
        documentoIdentidad: '12345678',
        email: 'ana@club.com',
        password: 'segura123',
        nombreApoderado: 'Carlos Perez',
        telefonoApoderado: '999888777',
        fechaNacimiento: '2012-05-10',
        altura: '160',
        peso: '55',
        planSesiones: '20',
        turnoId: 'turno-1',
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json).toEqual({ id: 'dep-2', nombre: 'Ana' })
    expect(prismaMock.deportista.create).toHaveBeenCalledTimes(1)

    const payload = prismaMock.deportista.create.mock.calls[0][0].data
    expect(payload.nombre).toBe('Ana')
    expect(payload.planSesiones).toBe(20)
    expect(payload.altura).toBe(160)
    expect(payload.password).not.toBe('segura123')
    expect(payload.password).toMatch(/^\$2[aby]\$/)
  })

  it('returns a friendly message when the document or email already exists', async () => {
    prismaMock.deportista.create.mockRejectedValue({ code: 'P2002' })

    const request = new Request('http://localhost:3000/api/deportistas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Ana',
        apellidos: 'Perez',
        documentoIdentidad: '12345678',
        email: 'ana@club.com',
        nombreApoderado: 'Carlos Perez',
        telefonoApoderado: '999888777',
        fechaNacimiento: '2012-05-10',
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('El email o documento de identidad ya existe')
  })
})
