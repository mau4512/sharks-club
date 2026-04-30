'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Users, Calendar, ClipboardCheck, LogOut, Activity } from 'lucide-react'

export default function EntrenadorDashboard() {
  const router = useRouter()
  const [entrenador, setEntrenador] = useState<any>(null)
  const [turnos, setTurnos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay sesión de entrenador
    const entrenadorData = localStorage.getItem('entrenador')
    if (!entrenadorData) {
      router.push('/entrenador/login')
      return
    }
    
    const entrenadorParsed = JSON.parse(entrenadorData)
    setEntrenador(entrenadorParsed)
    fetchTurnosYDeportistas(entrenadorParsed.id)
  }, [router])

  const fetchTurnosYDeportistas = async (entrenadorId: string) => {
    try {
      // Obtener turnos del entrenador
      const turnosResponse = await fetch('/api/turnos')
      if (turnosResponse.ok) {
        const allTurnos = await turnosResponse.json()
        const misTurnos = allTurnos.filter((t: any) => t.entrenadorId === entrenadorId)
        setTurnos(misTurnos)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('entrenador')
    router.push('/')
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
              <h1 className="text-2xl font-bold text-gray-900">Portal del Entrenador</h1>
              <p className="text-sm text-gray-600 mt-1">Bienvenido, {entrenador?.nombre} {entrenador?.apellidos}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mis Turnos */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Mis Turnos Asignados</h2>
          </CardHeader>
          <CardContent>
            {turnos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tienes turnos asignados</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turnos.map((turno) => (
                  <div key={turno.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition">
                    <h3 className="font-semibold text-gray-900 mb-2">{turno.nombre}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>⏰ {turno.hora} - {turno.tipo === 'diurno' ? 'Diurno' : 'Nocturno'}</p>
                      <p>📚 {turno.seccion.replace('_', ' ')}</p>
                      <p>👥 {turno._count?.deportistas || 0} deportistas inscritos</p>
                    </div>
                    <Link href={`/entrenador/asistencias?turnoId=${turno.id}`}>
                      <Button size="sm" className="w-full mt-3">
                        Ver Asistencias
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones Principales */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Acciones Rápidas</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/entrenador/entrenamientos"
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center group"
              >
                <Calendar className="h-12 w-12 text-gray-400 group-hover:text-primary-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900 mb-2">Preparar Entrenamientos</p>
                <p className="text-sm text-gray-600">Planificar sesiones de entrenamiento</p>
              </Link>

              <Link
                href="/entrenador/sesiones"
                className="p-6 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center group bg-primary-50"
              >
                <Activity className="h-12 w-12 text-primary-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900 mb-2">Ver Sesiones Completadas</p>
                <p className="text-sm text-gray-600">Progreso de tus deportistas</p>
              </Link>

              <Link
                href="/entrenador/asistencias"
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center group"
              >
                <ClipboardCheck className="h-12 w-12 text-gray-400 group-hover:text-primary-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900 mb-2">Registrar Asistencias</p>
                <p className="text-sm text-gray-600">Tomar asistencia de tus grupos</p>
              </Link>

              <Link
                href="/entrenador/mis-deportistas"
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center group"
              >
                <Users className="h-12 w-12 text-gray-400 group-hover:text-primary-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900 mb-2">Mis Deportistas</p>
                <p className="text-sm text-gray-600">Ingresar al listado completo de deportistas</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Especialidades y Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Mis Especialidades</h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {entrenador?.especialidad?.map((esp: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
                    {esp}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Información</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Email:</span> {entrenador?.email}</p>
                {entrenador?.celular && (
                  <p><span className="font-medium">Celular:</span> {entrenador?.celular}</p>
                )}
                <p><span className="font-medium">Estado:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${entrenador?.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {entrenador?.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
