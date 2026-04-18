'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ChevronLeft, Calendar, Clock, User, CheckCircle, XCircle, Target, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

interface PuntoTiro {
  posicion: string
  cantidad: number
  amboLados: boolean
  realizadoIzq?: number
  realizadoDer?: number
}

interface EjercicioResultado {
  id: string
  titulo: string
  completado: boolean
  notas: string
  puntosTiro?: PuntoTiro[]
}

interface SesionEntrenamiento {
  id: string
  fecha: string
  duracion: number
  observaciones: string
  resultados: EjercicioResultado[]
  deportista: {
    id: string
    nombre: string
    apellidos: string
    foto?: string
  }
  planEntrenamiento: {
    id: string
    titulo: string
    fecha: string
  }
}

interface EstadisticasDeportista {
  deportistaId: string
  nombre: string
  totalSesiones: number
  promedioCompletitud: number
  tendencia: number | null
}

export default function SesionesCompletadas() {
  const router = useRouter()
  const [entrenador, setEntrenador] = useState<any>(null)
  const [sesiones, setSesiones] = useState<SesionEntrenamiento[]>([])
  const [sesionExpandida, setSesionExpandida] = useState<string | null>(null)
  const [deportistaSeleccionado, setDeportistaSeleccionado] = useState<string>('todos')
  const [estadisticasDeportistas, setEstadisticasDeportistas] = useState<EstadisticasDeportista[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const entrenadorData = localStorage.getItem('entrenador')
    if (!entrenadorData) {
      router.push('/entrenador/login')
      return
    }
    
    const entrenadorParsed = JSON.parse(entrenadorData)
    setEntrenador(entrenadorParsed)
    fetchSesiones(entrenadorParsed.id)
  }, [router])

  const fetchSesiones = async (entrenadorId: string) => {
    try {
      console.log('🔍 Cargando sesiones para entrenador:', entrenadorId)
      const response = await fetch(`/api/sesiones?entrenadorId=${entrenadorId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Error en respuesta:', errorData)
        throw new Error(errorData.error || 'Error al cargar sesiones')
      }
      
      const data = await response.json()
      console.log('📊 Sesiones cargadas:', data)
      setSesiones(data)
      calcularEstadisticasPorDeportista(data)
    } catch (error) {
      console.error('❌ Error al cargar sesiones:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularEstadisticasPorDeportista = (sesiones: SesionEntrenamiento[]) => {
    const deportistasMap = new Map<string, {
      deportistaId: string
      nombre: string
      sesiones: SesionEntrenamiento[]
    }>()

    sesiones.forEach(sesion => {
      const key = sesion.deportista.id
      if (!deportistasMap.has(key)) {
        deportistasMap.set(key, {
          deportistaId: sesion.deportista.id,
          nombre: `${sesion.deportista.nombre} ${sesion.deportista.apellidos}`,
          sesiones: []
        })
      }
      deportistasMap.get(key)!.sesiones.push(sesion)
    })

    const stats: EstadisticasDeportista[] = Array.from(deportistasMap.values()).map(dep => {
      const totalEjercicios = dep.sesiones.reduce((sum, s) => sum + s.resultados.length, 0)
      const ejerciciosCompletados = dep.sesiones.reduce((sum, s) => {
        return sum + s.resultados.filter(e => e.completado).length
      }, 0)

      const promedioCompletitud = totalEjercicios > 0
        ? Math.round((ejerciciosCompletados / totalEjercicios) * 100)
        : 0

      // Calcular tendencia (últimas 2 sesiones vs anteriores)
      let tendencia: number | null = null
      if (dep.sesiones.length >= 2) {
        const sesionesOrdenadas = [...dep.sesiones].sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
        
        const ultimasDos = sesionesOrdenadas.slice(0, 2)
        const anteriores = sesionesOrdenadas.slice(2)

        const promReciente = ultimasDos.reduce((sum, s) => {
          const comp = s.resultados.filter(e => e.completado).length
          return sum + (comp / s.resultados.length) * 100
        }, 0) / ultimasDos.length

        if (anteriores.length > 0) {
          const promAnterior = anteriores.reduce((sum, s) => {
            const comp = s.resultados.filter(e => e.completado).length
            return sum + (comp / s.resultados.length) * 100
          }, 0) / anteriores.length

          tendencia = promReciente - promAnterior
        }
      }

      return {
        deportistaId: dep.deportistaId,
        nombre: dep.nombre,
        totalSesiones: dep.sesiones.length,
        promedioCompletitud,
        tendencia
      }
    })

    setEstadisticasDeportistas(stats)
  }

  const toggleSesion = (id: string) => {
    setSesionExpandida(sesionExpandida === id ? null : id)
  }

  const calcularPorcentajeEfectividad = (punto: PuntoTiro): { izq: number; der: number } => {
    const izq = punto.realizadoIzq && punto.realizadoIzq > 0
      ? Math.round((punto.cantidad / punto.realizadoIzq) * 100)
      : 0
    
    const der = punto.realizadoDer && punto.realizadoDer > 0
      ? Math.round((punto.cantidad / punto.realizadoDer) * 100)
      : 0
    
    return { izq, der }
  }

  const getNombrePunto = (posicion: string) => {
    const nombres: any = {
      'esquina_izq': 'Esquina Izquierda',
      'codo_izq': 'Codo Izquierdo',
      'medio': 'Centro',
      'codo_der': 'Codo Derecho',
      'esquina_der': 'Esquina Derecha'
    }
    return nombres[posicion] || posicion
  }

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando sesiones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/entrenador">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sesiones Completadas</h1>
                <p className="text-sm text-gray-600 mt-1">Progreso de tus deportistas</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas por Deportista */}
        {estadisticasDeportistas.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Resumen por Deportista</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {estadisticasDeportistas.map((stat) => (
                  <div
                    key={stat.deportistaId}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 transition cursor-pointer"
                    onClick={() => setDeportistaSeleccionado(
                      deportistaSeleccionado === stat.deportistaId ? 'todos' : stat.deportistaId
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{stat.nombre}</h3>
                        <p className="text-xs text-gray-500 mt-1">{stat.totalSesiones} sesión{stat.totalSesiones > 1 ? 'es' : ''}</p>
                      </div>
                      {stat.tendencia !== null && (
                        <div className={`flex items-center gap-1 ${
                          stat.tendencia > 0 ? 'text-green-600' : stat.tendencia < 0 ? 'text-primary-600' : 'text-gray-600'
                        }`}>
                          {stat.tendencia > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : stat.tendencia < 0 ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : null}
                          {stat.tendencia !== 0 && (
                            <span className="text-xs font-semibold">
                              {stat.tendencia > 0 ? '+' : ''}{Math.round(stat.tendencia)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Completitud</span>
                        <span className="font-semibold text-gray-900">{stat.promedioCompletitud}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stat.promedioCompletitud >= 80 ? 'bg-green-500' :
                            stat.promedioCompletitud >= 60 ? 'bg-primary-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${stat.promedioCompletitud}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtro activo */}
        {deportistaSeleccionado !== 'todos' && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Mostrando sesiones de:</span>
            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-semibold">
              {estadisticasDeportistas.find(s => s.deportistaId === deportistaSeleccionado)?.nombre}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeportistaSeleccionado('todos')}
            >
              Ver todos
            </Button>
          </div>
        )}
        {sesiones.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No hay sesiones completadas aún</p>
              <p className="text-sm text-gray-400 mt-2">
                Las sesiones aparecerán aquí cuando los deportistas completen sus entrenamientos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sesiones
              .filter(s => deportistaSeleccionado === 'todos' || s.deportista.id === deportistaSeleccionado)
              .map((sesion) => (
              <Card key={sesion.id} className="overflow-hidden">
                <div
                  className="cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleSesion(sesion.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Foto del deportista */}
                        <div className="flex-shrink-0">
                          {sesion.deportista.foto ? (
                            <img
                              src={sesion.deportista.foto}
                              alt={sesion.deportista.nombre}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-primary-600" />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {sesion.deportista.nombre} {sesion.deportista.apellidos}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {sesion.planEntrenamiento.titulo}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatearFecha(sesion.fecha)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {sesion.duracion} min
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Resumen de completitud */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                          {sesion.resultados.filter(r => r.completado).length}/{sesion.resultados.length}
                        </div>
                        <p className="text-xs text-gray-500">ejercicios completados</p>
                      </div>
                    </div>
                  </CardHeader>
                </div>

                {/* Detalles expandibles */}
                {sesionExpandida === sesion.id && (
                  <CardContent className="border-t border-gray-200 bg-gray-50">
                    <div className="space-y-6">
                      {/* Observaciones generales */}
                      {sesion.observaciones && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2">📝 Observaciones del Deportista</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{sesion.observaciones}</p>
                        </div>
                      )}

                      {/* Resultados por ejercicio */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Resultados por Ejercicio</h4>
                        <div className="space-y-3">
                          {sesion.resultados.map((resultado, idx) => (
                            <div
                              key={resultado.id}
                              className={`p-4 rounded-lg border-2 ${
                                resultado.completado
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {resultado.completado ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-gray-400" />
                                  )}
                                  <h5 className="font-semibold text-gray-900">
                                    {idx + 1}. {resultado.titulo}
                                  </h5>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  resultado.completado
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {resultado.completado ? 'Completado' : 'Pendiente'}
                                </span>
                              </div>

                              {/* Notas del ejercicio */}
                              {resultado.notas && (
                                <p className="text-sm text-gray-700 mt-2 pl-7">
                                  💭 {resultado.notas}
                                </p>
                              )}

                              {/* Puntos de tiro */}
                              {resultado.puntosTiro && resultado.puntosTiro.length > 0 && (
                                <div className="mt-3 pl-7">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">
                                    <Target className="inline h-3 w-3 mr-1" />
                                    Estadísticas de Tiro
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {resultado.puntosTiro.map((punto) => {
                                      const porcentajes = calcularPorcentajeEfectividad(punto)
                                      return (
                                        <div key={punto.posicion} className="bg-white p-3 rounded border border-gray-200">
                                          <p className="text-xs font-semibold text-gray-700 mb-1">
                                            {getNombrePunto(punto.posicion)}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            Meta: {punto.cantidad} convertidos
                                          </p>
                                          
                                          {punto.amboLados ? (
                                            <div className="mt-2 space-y-1">
                                              <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-600">Lado Izq:</span>
                                                <span className={`font-semibold ${
                                                  porcentajes.izq >= 50 ? 'text-green-600' : 'text-primary-600'
                                                }`}>
                                                  {punto.cantidad}/{punto.realizadoIzq || 0} = {porcentajes.izq}%
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-600">Lado Der:</span>
                                                <span className={`font-semibold ${
                                                  porcentajes.der >= 50 ? 'text-green-600' : 'text-primary-600'
                                                }`}>
                                                  {punto.cantidad}/{punto.realizadoDer || 0} = {porcentajes.der}%
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="mt-2">
                                              <span className={`text-sm font-semibold ${
                                                porcentajes.izq >= 50 ? 'text-green-600' : 'text-primary-600'
                                              }`}>
                                                {punto.cantidad}/{punto.realizadoIzq || 0} = {porcentajes.izq}%
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
