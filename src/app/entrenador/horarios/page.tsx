'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Link from 'next/link'
import { ArrowLeft, Clock, Users, MapPin, Calendar } from 'lucide-react'

export default function HorariosPage() {
  const router = useRouter()
  const [entrenador, setEntrenador] = useState<any>(null)
  const [turnos, setTurnos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const entrenadorData = localStorage.getItem('entrenador')
    if (!entrenadorData) {
      router.push('/entrenador/login')
      return
    }
    
    const entrenadorParsed = JSON.parse(entrenadorData)
    setEntrenador(entrenadorParsed)
    fetchTurnos(entrenadorParsed.id)
  }, [router])

  const fetchTurnos = async (entrenadorId: string) => {
    try {
      const response = await fetch('/api/turnos')
      if (response.ok) {
        const allTurnos = await response.json()
        const misTurnos = allTurnos.filter((t: any) => t.entrenadorId === entrenadorId)
        
        // Ordenar por día y hora
        const diasOrden: { [key: string]: number } = {
          'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 7
        }
        
        misTurnos.sort((a: any, b: any) => {
          const diaA = diasOrden[a.dia] || 0
          const diaB = diasOrden[b.dia] || 0
          if (diaA !== diaB) return diaA - diaB
          return a.hora.localeCompare(b.hora)
        })
        
        setTurnos(misTurnos)
      }
    } catch (error) {
      console.error('Error al cargar turnos:', error)
    } finally {
      setLoading(false)
    }
  }

  const turnosPorDia = turnos.reduce((acc: any, turno: any) => {
    if (!acc[turno.dia]) {
      acc[turno.dia] = []
    }
    acc[turno.dia].push(turno)
    return acc
  }, {})

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/entrenador" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Mis Horarios</h1>
          <p className="text-gray-600 mt-1">{turnos.length} turnos asignados</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {turnos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tienes turnos asignados aún</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {diasSemana.map(dia => {
              const turnosDia = turnosPorDia[dia]
              if (!turnosDia || turnosDia.length === 0) return null

              return (
                <Card key={dia}>
                  <CardHeader>
                    <h2 className="text-xl font-bold text-gray-900">{dia}</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {turnosDia.map((turno: any) => (
                        <div 
                          key={turno.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-16 h-16 bg-primary-100 rounded-lg flex flex-col items-center justify-center">
                              <Clock className="h-5 w-5 text-primary-600 mb-1" />
                              <span className="text-xs font-semibold text-primary-600">
                                {turno.hora}
                              </span>
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {turno.nombre}
                              </h3>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  Sección: {turno.seccion}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {turno._count?.deportistas || turno.deportistas?.length || 0} deportistas
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  {turno.tipo}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Link
                            href={`/entrenador/asistencias?turnoId=${turno.id}`}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                          >
                            Tomar Asistencia
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
