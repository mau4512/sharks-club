'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, FileDown, Printer, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

interface PartidoEntrenador {
  id: string
  titulo: string
  rival: string
  competencia?: string | null
  categoria?: string | null
  sede?: string | null
  fechaPartido: string
  horaPartido: string
  estado: string
  resultadoPropio?: number | null
  resultadoRival?: number | null
  estadisticas?: EstadisticasPartido | null
  analisisGeneral?: string | null
  erroresDeficiencias?: string | null
  correccionesProximaSemana?: string | null
  microcicloTrabajo?: string | null
}

interface EstadisticaEquipo {
  t2Convertidos: number
  t2Intentados: number
  t3Convertidos: number
  t3Intentados: number
  tlConvertidos: number
  tlIntentados: number
  rebotesOfensivos: number
  rebotesDefensivos: number
  asistencias: number
  perdidas: number
  robos: number
  bloqueos: number
  faltas: number
  puntosContraataque: number
  puntosSegundaOportunidad: number
}

interface EstadisticaJugador extends EstadisticaEquipo {
  id: string
  numero: string
  nombre: string
  minutos: number
}

interface PeriodoPartido {
  periodo: string
  propio: number
  rival: number
}

interface EstadisticasPartido {
  propio: EstadisticaEquipo
  rival: EstadisticaEquipo
  periodos: PeriodoPartido[]
  jugadores: EstadisticaJugador[]
}

const emptyStats: EstadisticaEquipo = {
  t2Convertidos: 0,
  t2Intentados: 0,
  t3Convertidos: 0,
  t3Intentados: 0,
  tlConvertidos: 0,
  tlIntentados: 0,
  rebotesOfensivos: 0,
  rebotesDefensivos: 0,
  asistencias: 0,
  perdidas: 0,
  robos: 0,
  bloqueos: 0,
  faltas: 0,
  puntosContraataque: 0,
  puntosSegundaOportunidad: 0,
}

const periodosBase: PeriodoPartido[] = [
  { periodo: '1C', propio: 0, rival: 0 },
  { periodo: '2C', propio: 0, rival: 0 },
  { periodo: '3C', propio: 0, rival: 0 },
  { periodo: '4C', propio: 0, rival: 0 },
]

function normalizeStats(stats?: EstadisticasPartido | null): EstadisticasPartido {
  return {
    propio: { ...emptyStats, ...(stats?.propio || {}) },
    rival: { ...emptyStats, ...(stats?.rival || {}) },
    periodos: Array.isArray(stats?.periodos) && stats.periodos.length > 0 ? stats.periodos : periodosBase,
    jugadores: Array.isArray(stats?.jugadores)
      ? stats.jugadores.map((jugador) => ({
          ...emptyStats,
          ...jugador,
          id: jugador.id || crypto.randomUUID(),
          numero: jugador.numero || '',
          nombre: jugador.nombre || '',
          minutos: Number(jugador.minutos) || 0,
        }))
      : [],
  }
}

function puntos(stats: EstadisticaEquipo) {
  return stats.t2Convertidos * 2 + stats.t3Convertidos * 3 + stats.tlConvertidos
}

function pct(convertidos: number, intentados: number) {
  return intentados ? `${Math.round((convertidos / intentados) * 100)}%` : '0%'
}

function totalRebotes(stats: EstadisticaEquipo) {
  return stats.rebotesOfensivos + stats.rebotesDefensivos
}

function fechaCorta(value: string) {
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ReportePartidoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const reportRef = useRef<HTMLDivElement>(null)
  const [partido, setPartido] = useState<PartidoEntrenador | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'image' | null>(null)
  const [analisis, setAnalisis] = useState({
    analisisGeneral: '',
    erroresDeficiencias: '',
    correccionesProximaSemana: '',
    microcicloTrabajo: '',
  })

  useEffect(() => {
    const entrenadorRaw = localStorage.getItem('entrenador')
    if (!entrenadorRaw) {
      router.push('/entrenador/login')
      return
    }

    const fetchPartido = async () => {
      const response = await fetch(`/api/partidos-entrenador/${params.id}`)
      if (!response.ok) {
        toast.error('No se pudo cargar el reporte del partido')
        router.push('/entrenador/partidos')
        return
      }
      const data = await response.json()
      setPartido(data)
      setAnalisis({
        analisisGeneral: data.analisisGeneral || '',
        erroresDeficiencias: data.erroresDeficiencias || '',
        correccionesProximaSemana: data.correccionesProximaSemana || '',
        microcicloTrabajo: data.microcicloTrabajo || '',
      })
      setLoading(false)
    }

    void fetchPartido()
  }, [params.id, router])

  const stats = useMemo(() => normalizeStats(partido?.estadisticas), [partido?.estadisticas])

  const guardar = async () => {
    if (!partido) return
    try {
      setSaving(true)
      const response = await fetch(`/api/partidos-entrenador/${partido.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...partido,
          fechaPartido: partido.fechaPartido.split('T')[0],
          estado: 'jugado',
          resultadoPropio: puntos(stats.propio),
          resultadoRival: puntos(stats.rival),
          estadisticas: stats,
          ...analisis,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo guardar')
      }
      const updated = await response.json()
      setPartido(updated)
      toast.success('Reporte del partido guardado')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const exportImage = async () => {
    if (!reportRef.current || !partido) return
    try {
      setExporting('image')
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `reporte-${partido.rival || 'partido'}.png`.replace(/\s+/g, '-').toLowerCase()
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error al exportar imagen:', error)
      toast.error('No se pudo exportar la imagen')
    } finally {
      setExporting(null)
    }
  }

  const exportPdf = async () => {
    if (!reportRef.current || !partido) return
    try {
      setExporting('pdf')
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      pdf.save(`reporte-${partido.rival || 'partido'}.pdf`.replace(/\s+/g, '-').toLowerCase())
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      toast.error('No se pudo exportar el PDF')
    } finally {
      setExporting(null)
    }
  }

  if (loading || !partido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  const totalRows = [
    { label: 'Nosotros', stats: stats.propio },
    { label: partido.rival, stats: stats.rival },
  ]

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-4xl px-4 py-5 print:max-w-none print:px-0 print:py-0">
        <div className="mb-5 flex flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
          <Link href="/entrenador/partidos" className="inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a partidos
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={() => void exportImage()} disabled={exporting !== null}>
              <Download className="mr-2 h-4 w-4" />
              {exporting === 'image' ? 'Exportando...' : 'Imagen'}
            </Button>
            <Button variant="outline" onClick={() => void exportPdf()} disabled={exporting !== null}>
              <FileDown className="mr-2 h-4 w-4" />
              {exporting === 'pdf' ? 'Generando...' : 'PDF'}
            </Button>
            <Button onClick={() => void guardar()} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar reporte'}
            </Button>
          </div>
        </div>

        <div ref={reportRef} className="mx-auto bg-white p-5 text-slate-950 shadow-lg print:p-3 print:shadow-none">
          <header className="border-b-2 border-slate-950 pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-950">Reporte estadístico postpartido</p>
                <h1 className="mt-1 text-2xl font-black uppercase text-slate-950">{partido.titulo}</h1>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {partido.competencia || 'Competencia'} · {partido.categoria || 'Categoría'} · {partido.sede || 'Sede no registrada'}
                </p>
              </div>
              <div className="min-w-[260px] border-2 border-slate-950 text-center text-slate-950">
                <div className="grid grid-cols-3 border-b-2 border-slate-950 bg-white text-slate-950">
                  <div className="px-3 py-2 text-xs font-bold uppercase">Nosotros</div>
                  <div className="px-3 py-2 text-xs font-bold uppercase">Final</div>
                  <div className="px-3 py-2 text-xs font-bold uppercase">{partido.rival}</div>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <div className="px-3 py-3 text-4xl font-black">{puntos(stats.propio)}</div>
                  <div className="px-3 py-3 text-xs font-bold text-slate-950">{fechaCorta(partido.fechaPartido)}</div>
                  <div className="px-3 py-3 text-4xl font-black">{puntos(stats.rival)}</div>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-2 border-slate-950 bg-white text-slate-950">
                    <th className="border border-slate-500 px-2 py-2 text-left">Periodo</th>
                    {stats.periodos.map((periodo) => <th key={periodo.periodo} className="border border-slate-500 px-2 py-2">{periodo.periodo}</th>)}
                    <th className="border border-slate-500 px-2 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-2 py-2 font-bold">Nosotros</td>
                    {stats.periodos.map((periodo) => <td key={periodo.periodo} className="border border-slate-300 px-2 py-2 text-center">{periodo.propio}</td>)}
                    <td className="border border-slate-300 px-2 py-2 text-center font-black">{puntos(stats.propio)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-2 py-2 font-bold">{partido.rival}</td>
                    {stats.periodos.map((periodo) => <td key={periodo.periodo} className="border border-slate-300 px-2 py-2 text-center">{periodo.rival}</td>)}
                    <td className="border border-slate-300 px-2 py-2 text-center font-black">{puntos(stats.rival)}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-2 border-slate-950 bg-white text-slate-950">
                    <th className="border border-slate-500 px-2 py-2 text-left">Equipo</th>
                    <th className="border border-slate-500 px-2 py-2">2P%</th>
                    <th className="border border-slate-500 px-2 py-2">3P%</th>
                    <th className="border border-slate-500 px-2 py-2">TL%</th>
                    <th className="border border-slate-500 px-2 py-2">REB</th>
                    <th className="border border-slate-500 px-2 py-2">AST</th>
                    <th className="border border-slate-500 px-2 py-2">PER</th>
                  </tr>
                </thead>
                <tbody>
                  {totalRows.map((row) => (
                    <tr key={row.label}>
                      <td className="border border-slate-300 px-2 py-2 font-bold">{row.label}</td>
                      <td className="border border-slate-300 px-2 py-2 text-center">{pct(row.stats.t2Convertidos, row.stats.t2Intentados)}</td>
                      <td className="border border-slate-300 px-2 py-2 text-center">{pct(row.stats.t3Convertidos, row.stats.t3Intentados)}</td>
                      <td className="border border-slate-300 px-2 py-2 text-center">{pct(row.stats.tlConvertidos, row.stats.tlIntentados)}</td>
                      <td className="border border-slate-300 px-2 py-2 text-center">{totalRebotes(row.stats)}</td>
                      <td className="border border-slate-300 px-2 py-2 text-center">{row.stats.asistencias}</td>
                      <td className="border border-slate-300 px-2 py-2 text-center">{row.stats.perdidas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-slate-900">Planilla estadística</h2>
              <p className="text-[10px] font-semibold uppercase text-slate-950">CA: contraataque · 2OP: segunda oportunidad</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-[9px] text-slate-900 print:min-w-0 print:text-[7px]">
                <thead>
                  <tr className="border-2 border-slate-950 bg-white text-slate-950">
                    <th className="border border-slate-500 px-1.5 py-1.5 text-left">Jugador</th>
                    <th className="border border-slate-500 px-1 py-1.5">PTS</th>
                    <th className="border border-slate-500 px-1 py-1.5">2P</th>
                    <th className="border border-slate-500 px-1 py-1.5">3P</th>
                    <th className="border border-slate-500 px-1 py-1.5">TC</th>
                    <th className="border border-slate-500 px-1 py-1.5">TL</th>
                    <th className="border border-slate-500 px-1 py-1.5">RO</th>
                    <th className="border border-slate-500 px-1 py-1.5">RD</th>
                    <th className="border border-slate-500 px-1 py-1.5">REB</th>
                    <th className="border border-slate-500 px-1 py-1.5">AST</th>
                    <th className="border border-slate-500 px-1 py-1.5">PER</th>
                    <th className="border border-slate-500 px-1 py-1.5">ROB</th>
                    <th className="border border-slate-500 px-1 py-1.5">BLK</th>
                    <th className="border border-slate-500 px-1 py-1.5">F</th>
                    <th className="border border-slate-500 px-1 py-1.5">CA</th>
                    <th className="border border-slate-500 px-1 py-1.5">2OP</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.jugadores.map((jugador) => (
                    <tr key={jugador.id} className="odd:bg-slate-50">
                      <td className="border border-slate-300 px-1.5 py-1.5 font-bold">#{jugador.numero || '-'} {jugador.nombre || 'Jugador'}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center font-bold">{puntos(jugador)}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.t2Convertidos}/{jugador.t2Intentados}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.t3Convertidos}/{jugador.t3Intentados}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.t2Convertidos + jugador.t3Convertidos}/{jugador.t2Intentados + jugador.t3Intentados}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.tlConvertidos}/{jugador.tlIntentados}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.rebotesOfensivos}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.rebotesDefensivos}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center font-bold">{totalRebotes(jugador)}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.asistencias}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.perdidas}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.robos}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.bloqueos}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center">{jugador.faltas}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center font-semibold">{jugador.puntosContraataque}</td>
                      <td className="border border-slate-300 px-1 py-1.5 text-center font-semibold">{jugador.puntosSegundaOportunidad}</td>
                    </tr>
                  ))}
                  <tr className="bg-white font-black text-slate-950">
                    <td className="border border-slate-400 px-1.5 py-1.5">TOTAL EQUIPO</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{puntos(stats.propio)}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.t2Convertidos}/{stats.propio.t2Intentados}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.t3Convertidos}/{stats.propio.t3Intentados}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.t2Convertidos + stats.propio.t3Convertidos}/{stats.propio.t2Intentados + stats.propio.t3Intentados}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.tlConvertidos}/{stats.propio.tlIntentados}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.rebotesOfensivos}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.rebotesDefensivos}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{totalRebotes(stats.propio)}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.asistencias}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.perdidas}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.robos}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.bloqueos}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.faltas}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.puntosContraataque}</td>
                    <td className="border border-slate-400 px-1 py-1.5 text-center">{stats.propio.puntosSegundaOportunidad}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-2 print:gap-3">
            {[
              ['analisisGeneral', 'Análisis general del partido'],
              ['erroresDeficiencias', 'Errores o deficiencias detectadas'],
              ['correccionesProximaSemana', 'Correcciones para la próxima semana'],
              ['microcicloTrabajo', 'Trabajo de microciclo'],
            ].map(([key, label]) => (
              <div key={key} className="break-inside-avoid">
                <label className="mb-1 block text-xs font-black uppercase text-slate-950">{label}</label>
                <textarea
                  rows={5}
                  value={analisis[key as keyof typeof analisis]}
                  onChange={(event) => setAnalisis((current) => ({ ...current, [key]: event.target.value }))}
                  className="w-full resize-none rounded border border-slate-400 bg-white px-3 py-2 text-sm text-slate-950 print:min-h-[96px]"
                />
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
