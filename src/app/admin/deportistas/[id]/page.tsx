'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { POSICIONES } from '@/lib/constants'
import { toast } from 'sonner'

interface DeportistaData {
  nombre: string
  apellidos: string
  documentoIdentidad: string
  email: string
  celular: string
  nombreApoderado: string
  telefonoApoderado: string
  fechaNacimiento: string
  altura: string
  peso: string
  posicion: string
  tallaCamiseta: string
  numeroCamiseta: string
  planSesiones: string
  turnoId: string
  activo: boolean
  password?: string
  confirmPassword?: string
}

interface Turno {
  id: string
  nombre: string
  tipo: string
  hora: string
}

export default function EditarDeportistaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [formData, setFormData] = useState<DeportistaData>({
    nombre: '',
    apellidos: '',
    documentoIdentidad: '',
    email: '',
    celular: '',
    nombreApoderado: '',
    telefonoApoderado: '',
    fechaNacimiento: '',
    altura: '',
    peso: '',
    posicion: '',
    tallaCamiseta: '',
    numeroCamiseta: '',
    planSesiones: '12',
    turnoId: '',
    activo: true
  })

  useEffect(() => {
    fetchDeportista()
    fetchTurnos()
  }, [id])

  const fetchTurnos = async () => {
    try {
      const response = await fetch('/api/turnos')
      if (response.ok) {
        const data = await response.json()
        // Filtrar solo turnos activos
        setTurnos(Array.isArray(data) ? data.filter((t: any) => t.activo) : [])
      }
    } catch (error) {
      console.error('Error al cargar turnos:', error)
      setTurnos([])
    }
  }

  const fetchDeportista = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/deportistas/${id}`)
      
      if (!response.ok) {
        throw new Error('Deportista no encontrado')
      }
      
      const data = await response.json()
      
      // Formatear fecha para input date
      const fechaNacimiento = new Date(data.fechaNacimiento).toISOString().split('T')[0]
      
      setFormData({
        nombre: data.nombre,
        apellidos: data.apellidos,
        documentoIdentidad: data.documentoIdentidad,
        email: data.email || '',
        celular: data.celular || '',
        nombreApoderado: data.nombreApoderado || '',
        telefonoApoderado: data.telefonoApoderado || '',
        fechaNacimiento,
        altura: data.altura?.toString() || '',
        peso: data.peso?.toString() || '',
        posicion: data.posicion || '',
        tallaCamiseta: data.tallaCamiseta || '',
        numeroCamiseta: data.numeroCamiseta || '',
        planSesiones: data.planSesiones?.toString() || '12',
        turnoId: data.turnoId || '',
        activo: data.activo
      })
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error al cargar deportista')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar contraseñas si se están cambiando
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Las contraseñas no coinciden')
        return
      }
      if (formData.password && formData.password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres')
        return
      }
    }
    
    setIsSubmitting(true)

    try {
      // Crear objeto sin los campos de confirmación
      const { confirmPassword, ...dataToSend } = formData
      
      // Si no se ingresó contraseña, no enviarla
      if (!dataToSend.password) {
        delete dataToSend.password
      }
      
      const response = await fetch(`/api/deportistas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar deportista')
      }
      
      toast.success('Deportista actualizado exitosamente')
      router.push('/admin/deportistas')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al actualizar deportista')
    } finally {
      setIsSubmitting(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin/deportistas">
            <Button>Volver a Deportistas</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/deportistas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Deportistas
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">Editar Deportista</h1>
          <p className="text-gray-600 mt-1">Actualiza la información del deportista</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Personal */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre *"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Juan"
                />
                <Input
                  label="Apellidos *"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  required
                  placeholder="Ej: García López"
                />
                <Input
                  label="Documento de Identidad *"
                  name="documentoIdentidad"
                  value={formData.documentoIdentidad}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 12345678X"
                />
                <Input
                  label="Fecha de Nacimiento *"
                  name="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
                <Input
                  label="Celular"
                  name="celular"
                  type="tel"
                  value={formData.celular}
                  onChange={handleChange}
                  placeholder="Ej: +34 600 123 456"
                />
                <Input
                  label="Nombre del Padre o Apoderado *"
                  name="nombreApoderado"
                  value={formData.nombreApoderado}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Carlos García"
                />
                <Input
                  label="Número del Padre o Apoderado *"
                  name="telefonoApoderado"
                  type="tel"
                  value={formData.telefonoApoderado}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 999 888 777"
                />
              </div>
            </div>

            {/* Cambiar Contraseña */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Contraseña</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Deja estos campos vacíos si no deseas cambiar la contraseña actual del deportista.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nueva Contraseña"
                  name="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <Input
                  label="Confirmar Nueva Contraseña"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword || ''}
                  onChange={handleChange}
                  placeholder="Repite la contraseña"
                  minLength={6}
                />
              </div>
            </div>

            {/* Información Deportiva */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Deportiva</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <Input
                  label="Altura (cm)"
                  name="altura"
                  type="number"
                  value={formData.altura}
                  onChange={handleChange}
                  placeholder="Ej: 188"
                />
                <Input
                  label="Peso (kg)"
                  name="peso"
                  type="number"
                  value={formData.peso}
                  onChange={handleChange}
                  placeholder="Ej: 82"
                />
                <Select
                  label="Posición"
                  name="posicion"
                  value={formData.posicion}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Seleccionar posición' },
                    ...POSICIONES.map(pos => ({ value: pos, label: pos }))
                  ]}
                />
                <Input
                  label="Talla de Camiseta"
                  name="tallaCamiseta"
                  value={formData.tallaCamiseta}
                  onChange={handleChange}
                  placeholder="Ej: S, M, L"
                />
                <Input
                  label="Número de Camiseta"
                  name="numeroCamiseta"
                  value={formData.numeroCamiseta}
                  onChange={handleChange}
                  placeholder="Ej: 7"
                />
              </div>
            </div>

            {/* Plan de Entrenamiento */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan de Entrenamiento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Número de Sesiones *"
                  name="planSesiones"
                  value={formData.planSesiones}
                  onChange={handleChange}
                  required
                  options={[
                    { value: '12', label: '12 Sesiones' },
                    { value: '20', label: '20 Sesiones' }
                  ]}
                />
                <Select
                  label="Turno Asignado"
                  name="turnoId"
                  value={formData.turnoId}
                  onChange={handleChange}
                >
                  <option value="">Sin turno asignado</option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nombre} - {turno.tipo === 'diurno' ? 'Diurno' : 'Nocturno'} ({turno.hora})
                    </option>
                  ))}
                </Select>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Selecciona el plan de entrenamiento y turno para este deportista
              </p>
            </div>

            {/* Estado */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado</h2>
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
                  Deportista activo
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col-reverse gap-3 pt-6 border-t sm:flex-row sm:justify-end">
              <Link href="/admin/deportistas" className="w-full sm:w-auto">
                <Button type="button" variant="secondary" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
