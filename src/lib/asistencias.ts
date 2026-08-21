export interface AsistenciaConFecha {
  fecha: string
  presente: boolean
}

export function filtrarAsistenciasPorMes<T extends AsistenciaConFecha>(asistencias: T[], mes: string) {
  return asistencias.filter((asistencia) => asistencia.fecha.slice(0, 7) === mes)
}

export function calcularResumenAsistenciaMensual<T extends AsistenciaConFecha>(asistencias: T[], mes: string) {
  const registros = filtrarAsistenciasPorMes(asistencias, mes)
  const presentes = registros.filter((asistencia) => asistencia.presente)
  const ausentes = registros.length - presentes.length

  return {
    registros,
    presentes,
    ausentes,
    porcentaje: registros.length ? Math.round((presentes.length / registros.length) * 100) : 0,
  }
}
