'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface ConfirmDialogOptions {
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'danger'
}

interface ConfirmDialogState extends Required<ConfirmDialogOptions> {
  resolve: (value: boolean) => void
}

type ConfirmDialogHandler = (options: ConfirmDialogOptions) => Promise<boolean>

let confirmDialogHandler: ConfirmDialogHandler | null = null

function normalizeOptions(options: string | ConfirmDialogOptions): ConfirmDialogOptions {
  if (typeof options === 'string') {
    return { description: options }
  }

  return options
}

export function confirmDialog(options: string | ConfirmDialogOptions): Promise<boolean> {
  const normalized = normalizeOptions(options)

  if (confirmDialogHandler) {
    return confirmDialogHandler(normalized)
  }

  if (typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(normalized.description))
  }

  return Promise.resolve(false)
}

export function ConfirmDialogProvider() {
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null)

  useEffect(() => {
    confirmDialogHandler = (options) =>
      new Promise<boolean>((resolve) => {
        setDialog({
          title: options.title || 'Confirmar acción',
          description: options.description,
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          variant: options.variant || 'primary',
          resolve,
        })
      })

    return () => {
      confirmDialogHandler = null
    }
  }, [])

  useEffect(() => {
    if (!dialog) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dialog.resolve(false)
        setDialog(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [dialog])

  if (!dialog) return null

  const handleClose = (value: boolean) => {
    dialog.resolve(value)
    setDialog(null)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => handleClose(false)}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{dialog.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{dialog.description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 px-6 py-5 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => handleClose(false)} className="w-full sm:w-auto">
            {dialog.cancelText}
          </Button>
          <Button
            variant={dialog.variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => handleClose(true)}
            className="w-full sm:w-auto"
          >
            {dialog.confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
