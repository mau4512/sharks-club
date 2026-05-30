'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

interface AdminFeedbackEditorProps {
  reporteId: string
  adminId?: string
  adminNombre?: string
  initialFeedback?: string | null
}

export default function AdminFeedbackEditor({
  reporteId,
  adminId,
  adminNombre,
  initialFeedback,
}: AdminFeedbackEditorProps) {
  const [feedback, setFeedback] = useState(initialFeedback || '')
  const [saving, setSaving] = useState(false)

  const guardarFeedback = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/reportes-entrenador/${reporteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorType: 'admin',
          adminId,
          adminNombre,
          feedbackAdmin: feedback,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo guardar el feedback')
      }

      toast.success('Feedback enviado al entrenador')
    } catch (error: any) {
      console.error('Error al guardar feedback del admin:', error)
      toast.error(error.message || 'No se pudo guardar el feedback')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm font-semibold text-blue-900">Feedback para el entrenador</p>
      <textarea
        rows={4}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="mt-3 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500"
        placeholder="Observaciones, correcciones o seguimiento para la próxima sesión..."
      />
      <div className="mt-3 flex justify-end">
        <Button onClick={() => void guardarFeedback()} disabled={saving}>
          {saving ? 'Enviando...' : 'Enviar feedback'}
        </Button>
      </div>
    </div>
  )
}
