'use client'

import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import type { ListaTurno } from '@/lib/turno-lista-export'

export function DescargarListaTurno({ turnoId, nombre }: { turnoId: string; nombre: string }) {
  const [generando, setGenerando] = useState<'excel' | 'pdf' | null>(null)

  const descargar = async (formato: 'excel' | 'pdf') => {
    if (generando) return
    setGenerando(formato)
    try {
      const response = await fetch(`/api/turnos/${encodeURIComponent(turnoId)}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('No se pudo cargar la lista del turno')
      const turno: ListaTurno = await response.json()
      if (!Array.isArray(turno.deportistas)) throw new Error('La lista del turno no es válida')
      if (turno.deportistas.length === 0) {
        toast.info('Este turno todavía no tiene deportistas asignados')
        return
      }
      const { archivoListaTurno, crearExcelListaTurno, crearPdfListaTurno } = await import('@/lib/turno-lista-export')
      const archivo = archivoListaTurno(turno)
      if (formato === 'pdf') {
        const pdf = await crearPdfListaTurno(turno)
        pdf.save(`${archivo}.pdf`)
      } else {
        const buffer = await crearExcelListaTurno(turno)
        const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
        const link = document.createElement('a')
        link.href = url
        link.download = `${archivo}.xlsx`
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      }
    } catch (error) {
      console.error('Error al descargar lista:', error)
      toast.error(error instanceof Error ? error.message : 'No se pudo descargar la lista')
    } finally {
      setGenerando(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={`Descargar lista de ${nombre}`}>
      <Button type="button" variant="outline" size="sm" disabled={generando !== null} onClick={() => descargar('excel')} aria-label={`Descargar Excel de ${nombre}`}>
        <FileSpreadsheet className="mr-1 h-4 w-4" />{generando === 'excel' ? 'Generando…' : 'Excel'}
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={generando !== null} onClick={() => descargar('pdf')} aria-label={`Descargar PDF de ${nombre}`}>
        <FileText className="mr-1 h-4 w-4" />{generando === 'pdf' ? 'Generando…' : 'PDF'}
      </Button>
    </div>
  )
}
