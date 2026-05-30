'use client'

import { useEffect, useState } from 'react'
import NotificationsList from '@/components/notificaciones/NotificationsList'

export default function AdminNotificacionesPage() {
  const [adminId, setAdminId] = useState<string | null>(null)

  useEffect(() => {
    const adminRaw = localStorage.getItem('admin')
    if (!adminRaw) return

    try {
      const admin = JSON.parse(adminRaw)
      setAdminId(admin.id)
    } catch (error) {
      console.error('Error al leer admin local:', error)
    }
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
        <p className="mt-2 text-gray-600">Alertas internas sobre reportes, planificaciones y feedback del club.</p>
      </div>

      {adminId ? (
        <NotificationsList recipientType="admin" recipientId={adminId} />
      ) : (
        <div className="py-10 text-center text-gray-600">No se pudo identificar la sesión del administrador.</div>
      )}
    </div>
  )
}
