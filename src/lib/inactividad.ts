export type PeriodoInactividad = { inicio: string; fin: string | null; motivo?: string }

export function leerPeriodosInactividad(value: unknown): PeriodoInactividad[] {
  if (!Array.isArray(value)) return []
  return value.filter((periodo): periodo is PeriodoInactividad =>
    periodo != null && typeof periodo === 'object' &&
    typeof periodo.inicio === 'string' && Number.isFinite(Date.parse(periodo.inicio)) &&
    (periodo.fin === null || (typeof periodo.fin === 'string' && Number.isFinite(Date.parse(periodo.fin))))
  )
}

/** Baja inclusiva y reactivación exclusiva en Perú.
 * Plan regular: lunes, miércoles y viernes, hasta 12 sesiones mensuales.
 * Los planes de fin de semana conservan el prorrateo calendario existente.
 */
export function proporcionActivaDelMes(periodos: unknown, mes: string, planSesiones = 12): number {
  const [anio, numero] = mes.split('-').map(Number)
  const dias = new Date(Date.UTC(anio, numero, 0)).getUTCDate()
  const diaPeru = (fecha: string) => new Date(Date.parse(fecha) - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const intervalos = leerPeriodosInactividad(periodos).map((periodo) => ({
    inicio: diaPeru(periodo.inicio), fin: periodo.fin === null ? null : diaPeru(periodo.fin),
  }))
  const regular = planSesiones === 12 || planSesiones === 20
  let activos = 0
  for (let dia = 1; dia <= dias; dia++) {
    if (regular && ![1, 3, 5].includes(new Date(Date.UTC(anio, numero - 1, dia)).getUTCDay())) continue
    const fecha = `${mes}-${String(dia).padStart(2, '0')}`
    if (!intervalos.some((p) => fecha >= p.inicio && (p.fin === null || fecha < p.fin))) activos++
  }
  return regular ? Math.min(activos / 12, 1) : activos / dias
}
