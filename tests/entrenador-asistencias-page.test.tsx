// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { confirmar, router } = vi.hoisted(() => ({
  confirmar: vi.fn(),
  router: { push: vi.fn() },
}))

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/components/ui/confirm-dialog', () => ({ confirmDialog: confirmar }))

import Page from '@/app/entrenador/asistencias/page'

describe('toma de asistencia del entrenador', () => {
  let atleta: any
  let eliminado: boolean
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.setItem('entrenador', JSON.stringify({ id: 'ent', nombre: 'Iván', apellidos: 'Campos' }))
    window.history.replaceState({}, '', '/entrenador/asistencias')
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    confirmar.mockResolvedValue(true)
    eliminado = false
    atleta = {
      id: 'dep',
      nombre: 'Ana',
      apellidos: 'Pérez',
      turnoId: 'turno',
      activo: true,
      periodosInactividad: [],
    }
    fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (options?.method === 'PUT') {
        const body = JSON.parse(options.body as string)
        atleta = {
          ...atleta,
          activo: body.activo,
          periodosInactividad: [{ inicio: '2026-09-23T12:00:00Z', fin: null, motivo: body.motivoInactividad }],
        }
        return { ok: true, json: async () => atleta }
      }
      if (options?.method === 'DELETE') {
        eliminado = true
        return { ok: true, json: async () => ({ success: true }) }
      }
      if (options?.method === 'POST') return { ok: true, json: async () => ({ success: true }) }
      if (url === '/api/turnos') return { ok: true, json: async () => [{ id: 'turno', nombre: 'U15', activo: true, entrenadorId: 'ent', _count: { deportistas: 1 } }] }
      if (url === '/api/deportistas') return { ok: true, json: async () => eliminado ? [] : [atleta] }
      if (url.startsWith('/api/asistencias?')) return { ok: true, json: async () => [] }
      return { ok: false, json: async () => ({ error: 'Ruta inesperada' }) }
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  const abrirTurno = async () => {
    render(<Page />)
    fireEvent.click(await screen.findByRole('button', { name: 'Tomar Asistencia' }))
    return screen.findByText('Ana Pérez')
  }

  it('inactiva con motivo y la excluye del registro de asistencia', async () => {
    await abrirTurno()
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como inactivo a Ana Pérez' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar inactividad' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/deportistas/dep', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ activo: false, motivoInactividad: 'Lesión' }),
    })))
    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver inactivos (1)' }))
    expect(await screen.findByText('Inactivo · Lesión')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar Asistencias' })).toBeDisabled()
  })

  it('elimina el deportista con confirmación', async () => {
    await abrirTurno()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar a Ana Pérez' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/deportistas/dep', { method: 'DELETE' }))
    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument()
    expect(confirmar).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger' }))
  })
})
