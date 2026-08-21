import { describe, expect, it } from 'vitest'
import { calcularResumenAsistenciaMensual } from '@/lib/asistencias'

describe('calcularResumenAsistenciaMensual', () => {
  it('no mezcla registros de meses anteriores en el porcentaje', () => {
    const resumen = calcularResumenAsistenciaMensual([
      { fecha: '2026-07-20T00:00:00.000Z', presente: true },
      { fecha: '2026-08-05T00:00:00.000Z', presente: true },
      { fecha: '2026-08-12T00:00:00.000Z', presente: false },
    ], '2026-08')

    expect(resumen.registros).toHaveLength(2)
    expect(resumen.presentes).toHaveLength(1)
    expect(resumen.ausentes).toBe(1)
    expect(resumen.porcentaje).toBe(50)
  })

  it('devuelve cero cuando el perfil no tiene registros en el mes', () => {
    const resumen = calcularResumenAsistenciaMensual([
      { fecha: '2026-07-20T00:00:00.000Z', presente: true },
    ], '2026-08')

    expect(resumen.registros).toHaveLength(0)
    expect(resumen.porcentaje).toBe(0)
  })
})
