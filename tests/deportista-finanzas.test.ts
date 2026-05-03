import { describe, expect, it } from 'vitest'

import { buildDeudaStatus, buildDeudaStatusDesdeAlta } from '@/lib/deportista-finanzas'

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

  it('cuenta meses adeudados desde la fecha de alta del deportista', () => {
    const status = buildDeudaStatusDesdeAlta(
      [
        {
          deportistaId: 'dep-1',
          concepto: 'mensualidad',
          fechaPago: new Date('2026-02-08T10:00:00.000Z'),
        },
      ],
      new Date('2026-01-10T12:00:00.000Z'),
      new Date('2026-04-29T12:00:00.000Z')
    )

    expect(status.mensualidadPendiente).toBe(true)
    expect(status.mesesDeudaMensualidad).toBe(3)
    expect(status.etiquetas).toContain('Debe 3 meses')
  })

  it('reinicia el control del mes cuando ya existe pago de la mensualidad actual', () => {
    const status = buildDeudaStatusDesdeAlta(
      [
        {
          deportistaId: 'dep-1',
          concepto: 'mensualidad',
          fechaPago: new Date('2026-03-06T10:00:00.000Z'),
        },
        {
          deportistaId: 'dep-1',
          concepto: 'mensualidad',
          fechaPago: new Date('2026-04-03T10:00:00.000Z'),
        },
      ],
      new Date('2026-03-01T12:00:00.000Z'),
      new Date('2026-04-29T12:00:00.000Z')
    )

    expect(status.mensualidadPendiente).toBe(false)
    expect(status.mesesDeudaMensualidad).toBe(0)
    expect(status.etiquetas).not.toContain('Debe 1 mes')
  })
})
