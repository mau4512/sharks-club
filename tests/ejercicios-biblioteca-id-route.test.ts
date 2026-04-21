import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    ejercicioBiblioteca: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { DELETE, PUT } from '@/app/api/ejercicios-biblioteca/[id]/route'

describe('/api/ejercicios-biblioteca/[id]', () => {
  beforeEach(() => {
    prismaMock.ejercicioBiblioteca.update.mockReset()
    prismaMock.ejercicioBiblioteca.delete.mockReset()
  })

  it('actualiza un ejercicio y convierte duración y series a números', async () => {
    prismaMock.ejercicioBiblioteca.update.mockResolvedValue({ id: 'bib-1', nombre: 'Actualizado' })

    const request = new NextRequest('http://localhost:3000/api/ejercicios-biblioteca/bib-1', {
      method: 'PUT',
      body: JSON.stringify({
        nombre: 'Actualizado',
        categoria: 'Tiro',
        duracion: '20',
        series: '4',
        esPublico: false,
      }),
    })

    const response = await PUT(request, { params: { id: 'bib-1' } })

    expect(response.status).toBe(200)
    expect(prismaMock.ejercicioBiblioteca.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'bib-1' },
        data: expect.objectContaining({
          nombre: 'Actualizado',
          categoria: 'Tiro',
          duracion: 20,
          series: 4,
          esPublico: false,
        }),
      })
    )
  })

  it('elimina un ejercicio por id', async () => {
    prismaMock.ejercicioBiblioteca.delete.mockResolvedValue({ id: 'bib-1' })

    const request = new NextRequest('http://localhost:3000/api/ejercicios-biblioteca/bib-1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: { id: 'bib-1' } })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.message).toBe('Ejercicio eliminado correctamente')
    expect(prismaMock.ejercicioBiblioteca.delete).toHaveBeenCalledWith({
      where: { id: 'bib-1' },
    })
  })
})
