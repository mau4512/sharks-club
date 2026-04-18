'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Calendar, CheckCircle, XCircle, User } from 'lucide-react'
import Link from 'next/link'

interface Deportista {
  id: string
  nombre: string
  apellidos: string
  email: string
  photoUrl: string | null
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

  useEffect(() => {
    cargarDatos()
  }, [id])

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
          calcularEstadisticas(turnoData.deportistas, asistenciasData)
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularEstadisticas = (deportistas: Deportista[], asistencias: Asistencia[]) => {
    const estadisticas = deportistas.map((deportista) => {
      const asistenciasDeportista = asistencias.filter(
        (a) => a.deportistaId === deportista.id
      )
      
      const presentes = asistenciasDeportista.filter((a) => a.presente).length
      const ausentes = asistenciasDeportista.filter((a) => !a.presente).length
      const total = asistenciasDeportista.length
      const porcentaje = total > 0 ? (presentes / total) * 100 : 0

      return {
        deportistaId: deportista.id,
        nombre: deportista.nombre,
        apellidos: deportista.apellidos,
        totalAsistencias: total,
        presentes,
        ausentes,
        porcentaje
      }
    })

    setStats(estadisticas)
  }

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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Resumen de Asistencias por Deportista
              </h2>
              <Link href={`/admin/turnos/${id}/tomar-asistencia`}>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Tomar Asistencia Hoy
                </Button>
              </Link>
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
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {stat.nombre} {stat.apellidos}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Total: {stat.totalAsistencias} registros
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
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

                        <div className="text-center min-w-[80px]">
                          <div className="text-2xl font-bold text-gray-900">
                            {stat.porcentaje.toFixed(0)}%
                          </div>
                          <p className="text-xs text-gray-500">Asistencia</p>
                        </div>
                      </div>
                    </div>

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
