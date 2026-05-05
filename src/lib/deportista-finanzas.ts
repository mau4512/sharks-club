import { PAYMENT_DEFAULTS } from '@/lib/pagos-config'

type PagoLite = {
  deportistaId: string
  concepto: string
  fechaPago: Date | string
  monto?: number
  montoEsperado?: number | null
  mesCoberturaInicio?: Date | string | null
  mesCoberturaFin?: Date | string | null
}

function isRecurringConcept(concepto: string) {
  return concepto === 'mensualidad' || concepto === 'anualidad'
}

const DEFAULT_MONTHLY_EXPECTED = 180
const DEFAULT_UNIFORM_EXPECTED = PAYMENT_DEFAULTS.uniforme
const DEFAULT_UNIFORM_UNIT = PAYMENT_DEFAULTS.uniformeUnitario

export const UNIFORME_CYCLE_BASE_YEAR = 2026
export const UNIFORME_CYCLE_DURATION_YEARS = 2

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getNextMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseDate(value: Date | string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseCoverageMonthStart(value: Date | string | null | undefined) {
  const parsed = parseDate(value)
  if (!parsed) return null
  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1)
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getUniformCycleStart(date: Date) {
  if (date.getFullYear() < UNIFORME_CYCLE_BASE_YEAR) {
    return new Date(UNIFORME_CYCLE_BASE_YEAR, 0, 1)
  }

  const yearsSinceBase = date.getFullYear() - UNIFORME_CYCLE_BASE_YEAR
  const completedCycles = Math.floor(yearsSinceBase / UNIFORME_CYCLE_DURATION_YEARS)
  return new Date(UNIFORME_CYCLE_BASE_YEAR + completedCycles * UNIFORME_CYCLE_DURATION_YEARS, 0, 1)
}

function getUniformCycleEnd(date: Date) {
  const cycleStart = getUniformCycleStart(date)
  return new Date(cycleStart.getFullYear() + UNIFORME_CYCLE_DURATION_YEARS, 0, 1)
}

export function buildDeudaStatus(pagos: PagoLite[], now = new Date()) {
  const monthStart = getMonthStart(now)
  const nextMonthStart = getNextMonthStart(now)
  const uniformCycleStart = getUniformCycleStart(now)
  const uniformCycleEnd = getUniformCycleEnd(now)

  const pagoMensualidad = pagos.some((pago) => {
    if (pago.concepto !== 'mensualidad') return false
    const fecha = new Date(pago.fechaPago)
    return fecha >= monthStart && fecha < nextMonthStart
  })

  const pagosUniforme = pagos.filter((pago) => {
    if (pago.concepto !== 'uniforme') return false
    const fecha = new Date(pago.fechaPago)
    return fecha >= uniformCycleStart && fecha < uniformCycleEnd
  })

  const montoUniformePagado = pagosUniforme.reduce((acc, pago) => {
    if (
      pago.monto != null &&
      pago.montoEsperado != null &&
      pago.monto + 0.01 >= pago.montoEsperado
    ) {
      return acc + DEFAULT_UNIFORM_EXPECTED
    }
    if (pago.monto != null) return acc + pago.monto
    if (pago.montoEsperado != null) return acc + pago.montoEsperado
    return acc + DEFAULT_UNIFORM_UNIT
  }, 0)

  const saldoUniforme = Math.max(0, DEFAULT_UNIFORM_EXPECTED - montoUniformePagado)
  const uniformesPendientes =
    saldoUniforme <= 0.01 ? 0 : Math.ceil(saldoUniforme / DEFAULT_UNIFORM_UNIT)
  const porcentajeUniformeCubierto = Math.max(
    0,
    Math.min(100, Math.round((montoUniformePagado / DEFAULT_UNIFORM_EXPECTED) * 100))
  )

  const mensualidadPendiente = !pagoMensualidad
  const uniformePendiente = uniformesPendientes > 0
  const tieneDeuda = mensualidadPendiente || uniformePendiente

  const etiquetaUniforme =
    uniformesPendientes === 0
      ? null
      : uniformesPendientes === 1
        ? porcentajeUniformeCubierto > 0
          ? `Debe 1 uniforme (${porcentajeUniformeCubierto}% cubierto)`
          : 'Debe 1 uniforme'
        : porcentajeUniformeCubierto > 0
          ? `Debe 2 uniformes (${porcentajeUniformeCubierto}% cubierto)`
          : 'Debe 2 uniformes'

  return {
    mensualidadPendiente,
    uniformePendiente,
    tieneDeuda,
    etiquetas: [
      mensualidadPendiente ? 'Mensualidad pendiente' : null,
      etiquetaUniforme,
    ].filter(Boolean) as string[],
    uniformesPendientes,
    porcentajeUniformeCubierto,
    cicloUniforme: {
      inicio: uniformCycleStart.getFullYear(),
      fin: uniformCycleEnd.getFullYear() - 1,
    },
  }
}

export function buildDeudaStatusDesdeAlta(
  pagos: PagoLite[],
  fechaAlta: Date | string | null | undefined,
  now = new Date()
) {
  const baseStatus = buildDeudaStatus(pagos, now)

  if (!fechaAlta) {
    return {
      ...baseStatus,
      mesesDeudaMensualidad: baseStatus.mensualidadPendiente ? 1 : 0,
    }
  }

  const alta = new Date(fechaAlta)
  const altaMonthStart = getMonthStart(alta)
  const currentMonthStart = getMonthStart(now)

  if (Number.isNaN(alta.getTime()) || altaMonthStart > currentMonthStart) {
    return {
      ...baseStatus,
      mensualidadPendiente: false,
      tieneDeuda: baseStatus.uniformePendiente,
      etiquetas: baseStatus.uniformePendiente ? baseStatus.etiquetas.filter((etiqueta) => !etiqueta.includes('Mensualidad')) : [],
      mesesDeudaMensualidad: 0,
    }
  }

  const mensualidadesPorMes = new Map<string, { paid: number; expected: number | null }>()

  pagos
    .filter((pago) => isRecurringConcept(pago.concepto))
    .forEach((pago) => {
      const inicio = parseCoverageMonthStart(pago.mesCoberturaInicio) || getMonthStart(new Date(pago.fechaPago))
      const fin =
        parseCoverageMonthStart(pago.mesCoberturaFin) ||
        parseCoverageMonthStart(pago.mesCoberturaInicio) ||
        getMonthStart(new Date(pago.fechaPago))
      const months: string[] = []
      let cursor = inicio
      while (cursor <= fin) {
        months.push(getMonthKey(cursor))
        cursor = getNextMonthStart(cursor)
      }

      const parts = Math.max(months.length, 1)
      const paidAmount =
        pago.monto != null
          ? pago.monto
          : pago.montoEsperado != null
            ? pago.montoEsperado
            : DEFAULT_MONTHLY_EXPECTED * parts
      const paidPerMonth = paidAmount / parts
      const expectedPerMonth = pago.montoEsperado != null ? pago.montoEsperado / parts : null

      months.forEach((monthKey) => {
        const bucket = mensualidadesPorMes.get(monthKey) || { paid: 0, expected: null }
        bucket.paid += paidPerMonth
        if (expectedPerMonth != null) {
          bucket.expected = expectedPerMonth
        }
        mensualidadesPorMes.set(monthKey, bucket)
      })
    })

  let cursor = altaMonthStart
  let mesesDeudaMensualidad = 0
  const mesesPendientes: Array<{ date: Date; porcentajePagado: number }> = []

  while (cursor <= currentMonthStart) {
    const bucket = mensualidadesPorMes.get(getMonthKey(cursor))
    const expected = bucket?.expected ?? DEFAULT_MONTHLY_EXPECTED
    const paid = bucket?.paid ?? 0

    if (paid + 0.01 < expected) {
      mesesDeudaMensualidad += 1
      const porcentajePagado = expected > 0 ? Math.max(0, Math.min(100, Math.round((paid / expected) * 100))) : 0
      mesesPendientes.push({ date: cursor, porcentajePagado })
    }
    cursor = getNextMonthStart(cursor)
  }

  const mensualidadPendiente = mesesDeudaMensualidad > 0
  const tieneDeuda = mensualidadPendiente || baseStatus.uniformePendiente
  const etiquetasMensualidad =
    mesesPendientes.length <= 3
      ? mesesPendientes.map((mes) =>
          mes.porcentajePagado > 0
            ? `${formatMonthLabel(mes.date)} pendiente (${mes.porcentajePagado}% cubierto)`
            : `${formatMonthLabel(mes.date)} pendiente`
        )
      : [
          ...mesesPendientes.slice(0, 3).map((mes) =>
            mes.porcentajePagado > 0
              ? `${formatMonthLabel(mes.date)} pendiente (${mes.porcentajePagado}% cubierto)`
              : `${formatMonthLabel(mes.date)} pendiente`
          ),
          `+${mesesPendientes.length - 3} mes(es) más`,
        ]
  const etiquetas = [
    ...etiquetasMensualidad,
    ...baseStatus.etiquetas.filter((etiqueta) => !etiqueta.includes('Mensualidad')),
  ].filter(Boolean) as string[]

  return {
    ...baseStatus,
    mensualidadPendiente,
    tieneDeuda,
    etiquetas,
    mesesDeudaMensualidad,
    mesesPendientes: mesesPendientes.map((mes) => getMonthKey(mes.date)),
  }
}

export function attachDeudaStatus<T extends { id: string }>(
  deportistas: T[],
  pagos: PagoLite[],
  now = new Date()
) {
  const pagosPorDeportista = new Map<string, PagoLite[]>()

  pagos.forEach((pago) => {
    const bucket = pagosPorDeportista.get(pago.deportistaId) || []
    bucket.push(pago)
    pagosPorDeportista.set(pago.deportistaId, bucket)
  })

  return deportistas.map((deportista) => ({
    ...deportista,
    deudaStatus: buildDeudaStatusDesdeAlta(
      pagosPorDeportista.get(deportista.id) || [],
      (deportista as T & { createdAt?: Date | string }).createdAt,
      now
    ),
  }))
}
