'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, Calendar, TrendingUp, Trophy, Target, Shirt, Wallet } from 'lucide-react'

export default function DeportistaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [deportista, setDeportista] = useState<any>(null)
  const [turno, setTurno] = useState<any>(null)
  const [asistencias, setAsistencias] = useState<any[]>([])
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const entrenadorData = localStorage.getItem('entrenador')
    if (!entrenadorData) {
      router.push('/entrenador/login')
      return
    }
    
    fetchDeportista()
  }, [params.id, router])

  const fetchDeportista = async () => {
    try {
      const [deportistaRes, turnosRes, asistenciasRes, estadisticasRes] = await Promise.all([
        fetch(`/api/deportistas/${params.id}`),
        fetch('/api/turnos'),
        fetch(`/api/asistencias?deportistaId=${params.id}`),
        fetch(`/api/estadisticas/deportista/${params.id}`)
      ])

      if (deportistaRes.ok) {
        const deportistaData = await deportistaRes.json()
        setDeportista(deportistaData)

        if (turnosRes.ok) {
          const allTurnos = await turnosRes.json()
          const turnoDeportista = allTurnos.find((t: any) => t.id === deportistaData.turnoId)
          setTurno(turnoDeportista)
        }

        if (asistenciasRes.ok) {
          const asistenciasData = await asistenciasRes.json()
          setAsistencias(asistenciasData)
        }

        if (estadisticasRes.ok) {
          setEstadisticas(await estadisticasRes.json())
        }
      }
    } catch (error) {
      console.error('Error al cargar deportista:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularAsistencia = () => {
    const hoy = new Date()
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    const asistenciasDelMes = asistencias.filter(a => a.fecha?.slice(0, 7) === mesActual)
    if (asistenciasDelMes.length === 0) return 0
    const presentes = asistenciasDelMes.filter(a => a.presente).length
    return Math.round((presentes / asistenciasDelMes.length) * 100)
  }

  const asistenciasDelMes = () => {
    const hoy = new Date()
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
    return asistencias.filter(a => a.fecha?.slice(0, 7) === mesActual)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!deportista) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Deportista no encontrado</p>
      </div>
    )
  }

  const porcentajeAsistencia = calcularAsistencia()
  const registrosMes = asistenciasDelMes()
  const partidos = estadisticas?.partidos
  const formatLimaTime = (value: string) =>
    new Date(value).toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/entrenador/mis-deportistas" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Mis Deportistas
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {deportista.nombre} {deportista.apellidos}
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Personal */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Información Personal</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-12 w-12 text-primary-600" />
                  </div>
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{deportista.email}</span>
                  </div>
                  
                  {deportista.telefono && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{deportista.telefono}</span>
                    </div>
                  )}
                  
                  {turno && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{turno.nombre} - {turno.hora}</span>
                    </div>
                  )}

                  {deportista.numeroCamiseta && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Shirt className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        Camiseta #{deportista.numeroCamiseta}
                        {deportista.tallaCamiseta ? ` · Talla ${deportista.tallaCamiseta}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {deportista.deudaStatus && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Estado de pagos</span>
                    </div>
                    {deportista.deudaStatus.tieneDeuda ? (
                      <div className="flex flex-wrap gap-2">
                        {deportista.deudaStatus.etiquetas.map((etiqueta: string) => (
                          <span
                            key={etiqueta}
                            className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                          >
                            {etiqueta}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Pagos al día
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Asistencia del mes</span>
                    <span className="text-2xl font-bold text-primary-600">{porcentajeAsistencia}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${porcentajeAsistencia}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {registrosMes.filter(a => a.presente).length} de {registrosMes.length} sesiones del mes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estadísticas y Progreso */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Resumen de Rendimiento</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Sesiones</h3>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{registrosMes.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Registradas este mes</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Presentes</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {registrosMes.filter(a => a.presente).length}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Confirmadas este mes</p>
                  </div>

                  <div className="bg-primary-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">Racha</h3>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {porcentajeAsistencia}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Tasa del mes actual</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Rendimiento en Partidos</h2>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500">PJ</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{partidos?.partidosJugados || 0}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500">PPP</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{partidos?.puntosPorPartido || 0}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500">APP</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{partidos?.asistenciasPorPartido || 0}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500">RPP</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{partidos?.rebotesPorPartido || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <div className="rounded border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">2P%</p>
                    <p className="font-bold text-gray-900">{partidos?.pct2 || 0}%</p>
                  </div>
                  <div className="rounded border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">3P%</p>
                    <p className="font-bold text-gray-900">{partidos?.pct3 || 0}%</p>
                  </div>
                  <div className="rounded border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">TL%</p>
                    <p className="font-bold text-gray-900">{partidos?.pctTl || 0}%</p>
                  </div>
                  <div className="rounded border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">CA</p>
                    <p className="font-bold text-gray-900">{partidos?.puntosContraataque || 0}</p>
                  </div>
                  <div className="rounded border border-gray-200 p-3 text-center">
                    <p className="text-xs text-gray-500">2OP</p>
                    <p className="font-bold text-gray-900">{partidos?.puntosSegundaOportunidad || 0}</p>
                  </div>
                </div>

                {partidos?.historial?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-xs text-slate-950">
                      <thead className="text-slate-950">
                        <tr className="border-2 border-slate-950 bg-white text-slate-950">
                          <th className="border border-slate-300 px-2 py-2 text-left text-slate-950">Partido</th>
                          <th className="border border-slate-300 px-2 py-2 text-slate-950">PTS</th>
                          <th className="border border-slate-300 px-2 py-2 text-slate-950">2P</th>
                          <th className="border border-slate-300 px-2 py-2 text-slate-950">3P</th>
                          <th className="border border-slate-300 px-2 py-2 text-slate-950">TL</th>
                          <th className="border border-slate-300 px-2 py-2 text-slate-950">REB</th>
                          <th className="border border-slate-300 px-2 py-2 text-slate-950">AST</th>
                          <th className="border border-slate-300 px-2 py-2 text-slate-950">ROB</th>
                          <th className="border border-slate-300 px-2 py-2 text-slate-950">BLK</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-950">
                        {partidos.historial.map((partido: any) => (
                          <tr key={partido.id}>
                            <td className="border border-slate-200 px-2 py-2 font-semibold text-slate-950">{partido.rival}</td>
                            <td className="border border-slate-200 px-2 py-2 text-center text-slate-950">{partido.puntos}</td>
                            <td className="border border-slate-200 px-2 py-2 text-center text-slate-950">{partido.estadisticas.t2Convertidos}/{partido.estadisticas.t2Intentados}</td>
                            <td className="border border-slate-200 px-2 py-2 text-center text-slate-950">{partido.estadisticas.t3Convertidos}/{partido.estadisticas.t3Intentados}</td>
                            <td className="border border-slate-200 px-2 py-2 text-center text-slate-950">{partido.estadisticas.tlConvertidos}/{partido.estadisticas.tlIntentados}</td>
                            <td className="border border-slate-200 px-2 py-2 text-center text-slate-950">{partido.estadisticas.rebotesOfensivos + partido.estadisticas.rebotesDefensivos}</td>
                            <td className="border border-slate-200 px-2 py-2 text-center text-slate-950">{partido.estadisticas.asistencias}</td>
                            <td className="border border-slate-200 px-2 py-2 text-center text-slate-950">{partido.estadisticas.robos}</td>
                            <td className="border border-slate-200 px-2 py-2 text-center text-slate-950">{partido.estadisticas.bloqueos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-gray-500">Aún no hay partidos finalizados con estadísticas para este jugador.</p>
                )}
              </CardContent>
            </Card>

            {/* Historial de Asistencias */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Historial de Asistencias</h2>
              </CardHeader>
              <CardContent>
                {asistencias.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay registros de asistencia aún
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {asistencias.slice().reverse().map((asistencia) => (
                      <div 
                        key={asistencia.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div className="text-sm text-gray-700">
                            <span>
                              {new Date(asistencia.fecha).toLocaleDateString('es-ES', {
                                timeZone: 'America/Lima',
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Registro: {formatLimaTime(asistencia.updatedAt || asistencia.createdAt || asistencia.fecha)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          asistencia.presente
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {asistencia.presente ? 'Presente' : 'Ausente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
