'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type AdminSession = {
  id?: string
  email?: string
  nombre?: string
}

export default function AdminPerfilPage() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const adminRaw = localStorage.getItem('admin')
    const isAdmin = localStorage.getItem('isAdmin')

    if (!adminRaw && !isAdmin) {
      window.location.href = '/login'
      return
    }

    const parsedAdmin = adminRaw ? JSON.parse(adminRaw) : { id: 'default-admin', email: 'admin', nombre: 'Administrador' }
    setAdminSession(parsedAdmin)
    fetchAdminProfile(parsedAdmin)
  }, [])

  const fetchAdminProfile = async (session: AdminSession) => {
    try {
      const params = new URLSearchParams()
      if (session.id) params.set('adminId', session.id)
      if (session.email) params.set('adminEmail', session.email)

      const response = await fetch(`/api/admin/profile?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo cargar el perfil')
      }

      setFormData((prev) => ({
        ...prev,
        nombre: data.nombre || '',
        email: data.email || '',
      }))
    } catch (err: any) {
      setError(err.message || 'Error al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('La nueva contraseña y su confirmación no coinciden')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAdminId: adminSession?.id,
          currentAdminEmail: adminSession?.email,
          nombre: formData.nombre,
          email: formData.email,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo guardar el perfil')
      }

      localStorage.setItem('isAdmin', 'true')
      localStorage.setItem('admin', JSON.stringify(data))
      setAdminSession(data)
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setSuccess('Perfil de administrador actualizado correctamente')
    } catch (err: any) {
      setError(err.message || 'Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-gray-600">Cargando perfil...</p>
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-bold text-gray-900">Perfil del Administrador</h1>
        <p className="text-sm text-gray-600 mt-1">
          Desde aquí puedes crear/actualizar tu cuenta admin principal.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo de administrador</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="tu-correo@dominio.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña actual</label>
            <Input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              placeholder="Solo necesaria si cambiarás contraseña"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña</label>
            <Input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nueva contraseña</label>
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Repite la nueva contraseña"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="w-full whitespace-nowrap sm:w-auto sm:min-w-40">
              {saving ? 'Guardando...' : 'Guardar Perfil'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
