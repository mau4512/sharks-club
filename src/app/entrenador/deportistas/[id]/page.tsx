'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, Calendar, TrendingUp, Trophy, Target } from 'lucide-react'

export default function DeportistaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [deportista, setDeportista] = useState<any>(null)
  const [turno, setTurno] = useState<any>(null)
  const [asistencias, setAsistencias] = useState<any[]>([])
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
      const [deportistaRes, turnosRes, asistenciasRes] = await Promise.all([
        fetch(`/api/deportistas/${params.id}`),
        fetch('/api/turnos'),
        fetch(`/api/asistencias?deportistaId=${params.id}`)
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
      }
    } catch (error) {
      console.error('Error al cargar deportista:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularAsistencia = () => {
    if (asistencias.length === 0) return 0
    const presentes = asistencias.filter(a => a.presente).length
    return Math.round((presentes / asistencias.length) * 100)
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
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Asistencia</span>
                    <span className="text-2xl font-bold text-primary-600">{porcentajeAsistencia}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${porcentajeAsistencia}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {asistencias.filter(a => a.presente).length} de {asistencias.length} sesiones
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
                    <p className="text-3xl font-bold text-blue-600">{asistencias.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Total registradas</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Presentes</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {asistencias.filter(a => a.presente).length}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Asistencias confirmadas</p>
                  </div>

                  <div className="bg-primary-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                      <h3 className="font-semibold text-gray-900">Racha</h3>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {porcentajeAsistencia}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Tasa de asistencia</p>
                  </div>
                </div>
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
                          <span className="text-sm text-gray-700">
                            {new Date(asistencia.fecha).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
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
