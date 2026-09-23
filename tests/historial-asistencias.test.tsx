// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const { confirmar } = vi.hoisted(() => ({ confirmar: vi.fn() }))
vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'turno' }) }))
vi.mock('@/components/ui/confirm-dialog', () => ({ confirmDialog: confirmar }))
import Page from '@/app/admin/turnos/[id]/asistencias/page'

describe('acciones del historial de asistencias', () => {
  let activo = true
  let eliminado = false
  let fetchMock: ReturnType<typeof vi.fn>
  beforeEach(() => {
    activo = true
    eliminado = false
    confirmar.mockResolvedValue(true)
    fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (options?.method === 'PUT') activo = JSON.parse(options.body as string).activo
      if (options?.method === 'DELETE') eliminado = true
      return { ok: true, json: async () => url === '/api/turnos/turno'
        ? { nombre: 'Turno', deportistas: eliminado ? [] : [{ id: 'dep', nombre: 'Ana', apellidos: 'Perez', activo }] }
        : [] }
    })
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })
  it('permite cancelar sin modificar datos', async () => {
    confirmar.mockResolvedValue(false)
    render(<Page />)
    fireEvent.click(await screen.findByText('Marcar inactivo'))
    await waitFor(() => expect(confirmar).toHaveBeenCalled())
    expect(fetchMock.mock.calls.some(([, options]) => options?.method)).toBe(false)
  })
  it('inactiva y reactiva desde la lista con confirmación', async () => {
    render(<Page />)
    fireEvent.click(await screen.findByText('Marcar inactivo'))
    expect(await screen.findByText('Inactivo · Mensualidad suspendida')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Reactivar'))
    expect(await screen.findByText('Marcar inactivo')).toBeInTheDocument()
    expect(confirmar).toHaveBeenCalledTimes(2)
  })
  it('elimina y retira al deportista de la lista', async () => {
    render(<Page />)
    fireEvent.click(await screen.findByText('Eliminar'))
    expect(await screen.findByText('No hay deportistas con este filtro')).toBeInTheDocument()
    expect(confirmar).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger' }))
  })
})
