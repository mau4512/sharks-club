type PagoLite = {
  deportistaId: string
  concepto: string
  fechaPago: Date | string
  mesCoberturaInicio?: Date | string | null
  mesCoberturaFin?: Date | string | null
}

function isRecurringConcept(concepto: string) {
  return concepto === 'mensualidad' || concepto === 'anualidad'
}

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

  const pagoUniforme = pagos.some((pago) => {
    if (pago.concepto !== 'uniforme') return false
    const fecha = new Date(pago.fechaPago)
    return fecha >= uniformCycleStart && fecha < uniformCycleEnd
  })

  const mensualidadPendiente = !pagoMensualidad
  const uniformePendiente = !pagoUniforme
  const tieneDeuda = mensualidadPendiente || uniformePendiente

  return {
    mensualidadPendiente,
    uniformePendiente,
    tieneDeuda,
    etiquetas: [
      mensualidadPendiente ? 'Mensualidad pendiente' : null,
      uniformePendiente ? 'Uniforme pendiente' : null,
    ].filter(Boolean) as string[],
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
      etiquetas: baseStatus.uniformePendiente ? ['Uniforme pendiente'] : [],
      mesesDeudaMensualidad: 0,
    }
  }

  const mesesPagados = new Set(
    pagos
      .filter((pago) => isRecurringConcept(pago.concepto))
      .flatMap((pago) => {
        const inicio = getMonthStart(parseDate(pago.mesCoberturaInicio) || new Date(pago.fechaPago))
        const fin = getMonthStart(parseDate(pago.mesCoberturaFin) || parseDate(pago.mesCoberturaInicio) || new Date(pago.fechaPago))

        const keys: string[] = []
        let cursor = inicio
        while (cursor <= fin) {
          keys.push(getMonthKey(cursor))
          cursor = getNextMonthStart(cursor)
        }
        return keys
      })
  )

  let cursor = altaMonthStart
  let mesesDeudaMensualidad = 0
  const mesesPendientes: Date[] = []

  while (cursor <= currentMonthStart) {
    if (!mesesPagados.has(getMonthKey(cursor))) {
      mesesDeudaMensualidad += 1
      mesesPendientes.push(cursor)
    }
    cursor = getNextMonthStart(cursor)
  }

  const mensualidadPendiente = mesesDeudaMensualidad > 0
  const tieneDeuda = mensualidadPendiente || baseStatus.uniformePendiente
  const etiquetasMensualidad =
    mesesPendientes.length <= 3
      ? mesesPendientes.map((mes) => `${formatMonthLabel(mes)} pendiente`)
      : [
          ...mesesPendientes.slice(0, 3).map((mes) => `${formatMonthLabel(mes)} pendiente`),
          `+${mesesPendientes.length - 3} mes(es) más`,
        ]
  const etiquetas = [
    ...etiquetasMensualidad,
    baseStatus.uniformePendiente ? 'Uniforme pendiente' : null,
  ].filter(Boolean) as string[]

  return {
    ...baseStatus,
    mensualidadPendiente,
    tieneDeuda,
    etiquetas,
    mesesDeudaMensualidad,
    mesesPendientes: mesesPendientes.map(getMonthKey),
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
