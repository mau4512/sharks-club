type PagoLite = {
  deportistaId: string
  concepto: string
  fechaPago: Date | string
}

export const UNIFORME_CYCLE_BASE_YEAR = 2026
export const UNIFORME_CYCLE_DURATION_YEARS = 2

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getNextMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
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
    deudaStatus: buildDeudaStatus(pagosPorDeportista.get(deportista.id) || [], now),
  }))
}
