'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { CheckCircle, TrendingUp, TrendingDown, Target, Award, Home, ArrowRight } from 'lucide-react'

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
  planEntrenamiento: {
    id: string
    titulo: string
    fecha: string
  }
}

interface Estadistica {
  promedio: number
  sesionesAnteriores: number
  mejora: number | null
}

export default function ResumenSesion() {
  const router = useRouter()
  const params = useParams()
  const sesionId = params.id as string

  const [sesion, setSesion] = useState<SesionEntrenamiento | null>(null)
  const [deportista, setDeportista] = useState<any>(null)
  const [estadisticas, setEstadisticas] = useState<Map<string, Estadistica>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const deportistaData = localStorage.getItem('deportista')
    if (!deportistaData) {
      router.push('/deportista/login')
      return
    }
    
    const deportistaParsed = JSON.parse(deportistaData)
    setDeportista(deportistaParsed)
    fetchSesionYEstadisticas(sesionId, deportistaParsed.id)
  }, [sesionId, router])

  const fetchSesionYEstadisticas = async (sesionId: string, deportistaId: string) => {
    try {
      // Obtener la sesión actual
      const sesionResponse = await fetch(`/api/sesiones/${sesionId}`)
      if (sesionResponse.ok) {
        const sesionData = await sesionResponse.json()
        setSesion(sesionData)

        // Obtener todas las sesiones del deportista para calcular promedios
        const todasSesionesResponse = await fetch(`/api/sesiones?deportistaId=${deportistaId}`)
        if (todasSesionesResponse.ok) {
          const todasSesiones = await todasSesionesResponse.json()
          calcularEstadisticas(sesionData, todasSesiones)
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularEstadisticas = (sesionActual: SesionEntrenamiento, todasSesiones: SesionEntrenamiento[]) => {
    const stats = new Map<string, Estadistica>()
    
    // Para cada ejercicio de la sesión actual
    sesionActual.resultados.forEach((ejercicioActual) => {
      // Buscar ejercicios con el mismo título en sesiones anteriores
      const ejerciciosAnteriores: EjercicioResultado[] = []
      
      todasSesiones.forEach((sesion) => {
        if (sesion.id !== sesionActual.id && new Date(sesion.fecha) < new Date(sesionActual.fecha)) {
          const ejercicioEncontrado = sesion.resultados.find(
            (ej: any) => ej.titulo === ejercicioActual.titulo
          )
          if (ejercicioEncontrado) {
            ejerciciosAnteriores.push(ejercicioEncontrado)
          }
        }
      })

      if (ejerciciosAnteriores.length > 0 && ejercicioActual.puntosTiro) {
        // Calcular porcentaje promedio del ejercicio actual
        const porcentajeActual = calcularPorcentajeTotal(ejercicioActual.puntosTiro)
        
        // Calcular porcentaje promedio de ejercicios anteriores
        const porcentajesAnteriores = ejerciciosAnteriores
          .filter(ej => ej.puntosTiro && ej.puntosTiro.length > 0)
          .map(ej => calcularPorcentajeTotal(ej.puntosTiro!))
        
        if (porcentajesAnteriores.length > 0) {
          const promedioAnterior = porcentajesAnteriores.reduce((a, b) => a + b, 0) / porcentajesAnteriores.length
          const mejora = porcentajeActual - promedioAnterior
          
          stats.set(ejercicioActual.id, {
            promedio: promedioAnterior,
            sesionesAnteriores: porcentajesAnteriores.length,
            mejora: mejora
          })
        }
      }
    })

    setEstadisticas(stats)
  }

  const calcularPorcentajeTotal = (puntosTiro: PuntoTiro[]): number => {
    let totalConvertidos = 0
    let totalIntentos = 0

    puntosTiro.forEach(punto => {
      if (punto.amboLados) {
        totalConvertidos += punto.cantidad * 2
        totalIntentos += (punto.realizadoIzq || 0) + (punto.realizadoDer || 0)
      } else {
        totalConvertidos += punto.cantidad
        totalIntentos += (punto.realizadoIzq || 0)
      }
    })

    return totalIntentos > 0 ? Math.round((totalConvertidos / totalIntentos) * 100) : 0
  }

  const calcularPorcentajePunto = (punto: PuntoTiro): { izq: number; der: number; promedio: number } => {
    const izq = punto.realizadoIzq && punto.realizadoIzq > 0
      ? Math.round((punto.cantidad / punto.realizadoIzq) * 100)
      : 0
    
    const der = punto.realizadoDer && punto.realizadoDer > 0
      ? Math.round((punto.cantidad / punto.realizadoDer) * 100)
      : 0
    
    const promedio = punto.amboLados && punto.realizadoIzq && punto.realizadoDer
      ? Math.round(((punto.cantidad * 2) / (punto.realizadoIzq + punto.realizadoDer)) * 100)
      : izq
    
    return { izq, der, promedio }
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

  const getColorPorcentaje = (porcentaje: number) => {
    if (porcentaje >= 70) return 'text-green-600 bg-green-50 border-green-200'
    if (porcentaje >= 50) return 'text-primary-600 bg-primary-50 border-primary-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando resumen...</p>
        </div>
      </div>
    )
  }

  if (!sesion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Sesión no encontrada</p>
      </div>
    )
  }

  const ejerciciosCompletados = sesion.resultados.filter(r => r.completado).length
  const porcentajeCompletitud = Math.round((ejerciciosCompletados / sesion.resultados.length) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">¡Entrenamiento Completado!</h1>
            <p className="text-gray-600 mt-2">Excelente trabajo, {deportista?.nombre}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Award className="h-12 w-12 text-primary-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">{porcentajeCompletitud}%</p>
                <p className="text-sm text-gray-600 mt-1">Completitud</p>
                <p className="text-xs text-gray-500 mt-2">
                  {ejerciciosCompletados} de {sesion.resultados.length} ejercicios
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">{sesion.duracion}</p>
                <p className="text-sm text-gray-600 mt-1">Minutos totales</p>
                <p className="text-xs text-gray-500 mt-2">
                  {sesion.planEntrenamiento.titulo}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">
                  {estadisticas.size > 0 ? estadisticas.size : '-'}
                </p>
                <p className="text-sm text-gray-600 mt-1">Con historial</p>
                <p className="text-xs text-gray-500 mt-2">
                  Ejercicios con datos previos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultados por Ejercicio */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900">Resultados Detallados</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sesion.resultados.map((ejercicio, idx) => {
                const stat = estadisticas.get(ejercicio.id)
                const porcentajeActual = ejercicio.puntosTiro ? calcularPorcentajeTotal(ejercicio.puntosTiro) : null

                return (
                  <div
                    key={ejercicio.id}
                    className={`p-6 rounded-lg border-2 ${
                      ejercicio.completado ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {idx + 1}. {ejercicio.titulo}
                        </h3>
                        {ejercicio.notas && (
                          <p className="text-sm text-gray-700 mt-2">
                            💭 {ejercicio.notas}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ejercicio.completado ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {ejercicio.completado ? '✓ Completado' : 'Pendiente'}
                      </span>
                    </div>

                    {/* Estadísticas de Tiro */}
                    {ejercicio.puntosTiro && ejercicio.puntosTiro.length > 0 && (
                      <div>
                        {/* Comparación con promedio anterior */}
                        {stat && porcentajeActual !== null && (
                          <div className={`mb-4 p-4 rounded-lg border-2 ${
                            stat.mejora && stat.mejora > 0
                              ? 'bg-green-50 border-green-300'
                              : stat.mejora && stat.mejora < 0
                              ? 'bg-primary-50 border-primary-300'
                              : 'bg-blue-50 border-blue-300'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  Porcentaje Actual: {porcentajeActual}%
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Promedio anterior: {Math.round(stat.promedio)}% (basado en {stat.sesionesAnteriores} sesión{stat.sesionesAnteriores > 1 ? 'es' : ''})
                                </p>
                              </div>
                              <div className="text-right">
                                {stat.mejora !== null && stat.mejora !== 0 && (
                                  <div className={`flex items-center gap-1 ${
                                    stat.mejora > 0 ? 'text-green-600' : 'text-primary-600'
                                  }`}>
                                    {stat.mejora > 0 ? (
                                      <TrendingUp className="h-5 w-5" />
                                    ) : (
                                      <TrendingDown className="h-5 w-5" />
                                    )}
                                    <span className="text-lg font-bold">
                                      {stat.mejora > 0 ? '+' : ''}{Math.round(stat.mejora)}%
                                    </span>
                                  </div>
                                )}
                                {stat.mejora === 0 && (
                                  <span className="text-blue-600 font-semibold">Sin cambio</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Desglose por punto */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {ejercicio.puntosTiro.map((punto) => {
                            const porcentajes = calcularPorcentajePunto(punto)
                            return (
                              <div
                                key={punto.posicion}
                                className={`p-4 rounded-lg border-2 ${getColorPorcentaje(porcentajes.promedio)}`}
                              >
                                <p className="font-semibold text-sm mb-2">
                                  {getNombrePunto(punto.posicion)}
                                </p>
                                <div className="text-2xl font-bold mb-1">
                                  {porcentajes.promedio}%
                                </div>
                                <p className="text-xs opacity-75 mb-2">
                                  Meta: {punto.cantidad} convertidos
                                </p>
                                
                                {punto.amboLados ? (
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span>Izq:</span>
                                      <span className="font-semibold">
                                        {punto.cantidad}/{punto.realizadoIzq || 0} ({porcentajes.izq}%)
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Der:</span>
                                      <span className="font-semibold">
                                        {punto.cantidad}/{punto.realizadoDer || 0} ({porcentajes.der}%)
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs">
                                    {punto.cantidad}/{punto.realizadoIzq || 0} intentos
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Observaciones Generales */}
        {sesion.observaciones && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Tus Observaciones</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{sesion.observaciones}</p>
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        <div className="flex justify-center gap-4">
          <Link href="/deportista">
            <Button size="lg" variant="outline">
              <Home className="h-5 w-5 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
          <Link href="/deportista/historial">
            <Button size="lg">
              Ver Mi Historial
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
