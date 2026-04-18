'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ChevronLeft, Calendar, Clock, CheckCircle, TrendingUp, Target, Award } from 'lucide-react'

interface SesionEntrenamiento {
  id: string
  fecha: string
  duracion: number
  observaciones: string
  resultados: any[]
  planEntrenamiento: {
    id: string
    titulo: string
    fecha: string
  }
}

export default function HistorialDeportista() {
  const router = useRouter()
  const [deportista, setDeportista] = useState<any>(null)
  const [sesiones, setSesiones] = useState<SesionEntrenamiento[]>([])
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const deportistaData = localStorage.getItem('deportista')
    if (!deportistaData) {
      router.push('/deportista/login')
      return
    }
    
    const deportistaParsed = JSON.parse(deportistaData)
    setDeportista(deportistaParsed)
    fetchData(deportistaParsed.id)
  }, [router])

  const fetchData = async (deportistaId: string) => {
    try {
      // Obtener sesiones
      const sesionesResponse = await fetch(`/api/sesiones?deportistaId=${deportistaId}`)
      if (sesionesResponse.ok) {
        const sesionesData = await sesionesResponse.json()
        setSesiones(sesionesData)
      }

      // Obtener estadísticas
      const statsResponse = await fetch(`/api/estadisticas/deportista/${deportistaId}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setEstadisticas(statsData)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando historial...</p>
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
              <Link href="/deportista">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mi Historial de Entrenamientos</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {deportista?.nombre} {deportista?.apellidos}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas Generales */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calendar className="h-10 w-10 text-primary-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.totalSesiones}</p>
                  <p className="text-sm text-gray-600 mt-1">Sesiones Totales</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.promedioCompletitud}%</p>
                  <p className="text-sm text-gray-600 mt-1">Completitud</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.ejerciciosUnicos}</p>
                  <p className="text-sm text-gray-600 mt-1">Ejercicios Únicos</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-10 w-10 text-purple-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{Math.round(estadisticas.duracionTotal / 60)}h</p>
                  <p className="text-sm text-gray-600 mt-1">Tiempo Total</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progreso por Ejercicio */}
        {estadisticas && estadisticas.ejercicios && estadisticas.ejercicios.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Progreso por Ejercicio</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {estadisticas.ejercicios.map((ejercicio: any, idx: number) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{ejercicio.titulo}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {ejercicio.sesiones} sesión{ejercicio.sesiones > 1 ? 'es' : ''} • 
                          Última: {formatearFecha(ejercicio.ultimaSesion)}
                        </p>
                      </div>
                      {ejercicio.tendencia !== null && ejercicio.tendencia !== 0 && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                          ejercicio.tendencia > 0 ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'
                        }`}>
                          <TrendingUp className={`h-4 w-4 ${ejercicio.tendencia < 0 ? 'rotate-180' : ''}`} />
                          <span className="text-xs font-semibold">
                            {ejercicio.tendencia > 0 ? '+' : ''}{Math.round(ejercicio.tendencia)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Completitud</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${ejercicio.porcentajeCompletitud}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {ejercicio.porcentajeCompletitud}%
                          </span>
                        </div>
                      </div>

                      {ejercicio.promedioEfectividad !== null && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Efectividad Promedio</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  ejercicio.promedioEfectividad >= 70 ? 'bg-green-500' :
                                  ejercicio.promedioEfectividad >= 50 ? 'bg-primary-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${ejercicio.promedioEfectividad}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {ejercicio.promedioEfectividad}%
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-600 mb-1">Realizados</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {ejercicio.completados} de {ejercicio.sesiones}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Sesiones */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">Todas las Sesiones</h2>
          </CardHeader>
          <CardContent>
            {sesiones.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay sesiones registradas</p>
            ) : (
              <div className="space-y-3">
                {sesiones.map((sesion) => {
                  const completados = sesion.resultados.filter((r: any) => r.completado).length
                  const porcentaje = Math.round((completados / sesion.resultados.length) * 100)
                  
                  return (
                    <Link key={sesion.id} href={`/deportista/resumen-sesion/${sesion.id}`}>
                      <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{sesion.planEntrenamiento.titulo}</h3>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatearFecha(sesion.fecha)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {sesion.duracion} min
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {completados}/{sesion.resultados.length} ejercicios
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              porcentaje >= 80 ? 'text-green-600' :
                              porcentaje >= 60 ? 'text-primary-600' : 'text-red-600'
                            }`}>
                              {porcentaje}%
                            </div>
                            <p className="text-xs text-gray-500">completitud</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
