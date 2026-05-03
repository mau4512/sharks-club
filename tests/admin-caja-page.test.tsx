// @vitest-environment jsdom

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('deportistaId=dep-1'),
}))

import CajaPage from '@/app/admin/caja/page'

describe('Admin caja page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads summary data and filters movements', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => [
          { id: 'dep-1', nombre: 'Juan', apellidos: 'Perez', documentoIdentidad: '12345678' },
        ],
      })
      .mockResolvedValueOnce({
        json: async () => [
          {
            id: 'pago-1',
            concepto: 'mensualidad',
            metodo: 'yape',
            monto: 150,
            fechaPago: '2026-04-20',
            mesCoberturaInicio: '2026-05-01T00:00:00.000Z',
            mesCoberturaFin: '2026-05-01T00:00:00.000Z',
            deportista: {
              id: 'dep-1',
              nombre: 'Juan',
              apellidos: 'Perez',
              documentoIdentidad: '12345678',
            },
          },
        ],
      })

    vi.stubGlobal('fetch', fetchMock)

    render(React.createElement(CajaPage))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Registrar Pago' })).toBeInTheDocument()
      expect(screen.getByText('Ventana de pago')).toBeInTheDocument()
      expect(screen.getByText('+ S/ 150.00')).toBeInTheDocument()
      expect(screen.getAllByText('Juan Perez').length).toBeGreaterThan(0)
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/pagos?deportistaId=dep-1')
    expect(fetchMock).not.toHaveBeenCalledWith('/api/egresos')
    expect(screen.queryByText('Registrar Egreso')).not.toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/buscar por persona, categoría o método/i), 'juan')

    expect(screen.getAllByText('Juan Perez').length).toBeGreaterThan(0)
    expect(screen.getByText(/cubre: 2026-05/i)).toBeInTheDocument()
  })
})
