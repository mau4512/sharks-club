'use client'

import { useEffect, useMemo, useState } from 'react'
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

export default function PlanEntrenamientoPdfPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string
  const [loading, setLoading] = useState(true)
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
            <Button onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Guardar como PDF
            </Button>
          </div>
        </div>

        <article className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-lg print:rounded-none print:shadow-none">
          <header className="border-b border-slate-200 pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Sharks Basketball</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">{plan.titulo}</h1>
                <p className="mt-2 text-sm text-slate-600">Planificación de entrenamiento exportable en PDF</p>
              </div>
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
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

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ejercicios</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{plan.ejercicios.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duración total</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{duracionTotal} min</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Turno</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{plan.turno.nombre}</p>
            </div>
          </section>

          {plan.notas && (
            <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Notas del entrenamiento</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950">{plan.notas}</p>
            </section>
          )}

          {reporte && (
            <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
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
            </section>
          )}

          <section className="mt-8 space-y-6">
            {plan.ejercicios.map((ejercicio, index) => {
              const pizarras = getPizarrasEjercicio(ejercicio)
              const detalleEjercicio = Array.isArray(reporte?.detalleEjercicios)
                ? reporte?.detalleEjercicios.find(
                    (item) => item.ejercicioId === ejercicio.id || item.titulo === ejercicio.titulo
                  )
                : null

              return (
                <div key={ejercicio.id || `${plan.id}-${index}`} className="rounded-3xl border border-slate-200 p-5 print:break-inside-avoid">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Ejercicio {index + 1}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">{ejercicio.titulo}</h2>
                      {ejercicio.descripcion && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{ejercicio.descripcion}</p>
                      )}
                    </div>
                    <div className="rounded-2xl bg-primary-50 px-4 py-3 text-sm text-primary-900">
                      <p className="font-semibold">{ejercicio.duracion} min</p>
                      {ejercicio.meta?.cantidad && (
                        <p className="mt-1">
                          Meta: {ejercicio.meta.cantidad} {ejercicio.meta.unidad}
                        </p>
                      )}
                      {ejercicio.meta?.tipoTiro && (
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide">
                          {ejercicio.meta.tipoTiro === '2puntos' ? 'Tiro de 2 puntos' : 'Tiro de 3 puntos'}
                        </p>
                      )}
                    </div>
                  </div>

                  {ejercicio.puntosTiro && ejercicio.puntosTiro.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-900">Puntos de tiro configurados</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {ejercicio.puntosTiro.map((punto, puntoIndex) => (
                          <div key={`${ejercicio.id}-punto-${puntoIndex}`} className="rounded-xl bg-white px-3 py-2 text-sm text-emerald-950">
                            <span className="font-semibold">{nombresPunto[punto.posicion] || punto.posicion}</span>
                            <span className="ml-2">{punto.cantidad} tiros{punto.amboLados ? ' por lado' : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pizarras.length > 0 && (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm font-semibold text-slate-900">Secuencia táctica</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        {pizarras.map((pizarra, pizarraIndex) => (
                          <div key={`${ejercicio.id}-pizarra-${pizarraIndex}`} className="rounded-2xl border border-slate-200 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Pizarra {pizarraIndex + 1} · {pizarra.tipo === 'media' ? 'Media cancha' : 'Cancha completa'}
                            </p>
                            <img
                              src={pizarra.data}
                              alt={`Pizarra ${pizarraIndex + 1}`}
                              className="w-full rounded-xl border border-slate-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ejercicio.tipoRecurso === 'video' && ejercicio.videoUrl && (
                    <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                      Video de apoyo: {ejercicio.videoUrl}
                    </div>
                  )}

                  {detalleEjercicio && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm font-semibold text-slate-900">Observación del ejercicio</p>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          detalleEjercicio.completado
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {detalleEjercicio.completado ? 'Ejecutado' : 'Requiere ajuste'}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observaciones</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                            {detalleEjercicio.observaciones || 'Sin observaciones registradas.'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mejora o cambio sugerido</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                            {detalleEjercicio.ajuste || 'Sin cambios sugeridos.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
