'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Target, Trash2, MapPin } from 'lucide-react'

interface Turno {
  id: string
  nombre: string
  tipo: string
  seccion: string
}

interface Posicion {
  zona: string
  meta: number
}

interface EjercicioTiro {
  id?: string
  turnoId: string
  nombre: string
  posiciones: Posicion[]
  metaTotal: number
  activo: boolean
}

const ZONAS_CANCHA = [
  'Esquina Izquierda',
  'Ala Izquierda',
  'Centro (Top)',
  'Ala Derecha',
  'Esquina Derecha',
  'Tiro Libre',
  'Media Distancia Centro',
  'Media Distancia Izquierda',
  'Media Distancia Derecha',
  'Pintura (cerca del aro)'
]

export default function EjerciciosTiroPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [ejercicios, setEjercicios] = useState<EjercicioTiro[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState<EjercicioTiro>({
    turnoId: '',
    nombre: '',
    posiciones: [{ zona: ZONAS_CANCHA[0], meta: 5 }],
    metaTotal: 5,
    activo: true
  })

  useEffect(() => {
    fetchTurnos()
    fetchEjercicios()
  }, [])

  const fetchTurnos = async () => {
    try {
      const res = await fetch('/api/turnos')
      const data = await res.json()
      setTurnos(data)
    } catch (error) {
      console.error('Error al cargar turnos:', error)
    }
  }

  const fetchEjercicios = async () => {
    try {
      const res = await fetch('/api/ejercicios-tiro')
      const data = await res.json()
      setEjercicios(data)
    } catch (error) {
      console.error('Error al cargar ejercicios:', error)
    }
  }

  const agregarPosicion = () => {
    const nuevasPosiciones = [...formData.posiciones, { zona: ZONAS_CANCHA[0], meta: 5 }]
    const metaTotal = nuevasPosiciones.reduce((sum, p) => sum + p.meta, 0)
    setFormData({
      ...formData,
      posiciones: nuevasPosiciones,
      metaTotal
    })
  }

  const eliminarPosicion = (index: number) => {
    const nuevasPosiciones = formData.posiciones.filter((_, i) => i !== index)
    const metaTotal = nuevasPosiciones.reduce((sum, p) => sum + p.meta, 0)
    setFormData({
      ...formData,
      posiciones: nuevasPosiciones,
      metaTotal
    })
  }

  const actualizarPosicion = (index: number, campo: 'zona' | 'meta', valor: string | number) => {
    const nuevasPosiciones = [...formData.posiciones]
    nuevasPosiciones[index] = {
      ...nuevasPosiciones[index],
      [campo]: campo === 'meta' ? parseInt(valor as string) || 0 : valor
    }
    const metaTotal = nuevasPosiciones.reduce((sum, p) => sum + p.meta, 0)
    setFormData({
      ...formData,
      posiciones: nuevasPosiciones,
      metaTotal
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/ejercicios-tiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        alert('Ejercicio de tiro creado exitosamente')
        setShowForm(false)
        setFormData({
          turnoId: '',
          nombre: '',
          posiciones: [{ zona: ZONAS_CANCHA[0], meta: 5 }],
          metaTotal: 5,
          activo: true
        })
        fetchEjercicios()
      } else {
        alert('Error al crear ejercicio')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear ejercicio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ejercicios de Tiro</h1>
          <p className="text-gray-600 mt-2">Configura ejercicios de tiro para los deportistas</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ejercicio
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Crear Ejercicio de Tiro</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Ejercicio
                </label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Tiro triple progresivo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turno
                </label>
                <select
                  value={formData.turnoId}
                  onChange={(e) => setFormData({ ...formData, turnoId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Seleccionar turno</option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nombre} - {turno.tipo} - {turno.seccion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Posiciones y Metas
                  </label>
                  <Button type="button" onClick={agregarPosicion} size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar Posición
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.posiciones.map((posicion, index) => (
                    <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <select
                        value={posicion.zona}
                        onChange={(e) => actualizarPosicion(index, 'zona', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {ZONAS_CANCHA.map((zona) => (
                          <option key={zona} value={zona}>{zona}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="1"
                        value={posicion.meta}
                        onChange={(e) => actualizarPosicion(index, 'meta', e.target.value)}
                        placeholder="Meta"
                        className="w-24"
                      />
                      <span className="text-sm text-gray-600">aciertos</span>
                      {formData.posiciones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarPosicion(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm font-medium text-primary-900">
                    Meta Total: {formData.metaTotal} aciertos
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Ejercicio'}
                </Button>
                <Button type="button" onClick={() => setShowForm(false)} className="bg-gray-500">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {ejercicios.map((ejercicio: any) => (
          <Card key={ejercicio.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary-600" />
                    <h3 className="font-semibold text-lg">{ejercicio.nombre}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${ejercicio.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {ejercicio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Turno: {ejercicio.turno?.nombre}
                  </p>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Posiciones:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {(ejercicio.posiciones as Posicion[]).map((pos, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{pos.zona}</span>
                          <span className="text-sm font-medium text-primary-600">{pos.meta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-3">
                    Meta Total: {ejercicio.metaTotal} aciertos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {ejercicios.length === 0 && !showForm && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay ejercicios de tiro configurados</p>
              <p className="text-sm text-gray-500 mt-1">Crea el primer ejercicio para empezar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
