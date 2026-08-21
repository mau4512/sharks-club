'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

interface RegistroAsistencia {
  id: string
  fecha: string
  presente: boolean
  notas?: string | null
  turno?: {
    nombre?: string | null
    hora?: string | null
  } | null
}

interface AsistenciaMensualProps {
  deportistaId?: string
  asistencias?: RegistroAsistencia[]
}

const mesActual = () => {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

const claveMes = (fecha: string) => fecha.slice(0, 7)

export function AsistenciaMensual({ deportistaId, asistencias: asistenciasIniciales }: AsistenciaMensualProps) {
  const [mes, setMes] = useState(mesActual)
  const [asistencias, setAsistencias] = useState<RegistroAsistencia[]>(asistenciasIniciales || [])
  const [loading, setLoading] = useState(!asistenciasIniciales && Boolean(deportistaId))

  useEffect(() => {
    if (asistenciasIniciales) {
      setAsistencias(asistenciasIniciales)
      setLoading(false)
      return
    }

    if (!deportistaId) return

    setLoading(true)
    fetch(`/api/asistencias?deportistaId=${deportistaId}`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setAsistencias(Array.isArray(data) ? data : []))
      .catch((error) => console.error('Error al cargar asistencias:', error))
      .finally(() => setLoading(false))
  }, [deportistaId, asistenciasIniciales])

  const registrosDelMes = useMemo(
    () => asistencias.filter((registro) => claveMes(registro.fecha) === mes),
    [asistencias, mes]
  )
  const diasAsistidos = registrosDelMes.filter((registro) => registro.presente)
  const porcentaje = registrosDelMes.length
    ? Math.round((diasAsistidos.length / registrosDelMes.length) * 100)
    : 0
  const nombreMes = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' })
    .format(new Date(`${mes}-01T12:00:00`))

  const formatearFecha = (fecha: string) => new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  }).format(new Date(fecha))

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center text-lg font-semibold text-gray-900">
            <Calendar className="mr-2 h-5 w-5 text-primary-600" />
            Asistencia mensual
          </h2>
          <input
            type="month"
            value={mes}
            onChange={(event) => setMes(event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            aria-label="Mes de asistencia"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-6 text-center text-sm text-gray-500">Cargando asistencias...</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-primary-50 p-3 text-center">
                <p className="text-2xl font-bold text-primary-700">{porcentaje}%</p>
                <p className="text-xs text-gray-600">Asistencia</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{diasAsistidos.length}</p>
                <p className="text-xs text-gray-600">Días asistidos</p>
              </div>
              <div className="col-span-2 rounded-lg bg-gray-50 p-3 text-center sm:col-span-1">
                <p className="text-2xl font-bold text-gray-900">{registrosDelMes.length}</p>
                <p className="text-xs text-gray-600">Entrenamientos registrados</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold capitalize text-gray-800">
                Días que asistió en {nombreMes}
              </h3>
              {diasAsistidos.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-500">
                  No hay asistencias registradas para este mes.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {diasAsistidos.map((registro) => (
                    <div key={registro.id} className="flex items-start gap-3 p-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize text-gray-900">
                          {formatearFecha(registro.fecha)}
                        </p>
                        {(registro.turno?.nombre || registro.turno?.hora) && (
                          <p className="mt-1 flex items-center text-xs text-gray-500">
                            <Clock className="mr-1 h-3.5 w-3.5" />
                            {[registro.turno?.nombre, registro.turno?.hora].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {registro.notas && <p className="mt-1 text-xs text-gray-600">{registro.notas}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
