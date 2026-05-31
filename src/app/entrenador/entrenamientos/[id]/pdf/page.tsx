'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Download, Loader2, Printer, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { getPizarrasEjercicio, type PizarraEjercicio } from '@/lib/ejercicio-pizarras'

interface EjercicioPlan {
  id: string
  titulo: string
  descripcion?: string
  categoria?: string
  etiqueta?: string
  tags?: string[]
  duracion: number
  meta?: {
    tipo?: string
    cantidad?: number
    unidad?: string
    tipoTiro?: string
  }
  puntosTiro?: Array<{
    posicion: string
    cantidad: number
    amboLados: boolean
  }>
  tipoRecurso?: string
  pizarra?: PizarraEjercicio
  pizarras?: PizarraEjercicio[]
  videoUrl?: string
}

interface PlanEntrenamientoDetalle {
  id: string
  titulo: string
  fecha: string
  notas?: string
  ejercicios: EjercicioPlan[]
  turno: {
    id: string
    nombre: string
    hora: string
  }
  reportesEntrenador?: Array<{
    id: string
    completada: boolean
    observaciones?: string | null
    motivoIncompleta?: string | null
    requerimientos?: string | null
    feedbackAdmin?: string | null
    detalleEjercicios?: Array<{
      ejercicioId: string
      titulo: string
      completado: boolean
      observaciones: string
      ajuste: string
    }> | null
  }>
}

const nombresPunto: Record<string, string> = {
  esquina_izq: 'Esquina izquierda',
  codo_izq: 'Codo izquierdo',
  medio: 'Centro',
  codo_der: 'Codo derecho',
  esquina_der: 'Esquina derecha',
}

function normalizarHora(hora?: string) {
  const match = String(hora || '').match(/(\d{1,2}):(\d{2})/)
  if (!match) return null

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  }
}

function sumarMinutos(hora: string | undefined, minutos: number) {
  const parsed = normalizarHora(hora)
  if (!parsed) return ''

  const date = new Date(2026, 0, 1, parsed.hours, parsed.minutes + minutos)
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatearDuracion(minutos?: number) {
  const value = Number(minutos || 0)
  if (value <= 0) return 'Meta'
  return `${String(value).padStart(2, '0')} min`
}

function getEtiquetaEjercicio(ejercicio: EjercicioPlan) {
  if (ejercicio.etiqueta) return ejercicio.etiqueta
  const categoria = ejercicio.categoria || ejercicio.tags?.[0]
  if (categoria) return categoria.slice(0, 3).toUpperCase()
  if (ejercicio.meta?.tipoTiro) return 'TIR'
  if (ejercicio.tipoRecurso === 'video') return 'VID'
  if (ejercicio.tipoRecurso === 'pizarra') return 'TAC'
  return 'GEN'
}

function getColorEtiqueta(etiqueta: string) {
  if (['GEN', 'CAL', 'ENF'].includes(etiqueta)) return 'bg-yellow-300 text-black'
  if (['TEC', 'TÉC', 'TIR'].includes(etiqueta)) return 'bg-green-400 text-black'
  if (['COM', 'TAC', 'DEF', 'ATA'].includes(etiqueta)) return 'bg-red-500 text-black'
  return 'bg-slate-200 text-slate-900'
}

function getMetaTexto(ejercicio: EjercicioPlan) {
  const partes: string[] = []

  if (ejercicio.meta?.cantidad) {
    partes.push(`${ejercicio.meta.cantidad} ${ejercicio.meta.unidad || ''}`.trim())
  }

  if (ejercicio.meta?.tipoTiro) {
    partes.push(ejercicio.meta.tipoTiro === '2puntos' ? '2 pts' : '3 pts')
  }

  if (ejercicio.puntosTiro?.length) {
    partes.push(
      ejercicio.puntosTiro
        .map((punto) => `${nombresPunto[punto.posicion] || punto.posicion}: ${punto.cantidad}`)
        .join(' · ')
    )
  }

  return partes.join(' · ')
}

function getPizarraPreviewClasses(tipo: PizarraEjercicio['tipo']) {
  if (tipo === 'completa') {
    return {
      wrapper: 'relative mx-auto h-[98px] w-full max-w-[190px] overflow-hidden border border-slate-300 bg-white print:h-[88px] print:max-w-[180px]',
      image: 'absolute left-1/2 top-1/2 h-[150px] w-[98px] -translate-x-1/2 -translate-y-1/2 rotate-90 object-contain print:h-[134px] print:w-[88px]',
    }
  }

  return {
    wrapper: 'mx-auto h-[72px] w-full max-w-[190px] border border-slate-300 bg-white print:h-[62px] print:max-w-[180px]',
    image: 'h-full w-full object-contain',
  }
}

function getPizarraAlt(pizarra: PizarraEjercicio, index: number) {
  const tipo = pizarra.tipo === 'completa' ? 'cancha completa' : 'media cancha'
  return `Pizarra ${index + 1} - ${tipo}`
}

export default function PlanEntrenamientoPdfPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string
  const pdfRef = useRef<HTMLElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [plan, setPlan] = useState<PlanEntrenamientoDetalle | null>(null)
  const [entrenadorNombre, setEntrenadorNombre] = useState('')

  useEffect(() => {
    const entrenadorRaw = localStorage.getItem('entrenador')
    const adminRaw = localStorage.getItem('admin')

    if (!entrenadorRaw && !adminRaw) {
      router.push('/login')
      return
    }

    if (entrenadorRaw) {
      const entrenador = JSON.parse(entrenadorRaw)
      setEntrenadorNombre(`${entrenador.nombre || ''} ${entrenador.apellidos || ''}`.trim())
    } else if (adminRaw) {
      const admin = JSON.parse(adminRaw)
      setEntrenadorNombre(`${admin.nombre || 'Administración Sharks'}`)
    }

    void fetchPlan()
  }, [planId, router])

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/planes-entrenamiento/${planId}`)
      if (!response.ok) {
        throw new Error('No se pudo cargar la planificación')
      }

      const data = await response.json()
      setPlan(data)
    } catch (error) {
      console.error('Error al cargar planificación para PDF:', error)
      setPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const fechaFormateada = useMemo(() => {
    if (!plan?.fecha) return ''
    return new Date(plan.fecha).toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Lima',
    })
  }, [plan?.fecha])

  const duracionTotal = useMemo(
    () => plan?.ejercicios?.reduce((total, ejercicio) => total + (ejercicio.duracion || 0), 0) || 0,
    [plan]
  )

  const reporte = plan?.reportesEntrenador?.[0] || null

  const descargarPdf = async () => {
    if (!pdfRef.current || !plan) return

    try {
      setGenerandoPdf(true)
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(pdfRef.current, {
        backgroundColor: '#ffffff',
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        onclone: (documentClone) => {
          const pdfElement = documentClone.querySelector('[data-pdf-document="true"]') as HTMLElement | null
          if (!pdfElement) return

          documentClone.body.style.background = '#ffffff'
          pdfElement.style.background = '#ffffff'
          pdfElement.style.boxShadow = 'none'
          pdfElement.style.borderRadius = '0'
          pdfElement.querySelectorAll<HTMLElement>('*').forEach((element) => {
            element.style.boxShadow = 'none'
          })
        },
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 8
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let remainingHeight = imgHeight
      let position = margin

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      remainingHeight -= pageHeight - margin * 2

      while (remainingHeight > 0) {
        position = remainingHeight - imgHeight + margin
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
        remainingHeight -= pageHeight - margin * 2
      }

      const nombreArchivo = `${plan.titulo || 'plan-entrenamiento'}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      pdf.save(`${nombreArchivo || 'plan-entrenamiento'}.pdf`)
    } catch (error) {
      console.error('Error al generar PDF:', error)
      window.print()
    } finally {
      setGenerandoPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <Card className="mx-auto max-w-3xl">
          <CardContent className="py-10 text-center">
            <p className="text-lg font-semibold text-gray-900">No se pudo cargar la planificación</p>
            <Link href="/entrenador/entrenamientos" className="mt-4 inline-flex">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a entrenamientos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Link href="/entrenador/entrenamientos">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={descargarPdf} disabled={generandoPdf}>
              {generandoPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {generandoPdf ? 'Generando PDF...' : 'Guardar como PDF'}
            </Button>
          </div>
        </div>

        <article
          ref={pdfRef}
          data-pdf-document="true"
          className="mx-auto max-w-5xl rounded-2xl bg-white p-5 shadow-lg print:rounded-none print:p-0 print:shadow-none"
        >
          <header className="border-b border-slate-200 pb-4 print:border-0 print:pb-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 print:hidden">Sharks Basketball</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 print:text-lg">{plan.titulo}</h1>
                <p className="mt-1 text-sm text-slate-600 print:hidden">Planificación de entrenamiento exportable en PDF</p>
              </div>
              <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 print:hidden">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary-700" />
                  <span>{fechaFormateada}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary-700" />
                  <span>{plan.turno.nombre} · {plan.turno.hora}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary-700" />
                  <span>{entrenadorNombre || 'Entrenador Sharks'}</span>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-5 grid gap-x-8 gap-y-2 text-sm text-slate-900 sm:grid-cols-3 print:grid-cols-3">
            <p><span className="font-bold text-teal-900">Equipo:</span> {plan.turno.nombre}</p>
            <p><span className="font-bold text-teal-900">Micro:</span> {plan.ejercicios.length}</p>
            <p><span className="font-bold text-teal-900">Lugar:</span> Cancha</p>
            <p className="font-bold text-teal-900">{plan.notas || 'Sin objetivo establecido'}</p>
            <p><span className="font-bold text-teal-900">Día:</span> {new Date(plan.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</p>
            <p>
              <span className="font-bold text-teal-900">Hora:</span> {plan.turno.hora}
              <span className="ml-4 font-bold text-teal-900">Tiempo fijo:</span> {String(Math.floor(duracionTotal / 60)).padStart(2, '0')}:{String(duracionTotal % 60).padStart(2, '0')}
            </p>
          </section>

          {plan.notas && (
            <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 print:hidden">
              <p className="text-sm font-semibold text-amber-900">Notas del entrenamiento</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950">{plan.notas}</p>
            </section>
          )}

          {reporte && (
            <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 print:hidden">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Reporte del entrenamiento</p>
                  <p className="mt-1 text-sm text-emerald-950">
                    {reporte.completada ? 'La práctica se reportó como completada.' : 'La práctica se reportó como incompleta.'}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  reporte.completada ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {reporte.completada ? 'Reporte completado' : 'Reporte con incidencias'}
                </span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observaciones generales</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {reporte.observaciones || 'Sin observaciones generales.'}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Si no terminó</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {reporte.motivoIncompleta || 'No aplica'}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requerimientos</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {reporte.requerimientos || 'Sin requerimientos registrados.'}
                  </p>
                </div>
              </div>

              {reporte.feedbackAdmin && (
                <div className="mt-4 rounded-xl bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feedback de administración</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {reporte.feedbackAdmin}
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="mt-5 overflow-hidden border border-slate-500">
            <table className="w-full border-collapse text-left text-[11px] leading-tight text-slate-950">
              <colgroup>
                <col className="w-[7%]" />
                <col className="w-[20%]" />
                <col className="w-[10%]" />
                <col className="w-[33%]" />
                <col className="w-[30%]" />
              </colgroup>
              <thead>
                <tr className="bg-teal-900 text-white">
                  <th className="border border-slate-500 px-2 py-1 text-center font-bold">Inicio</th>
                  <th className="border border-slate-500 px-2 py-1 text-center font-bold">Ejercicio</th>
                  <th className="border border-slate-500 px-2 py-1 text-center font-bold">Tags</th>
                  <th className="border border-slate-500 px-2 py-1 text-center font-bold">Descripción</th>
                  <th className="border border-slate-500 px-2 py-1 text-center font-bold">Esquema</th>
                </tr>
              </thead>
              <tbody>
                {plan.ejercicios.map((ejercicio, index) => {
                  const inicioAcumulado = plan.ejercicios
                    .slice(0, index)
                    .reduce((total, item) => total + (item.duracion || 0), 0)
                  const pizarras = getPizarrasEjercicio(ejercicio)
                  const etiqueta = getEtiquetaEjercicio(ejercicio)
                  const metaTexto = getMetaTexto(ejercicio)

                  return (
                    <tr key={ejercicio.id || `${plan.id}-${index}`} className="align-top print:break-inside-avoid">
                      <td className="border border-slate-400 px-1.5 py-2">
                        <div>{sumarMinutos(plan.turno.hora, inicioAcumulado)}</div>
                        <div>{formatearDuracion(ejercicio.duracion)}</div>
                      </td>
                      <td className="border border-slate-400 px-1.5 py-2">
                        <p className="font-medium">{ejercicio.titulo}</p>
                        <div className={`mt-1 h-5 text-center text-[10px] font-semibold leading-5 ${getColorEtiqueta(etiqueta)}`}>
                          {etiqueta}
                        </div>
                      </td>
                      <td className="border border-slate-400 px-1.5 py-2 text-center text-[10px]">
                        {ejercicio.tags?.length ? ejercicio.tags.join(', ') : ejercicio.categoria || 'Sin tags'}
                      </td>
                      <td className="border border-slate-400 px-2 py-2">
                        <p className="whitespace-pre-wrap">{ejercicio.descripcion || 'Sin descripción.'}</p>
                        {metaTexto && <p className="mt-1 font-medium">{metaTexto}</p>}
                        {ejercicio.tipoRecurso === 'video' && ejercicio.videoUrl && (
                          <p className="mt-1 text-blue-800">Video: {ejercicio.videoUrl}</p>
                        )}
                      </td>
                      <td className="border border-slate-400 px-2 py-2">
                        {pizarras.length > 0 ? (
                          <div className="grid gap-1">
                            {pizarras.slice(0, 2).map((pizarra, pizarraIndex) => {
                              const previewClasses = getPizarraPreviewClasses(pizarra.tipo)

                              return (
                                <div key={`${ejercicio.id}-pizarra-${pizarraIndex}`} className={previewClasses.wrapper}>
                                  <img
                                    src={pizarra.data}
                                    alt={getPizarraAlt(pizarra, pizarraIndex)}
                                    className={previewClasses.image}
                                  />
                                </div>
                              )
                            })}
                            {pizarras.length > 2 && (
                              <p className="text-center text-[10px] text-slate-500">+{pizarras.length - 2} esquemas</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-[72px] items-center justify-center border border-dashed border-slate-300 text-[10px] text-slate-400">
                            Sin esquema
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        </article>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}
