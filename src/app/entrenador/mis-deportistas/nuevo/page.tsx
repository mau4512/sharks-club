'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { POSICIONES } from '@/lib/constants'
import { getPlanSesionesByModalidad, getTurnoModalidadLabel } from '@/lib/pagos-config'
import { toast } from 'sonner'

interface Turno {
  id: string
  nombre: string
  hora: string
  modalidad: string
  activo: boolean
  entrenadorId?: string | null
}

export default function NuevoDeportistaEntrenadorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [entrenadorId, setEntrenadorId] = useState('')
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    documentoIdentidad: '',
    fechaNacimiento: '',
    email: '',
    celular: '',
    nombreApoderado: '',
    telefonoApoderado: '',
    posicion: '',
    turnoId: '',
    planSesiones: '12',
  })

  useEffect(() => {
    const entrenadorRaw = localStorage.getItem('entrenador')
    if (!entrenadorRaw) {
      router.push('/entrenador/login')
      return
    }

    const entrenador = JSON.parse(entrenadorRaw)
    setEntrenadorId(entrenador.id)
    void fetchTurnos(entrenador.id)
  }, [router])

  const fetchTurnos = async (currentEntrenadorId: string) => {
    try {
      const response = await fetch('/api/turnos')
      if (!response.ok) {
        throw new Error('No se pudieron cargar los turnos')
      }

      const data = await response.json()
      const turnosEntrenador = Array.isArray(data)
        ? data.filter((turno: Turno) => turno.activo && turno.entrenadorId === currentEntrenadorId)
        : []

      setTurnos(turnosEntrenador)
    } catch (error) {
      console.error('Error al cargar turnos del entrenador:', error)
      toast.error('No se pudieron cargar tus turnos')
      setTurnos([])
    } finally {
      setLoading(false)
    }
  }

  const turnoSeleccionado = useMemo(
    () => turnos.find((turno) => turno.id === formData.turnoId) || null,
    [formData.turnoId, turnos]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'turnoId') {
      const turno = turnos.find((item) => item.id === value)
      setFormData((current) => ({
        ...current,
        turnoId: value,
        planSesiones: getPlanSesionesByModalidad(turno?.modalidad),
      }))
      return
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.turnoId) {
      toast.error('Selecciona uno de tus turnos')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/deportistas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creadoDesde: 'entrenador',
          entrenadorId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo registrar el deportista')
      }

      toast.success('Deportista agregado al grupo')
      router.push('/entrenador/mis-deportistas')
    } catch (error: any) {
      console.error('Error al crear deportista desde entrenador:', error)
      toast.error(error.message || 'No se pudo registrar el deportista')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/entrenador/mis-deportistas" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Mis Deportistas
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Agregar Deportista al Grupo</h1>
          <p className="mt-1 text-gray-600">
            Registra lo básico y luego administración completa el expediente.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Registro rápido</h2>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Este registro no exige todos los datos. Si faltan DNI, fecha de nacimiento o datos del apoderado,
              quedarán pendientes para que administración los complete. Hasta entonces el deportista no tendrá
              credenciales definitivas para ingresar a su portal.
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Datos principales</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Nombres *"
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
                    placeholder="Ej: Pérez López"
                  />
                  <Select
                    label="Turno a cargo *"
                    name="turnoId"
                    value={formData.turnoId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona uno de tus turnos</option>
                    {turnos.map((turno) => (
                      <option key={turno.id} value={turno.id}>
                        {turno.nombre} · {turno.hora}
                      </option>
                    ))}
                  </Select>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-sm font-medium text-gray-700">Plan asociado al turno</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {turnoSeleccionado
                        ? getTurnoModalidadLabel(turnoSeleccionado.modalidad)
                        : 'Selecciona un turno para verlo'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Datos opcionales</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Documento de identidad"
                    name="documentoIdentidad"
                    value={formData.documentoIdentidad}
                    onChange={handleChange}
                    placeholder="Si el deportista lo conoce"
                  />
                  <Input
                    label="Fecha de nacimiento"
                    name="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
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
                    label="Teléfono de contacto"
                    name="celular"
                    type="tel"
                    value={formData.celular}
                    onChange={handleChange}
                    placeholder="Puede ser del deportista o del apoderado"
                  />
                  <Input
                    label="Padre o apoderado"
                    name="nombreApoderado"
                    value={formData.nombreApoderado}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                  <Input
                    label="Teléfono del apoderado"
                    name="telefonoApoderado"
                    type="tel"
                    value={formData.telefonoApoderado}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                  <Select
                    label="Posición"
                    name="posicion"
                    value={formData.posicion}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Sin definir todavía' },
                      ...POSICIONES.map((posicion) => ({ value: posicion, label: posicion })),
                    ]}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link href="/entrenador/mis-deportistas" className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || turnos.length === 0}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar deportista
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
