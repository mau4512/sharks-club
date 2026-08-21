'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Calendar, CheckCircle, ChevronDown, ChevronUp, Eye, MessageCircle, XCircle, User } from 'lucide-react'
import Link from 'next/link'
import { calcularResumenAsistenciaMensual } from '@/lib/asistencias'

interface Deportista {
  id: string
  nombre: string
  apellidos: string
  email: string
  photoUrl: string | null
  celular?: string | null
  telefonoApoderado?: string | null
  becado?: boolean
  deudaStatus?: {
    tieneDeuda: boolean
    etiquetas: string[]
  }
}

interface Turno {
  id: string
  nombre: string
  tipo: string
  hora: string
  deportistas: Deportista[]
}

interface Asistencia {
  id: string
  fecha: string
  presente: boolean
  deportistaId: string
}

interface AsistenciaStats {
  deportistaId: string
  nombre: string
  apellidos: string
  email: string
  celular?: string | null
  telefonoApoderado?: string | null
  becado?: boolean
  deudaStatus?: {
    tieneDeuda: boolean
    etiquetas: string[]
  }
  totalAsistencias: number
  presentes: number
  ausentes: number
  porcentaje: number
}

export default function AsistenciasTurnoPage() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [turno, setTurno] = useState<Turno | null>(null)
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [stats, setStats] = useState<AsistenciaStats[]>([])
  const [mesSeleccionado, setMesSeleccionado] = useState(() => new Date().toISOString().slice(0, 7))
  const [detalleAbierto, setDetalleAbierto] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [id])

  useEffect(() => {
    if (turno) calcularEstadisticas(turno.deportistas, asistencias, mesSeleccionado)
  }, [mesSeleccionado])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar turno con deportistas
      const turnoRes = await fetch(`/api/turnos/${id}`)
      if (turnoRes.ok) {
        const turnoData = await turnoRes.json()
        setTurno(turnoData)
        
        // Cargar asistencias
        const asistenciasRes = await fetch(`/api/asistencias?turnoId=${id}`)
        if (asistenciasRes.ok) {
          const asistenciasData = await asistenciasRes.json()
          setAsistencias(asistenciasData)
          calcularEstadisticas(turnoData.deportistas, asistenciasData, mesSeleccionado)
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularEstadisticas = (deportistas: Deportista[], asistencias: Asistencia[], mes: string) => {
    const estadisticas = deportistas.map((deportista) => {
      const asistenciasDeportista = asistencias.filter(
        (a) => a.deportistaId === deportista.id && a.fecha.slice(0, 7) === mes
      )
      
      const resumen = calcularResumenAsistenciaMensual(asistenciasDeportista, mes)

      return {
        deportistaId: deportista.id,
        nombre: deportista.nombre,
        apellidos: deportista.apellidos,
        email: deportista.email,
        celular: deportista.celular,
        telefonoApoderado: deportista.telefonoApoderado,
        becado: deportista.becado,
        deudaStatus: deportista.deudaStatus,
        totalAsistencias: resumen.registros.length,
        presentes: resumen.presentes.length,
        ausentes: resumen.ausentes,
        porcentaje: resumen.porcentaje
      }
    })

    setStats(estadisticas)
  }

  const fechasAsistidas = (deportistaId: string) => asistencias
    .filter((asistencia) =>
      asistencia.deportistaId === deportistaId &&
      asistencia.presente &&
      asistencia.fecha.slice(0, 7) === mesSeleccionado
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const enlaceWhatsApp = (stat: AsistenciaStats) => {
    if (!stat.deudaStatus?.tieneDeuda) return null
    const telefono = stat.telefonoApoderado || stat.celular
    if (!telefono) return null
    const digitos = telefono.replace(/\D/g, '').replace(/^00/, '')
    if (!digitos) return null
    const numero = digitos.length === 9 ? `51${digitos}` : digitos
    const deuda = stat.deudaStatus.etiquetas.join(', ') || 'pagos pendientes'
    const mensaje = `Hola, te escribimos de Sharks Basketball por ${stat.nombre} ${stat.apellidos}. Registramos los siguientes pagos pendientes: ${deuda}. Te solicitamos por favor regularizar el pago a la brevedad. Si ya realizaste el pago, envíanos el comprobante. Gracias.`
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
  }

  const formatearFecha = (fecha: string) => new Intl.DateTimeFormat('es-PE', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
  }).format(new Date(fecha))

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!turno) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Turno no encontrado</p>
          <Link href="/admin/turnos">
            <Button className="mt-4">Volver a Turnos</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/turnos" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Turnos
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Historial de Asistencias</h1>
        <p className="text-gray-600 mt-2">
          {turno.nombre} - {turno.tipo === 'diurno' ? 'Diurno' : 'Nocturno'} ({turno.hora})
        </p>
      </div>

      <div className="grid gap-6">
        {/* Resumen de asistencias */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Resumen de Asistencias por Deportista
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input type="month" value={mesSeleccionado} onChange={(event) => setMesSeleccionado(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" aria-label="Mes del resumen de asistencias" />
                <Link href={`/admin/turnos/${id}/tomar-asistencia`}>
                  <Button className="w-full"><Calendar className="h-4 w-4 mr-2" />Tomar Asistencia Hoy</Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay deportistas en este turno
              </p>
            ) : (
              <div className="space-y-4">
                {stats.map((stat) => (
                  <div
                    key={stat.deportistaId}
                    className={`rounded-lg p-4 transition-colors ${
                      stat.deudaStatus?.tieneDeuda
                        ? 'bg-red-50 hover:bg-red-100'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          stat.deudaStatus?.tieneDeuda ? 'bg-red-100' : 'bg-primary-100'
                        }`}>
                          <User className={`h-5 w-5 ${
                            stat.deudaStatus?.tieneDeuda ? 'text-red-600' : 'text-primary-600'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/deportistas/${stat.deportistaId}/perfil`} className={`inline-flex items-center gap-1 font-semibold hover:underline ${
                            stat.deudaStatus?.tieneDeuda ? 'text-red-700' : 'text-gray-900'
                          }`}>
                            {stat.nombre} {stat.apellidos}
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <p className="text-sm text-gray-600">
                            Total del mes: {stat.totalAsistencias} registros
                          </p>
                          <p className="text-sm text-gray-600">{stat.email || 'Email pendiente'}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {stat.becado ? (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Becado por el club
                              </span>
                            ) : stat.deudaStatus?.tieneDeuda ? (
                              stat.deudaStatus.etiquetas.map((etiqueta) => (
                                <span
                                  key={`${stat.deportistaId}-${etiqueta}`}
                                  className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                                >
                                  {etiqueta}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                Al día
                              </span>
                            )}
                            {stat.deudaStatus?.tieneDeuda && enlaceWhatsApp(stat) && (
                              <a href={enlaceWhatsApp(stat)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700">
                                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                              </a>
                            )}
                            {stat.deudaStatus?.tieneDeuda && !enlaceWhatsApp(stat) && (
                              <span title="Registra el celular del deportista o del apoderado" className="inline-flex cursor-not-allowed items-center gap-1 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-500">
                                <MessageCircle className="h-3.5 w-3.5" /> Sin teléfono
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 justify-self-stretch rounded-lg bg-white/70 p-3 shadow-sm sm:flex sm:items-center sm:justify-end sm:gap-6 lg:justify-self-end lg:bg-transparent lg:p-0 lg:shadow-none">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-semibold">{stat.presentes}</span>
                          </div>
                          <p className="text-xs text-gray-500">Presentes</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="font-semibold">{stat.ausentes}</span>
                          </div>
                          <p className="text-xs text-gray-500">Ausentes</p>
                        </div>

                        <button type="button" onClick={() => setDetalleAbierto(detalleAbierto === stat.deportistaId ? null : stat.deportistaId)} className="min-w-[80px] rounded-md p-1 text-center hover:bg-primary-50" aria-expanded={detalleAbierto === stat.deportistaId}>
                          <div className="text-2xl font-bold text-gray-900">
                            {stat.porcentaje.toFixed(0)}%
                          </div>
                          <p className="flex items-center justify-center text-xs text-gray-500">Asistencia {detalleAbierto === stat.deportistaId ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}</p>
                        </button>
                      </div>
                    </div>

                    {detalleAbierto === stat.deportistaId && (
                      <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900">Días asistidos del mes</p>
                          <Link href={`/admin/deportistas/${stat.deportistaId}/perfil`} className="text-xs font-semibold text-primary-700 hover:underline">Ver perfil completo</Link>
                        </div>
                        {fechasAsistidas(stat.deportistaId).length === 0 ? (
                          <p className="mt-2 text-sm text-gray-500">No tiene asistencias registradas en este mes.</p>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {fechasAsistidas(stat.deportistaId).map((asistencia) => (
                              <span key={asistencia.id} className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium capitalize text-green-700">{formatearFecha(asistencia.fecha)}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Barra de progreso */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${stat.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link al perfil de entrenador para tomar asistencia */}
        <Card className="border-2 border-primary-200 bg-primary-50">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Gestionar Asistencia Diaria
                </h3>
                <p className="text-gray-600 mt-1">
                  Accede al perfil de entrenador para registrar la asistencia del día de hoy
                </p>
              </div>
              <Link href="/admin/asistencias">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ir a Asistencias
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
