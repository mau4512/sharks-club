'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Target, MapPin, CheckCircle, TrendingUp } from 'lucide-react'

interface Posicion {
  zona: string
  meta: number
}

interface EjercicioTiro {
  id: string
  nombre: string
  posiciones: Posicion[]
  metaTotal: number
  turno: {
    nombre: string
  }
}

interface RegistroTiro {
  id: string
  posicion: string
  metaPosicion: number
  intentos: number
  aciertos: number
  completado: boolean
  fecha: string
}

export default function EntrenamientoTiroPage() {
  const [ejercicios, setEjercicios] = useState<EjercicioTiro[]>([])
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState<EjercicioTiro | null>(null)
  const [posicionActual, setPosicionActual] = useState(0)
  const [intentos, setIntentos] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const [registros, setRegistros] = useState<RegistroTiro[]>([])
  const [loading, setLoading] = useState(false)
  
  // Simulamos el ID del deportista (debería venir de la sesión)
  const deportistaId = 'deportista-demo-id'

  useEffect(() => {
    fetchEjercicios()
    fetchRegistros()
  }, [])

  const fetchEjercicios = async () => {
    try {
      const res = await fetch('/api/ejercicios-tiro?activo=true')
      const data = await res.json()
      setEjercicios(data)
    } catch (error) {
      console.error('Error al cargar ejercicios:', error)
    }
  }

  const fetchRegistros = async () => {
    try {
      const res = await fetch(`/api/registros-tiro?deportistaId=${deportistaId}`)
      const data = await res.json()
      setRegistros(data)
    } catch (error) {
      console.error('Error al cargar registros:', error)
    }
  }

  const seleccionarEjercicio = (ejercicio: EjercicioTiro) => {
    setEjercicioSeleccionado(ejercicio)
    setPosicionActual(0)
    setIntentos(0)
    setAciertos(0)
  }

  const registrarTiro = async (esAcierto: boolean) => {
    const nuevosIntentos = intentos + 1
    const nuevosAciertos = esAcierto ? aciertos + 1 : aciertos
    
    setIntentos(nuevosIntentos)
    setAciertos(nuevosAciertos)

    // Verificar si completó la meta de esta posición
    if (nuevosAciertos >= ejercicioSeleccionado!.posiciones[posicionActual].meta) {
      // Guardar el registro
      setLoading(true)
      try {
        await fetch('/api/registros-tiro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ejercicioTiroId: ejercicioSeleccionado!.id,
            deportistaId: deportistaId,
            posicion: ejercicioSeleccionado!.posiciones[posicionActual].zona,
            metaPosicion: ejercicioSeleccionado!.posiciones[posicionActual].meta,
            intentos: nuevosIntentos,
            aciertos: nuevosAciertos
          })
        })

        // Pasar a la siguiente posición o finalizar
        if (posicionActual < ejercicioSeleccionado!.posiciones.length - 1) {
          setPosicionActual(posicionActual + 1)
          setIntentos(0)
          setAciertos(0)
          alert(`¡Completaste ${ejercicioSeleccionado!.posiciones[posicionActual].zona}! Pasando a la siguiente posición...`)
        } else {
          alert('¡Felicitaciones! Completaste el ejercicio completo')
          setEjercicioSeleccionado(null)
          fetchRegistros()
        }
      } catch (error) {
        console.error('Error al registrar tiro:', error)
        alert('Error al guardar el registro')
      } finally {
        setLoading(false)
      }
    }
  }

  if (ejercicioSeleccionado) {
    const posicion = ejercicioSeleccionado.posiciones[posicionActual]
    const progreso = (aciertos / posicion.meta) * 100

    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{ejercicioSeleccionado.nombre}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Posición {posicionActual + 1} de {ejercicioSeleccionado.posiciones.length}
                </p>
              </div>
              <Button onClick={() => setEjercicioSeleccionado(null)} className="bg-gray-500">
                Cancelar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center bg-primary-50 rounded-lg p-6">
              <MapPin className="h-12 w-12 text-primary-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900">{posicion.zona}</h3>
              <p className="text-sm text-gray-600 mt-1">Posición actual</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Progreso</span>
                <span className="text-sm font-bold text-primary-600">
                  {aciertos} / {posicion.meta} aciertos
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-primary-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Intentos</p>
                <p className="text-3xl font-bold text-blue-600">{intentos}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Aciertos</p>
                <p className="text-3xl font-bold text-green-600">{aciertos}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button
                onClick={() => registrarTiro(false)}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 h-20 text-lg"
              >
                ❌ Fallo
              </Button>
              <Button
                onClick={() => registrarTiro(true)}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 h-20 text-lg"
              >
                ✅ Acierto
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                Registra cada tiro para llevar el conteo de intentos necesarios para alcanzar tu meta
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Entrenamiento de Tiro</h1>
        <p className="text-gray-600 mt-2">Selecciona un ejercicio para comenzar</p>
      </div>

      <div className="grid gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ejercicios Disponibles</h2>
          <div className="grid gap-4">
            {ejercicios.map((ejercicio) => (
              <Card key={ejercicio.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => seleccionarEjercicio(ejercicio)}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-primary-600" />
                        <h3 className="font-semibold text-lg">{ejercicio.nombre}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Turno: {ejercicio.turno.nombre}</p>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          {ejercicio.posiciones.length} posiciones
                        </span>
                        <span className="text-primary-600 font-medium">
                          Meta: {ejercicio.metaTotal} aciertos
                        </span>
                      </div>
                    </div>
                    <Button size="sm">Comenzar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {ejercicios.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay ejercicios disponibles</p>
                  <p className="text-sm text-gray-500 mt-1">Espera a que tu entrenador configure ejercicios</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {registros.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Historial Reciente</h2>
            <div className="grid gap-3">
              {registros.slice(0, 5).map((registro) => (
                <Card key={registro.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {registro.completado ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-primary-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{registro.posicion}</p>
                          <p className="text-sm text-gray-600">
                            {registro.intentos} intentos para {registro.aciertos} aciertos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {((registro.aciertos / registro.intentos) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(registro.fecha).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
