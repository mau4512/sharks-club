// @vitest-environment jsdom

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pushMock = vi.fn()
const routerMock = { push: pushMock }

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}))

vi.mock('next/link', () => ({
  default: ({ children }: any) => React.createElement('a', null, children),
}))

vi.mock('@/components/PizarraTactica', () => ({
  default: () => React.createElement('div', null, 'Pizarra mock'),
}))

vi.mock('@/components/SelectorEjerciciosBiblioteca', () => ({
  default: () => React.createElement('div', null, 'Selector mock'),
}))

import PrepararEntrenamientoPage from '@/app/entrenador/entrenamientos/page'

describe('Entrenador entrenamientos page', () => {
  beforeEach(() => {
    pushMock.mockReset()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('permite agregar un ejercicio al plan y guardar el entrenamiento', async () => {
    localStorage.setItem('entrenador', JSON.stringify({ id: 'ent-1', nombre: 'Martina' }))

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'turno-1', nombre: 'Sub 14', hora: '18:00', entrenadorId: 'ent-1' },
          { id: 'turno-2', nombre: 'Sub 16', hora: '19:00', entrenadorId: 'otro' },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'bib-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'plan-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'plan-1',
            titulo: 'Plan final',
            fecha: '2026-04-20T12:00:00.000Z',
            turnoId: 'turno-1',
            turno: { nombre: 'Sub 14', hora: '18:00' },
            ejercicios: [{ titulo: 'Closeout + tiro' }],
            notas: '',
          },
        ],
      })

    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(React.createElement(PrepararEntrenamientoPage))

    expect(await screen.findByText('Preparar Entrenamiento')).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText(/ej: entrenamiento técnica de tiro/i),
      'Plan final'
    )

    const turnoSelect = screen
      .getByText('Turno *')
      .parentElement
      ?.querySelector('select') as HTMLSelectElement

    await user.selectOptions(turnoSelect, 'turno-1')
    await user.click(screen.getByRole('button', { name: /crear nuevo ejercicio/i }))
    await user.type(screen.getByPlaceholderText(/nombre del ejercicio/i), 'Closeout + tiro')
    await user.type(
      screen.getByPlaceholderText(/detalles del ejercicio, objetivos, instrucciones/i),
      'Cerrar línea y finalizar'
    )
    await user.click(screen.getByRole('button', { name: /guardar ejercicio/i }))

    expect(await screen.findByText('Closeout + tiro')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /guardar plan de entrenamiento/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/planes-entrenamiento',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    const planCall = fetchMock.mock.calls.find((call) => call[0] === '/api/planes-entrenamiento')
    const payload = JSON.parse(planCall?.[1]?.body as string)

    expect(payload).toMatchObject({
      titulo: 'Plan final',
      turnoId: 'turno-1',
      entrenadorId: 'ent-1',
    })
    expect(payload.ejercicios).toHaveLength(1)
    expect(payload.ejercicios[0]).toMatchObject({
      titulo: 'Closeout + tiro',
      descripcion: 'Cerrar línea y finalizar',
      duracion: 15,
      tipoRecurso: 'ninguno',
    })
  })
})
