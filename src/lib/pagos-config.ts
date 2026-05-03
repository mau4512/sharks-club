export const PLAN_SESIONES_OPTIONS = [
  { value: '20', label: '20 sesiones - Plan diario' },
  { value: '12', label: '12 sesiones - Plan interdiario' },
  { value: '8', label: '8 sesiones - Fines de semana' },
  { value: '4', label: '4 sesiones - Fines de semana (1 vez por semana)' },
] as const

export const TURNO_MODALIDAD_OPTIONS = [
  { value: 'diario', label: 'Diario (20 sesiones)' },
  { value: 'interdiario', label: 'Interdiario (12 sesiones)' },
  { value: 'fin_semana_8', label: 'Fines de semana (8 sesiones)' },
  { value: 'fin_semana_4', label: 'Fines de semana (4 sesiones)' },
] as const

export function getTurnoModalidadLabel(modalidad: string) {
  return (
    TURNO_MODALIDAD_OPTIONS.find((option) => option.value === modalidad)?.label ||
    modalidad
  )
}

export const TARIFA_MENSUAL_OPTIONS = [
  { value: 'regular', label: 'Plan regular - S/ 180' },
  { value: 'hermanas', label: 'Combo hermanas - S/ 165 c/u' },
  { value: 'finSemana', label: 'Fines de semana (8 sesiones) - S/ 120' },
  { value: 'finSemanaHermanas', label: 'Fines de semana hermanas - S/ 110 c/u' },
  { value: 'finSemana4', label: 'Fines de semana (4 sesiones) - S/ 60' },
] as const

export type TarifaMensual =
  | 'regular'
  | 'hermanas'
  | 'finSemana'
  | 'finSemanaHermanas'
  | 'finSemana4'

export const PAYMENT_DEFAULTS = {
  inscripcion: 50,
  mensualidadRegular: 180,
  mensualidadHermanas: 165,
  mensualidadFinSemana: 120,
  mensualidadFinSemanaHermanas: 110,
  mensualidadFinSemana4: 60,
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
  tarifaMensual?: TarifaMensual
}) {
  const { concepto, mesCoberturaInicio, mesCoberturaFin, tarifaMensual = 'regular' } = params

  switch (concepto) {
    case 'inscripcion':
      return PAYMENT_DEFAULTS.inscripcion
    case 'uniforme':
      return PAYMENT_DEFAULTS.uniforme
    case 'mensualidad':
    case 'anualidad': {
      const tarifa = {
        regular: PAYMENT_DEFAULTS.mensualidadRegular,
        hermanas: PAYMENT_DEFAULTS.mensualidadHermanas,
        finSemana: PAYMENT_DEFAULTS.mensualidadFinSemana,
        finSemanaHermanas: PAYMENT_DEFAULTS.mensualidadFinSemanaHermanas,
        finSemana4: PAYMENT_DEFAULTS.mensualidadFinSemana4,
      }[tarifaMensual]
      return tarifa * getRecurringMonthsCount(mesCoberturaInicio, mesCoberturaFin)
    }
    default:
      return 0
  }
}
