import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    admin: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    entrenador: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deportista: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { POST } from '@/app/api/auth/login/route'

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    prismaMock.admin.findUnique.mockReset()
    prismaMock.admin.update.mockReset()
    prismaMock.entrenador.findUnique.mockReset()
    prismaMock.entrenador.update.mockReset()
    prismaMock.deportista.findUnique.mockReset()
    prismaMock.deportista.update.mockReset()

    prismaMock.admin.findUnique.mockResolvedValue(null)
    prismaMock.entrenador.findUnique.mockResolvedValue(null)
    prismaMock.deportista.findUnique.mockResolvedValue(null)
  })

  it('allows the temporary admin/admin access', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin', password: 'admin' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.role).toBe('admin')
    expect(json.user.email).toBe('admin')
  })

  it('authenticates an admin stored in the database and upgrades a legacy password', async () => {
    prismaMock.admin.findUnique.mockResolvedValue({
      id: 'admin-db',
      nombre: 'Admin DB',
      email: 'admin@club.com',
      password: 'secreto123',
      rol: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@club.com', password: 'secreto123' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.role).toBe('admin')
    expect(json.user.id).toBe('admin-db')
    expect(prismaMock.admin.update).toHaveBeenCalledTimes(1)
  })

  it('returns 401 when credentials are invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nadie@club.com', password: 'mal' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Credenciales incorrectas')
  })
})
