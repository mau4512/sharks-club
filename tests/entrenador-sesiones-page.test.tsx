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

import SesionesCompletadas from '@/app/entrenador/sesiones/page'

describe('Entrenador sesiones page', () => {
  beforeEach(() => {
    pushMock.mockReset()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('muestra resumen por deportista, permite filtrar y ver el detalle de una sesión', async () => {
    localStorage.setItem('entrenador', JSON.stringify({ id: 'ent-1', nombre: 'Martina' }))

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'ses-1',
            fecha: '2026-04-20T10:00:00.000Z',
            duracion: 45,
            observaciones: 'Buena disciplina táctica',
            resultados: [
              { id: 'r1', titulo: 'Tiro corto', completado: true, notas: 'Buen ritmo' },
              { id: 'r2', titulo: 'Closeout', completado: false, notas: '' },
            ],
            deportista: { id: 'dep-1', nombre: 'Juan', apellidos: 'Perez' },
            planEntrenamiento: { id: 'plan-1', titulo: 'Plan ofensivo', fecha: '2026-04-20' },
          },
          {
            id: 'ses-2',
            fecha: '2026-04-18T10:00:00.000Z',
            duracion: 40,
            observaciones: '',
            resultados: [
              { id: 'r3', titulo: 'Tiro corto', completado: true, notas: '' },
              { id: 'r4', titulo: 'Pase', completado: true, notas: '' },
            ],
            deportista: { id: 'dep-1', nombre: 'Juan', apellidos: 'Perez' },
            planEntrenamiento: { id: 'plan-2', titulo: 'Plan técnico', fecha: '2026-04-18' },
          },
          {
            id: 'ses-3',
            fecha: '2026-04-19T10:00:00.000Z',
            duracion: 35,
            observaciones: '',
            resultados: [
              { id: 'r5', titulo: 'Defensa', completado: true, notas: '' },
            ],
            deportista: { id: 'dep-2', nombre: 'Ana', apellidos: 'Lopez' },
            planEntrenamiento: { id: 'plan-3', titulo: 'Plan defensivo', fecha: '2026-04-19' },
          },
        ],
      })
    )

    const user = userEvent.setup()
    render(React.createElement(SesionesCompletadas))

    expect(await screen.findByText('Resumen por Deportista')).toBeInTheDocument()
    expect(screen.getAllByText('Juan Perez').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ana Lopez').length).toBeGreaterThan(0)
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()

    await user.click(screen.getAllByText('Juan Perez')[0])

    await waitFor(() => {
      expect(screen.getByText('Mostrando sesiones de:')).toBeInTheDocument()
    })

    expect(screen.getByText('Plan ofensivo')).toBeInTheDocument()
    expect(screen.getByText('Plan técnico')).toBeInTheDocument()
    expect(screen.queryByText('Plan defensivo')).not.toBeInTheDocument()

    await user.click(screen.getByText('Plan ofensivo'))

    expect(await screen.findByText(/observaciones del deportista/i)).toBeInTheDocument()
    expect(screen.getByText('Buena disciplina táctica')).toBeInTheDocument()
    expect(screen.getByText('1. Tiro corto')).toBeInTheDocument()
    expect(screen.getByText('2. Closeout')).toBeInTheDocument()
  })
})
