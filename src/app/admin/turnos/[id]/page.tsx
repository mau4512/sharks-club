'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Save, Loader2, UserPlus, X, Calendar } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { confirmDialog } from '@/components/ui/confirm-dialog'

interface Turno {
  id: string
  nombre: string
  tipo: string
  hora: string
  modalidad: string
  activo: boolean
  deportistas: Array<{
    id: string
    nombre: string
    apellidos: string
    email: string
  }>
}

interface Deportista {
  id: string
  nombre: string
  apellidos: string
  email: string
  turnoId: string | null
}

export default function EditarTurnoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [turno, setTurno] = useState<Turno | null>(null)
  const [deportistasDisponibles, setDeportistasDisponibles] = useState<Deportista[]>([])
  const [showAddDeportista, setShowAddDeportista] = useState(false)
  const [selectedDeportistaId, setSelectedDeportistaId] = useState('')
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'diurno',
    hora: '',
    modalidad: 'interdiario',
    activo: true
  })

  useEffect(() => {
    cargarTurno()
    cargarDeportistasDisponibles()
  }, [id])

  const cargarTurno = async () => {
    try {
      const response = await fetch(`/api/turnos/${id}`)
      if (!response.ok) throw new Error('Error al cargar turno')
      
      const data = await response.json()
      setTurno(data)
      setFormData({
        nombre: data.nombre,
        tipo: data.tipo,
        hora: data.hora,
        modalidad: data.modalidad,
        activo: data.activo
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar el turno')
    } finally {
      setLoading(false)
    }
  }

  const cargarDeportistasDisponibles = async () => {
    try {
      const response = await fetch('/api/deportistas')
      if (!response.ok) throw new Error('Error al cargar deportistas')
      
      const data = await response.json()
      // Filtrar solo deportistas sin turno asignado
      setDeportistasDisponibles(data.filter((d: Deportista) => !d.turnoId))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/turnos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/turnos')
      } else {
        toast.error('Error al actualizar el turno')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el turno')
    } finally {
      setIsSubmitting(false)
    }
  }

  const agregarDeportista = async () => {
    if (!selectedDeportistaId) return

    try {
      const response = await fetch(`/api/deportistas/${selectedDeportistaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ turnoId: id })
      })

      if (response.ok) {
        setShowAddDeportista(false)
        setSelectedDeportistaId('')
        cargarTurno()
        cargarDeportistasDisponibles()
      } else {
        toast.error('Error al agregar deportista al turno')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al agregar deportista al turno')
    }
  }

  const removerDeportista = async (deportistaId: string) => {
    const confirmed = await confirmDialog({
      title: 'Remover deportista',
      description: '¿Deseas remover este deportista del turno?',
      confirmText: 'Remover',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/deportistas/${deportistaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ turnoId: null })
      })

      if (response.ok) {
        cargarTurno()
        cargarDeportistasDisponibles()
      } else {
        toast.error('Error al remover deportista del turno')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al remover deportista del turno')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!turno) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Turno no encontrado</p>
        <Link href="/admin/turnos">
          <Button className="mt-4">Volver a Turnos</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/turnos" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Turnos
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Turno</h1>
            <p className="text-gray-600 mt-2">Modifica la información del turno y gestiona sus deportistas</p>
          </div>
          <Link href={`/admin/turnos/${id}/asistencias`}>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Ver Asistencias
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de edición */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Información del Turno</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Nombre del Turno *"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Turno Mañana"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Tipo de Turno *"
                  name="tipo"
                  required
                  value={formData.tipo}
                  onChange={handleChange}
                >
                  <option value="diurno">Diurno</option>
                  <option value="nocturno">Nocturno</option>
                </Select>

                <Input
                  label="Hora *"
                  name="hora"
                  type="time"
                  required
                  value={formData.hora}
                  onChange={handleChange}
                />
              </div>

              <Select
                label="Modalidad *"
                name="modalidad"
                required
                value={formData.modalidad}
                onChange={handleChange}
              >
                <option value="interdiario">Interdiario (12 sesiones)</option>
                <option value="diario">Diario (20 sesiones)</option>
              </Select>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                  Turno activo
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
                <Link href="/admin/turnos" className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de deportistas */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Deportistas en este Turno</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {turno.deportistas.length} deportistas inscritos
                </p>
              </div>
              <Button 
                onClick={() => setShowAddDeportista(!showAddDeportista)}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddDeportista && deportistasDisponibles.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Deportista
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedDeportistaId}
                    onChange={(e) => setSelectedDeportistaId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Selecciona un deportista...</option>
                    {deportistasDisponibles.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.nombre} {dep.apellidos} - {dep.email || 'sin email'}
                      </option>
                    ))}
                  </select>
                  <Button 
                    onClick={agregarDeportista}
                    disabled={!selectedDeportistaId}
                    size="sm"
                  >
                    Agregar
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowAddDeportista(false)
                      setSelectedDeportistaId('')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {showAddDeportista && deportistasDisponibles.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No hay deportistas disponibles. Todos los deportistas ya tienen un turno asignado.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {turno.deportistas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay deportistas en este turno
                </p>
              ) : (
                turno.deportistas.map((deportista) => (
                  <div 
                    key={deportista.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {deportista.nombre} {deportista.apellidos}
                      </p>
                      <p className="text-sm text-gray-600">{deportista.email}</p>
                    </div>
                    <button
                      onClick={() => removerDeportista(deportista.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remover del turno"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
