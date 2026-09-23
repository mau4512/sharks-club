import { beforeEach, describe, expect, it, vi } from 'vitest'
const { deportista } = vi.hoisted(() => ({ deportista: {
  findUnique: vi.fn(), updateMany: vi.fn(), update: vi.fn(), delete: vi.fn(),
} }))
vi.mock('@/lib/prisma', () => ({ prisma: { deportista } }))
import { PUT, DELETE } from '@/app/api/deportistas/[id]/route'
const cambiar = (activo: unknown, motivoInactividad?: unknown) => PUT(new Request('http://localhost/api/deportistas/dep', {
  method: 'PUT', body: JSON.stringify({ activo, motivoInactividad }),
}), { params: { id: 'dep' } })

describe('estado del deportista', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    deportista.updateMany.mockResolvedValue({ count: 1 })
    deportista.findUnique.mockResolvedValue({ id: 'dep', activo: true, updatedAt: new Date(), periodosInactividad: [] })
  })
  it('guarda estado e inicio juntos', async () => {
    expect((await cambiar(false)).status).toBe(200)
    expect(deportista.updateMany.mock.calls[0][0].data).toMatchObject({
      activo: false, periodosInactividad: [{ inicio: expect.any(String), fin: null }],
    })
  })
  it('cierra el periodo al reactivar sin borrar el historial', async () => {
    deportista.findUnique.mockResolvedValue({ id: 'dep', activo: false, updatedAt: new Date(),
      periodosInactividad: [{ inicio: '2026-01-20T12:00:00Z', fin: null }] })
    expect((await cambiar(true)).status).toBe(200)
    expect(deportista.updateMany.mock.calls[0][0].data.periodosInactividad)
      .toEqual([{ inicio: '2026-01-20T12:00:00Z', fin: expect.any(String) }])
  })
  it('no crea periodos si no cambia el estado', async () => {
    await cambiar(true)
    expect(deportista.updateMany.mock.calls[0][0].data.periodosInactividad).toBeUndefined()
  })
  it('rechaza conflictos e inputs inválidos', async () => {
    expect((await cambiar('false')).status).toBe(400)
    expect(deportista.updateMany).not.toHaveBeenCalled()
    deportista.updateMany.mockResolvedValue({ count: 0 })
    expect((await cambiar(false)).status).toBe(409)
  })
  it('guarda el motivo y lo conserva al reactivar', async () => {
    await cambiar(false, '  Lesión  ')
    const periodos = deportista.updateMany.mock.calls[0][0].data.periodosInactividad
    expect(periodos[0].motivo).toBe('Lesión')
    deportista.findUnique.mockResolvedValue({ id: 'dep', activo: false, updatedAt: new Date(), periodosInactividad: periodos })
    await cambiar(true)
    expect(deportista.updateMany.mock.calls[1][0].data.periodosInactividad[0]).toMatchObject({ motivo: 'Lesión', fin: expect.any(String) })
  })
  it('rechaza motivos vacíos, demasiado largos o en una reactivación', async () => {
    expect((await cambiar(false, '  ')).status).toBe(400)
    expect((await cambiar(false, 'a'.repeat(301))).status).toBe(400)
    expect((await cambiar(true, 'Lesión')).status).toBe(400)
    expect(deportista.updateMany).not.toHaveBeenCalled()
  })
  it('elimina el deportista solicitado', async () => {
    expect((await DELETE(new Request('http://localhost'), { params: { id: 'dep' } })).status).toBe(200)
    expect(deportista.delete).toHaveBeenCalledWith({ where: { id: 'dep' } })
  })
})
