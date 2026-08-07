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
        email: deportista.email,
        becado: deportista.becado,
        deudaStatus: deportista.deudaStatus,
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
                          <h3 className={`font-semibold ${
                            stat.deudaStatus?.tieneDeuda ? 'text-red-700' : 'text-gray-900'
                          }`}>
                            {stat.nombre} {stat.apellidos}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Total: {stat.totalAsistencias} registros
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
