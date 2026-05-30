'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'

interface NotificationsBellProps {
  recipientType: 'admin' | 'entrenador'
  recipientId?: string
  href: string
  label?: string
}

export default function NotificationsBell({
  recipientType,
  recipientId,
  href,
  label,
}: NotificationsBellProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!recipientId) return

    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `/api/notificaciones?destinatarioTipo=${recipientType}&destinatarioId=${recipientId}&soloNoLeidas=1&limit=50`
        )
        if (!response.ok) return
        const data = await response.json()
        setCount(Array.isArray(data) ? data.length : 0)
      } catch (error) {
        console.error('Error al cargar contador de notificaciones:', error)
      }
    }

    void fetchNotifications()
  }, [recipientId, recipientType])

  return (
    <Link
      href={href}
      className="relative inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 transition"
    >
      <Bell className="h-5 w-5" />
      {label ? <span className="text-sm font-medium">{label}</span> : null}
      {count > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
