'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { POSICIONES } from '@/lib/constants'

interface Turno {
  id: string
  nombre: string
  tipo: string
  hora: string
  activo: boolean
  _count: { deportistas: number }
}

export default function NuevoDeportistaPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    documentoIdentidad: '',
    email: '',
    password: '',
    confirmPassword: '',
    celular: '',
    nombreApoderado: '',
    telefonoApoderado: '',
    fechaNacimiento: '',
    altura: '',
    peso: '',
    posicion: '',
    planSesiones: '12',
    turnoId: ''
  })

  useEffect(() => {
    fetchTurnos()
  }, [])

  const fetchTurnos = async () => {
    try {
      const response = await fetch('/api/turnos')
      if (response.ok) {
        const data = await response.json()
        // Filtrar solo turnos activos. Los turnos no tienen limite de deportistas.
        setTurnos(Array.isArray(data) ? data.filter((t: Turno) => t.activo) : [])
      }
    } catch (error) {
      console.error('Error al cargar turnos:', error)
      setTurnos([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }
    
    // Validar longitud mínima de contraseña
    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    setIsSubmitting(true)

    try {
      // Remover confirmPassword antes de enviar
      const { confirmPassword, ...dataToSend } = formData
      
      const response = await fetch('/api/deportistas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al registrar deportista')
      }
      
      alert('Deportista registrado exitosamente')
      router.push('/admin/deportistas')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al registrar deportista')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Registrar Nuevo Deportista</h1>
          <p className="text-gray-600 mt-1">Completa la información del deportista</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Credenciales de Acceso:</strong> El DNI y la contraseña que establezcas aquí serán las credenciales principales que el deportista usará para iniciar sesión en su portal. El email es opcional.
            </p>
          </div>
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
                  label="Contraseña *"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <Input
                  label="Confirmar Contraseña *"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Repite la contraseña"
                  minLength={6}
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

            {/* Información Deportiva */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Deportiva</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </div>

            {/* Plan de Sesiones */}
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
                  label="Turno"
                  name="turnoId"
                  value={formData.turnoId}
                  onChange={handleChange}
                >
                  <option value="">Sin turno asignado</option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nombre} - {turno.tipo === 'diurno' ? 'Diurno' : 'Nocturno'} ({turno.hora}) - {turno._count.deportistas} inscritos
                    </option>
                  ))}
                </Select>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Selecciona el plan de entrenamiento y turno (opcional) para este deportista
              </p>
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
                {isSubmitting ? 'Guardando...' : 'Registrar Deportista'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
