'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoTurnoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [entrenadores, setEntrenadores] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'diurno',
    hora: '',
    modalidad: 'interdiario',
    entrenadorId: '',
    activo: true
  })

  useEffect(() => {
    fetchEntrenadores()
  }, [])

  const fetchEntrenadores = async () => {
    try {
      const response = await fetch('/api/entrenadores')
      if (response.ok) {
        const data = await response.json()
        setEntrenadores(data.filter((e: any) => e.activo))
      }
    } catch (error) {
      console.error('Error al cargar entrenadores:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/turnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/turnos')
      } else {
        alert('Error al crear el turno')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear el turno')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/turnos" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Turnos
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Turno</h1>
        <p className="text-gray-600 mt-2">Completa la información del turno</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Información del Turno</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Turno *
              </label>
              <Input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Turno Mañana"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Turno *
                </label>
                <Select
                  id="tipo"
                  name="tipo"
                  required
                  value={formData.tipo}
                  onChange={handleChange}
                >
                  <option value="diurno">Diurno</option>
                  <option value="nocturno">Nocturno</option>
                </Select>
              </div>

              <div>
                <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-2">
                  Hora *
                </label>
                <Input
                  id="hora"
                  name="hora"
                  type="time"
                  required
                  value={formData.hora}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="modalidad" className="block text-sm font-medium text-gray-700 mb-2">
                Modalidad *
              </label>
              <Select
                id="modalidad"
                name="modalidad"
                required
                value={formData.modalidad}
                onChange={handleChange}
              >
                <option value="interdiario">Interdiario (12 sesiones)</option>
                <option value="diario">Diario (20 sesiones)</option>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona la frecuencia del plan de entrenamiento
              </p>
            </div>

            <div>
              <label htmlFor="entrenadorId" className="block text-sm font-medium text-gray-700 mb-2">
                Entrenador Asignado
              </label>
              <Select
                id="entrenadorId"
                name="entrenadorId"
                value={formData.entrenadorId}
                onChange={handleChange}
              >
                <option value="">Sin asignar</option>
                {entrenadores.map(entrenador => (
                  <option key={entrenador.id} value={entrenador.id}>
                    {entrenador.nombre} {entrenador.apellidos} - {entrenador.especialidad.join(', ')}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Opcional: Asigna un entrenador a este turno
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="activo"
                name="activo"
                type="checkbox"
                checked={formData.activo}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
                Turno activo
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-4 border-t sm:flex-row">
              <Button type="submit" disabled={loading} className="w-full sm:flex-1">
                {loading ? 'Creando...' : 'Crear Turno'}
              </Button>
              <Link href="/admin/turnos" className="w-full sm:flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
