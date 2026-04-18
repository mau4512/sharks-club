'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft } from 'lucide-react'

interface Turno {
  id: string
  nombre: string
  hora: string
  tipo: string
  seccion: string
  activo: boolean
}

interface Entrenador {
  id: string
  nombre: string
  apellidos: string
  documentoIdentidad: string
  email: string
  celular?: string
  especialidad?: string
  activo: boolean
  turnoId?: string
}

export default function EditarEntrenadorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    documentoIdentidad: '',
    email: '',
    password: '',
    celular: '',
    activo: true,
  })

  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [turnosSeleccionados, setTurnosSeleccionados] = useState<string[]>([])

  const especialidadesDisponibles = [
    'Todas',
    'Preparación Física',
    'Técnica Individual',
    'Entrenamiento Personalizado',
    'Táctica',
    'Defensa',
    'Ataque'
  ]

  useEffect(() => {
    fetchEntrenador()
    fetchTurnos()
  }, [id])

  const fetchEntrenador = async () => {
    try {
      const response = await fetch(`/api/entrenadores/${id}`)
      if (response.ok) {
        const data: any = await response.json()
        setFormData({
          nombre: data.nombre,
          apellidos: data.apellidos,
          documentoIdentidad: data.documentoIdentidad,
          email: data.email,
          password: '',
          celular: data.celular || '',
          activo: data.activo,
        })
        setEspecialidades(data.especialidad || [])
        // Los turnos ahora vienen desde la relación
        if (data.turnos) {
          setTurnosSeleccionados(data.turnos.map((t: any) => t.id))
        }
      }
    } catch (error) {
      console.error('Error al cargar entrenador:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchTurnos = async () => {
    try {
      const response = await fetch('/api/turnos')
      if (response.ok) {
        const data = await response.json()
        setTurnos(data)
      }
    } catch (error) {
      console.error('Error al cargar turnos:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData({
        ...formData,
        [name]: checked
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleEspecialidadChange = (especialidad: string) => {
    if (especialidad === 'Todas') {
      if (especialidades.includes('Todas')) {
        setEspecialidades([])
      } else {
        setEspecialidades([...especialidadesDisponibles])
      }
    } else {
      if (especialidades.includes(especialidad)) {
        setEspecialidades(especialidades.filter(e => e !== especialidad && e !== 'Todas'))
      } else {
        const nuevasEspecialidades = [...especialidades, especialidad]
        if (nuevasEspecialidades.length === especialidadesDisponibles.length - 1 && !nuevasEspecialidades.includes('Todas')) {
          setEspecialidades([...especialidadesDisponibles])
        } else {
          setEspecialidades(nuevasEspecialidades)
        }
      }
    }
  }

  const handleTurnoChange = (turnoId: string) => {
    if (turnosSeleccionados.includes(turnoId)) {
      setTurnosSeleccionados(turnosSeleccionados.filter(id => id !== turnoId))
    } else {
      setTurnosSeleccionados([...turnosSeleccionados, turnoId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/entrenadores/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          especialidad: especialidades,
          turnoIds: turnosSeleccionados
        }),
      })

      if (response.ok) {
        router.push('/admin/entrenadores')
      } else {
        const data = await response.json()
        alert(data.error || 'Error al actualizar el entrenador')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el entrenador')
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Cargando datos del entrenador...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/entrenadores">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Entrenadores
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Entrenador</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <Input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Nombre del entrenador"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos *
                  </label>
                  <Input
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    required
                    placeholder="Apellidos del entrenador"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Identidad *
                  </label>
                  <Input
                    name="documentoIdentidad"
                    value={formData.documentoIdentidad}
                    onChange={handleChange}
                    required
                    placeholder="DNI/Cédula"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Celular
                  </label>
                  <Input
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Dejar vacío para mantener contraseña actual"
                  />
                  <p className="text-xs text-gray-500 mt-1">Solo completa si deseas cambiar la contraseña</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidades
                </label>
                <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                  {especialidadesDisponibles.map((esp) => (
                    <div key={esp} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`esp-${esp}`}
                        checked={especialidades.includes(esp)}
                        onChange={() => handleEspecialidadChange(esp)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`esp-${esp}`}
                        className="ml-2 block text-sm text-gray-700 cursor-pointer"
                      >
                        {esp}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Selecciona una o varias especialidades del entrenador
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asignar Turnos
                </label>
                <div className="space-y-2 border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {turnos.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay turnos disponibles</p>
                  ) : (
                    turnos.map((turno) => (
                      <div key={turno.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`turno-${turno.id}`}
                          checked={turnosSeleccionados.includes(turno.id)}
                          onChange={() => handleTurnoChange(turno.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`turno-${turno.id}`}
                          className="ml-2 block text-sm text-gray-700 cursor-pointer"
                        >
                          {turno.nombre} - {turno.hora} ({turno.tipo})
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Puedes asignar uno o varios turnos
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
                  Entrenador activo
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/entrenadores')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
