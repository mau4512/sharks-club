'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Target, Calendar, Trophy, Activity, Eye } from 'lucide-react'

export default function EstadisticasPage() {
  const router = useRouter()
  const [deportista, setDeportista] = useState<any>(null)
  const [sesiones, setSesiones] = useState<any[]>([])
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [asistencias, setAsistencias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const deportistaData = localStorage.getItem('deportista')
    if (!deportistaData) {
      router.push('/deportista/login')
      return
    }
    
    const parsed = JSON.parse(deportistaData)
    setDeportista(parsed)
    fetchEstadisticas(parsed.id)
  }, [router])

  const fetchEstadisticas = async (deportistaId: string) => {
    try {
      const [sesionesRes, asistenciasRes, statsRes] = await Promise.all([
        fetch(`/api/sesiones?deportistaId=${deportistaId}`),
        fetch(`/api/asistencias?deportistaId=${deportistaId}`),
        fetch(`/api/estadisticas/deportista/${deportistaId}`)
      ])

      if (sesionesRes.ok) setSesiones(await sesionesRes.json())
      if (asistenciasRes.ok) setAsistencias(await asistenciasRes.json())
      if (statsRes.ok) setEstadisticas(await statsRes.json())
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularAsistencia = () => {
    if (asistencias.length === 0) return 0
    const presentes = asistencias.filter(a => a.presente).length
    return Math.round((presentes / asistencias.length) * 100)
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
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  const porcentajeAsistencia = calcularAsistencia()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/deportista" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Mis Estadísticas</h1>
          <p className="text-gray-600 mt-1">Análisis de tu progreso deportivo</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sesiones Totales</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas?.totalSesiones || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completitud</p>
                  <p className="text-3xl font-bold text-green-600">{estadisticas?.promedioCompletitud || 0}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tiempo Total</p>
                  <p className="text-3xl font-bold text-blue-600">{Math.round((estadisticas?.duracionTotal || 0) / 60)}h</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Asistencia</p>
                  <p className="text-3xl font-bold text-purple-600">{porcentajeAsistencia}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resúmenes de Entrenamientos Completados */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">Entrenamientos Completados</h2>
            <p className="text-sm text-gray-600 mt-1">
              Revisa los resúmenes de tus sesiones anteriores
            </p>
          </CardHeader>
          <CardContent>
            {sesiones.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No tienes entrenamientos completados aún</p>
                <p className="text-sm text-gray-400 mt-2">Los resúmenes aparecerán aquí después de completar tus entrenamientos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sesiones.map((sesion) => {
                  const completados = sesion.resultados?.filter((r: any) => r.completado).length || 0
                  const total = sesion.resultados?.length || 1
                  const porcentaje = Math.round((completados / total) * 100)
                  
                  return (
                    <div
                      key={sesion.id}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{sesion.planEntrenamiento?.titulo || 'Entrenamiento'}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatearFecha(sesion.fecha)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              {sesion.duracion} min
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              porcentaje >= 80 ? 'bg-green-100 text-green-700' :
                              porcentaje >= 60 ? 'bg-primary-100 text-primary-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {porcentaje}% completado
                            </span>
                          </div>
                        </div>
                        <Link href={`/deportista/resumen-sesion/${sesion.id}`}>
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Resumen
                          </Button>
                        </Link>
                      </div>
                    </div>
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
