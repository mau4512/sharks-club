import { describe, expect, it } from 'vitest'

import { buildDeudaStatus, buildDeudaStatusDesdeAlta } from '@/lib/deportista-finanzas'

describe('deportista finanzas', () => {
  it('marca deuda cuando no hay pagos del mes ni uniforme del ciclo', () => {
    const status = buildDeudaStatus([], new Date('2026-04-29T12:00:00.000Z'))

    expect(status.mensualidadPendiente).toBe(true)
    expect(status.uniformePendiente).toBe(true)
    expect(status.tieneDeuda).toBe(true)
    expect(status.uniformesPendientes).toBe(2)
    expect(status.etiquetas).toContain('Debe 2 uniformes')
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
          monto: 160,
          montoEsperado: 160,
        },
      ],
      new Date('2026-04-29T12:00:00.000Z')
    )

    expect(status.mensualidadPendiente).toBe(false)
    expect(status.uniformePendiente).toBe(false)
    expect(status.tieneDeuda).toBe(false)
    expect(status.etiquetas).toEqual([])
  })

  it('marca un uniforme pendiente cuando solo abonaron un juego', () => {
    const status = buildDeudaStatus(
      [
        {
          deportistaId: 'dep-1',
          concepto: 'uniforme',
          fechaPago: new Date('2026-04-05T10:00:00.000Z'),
          monto: 80,
          montoEsperado: 160,
        },
      ],
      new Date('2026-04-29T12:00:00.000Z')
    )

    expect(status.uniformePendiente).toBe(true)
    expect(status.uniformesPendientes).toBe(1)
    expect(status.etiquetas).toContain('Debe 1 uniforme (50% cubierto)')
  })

  it('respeta un uniforme con descuento si fue registrado como pago completo', () => {
    const status = buildDeudaStatus(
      [
        {
          deportistaId: 'dep-1',
          concepto: 'uniforme',
          fechaPago: new Date('2026-04-05T10:00:00.000Z'),
          monto: 140,
          montoEsperado: 140,
        },
      ],
      new Date('2026-04-29T12:00:00.000Z')
    )

    expect(status.uniformePendiente).toBe(false)
    expect(status.uniformesPendientes).toBe(0)
    expect(status.etiquetas).not.toContain('Debe 1 uniforme')
    expect(status.etiquetas).not.toContain('Debe 2 uniformes')
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
    expect(status.etiquetas).toContain('enero de 2026 pendiente')
    expect(status.etiquetas).toContain('marzo de 2026 pendiente')
    expect(status.etiquetas).toContain('abril de 2026 pendiente')
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
    expect(status.etiquetas).toEqual(['Debe 2 uniformes'])
  })

  it('muestra porcentaje cubierto cuando solo hubo un abono parcial del mes', () => {
    const status = buildDeudaStatusDesdeAlta(
      [
        {
          deportistaId: 'dep-1',
          concepto: 'mensualidad',
          fechaPago: new Date('2026-05-03T10:00:00.000Z'),
          monto: 90,
          montoEsperado: 180,
          mesCoberturaInicio: new Date('2026-05-01T00:00:00.000Z'),
          mesCoberturaFin: new Date('2026-05-01T00:00:00.000Z'),
        },
      ],
      new Date('2026-05-01T12:00:00.000Z'),
      new Date('2026-05-29T12:00:00.000Z')
    )

    expect(status.mensualidadPendiente).toBe(true)
    expect(status.etiquetas).toContain('mayo de 2026 pendiente (50% cubierto)')
  })

  it('excluye de la deuda los meses exonerados sin mostrarlos como alerta', () => {
    const status = buildDeudaStatusDesdeAlta(
      [],
      new Date('2026-05-01T12:00:00.000Z'),
      new Date('2026-05-29T12:00:00.000Z'),
      [
        {
          deportistaId: 'dep-1',
          mes: new Date('2026-05-01T00:00:00.000Z'),
          motivo: 'lesion',
        },
      ]
    )

    expect(status.mensualidadPendiente).toBe(false)
    expect(status.mesesDeudaMensualidad).toBe(0)
    expect(status.mesesPendientes).toEqual([])
    expect(status.mesesExonerados).toEqual(['2026-05'])
    expect(status.etiquetas).not.toContain('mayo de 2026 pendiente')
    expect(status.etiquetas).not.toContain('mayo de 2026 exonerado: lesion')
  })
})
