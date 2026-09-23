'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

export function InactivarDeportistaDialog({ nombre, onCancel, onConfirm }: {
  nombre: string
  onCancel: () => void
  onConfirm: (motivo: string) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [tipo, setTipo] = useState('Lesión')
  const [detalle, setDetalle] = useState('')

  useEffect(() => { dialogRef.current?.showModal() }, [])

  return (
    <dialog ref={dialogRef} onCancel={onCancel} aria-labelledby="inactividad-titulo" className="w-full max-w-md rounded-xl p-6 shadow-xl backdrop:bg-black/50">
      <form onSubmit={(event) => {
        event.preventDefault()
        const motivo = tipo === 'Otro' ? detalle.trim() : tipo
        if (motivo) onConfirm(motivo)
      }}>
        <h2 id="inactividad-titulo" className="text-lg font-bold">Marcar como inactivo</h2>
        <p className="mt-2 text-sm text-gray-600">{nombre} dejará de aparecer en las listas de asistencia hasta su reactivación. Se conservarán sus registros y deudas anteriores.</p>
        <p className="mt-2 text-sm text-gray-600">Desde hoy se suspende el cobro de sus sesiones regulares. En el plan de S/ 180 se cobran hasta 12 sesiones de lunes, miércoles y viernes; martes y jueves no suman cobro.</p>
        <label className="mt-4 block text-sm font-medium" htmlFor="motivo-inactividad">Motivo de inactividad</label>
        <select id="motivo-inactividad" value={tipo} onChange={(event) => setTipo(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2">
          <option>Lesión</option><option>Otro</option>
        </select>
        {tipo === 'Otro' && <>
          <label className="mt-3 block text-sm font-medium" htmlFor="detalle-inactividad">Describe el motivo</label>
          <textarea id="detalle-inactividad" value={detalle} onChange={(event) => setDetalle(event.target.value)} required maxLength={300} className="mt-1 w-full rounded-md border border-gray-300 p-2" />
        </>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={tipo === 'Otro' && !detalle.trim()}>Confirmar inactividad</Button>
        </div>
      </form>
    </dialog>
  )
}
