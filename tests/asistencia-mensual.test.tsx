// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AsistenciaMensual } from '@/components/AsistenciaMensual'

const asistencias = [
  {
    id: 'ago-presente',
    fecha: '2026-08-05T00:00:00.000Z',
    presente: true,
    turno: { nombre: 'Sub 15', hora: '18:00' }
  },
  {
    id: 'ago-ausente',
    fecha: '2026-08-12T00:00:00.000Z',
    presente: false,
    turno: { nombre: 'Sub 15', hora: '18:00' }
  },
  {
    id: 'jul-presente',
    fecha: '2026-07-09T00:00:00.000Z',
    presente: true,
    turno: { nombre: 'Sub 15', hora: '18:00' }
  }
]

describe('AsistenciaMensual', () => {
  it('muestra porcentaje y fechas del mes seleccionado', () => {
    render(<AsistenciaMensual asistencias={asistencias} />)

    fireEvent.change(screen.getByLabelText('Mes de asistencia'), {
      target: { value: '2026-08' }
    })

    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText(/miércoles, 5 de agosto/i)).toBeInTheDocument()
    expect(screen.queryByText(/domingo, 9 de julio/i)).not.toBeInTheDocument()
    expect(screen.getByText('Sub 15 · 18:00')).toBeInTheDocument()
  })
})
