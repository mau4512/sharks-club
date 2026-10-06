// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }))
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, Bar: () => null, BarChart: () => null, CartesianGrid: () => null, Legend: () => null, Line: () => null, LineChart: () => null, Tooltip: () => null, XAxis: () => null, YAxis: () => null }))
import CajaPage from '@/app/admin/caja/page'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('resumen de caja', () => {
  it('muestra abonos mensuales, cancelados y cobros por turno sin compensar deudas entre alumnos', async () => {
    const mes = new Date().toISOString().slice(0, 7)
    const deportistas = [
      { id: 'a', nombre: 'Ana', apellidos: 'A', turnoId: 't', planSesiones: 12 },
      { id: 'b', nombre: 'Beto', apellidos: 'B', turnoId: 't', planSesiones: 12 },
    ]
    const datos: Record<string, unknown> = {
      '/api/deportistas': deportistas,
      '/api/pagos': [{ id: 'p', concepto: 'mensualidad', monto: 200, fechaPago: `${mes}-06`, mesCoberturaInicio: `${mes}-01`, metodo: 'yape', deportista: deportistas[0] }],
      '/api/egresos': [
        { id: 'e', categoria: 'sueldos', metodo: 'yape', beneficiario: 'Profesor', monto: 300, fechaEgreso: `${mes}-06`, gastoFijoId: 'g', mesObligacion: mes },
        { id: 'e2', categoria: 'impuestos', metodo: 'yape', beneficiario: 'SUNAT', monto: 100, fechaEgreso: `${mes}-06`, gastoFijoId: 's', mesObligacion: mes },
      ],
      '/api/gastos-fijos': [{ id: 'g', nombre: 'Profesor', categoria: 'sueldos', monto: 1000, activo: true }, { id: 's', nombre: 'SUNAT', categoria: 'impuestos', monto: 100, activo: true }],
      '/api/turnos': [{ id: 't', nombre: 'Mañana', hora: '09:00' }],
    }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, json: async () => datos[url] || [] })))
    render(<CajaPage />)
    await waitFor(() => expect(screen.getByText('Mañana · 09:00')).toBeInTheDocument())
    const fila = screen.getByText('Mañana · 09:00').closest('tr')!
    expect(within(fila).getByText('S/ 180.00')).toBeInTheDocument()
    expect(within(fila).getAllByText('S/ 200.00')).toHaveLength(2)
    const resumen = screen.getByText(/Gastos fijos · Pendiente/)
    expect(resumen.closest('details')).not.toHaveAttribute('open')
    fireEvent.click(resumen)
    expect(screen.getByText('Saldo: S/ 700.00')).toBeInTheDocument()
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar abono / pago' }))
    expect(document.getElementById('form-egreso')?.closest('details')).toHaveAttribute('open')
    expect(screen.getByDisplayValue('700')).toBeInTheDocument()
  })
})
