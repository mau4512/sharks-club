import { describe, expect, it } from 'vitest'
import { saldoGastoFijo } from '@/lib/caja-gastos'

describe('saldo mensual de gastos fijos', () => {
  const gasto = { id: 'profesor', monto: 1000 }
  const abono = { gastoFijoId: 'profesor', mesObligacion: '2026-10', monto: 300 }
  it('descuenta adelantos, completa el pago y reabre el saldo al anular un egreso', () => {
    expect(saldoGastoFijo(gasto, '2026-10', [abono])).toEqual({ pagado: 300, pendiente: 700, estado: 'Parcial' })
    expect(saldoGastoFijo(gasto, '2026-10', [abono, { ...abono, monto: 700 }])).toEqual({ pagado: 1000, pendiente: 0, estado: 'Cancelado' })
    expect(saldoGastoFijo(gasto, '2026-10', [])).toEqual({ pagado: 0, pendiente: 1000, estado: 'Pendiente' })
  })
  it('no mezcla meses, otros gastos ni egresos sin vincular', () => {
    expect(saldoGastoFijo(gasto, '2026-11', [abono, { ...abono, gastoFijoId: 'sunat', mesObligacion: '2026-11' }, { monto: 500 }]).pendiente).toBe(1000)
  })
  it('trabaja en céntimos y no produce saldos negativos', () => {
    expect(saldoGastoFijo({ ...gasto, monto: 0.3 }, '2026-10', [{ ...abono, monto: 0.1 }, { ...abono, monto: 0.2 }]).estado).toBe('Cancelado')
    expect(saldoGastoFijo(gasto, '2026-10', [{ ...abono, monto: 1100 }]).pendiente).toBe(0)
  })
})
