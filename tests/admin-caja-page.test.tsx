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
            deportista: {
              id: 'dep-1',
              nombre: 'Juan',
              apellidos: 'Perez',
              documentoIdentidad: '12345678',
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        json: async () => [
          {
            id: 'egreso-1',
            categoria: 'alquiler',
            metodo: 'transferencia',
            beneficiario: 'Coliseo',
            monto: 50,
            fechaEgreso: '2026-04-20',
          },
        ],
      })

    vi.stubGlobal('fetch', fetchMock)

    render(React.createElement(CajaPage))

    await waitFor(() => {
      expect(screen.getByText('Ingresos Totales')).toBeInTheDocument()
      expect(screen.getByText('Egresos Totales')).toBeInTheDocument()
      expect(screen.getByText('Saldo Neto')).toBeInTheDocument()
      expect(screen.getByText('+ S/ 150.00')).toBeInTheDocument()
      expect(screen.getByText('- S/ 50.00')).toBeInTheDocument()
      expect(screen.getByText('S/ 100.00')).toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/pagos?deportistaId=dep-1')

    await user.type(screen.getByPlaceholderText(/buscar por persona, categoría o método/i), 'coliseo')

    expect(screen.getByText('Coliseo')).toBeInTheDocument()
    expect(screen.queryByText('+ S/ 150.00')).not.toBeInTheDocument()
  })
})
