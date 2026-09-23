import { expect, it } from 'vitest'
import { proporcionActivaDelMes } from '@/lib/inactividad'

it('cobra seis sesiones regulares antes de la baja del 15 de abril', () => {
  expect(proporcionActivaDelMes([{ inicio: '2026-04-15T12:00:00Z', fin: null }], '2026-04')).toBe(6 / 12)
})
it('no cobra martes y jueves ni fines de semana en el plan regular', () => {
  for (const [inicio, fin] of [['07', '08'], ['09', '10'], ['11', '13']]) {
    expect(proporcionActivaDelMes([
      { inicio: '2026-04-01T05:00:00Z', fin: `2026-04-${inicio}T05:00:00Z` },
      { inicio: `2026-04-${fin}T05:00:00Z`, fin: null },
    ], '2026-04')).toBe(0)
  }
})
it('limita a doce sesiones incluso en meses con catorce y planes diarios', () => {
  expect(proporcionActivaDelMes([], '2026-07')).toBe(1)
  expect(proporcionActivaDelMes([], '2026-07', 20)).toBe(1)
})
it('cuenta reactivación desde ese día y no duplica periodos superpuestos', () => {
  expect(proporcionActivaDelMes([
    { inicio: '2026-04-10T12:00:00Z', fin: '2026-04-20T12:00:00Z' },
    { inicio: '2026-04-15T12:00:00Z', fin: '2026-04-25T12:00:00Z' },
  ], '2026-04')).toBe(6 / 12)
})
it('excluye meses completos y respeta la fecha peruana', () => {
  expect(proporcionActivaDelMes([{ inicio: '2026-03-15T12:00:00Z', fin: null }], '2026-04')).toBe(0)
  expect(proporcionActivaDelMes([{ inicio: '2026-04-02T02:00:00Z', fin: null }], '2026-04')).toBe(0)
})
it('mantiene el prorrateo calendario de los planes de fin de semana', () => {
  expect(proporcionActivaDelMes([{ inicio: '2026-04-15T12:00:00Z', fin: null }], '2026-04', 8)).toBe(14 / 30)
})
