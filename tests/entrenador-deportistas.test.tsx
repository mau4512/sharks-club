// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const { confirmar, router } = vi.hoisted(() => ({ confirmar: vi.fn(), router: { push: vi.fn() } }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/components/ui/confirm-dialog', () => ({ confirmDialog: confirmar }))
import Page from '@/app/entrenador/mis-deportistas/page'

describe('gestión de deportistas del entrenador', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  beforeEach(() => {
    localStorage.setItem('entrenador', JSON.stringify({ id: 'ent' }))
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute('open', '') })
    confirmar.mockResolvedValue(true)
    const atleta = { id: 'dep', nombre: 'Ana', apellidos: 'Perez', turnoId: 'turno', activo: true, periodosInactividad: [] as unknown[] }
    fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (options?.method === 'PUT') {
        const body = JSON.parse(options.body as string)
        atleta.activo = body.activo
        atleta.periodosInactividad = [{ inicio: '2026-09-23T12:00:00Z', fin: null, motivo: body.motivoInactividad }]
        return { ok: true, json: async () => atleta }
      }
      return { ok: true, json: async () => url === '/api/turnos'
        ? [{ id: 'turno', entrenadorId: 'ent' }]
        : url === '/api/deportistas' ? [atleta, { id: 'otro', nombre: 'Luis', apellidos: 'Fuera', turnoId: 'ajeno', activo: true }] : {} }
    })
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals() })
  it('confirma lesión y muestra el motivo guardado', async () => {
    render(<Page />)
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar a Ana Perez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inactividad' }))
    expect(await screen.findByText('Lesión', { selector: 'p' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/deportistas/dep', expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ activo: false, motivoInactividad: 'Lesión' }),
    }))
  })
  it('requiere detalle para otro motivo y permite cancelar', async () => {
    render(<Page />)
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar a Ana Perez' }))
    fireEvent.change(screen.getByLabelText('Motivo de inactividad'), { target: { value: 'Otro' } })
    expect(screen.getByText('Confirmar inactividad')).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Describe el motivo'), { target: { value: 'Viaje' } })
    expect(screen.getByText('Confirmar inactividad')).toBeEnabled()
    fireEvent.click(screen.getByText('Cancelar'))
    expect(fetchMock.mock.calls.some(([, options]) => options?.method)).toBe(false)
  })
  it('elimina con confirmación y solo muestra deportistas de sus turnos', async () => {
    render(<Page />)
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar a Ana Perez' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/deportistas/dep', { method: 'DELETE' }))
    expect(await screen.findByText('No tienes deportistas asignados aún')).toBeInTheDocument()
    expect(screen.queryByText('Fuera, Luis')).not.toBeInTheDocument()
    expect(confirmar).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger' }))
  })
  it('no elimina al cancelar la confirmación', async () => {
    confirmar.mockResolvedValue(false)
    render(<Page />)
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar a Ana Perez' }))
    await waitFor(() => expect(confirmar).toHaveBeenCalled())
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'DELETE')).toBe(false)
  })
})
