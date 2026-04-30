'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface Turno {
  id: string
  nombre: string
  hora: string
  tipo: string
  seccion: string
  activo: boolean
}

export default function NuevoEntrenadorPage() {
  const router = useRouter()
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    documentoIdentidad: '',
    email: '',
    password: '',
    celular: '',
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
    fetchTurnos()
  }, [])

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleEspecialidadChange = (especialidad: string) => {
    if (especialidad === 'Todas') {
      // Si selecciona "Todas", marcar/desmarcar todas
      if (especialidades.includes('Todas')) {
        setEspecialidades([])
      } else {
        setEspecialidades([...especialidadesDisponibles])
      }
    } else {
      // Si selecciona una específica
      if (especialidades.includes(especialidad)) {
        // Remover esa especialidad y "Todas" si estaba marcada
        setEspecialidades(especialidades.filter(e => e !== especialidad && e !== 'Todas'))
      } else {
        const nuevasEspecialidades = [...especialidades, especialidad]
        // Si ahora tiene todas las especialidades específicas, agregar "Todas"
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
      const response = await fetch('/api/entrenadores', {
        method: 'POST',
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
        toast.error(data.error || 'Error al crear el entrenador')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear el entrenador')
      setLoading(false)
    }
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Registrar Nuevo Entrenador</h1>

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
                    Contraseña *
                  </label>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Contraseña de acceso"
                  />
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

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creando...' : 'Crear Entrenador'}
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
