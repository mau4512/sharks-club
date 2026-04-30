'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Clock, CheckCircle, Target, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PuntoTiro {
  posicion: string
  cantidad: number
  amboLados: boolean
  realizadoIzq?: number
  realizadoDer?: number
}

interface Ejercicio {
  id: string
  titulo: string
  descripcion: string
  duracion: number
  meta: {
    tipo: string
    cantidad: number
    unidad: string
    tipoTiro?: string
  }
  puntosTiro?: PuntoTiro[]
  tipoRecurso: string
  pizarra?: {
    tipo: string
    data: string
  }
  videoUrl?: string
}

export default function EjecutarEntrenamientoPage() {
  const router = useRouter()
  const params = useParams()
  const planId = params.id as string

  const [deportista, setDeportista] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [ejercicioActual, setEjercicioActual] = useState(0)
  const [resultados, setResultados] = useState<any>({})

  useEffect(() => {
    const deportistaData = localStorage.getItem('deportista')
    if (!deportistaData) {
      router.push('/deportista/login')
      return
    }
    
    const parsed = JSON.parse(deportistaData)
    setDeportista(parsed)
    fetchPlan(parsed.id)
  }, [])

  const fetchPlan = async (deportistaId: string) => {
    try {
      const response = await fetch(`/api/planes-entrenamiento/${planId}`)
      if (response.ok) {
        const data = await response.json()
        
        // Verificar si ya existe una sesión de hoy para este plan
        const hoy = new Date().toISOString().split('T')[0]
        const sesionesResponse = await fetch(`/api/sesiones?deportistaId=${deportistaId}`)
        
        if (sesionesResponse.ok) {
          const sesiones = await sesionesResponse.json()
          const sesionHoy = sesiones.find((s: any) => {
            const fechaSesion = new Date(s.fecha).toISOString().split('T')[0]
            return s.planEntrenamientoId === planId && fechaSesion === hoy
          })
          
          if (sesionHoy) {
            toast.info('Ya completaste este entrenamiento hoy. Revisa tu resumen en el historial.')
            router.push(`/deportista/resumen-sesion/${sesionHoy.id}`)
            return
          }
        }
        
        setPlan(data)
        
        // Inicializar resultados para cada ejercicio
        const resultadosIniciales: any = {}
        data.ejercicios?.forEach((ejercicio: Ejercicio) => {
          resultadosIniciales[ejercicio.id] = {
            completado: false,
            duracionReal: ejercicio.duracion,
            notas: '',
            puntosTiro: ejercicio.puntosTiro?.map(punto => ({
              ...punto,
              realizadoIzq: 0,
              realizadoDer: punto.amboLados ? 0 : undefined
            })) || []
          }
        })
        setResultados(resultadosIniciales)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const actualizarPuntoTiro = (ejercicioId: string, puntoIndex: number, campo: 'realizadoIzq' | 'realizadoDer', valor: number) => {
    setResultados((prev: any) => ({
      ...prev,
      [ejercicioId]: {
        ...prev[ejercicioId],
        puntosTiro: prev[ejercicioId].puntosTiro.map((punto: any, idx: number) =>
          idx === puntoIndex ? { ...punto, [campo]: valor } : punto
        )
      }
    }))
  }

  const marcarEjercicioCompletado = (ejercicioId: string) => {
    setResultados((prev: any) => ({
      ...prev,
      [ejercicioId]: {
        ...prev[ejercicioId],
        completado: !prev[ejercicioId].completado
      }
    }))
  }

  const guardarSesion = async () => {
    if (!deportista) return

    setGuardando(true)
    try {
      // Recopilar todas las observaciones de los ejercicios
      const todasObservaciones = plan.ejercicios
        .map((ej: Ejercicio, idx: number) => {
          const obs = resultados[ej.id]?.notas
          return obs ? `${idx + 1}. ${ej.titulo}: ${obs}` : null
        })
        .filter(Boolean)
        .join('\n\n')

      const sesionData = {
        deportistaId: deportista.id,
        planEntrenamientoId: planId,
        fecha: new Date().toISOString(),
        duracion: plan.ejercicios.reduce((sum: number, ej: Ejercicio) => sum + ej.duracion, 0),
        ejercicios: plan.ejercicios.map((ej: Ejercicio) => ({
          id: ej.id,
          titulo: ej.titulo,
          completado: resultados[ej.id]?.completado || false,
          notas: resultados[ej.id]?.notas || '',
          puntosTiro: ej.puntosTiro?.map((pt: any) => ({
            ...pt,
            realizadoIzq: resultados[ej.id]?.puntosTiro?.find((p: any) => p.posicion === pt.posicion)?.realizadoIzq || 0,
            realizadoDer: resultados[ej.id]?.puntosTiro?.find((p: any) => p.posicion === pt.posicion)?.realizadoDer || 0
          }))
        })),
        observaciones: todasObservaciones
      }

      console.log('📤 Guardando sesión:', JSON.stringify(sesionData, null, 2))

      const response = await fetch('/api/sesiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sesionData)
      })

      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error del servidor:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          toast.error(`Error al guardar: ${errorData.error}. Detalles: ${errorData.details || 'No disponibles'}`)
        } catch {
          toast.error(`Error al guardar la sesión. Status: ${response.status}`)
        }
        return
      }
      
      const sesionCreada = await response.json()
      console.log('✅ Sesión creada con ID:', sesionCreada.id)
      // Redirigir al resumen de la sesión
      router.push(`/deportista/resumen-sesion/${sesionCreada.id}`)
    } catch (error) {
      console.error('❌ Error completo:', error)
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error('Error desconocido al guardar la sesión')
      }
    } finally {
      setGuardando(false)
    }
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

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Plan no encontrado</p>
      </div>
    )
  }

  const ejercicio = plan.ejercicios[ejercicioActual]
  const resultado = resultados[ejercicio?.id]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/deportista">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{plan.titulo}</h1>
                <p className="text-sm text-gray-600">
                  Ejercicio {ejercicioActual + 1} de {plan.ejercicios.length}
                </p>
              </div>
            </div>
            <Button onClick={guardarSesion} disabled={guardando}>
              <Save className="h-4 w-4 mr-2" />
              {guardando ? 'Guardando...' : 'Finalizar y Guardar'}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progreso */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso del Entrenamiento</span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(((ejercicioActual + 1) / plan.ejercicios.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${((ejercicioActual + 1) / plan.ejercicios.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel principal - Ejercicio actual */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{ejercicio.titulo}</h2>
                    <p className="text-sm text-gray-600 mt-1">{ejercicio.descripcion}</p>
                  </div>
                  <Button
                    variant={resultado.completado ? "primary" : "outline"}
                    onClick={() => marcarEjercicioCompletado(ejercicio.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {resultado.completado ? 'Completado' : 'Marcar completo'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Meta del ejercicio */}
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-primary-900">
                      <Target className="inline h-4 w-4 mr-1" />
                      Meta: {ejercicio.meta.cantidad} {ejercicio.meta.unidad}
                    </p>
                    {ejercicio.meta.tipoTiro && (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        ejercicio.meta.tipoTiro === '2puntos' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {ejercicio.meta.tipoTiro === '2puntos' ? '🏀 2 Puntos' : '🎯 3 Puntos'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-primary-700">
                    <Clock className="h-4 w-4" />
                    <span>Duración estimada: {ejercicio.duracion} minutos</span>
                  </div>
                </div>

                {/* Pizarra táctica */}
                {ejercicio.tipoRecurso === 'pizarra' && ejercicio.pizarra && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      📋 Pizarra: {ejercicio.pizarra.tipo === 'media' ? 'Media Cancha' : 'Cancha Completa'}
                    </p>
                    <img
                      src={ejercicio.pizarra.data}
                      alt="Pizarra táctica"
                      className="border border-gray-300 rounded max-w-full h-auto"
                    />
                  </div>
                )}

                {/* Puntos de Tiro */}
                {ejercicio.puntosTiro && ejercicio.puntosTiro.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">📍 Registro por Puntos de Tiro</h3>
                    {resultado.puntosTiro.map((punto: any, idx: number) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{getNombrePunto(punto.posicion)}</h4>
                          <span className="text-sm font-semibold text-primary-600">
                            Meta: {punto.cantidad} convertidos{punto.amboLados && ' por lado'}
                          </span>
                        </div>
                        
                        <div className={`grid ${punto.amboLados ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {punto.amboLados ? 'Tiros Intentados (Izq)' : 'Total de Tiros Intentados'}
                            </label>
                            <Input
                              type="number"
                              min="0"
                              value={punto.realizadoIzq || 0}
                              onChange={(e) => actualizarPuntoTiro(ejercicio.id, idx, 'realizadoIzq', Number(e.target.value))}
                              placeholder="Total de intentos"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Convertidos: {punto.cantidad} / Intentos: {punto.realizadoIzq || 0}
                              {punto.realizadoIzq > 0 && ` = ${Math.round((punto.cantidad / punto.realizadoIzq) * 100)}%`}
                            </p>
                          </div>
                          
                          {punto.amboLados && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Tiros Intentados (Der)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                value={punto.realizadoDer || 0}
                                onChange={(e) => actualizarPuntoTiro(ejercicio.id, idx, 'realizadoDer', Number(e.target.value))}
                                placeholder="Total de intentos"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Convertidos: {punto.cantidad} / Intentos: {punto.realizadoDer || 0}
                                {punto.realizadoDer > 0 && ` = ${Math.round((punto.cantidad / punto.realizadoDer) * 100)}%`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas del Ejercicio
                  </label>
                  <textarea
                    value={resultado.notas}
                    onChange={(e) => setResultados((prev: any) => ({
                      ...prev,
                      [ejercicio.id]: { ...prev[ejercicio.id], notas: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                    placeholder="Observaciones, dificultades, logros..."
                  />
                </div>

                {/* Navegación entre ejercicios */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setEjercicioActual(Math.max(0, ejercicioActual - 1))}
                    disabled={ejercicioActual === 0}
                  >
                    ← Anterior
                  </Button>
                  <Button
                    onClick={() => setEjercicioActual(Math.min(plan.ejercicios.length - 1, ejercicioActual + 1))}
                    disabled={ejercicioActual === plan.ejercicios.length - 1}
                  >
                    Siguiente →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral - Lista de ejercicios */}
          <div>
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Todos los Ejercicios</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plan.ejercicios.map((ej: Ejercicio, idx: number) => (
                    <button
                      key={ej.id}
                      onClick={() => setEjercicioActual(idx)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition ${
                        idx === ejercicioActual
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">{idx + 1}. {ej.titulo}</span>
                        {resultados[ej.id]?.completado && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {ej.duracion} min • {ej.meta.cantidad} {ej.meta.unidad}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
