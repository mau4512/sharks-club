'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'

type EntrenadorProfile = {
  id: string
  nombre: string
  apellidos: string
  documentoIdentidad: string
  email: string
  celular?: string | null
  especialidad: string[]
  activo: boolean
  turnos?: Array<{ id: string; nombre: string; tipo: string; hora: string }>
}

export default function EntrenadorPerfilPage() {
  const router = useRouter()
  const [entrenador, setEntrenador] = useState<EntrenadorProfile | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    documentoIdentidad: '',
    email: '',
    celular: '',
    especialidad: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const entrenadorRaw = localStorage.getItem('entrenador')
    if (!entrenadorRaw) {
      router.push('/entrenador/login')
      return
    }

    const session = JSON.parse(entrenadorRaw)
    void fetchProfile(session.id)
  }, [router])

  const fetchProfile = async (entrenadorId: string) => {
    try {
      const response = await fetch(`/api/entrenadores/${entrenadorId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo cargar el perfil')
      }

      setEntrenador(data)
      setFormData({
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        documentoIdentidad: data.documentoIdentidad || '',
        email: data.email || '',
        celular: data.celular || '',
        especialidad: Array.isArray(data.especialidad) ? data.especialidad.join(', ') : '',
        password: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'No se pudo cargar el perfil')
      router.push('/entrenador')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!entrenador) return

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('La contraseña y su confirmación no coinciden')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/entrenadores/${entrenador.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          apellidos: formData.apellidos.trim(),
          documentoIdentidad: formData.documentoIdentidad.trim(),
          email: formData.email.trim().toLowerCase(),
          celular: formData.celular.trim() || null,
          especialidad: formData.especialidad
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          password: formData.password || undefined,
          activo: entrenador.activo,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo guardar el perfil')
      }

      const { password, turnos, ...sessionData } = data
      localStorage.setItem('entrenador', JSON.stringify(sessionData))
      setEntrenador(data)
      setFormData((current) => ({
        ...current,
        password: '',
        confirmPassword: '',
      }))
      toast.success('Perfil actualizado correctamente')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/entrenador" className="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Perfil del Entrenador</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Datos personales</h2>
            <p className="mt-1 text-sm text-gray-600">Actualiza tu información de contacto y especialidades.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Nombre</label>
                  <Input value={formData.nombre} onChange={(event) => setFormData({ ...formData, nombre: event.target.value })} required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Apellidos</label>
                  <Input value={formData.apellidos} onChange={(event) => setFormData({ ...formData, apellidos: event.target.value })} required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Documento</label>
                  <Input value={formData.documentoIdentidad} onChange={(event) => setFormData({ ...formData, documentoIdentidad: event.target.value })} required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                  <Input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Celular</label>
                  <Input value={formData.celular} onChange={(event) => setFormData({ ...formData, celular: event.target.value })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Especialidades</label>
                  <Input value={formData.especialidad} onChange={(event) => setFormData({ ...formData, especialidad: event.target.value })} placeholder="Técnica, Táctica, Preparación física" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Nueva contraseña</label>
                  <Input type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} placeholder="Dejar vacío para no cambiar" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                  <Input type="password" value={formData.confirmPassword} onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })} placeholder="Repetir nueva contraseña" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Turnos asignados</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {entrenador?.turnos?.length ? (
                    entrenador.turnos.map((turno) => (
                      <span key={turno.id} className="rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800">
                        {turno.nombre} · {turno.hora}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-600">No tienes turnos asignados.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar perfil'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
