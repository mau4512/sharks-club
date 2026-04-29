import { describe, expect, it } from 'vitest'

import { buildDeudaStatus } from '@/lib/deportista-finanzas'

describe('deportista finanzas', () => {
  it('marca deuda cuando no hay pagos del mes ni uniforme del ciclo', () => {
    const status = buildDeudaStatus([], new Date('2026-04-29T12:00:00.000Z'))

    expect(status.mensualidadPendiente).toBe(true)
    expect(status.uniformePendiente).toBe(true)
    expect(status.tieneDeuda).toBe(true)
    expect(status.cicloUniforme).toEqual({ inicio: 2026, fin: 2027 })
  })

  it('marca al dia cuando existe pago mensual y uniforme vigente', () => {
    const status = buildDeudaStatus(
      [
        {
          deportistaId: 'dep-1',
          concepto: 'mensualidad',
          fechaPago: new Date('2026-04-05T10:00:00.000Z'),
        },
        {
          deportistaId: 'dep-1',
          concepto: 'uniforme',
          fechaPago: new Date('2026-02-15T10:00:00.000Z'),
        },
      ],
      new Date('2026-04-29T12:00:00.000Z')
    )

    expect(status.mensualidadPendiente).toBe(false)
    expect(status.uniformePendiente).toBe(false)
    expect(status.tieneDeuda).toBe(false)
    expect(status.etiquetas).toEqual([])
  })
})
