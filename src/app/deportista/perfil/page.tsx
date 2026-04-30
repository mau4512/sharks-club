'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { ArrowLeft, Save, User, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function PerfilPage() {
  const router = useRouter()
  const [deportista, setDeportista] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    celular: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const deportistaData = localStorage.getItem('deportista')
    if (!deportistaData) {
      router.push('/deportista/login')
      return
    }
    
    const parsed = JSON.parse(deportistaData)
    setDeportista(parsed)
    setFormData({
      celular: parsed.celular || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setLoading(false)
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/deportistas/${deportista.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          celular: formData.celular
        })
      })

      if (response.ok) {
        const updated = await response.json()
        setDeportista(updated)
        localStorage.setItem('deportista', JSON.stringify(updated))
        toast.success('Perfil actualizado correctamente')
      } else {
        toast.error('Error al actualizar el perfil')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/deportistas/${deportista.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      if (response.ok) {
        toast.success('Contraseña actualizada correctamente')
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al cambiar la contraseña')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/deportista" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">Gestiona tu información personal</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información No Editable */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-600" />
              Información del Deportista
            </h2>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                Los datos personales principales solo pueden ser modificados por el administrador.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                <p className="text-gray-900 mt-1">{deportista?.nombre} {deportista?.apellidos}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 mt-1">{deportista?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Documento</label>
                <p className="text-gray-900 mt-1">{deportista?.documentoIdentidad}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Posición</label>
                <p className="text-gray-900 mt-1">{deportista?.posicion || 'No especificada'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Editable */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Información de Contacto</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Número de Celular"
                name="celular"
                type="tel"
                value={formData.celular}
                onChange={handleChange}
                placeholder="Ej: +34 600 123 456"
              />
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Cambiar Contraseña */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-primary-600" />
              Cambiar Contraseña
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Contraseña Actual *"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                placeholder="Ingresa tu contraseña actual"
              />
              
              <Input
                label="Nueva Contraseña *"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
              
              <Input
                label="Confirmar Nueva Contraseña *"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Repite la nueva contraseña"
              />
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                  <Lock className="h-4 w-4 mr-2" />
                  {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
