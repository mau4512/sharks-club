'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, FileText, Plus } from 'lucide-react'

export default function SesionesPage() {
  const router = useRouter()
  const [deportista, setDeportista] = useState<any>(null)
  const [sesiones, setSesiones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const deportistaData = localStorage.getItem('deportista')
    if (!deportistaData) {
      router.push('/deportista/login')
      return
    }
    
    const parsed = JSON.parse(deportistaData)
    setDeportista(parsed)
    fetchSesiones(parsed.id)
  }, [router])

  const fetchSesiones = async (deportistaId: string) => {
    try {
      const response = await fetch(`/api/sesiones?deportistaId=${deportistaId}`)
      if (response.ok) {
        const data = await response.json()
        setSesiones(data)
      }
    } catch (error) {
      console.error('Error al cargar sesiones:', error)
    } finally {
      setLoading(false)
    }
  }

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
          <Link href="/deportista" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Mis Sesiones de Entrenamiento</h1>
          <p className="text-gray-600 mt-1">{sesiones.length} sesiones registradas</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sesiones.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No tienes sesiones registradas aún</p>
              <p className="text-sm text-gray-500">Las sesiones serán registradas por tu entrenador</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sesiones.map((sesion: any) => (
              <Card key={sesion.id} className="hover:shadow-lg transition">
                <CardContent className="py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-6 w-6 text-primary-600" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{sesion.tipo}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(sesion.fecha).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                          {sesion.duracion && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {sesion.duracion} minutos
                            </span>
                          )}
                        </div>
                        
                        {sesion.notas && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700 flex items-start gap-2">
                              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{sesion.notas}</span>
                            </p>
                          </div>
                        )}
                        
                        {sesion.ejercicios && sesion.ejercicios.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Ejercicios realizados ({sesion.ejercicios.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {sesion.ejercicios.map((ej: any, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                >
                                  {ej.ejercicio?.titulo || `Ejercicio ${index + 1}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
