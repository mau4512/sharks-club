export const PAYMENT_DEFAULTS = {
  inscripcion: 50,
  mensualidadRegular: 180,
  mensualidadHermanas: 165,
  uniforme: 160,
  uniformeUnitario: 80,
} as const

export function getRecurringMonthsCount(inicio?: string | null, fin?: string | null) {
  if (!inicio) return 1

  const start = new Date(`${inicio}-01T00:00:00`)
  const end = new Date(`${fin || inicio}-01T00:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1
  }

  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
}

export function inferExpectedAmount(params: {
  concepto: string
  mesCoberturaInicio?: string | null
  mesCoberturaFin?: string | null
  tarifaMensual?: 'regular' | 'hermanas'
}) {
  const { concepto, mesCoberturaInicio, mesCoberturaFin, tarifaMensual = 'regular' } = params

  switch (concepto) {
    case 'inscripcion':
      return PAYMENT_DEFAULTS.inscripcion
    case 'uniforme':
      return PAYMENT_DEFAULTS.uniforme
    case 'mensualidad':
    case 'anualidad': {
      const tarifa =
        tarifaMensual === 'hermanas'
          ? PAYMENT_DEFAULTS.mensualidadHermanas
          : PAYMENT_DEFAULTS.mensualidadRegular
      return tarifa * getRecurringMonthsCount(mesCoberturaInicio, mesCoberturaFin)
    }
    default:
      return 0
  }
}
