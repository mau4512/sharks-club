'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import NotificationsList from '@/components/notificaciones/NotificationsList'

export default function EntrenadorNotificacionesPage() {
  const [entrenadorId, setEntrenadorId] = useState<string | null>(null)

  useEffect(() => {
    const entrenadorRaw = localStorage.getItem('entrenador')
    if (!entrenadorRaw) return

    try {
      const entrenador = JSON.parse(entrenadorRaw)
      setEntrenadorId(entrenador.id)
    } catch (error) {
      console.error('Error al leer entrenador local:', error)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/entrenador" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="mt-1 text-gray-600">Feedback y alertas internas enviadas por administración.</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {entrenadorId ? (
          <NotificationsList recipientType="entrenador" recipientId={entrenadorId} />
        ) : (
          <div className="py-10 text-center text-gray-600">No se pudo identificar la sesión del entrenador.</div>
        )}
      </div>
    </div>
  )
}
