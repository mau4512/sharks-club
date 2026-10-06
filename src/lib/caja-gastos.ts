interface AbonoGasto {
  gastoFijoId?: string | null
  mesObligacion?: string | null
  monto: number
}

export function saldoGastoFijo(gasto: { id: string; monto: number }, mes: string, egresos: AbonoGasto[]) {
  const pagadoCentavos = egresos
    .filter((egreso) => egreso.gastoFijoId === gasto.id && egreso.mesObligacion === mes)
    .reduce((total, egreso) => total + Math.round(egreso.monto * 100), 0)
  const pendiente = Math.max(0, Math.round(gasto.monto * 100) - pagadoCentavos) / 100
  return { pagado: pagadoCentavos / 100, pendiente, estado: pendiente === 0 ? 'Cancelado' : pagadoCentavos > 0 ? 'Parcial' : 'Pendiente' }
}
