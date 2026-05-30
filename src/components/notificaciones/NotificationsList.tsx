'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface NotificationsListProps {
  recipientType: 'admin' | 'entrenador'
  recipientId: string
}

interface NotificacionItem {
  id: string
  titulo: string
  mensaje: string
  enlace?: string | null
  leida: boolean
  remitenteNombre?: string | null
  createdAt: string
}

export default function NotificationsList({
  recipientType,
  recipientId,
}: NotificationsListProps) {
  const [items, setItems] = useState<NotificacionItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/notificaciones?destinatarioTipo=${recipientType}&destinatarioId=${recipientId}&limit=50`
      )
      if (!response.ok) throw new Error('No se pudieron cargar las notificaciones')
      const data = await response.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchItems()
  }, [recipientId, recipientType])

  const marcarComoLeida = async (id: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leida: true }),
      })
      if (!response.ok) throw new Error('No se pudo actualizar la notificación')
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, leida: true } : item))
      )
    } catch (error) {
      console.error('Error al marcar notificación:', error)
    }
  }

  if (loading) {
    return <div className="py-10 text-center text-gray-600">Cargando notificaciones...</div>
  }

  if (items.length === 0) {
    return <div className="py-10 text-center text-gray-600">No hay notificaciones por ahora.</div>
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-2xl border p-4 ${
            item.leida ? 'border-gray-200 bg-white' : 'border-primary-200 bg-primary-50'
          }`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{item.titulo}</h3>
                {!item.leida && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                    Nueva
                  </span>
                )}
              </div>
              {item.remitenteNombre && (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary-700">
                  {item.remitenteNombre}
                </p>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.mensaje}</p>
              <p className="mt-2 text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleString('es-PE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'America/Lima',
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.enlace && (
                <Link href={item.enlace}>
                  <Button variant="outline" onClick={() => void marcarComoLeida(item.id)}>
                    Revisar
                  </Button>
                </Link>
              )}
              {!item.leida && (
                <Button variant="ghost" onClick={() => void marcarComoLeida(item.id)}>
                  Marcar leída
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
