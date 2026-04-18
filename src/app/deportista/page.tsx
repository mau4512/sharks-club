'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, Calendar, TrendingUp, LogOut, User, Trophy, Camera, CheckCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function DeportistaDashboard() {
  const router = useRouter()
  const [deportista, setDeportista] = useState<any>(null)
  const [sesiones, setSesiones] = useState<any[]>([])
  const [asistencias, setAsistencias] = useState<any[]>([])
  const [planesEntrenamiento, setPlanesEntrenamiento] = useState<any[]>([])
  const [planesExpandidos, setPlanesExpandidos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    // Verificar si hay sesión de deportista
    const deportistaData = localStorage.getItem('deportista')
    if (!deportistaData) {
      router.push('/')
      return
    }
    
    const parsed = JSON.parse(deportistaData)
    setDeportista(parsed)
    fetchData(parsed.id)
  }, [router])

  const fetchData = async (deportistaId: string) => {
    try {
      // Cargar datos del deportista con el turno
      const deportistaRes = await fetch(`/api/deportistas/${deportistaId}`)
      if (deportistaRes.ok) {
        const deportistaData = await deportistaRes.json()
        console.log('Deportista data:', deportistaData)
        setDeportista(deportistaData)
        
        // Si tiene turno, cargar planes de entrenamiento
        if (deportistaData.turnoId) {
          console.log('Cargando planes para turnoId:', deportistaData.turnoId)
          const planesRes = await fetch(`/api/planes-entrenamiento?turnoId=${deportistaData.turnoId}`)
          if (planesRes.ok) {
            const planesData = await planesRes.json()
            console.log('Planes de entrenamiento cargados:', planesData)
            setPlanesEntrenamiento(planesData)
          } else {
            console.error('Error al cargar planes:', await planesRes.text())
          }
        } else {
          console.log('Deportista no tiene turnoId asignado')
        }
      }

      const [sesionesRes, asistenciasRes] = await Promise.all([
        fetch(`/api/sesiones?deportistaId=${deportistaId}`),
        fetch(`/api/asistencias?deportistaId=${deportistaId}`)
      ])

      if (sesionesRes.ok) {
        const sesionesData = await sesionesRes.json()
        setSesiones(sesionesData)
      }

      if (asistenciasRes.ok) {
        const asistenciasData = await asistenciasRes.json()
        setAsistencias(asistenciasData)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/deportistas/${deportista.id}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const updatedDeportista = { ...deportista, photoUrl: data.photoUrl }
        setDeportista(updatedDeportista)
        localStorage.setItem('deportista', JSON.stringify(updatedDeportista))
        alert('Foto actualizada correctamente')
      } else {
        alert('Error al subir la foto')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al subir la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('deportista')
    router.push('/')
  }

  const calcularAsistencia = () => {
    if (asistencias.length === 0) return 0
    const presentes = asistencias.filter(a => a.presente).length
    return Math.round((presentes / asistencias.length) * 100)
  }

  const togglePlanExpandido = (planId: string) => {
    setPlanesExpandidos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(planId)) {
        newSet.delete(planId)
      } else {
        newSet.add(planId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil Deportivo</h1>
              <p className="text-sm text-gray-600 mt-1">Bienvenido, {deportista?.nombre} {deportista?.apellidos}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Foto y Datos Personales */}
          <div className="lg:col-span-1 space-y-6">
            {/* Foto de Perfil */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto">
                      {deportista?.photoUrl ? (
                        <Image
                          src={deportista.photoUrl}
                          alt={`${deportista.nombre} ${deportista.apellidos}`}
                          width={128}
                          height={128}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-100">
                          <User className="h-16 w-16 text-primary-600" />
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="photo-upload"
                      className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition"
                    >
                      <Camera className="h-5 w-5 text-white" />
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mt-4">
                    {deportista?.nombre} {deportista?.apellidos}
                  </h2>
                  <p className="text-gray-600">{deportista?.posicion || 'Jugador'}</p>
                  {uploadingPhoto && (
                    <p className="text-sm text-primary-600 mt-2">Subiendo foto...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información Personal */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Información Personal</h2>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{deportista?.email}</p>
                </div>
                {deportista?.celular && (
                  <div>
                    <span className="font-medium text-gray-700">Celular:</span>
                    <p className="text-gray-900">{deportista?.celular}</p>
                  </div>
                )}
                {deportista?.altura && (
                  <div>
                    <span className="font-medium text-gray-700">Altura:</span>
                    <p className="text-gray-900">{deportista.altura} cm</p>
                  </div>
                )}
                {deportista?.peso && (
                  <div>
                    <span className="font-medium text-gray-700">Peso:</span>
                    <p className="text-gray-900">{deportista.peso} kg</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Plan:</span>
                  <p className="text-gray-900">{deportista?.planSesiones} sesiones</p>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas de Asistencia */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Asistencia</h2>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {calcularAsistencia()}%
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {asistencias.filter(a => a.presente).length} de {asistencias.length} sesiones
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${calcularAsistencia()}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Sesiones y Acciones */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Trophy className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-gray-900">{sesiones.length}</div>
                    <p className="text-sm text-gray-600">Sesiones Totales</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-gray-900">
                      {asistencias.filter(a => a.presente).length}
                    </div>
                    <p className="text-sm text-gray-600">Asistencias</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-gray-900">
                      {deportista?.planSesiones || 0}
                    </div>
                    <p className="text-sm text-gray-600">Plan Contratado</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Últimas Sesiones */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Últimas Sesiones</h2>
                  <Link href="/deportista/sesiones" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Ver todas →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {sesiones.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No tienes sesiones registradas aún</p>
                ) : (
                  <div className="space-y-3">
                    {sesiones.slice(0, 5).map((sesion: any) => (
                      <div
                        key={sesion.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{sesion.tipo}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(sesion.fecha).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        {sesion.duracion && (
                          <span className="text-sm text-gray-600">{sesion.duracion} min</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Entrenamientos Programados */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Entrenamientos Programados</h2>
                  <Trophy className="h-5 w-5 text-primary-600" />
                </div>
              </CardHeader>
              <CardContent>
                {planesEntrenamiento.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay entrenamientos programados aún</p>
                ) : (
                  <div className="space-y-3">
                    {planesEntrenamiento.slice(0, 5).map((plan: any) => {
                      const isExpanded = planesExpandidos.has(plan.id)
                      return (
                        <div
                          key={plan.id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:border-primary-300 transition"
                        >
                          {/* Header clickeable */}
                          <div
                            onClick={() => togglePlanExpandido(plan.id)}
                            className="p-4 cursor-pointer hover:bg-gray-50 transition"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{plan.titulo}</h3>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  )}
                                </div>
                              </div>
                              <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded-full font-medium ml-2">
                                {new Date(plan.fecha).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {Array.isArray(plan.ejercicios) ? plan.ejercicios.length : 0} ejercicios
                              </span>
                              {plan.turno && (
                                <span>• {plan.turno.nombre}</span>
                              )}
                            </div>
                          </div>

                          {/* Contenido expandible */}
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-100">
                              {/* Notas del entrenador */}
                              {plan.notas && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-xs font-semibold text-blue-800 mb-1">Notas del Entrenador:</p>
                                  <p className="text-sm text-blue-900">{plan.notas}</p>
                                </div>
                              )}

                              {/* Lista completa de ejercicios */}
                              {Array.isArray(plan.ejercicios) && plan.ejercicios.length > 0 && (
                                <div className="mt-4 space-y-3">
                                  <p className="text-sm font-semibold text-gray-900">Ejercicios del Entrenamiento:</p>
                                  {plan.ejercicios.map((ejercicio: any, idx: number) => (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-white">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                                            <h4 className="font-semibold text-gray-900">{ejercicio.titulo}</h4>
                                          </div>
                                          {ejercicio.descripcion && (
                                            <p className="text-sm text-gray-600 mb-2">{ejercicio.descripcion}</p>
                                          )}
                                        </div>
                                      </div>

                                      {/* Meta del ejercicio */}
                                      <div className="p-2 bg-primary-50 border border-primary-200 rounded">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="text-xs font-semibold text-primary-800">Meta:</p>
                                            <p className="text-sm text-primary-900">
                                              {ejercicio.meta?.cantidad} {ejercicio.meta?.unidad}
                                            </p>
                                          </div>
                                          {ejercicio.meta?.tipoTiro && (
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                              ejercicio.meta.tipoTiro === '2puntos' 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'bg-purple-100 text-purple-800'
                                            }`}>
                                              {ejercicio.meta.tipoTiro === '2puntos' ? '🏀 2 Puntos' : '🎯 3 Puntos'}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Pizarra táctica */}
                                      {ejercicio.tipoRecurso === 'pizarra' && ejercicio.pizarra && (
                                        <div className="mt-3">
                                          <p className="text-xs font-medium text-gray-700 mb-2">
                                            📋 Pizarra: {ejercicio.pizarra.tipo === 'media' ? 'Media Cancha' : 'Cancha Completa'}
                                          </p>
                                          <img
                                            src={ejercicio.pizarra.data}
                                            alt="Pizarra táctica"
                                            className="border border-gray-300 rounded max-w-full h-auto"
                                          />
                                        </div>
                                      )}

                                      {/* Video */}
                                      {ejercicio.tipoRecurso === 'video' && ejercicio.videoUrl && (
                                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                          <p className="text-xs text-blue-800">
                                            📹 Video: {ejercicio.videoUrl}
                                          </p>
                                        </div>
                                      )}

                                      {/* Duración */}
                                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                                        <Clock className="h-3 w-3" />
                                        <span>{ejercicio.duracion} minutos</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Botón Iniciar Entrenamiento */}
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <Link href={`/deportista/ejecutar-entrenamiento/${plan.id}`}>
                                  <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                                    <Trophy className="h-4 w-4 mr-2" />
                                    Iniciar Entrenamiento
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/deportista/sesiones"
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center group"
                  >
                    <Calendar className="h-10 w-10 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
                    <p className="font-medium text-gray-900 text-sm">Mis Sesiones</p>
                  </Link>

                  <Link
                    href="/deportista/estadisticas"
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center group"
                  >
                    <TrendingUp className="h-10 w-10 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
                    <p className="font-medium text-gray-900 text-sm">Estadísticas</p>
                  </Link>

                  <Link
                    href="/deportista/perfil"
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center group"
                  >
                    <User className="h-10 w-10 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
                    <p className="font-medium text-gray-900 text-sm">Mi Perfil</p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
