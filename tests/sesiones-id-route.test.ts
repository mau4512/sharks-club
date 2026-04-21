import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    sesionEntrenamiento: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { DELETE, GET } from '@/app/api/sesiones/[id]/route'

describe('/api/sesiones/[id]', () => {
  beforeEach(() => {
    prismaMock.sesionEntrenamiento.findUnique.mockReset()
    prismaMock.sesionEntrenamiento.delete.mockReset()
  })

  it('obtiene una sesión específica con deportista y plan relacionado', async () => {
    prismaMock.sesionEntrenamiento.findUnique.mockResolvedValue({ id: 'ses-1' })

    const request = new NextRequest('http://localhost:3000/api/sesiones/ses-1')
    const response = await GET(request, { params: { id: 'ses-1' } })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ id: 'ses-1' })
    expect(prismaMock.sesionEntrenamiento.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'ses-1',
      },
      include: {
        deportista: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            photoUrl: true,
            email: true,
            posicion: true,
          },
        },
        planEntrenamiento: {
          select: {
            id: true,
            titulo: true,
            fecha: true,
            ejercicios: true,
            notas: true,
            entrenador: {
              select: {
                nombre: true,
                apellidos: true,
              },
            },
          },
        },
      },
    })
  })

  it('elimina una sesión por id', async () => {
    prismaMock.sesionEntrenamiento.delete.mockResolvedValue({ id: 'ses-1' })

    const request = new NextRequest('http://localhost:3000/api/sesiones/ses-1', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: { id: 'ses-1' } })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.message).toBe('Sesión eliminada exitosamente')
    expect(prismaMock.sesionEntrenamiento.delete).toHaveBeenCalledWith({
      where: {
        id: 'ses-1',
      },
    })
  })
})
