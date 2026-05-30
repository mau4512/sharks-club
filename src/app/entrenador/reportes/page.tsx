'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle2, ClipboardList, Loader2, Save, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { confirmDialog } from '@/components/ui/confirm-dialog'

interface PlanMes {
  id: string
  titulo: string
  fecha: string
  notas?: string
  turnoId: string
  ejercicios?: Array<{
    id?: string
    titulo: string
    duracion?: number
    descripcion?: string
    meta?: {
      cantidad?: number
      unidad?: string
      tipoTiro?: string
    }
  }>
  turno: {
    id: string
    nombre: string
    hora: string
  }
}

interface DetalleEjercicioReporte {
  ejercicioId: string
  titulo: string
  completado: boolean
  observaciones: string
  ajuste: string
}

interface ReporteEntrenador {
  id: string
  fechaSesion: string
  turnoId: string
  planEntrenamientoId?: string | null
  completada: boolean
  observaciones?: string | null
  motivoIncompleta?: string | null
  requerimientos?: string | null
  detalleEjercicios?: DetalleEjercicioReporte[] | null
  feedbackAdmin?: string | null
}

interface FormReporte {
  id?: string
  completada: boolean
  observaciones: string
  motivoIncompleta: string
  requerimientos: string
  detalleEjercicios: DetalleEjercicioReporte[]
}

const currentMonth = new Date().toISOString().slice(0, 7)

function buildDetalleEjercicios(
  plan: PlanMes,
  reporte?: ReporteEntrenador
): DetalleEjercicioReporte[] {
  const guardados = Array.isArray(reporte?.detalleEjercicios) ? reporte!.detalleEjercicios! : []
  const guardadosPorId = new Map(
    guardados.map((item) => [item.ejercicioId || item.titulo, item])
  )

  return Array.isArray(plan.ejercicios)
    ? plan.ejercicios.map((ejercicio, index) => {
        const ejercicioId = ejercicio.id || `ejercicio-${index + 1}`
        const saved = guardadosPorId.get(ejercicioId) || guardadosPorId.get(ejercicio.titulo)

        return {
          ejercicioId,
          titulo: ejercicio.titulo,
          completado: saved?.completado ?? true,
          observaciones: saved?.observaciones ?? '',
          ajuste: saved?.ajuste ?? '',
        }
      })
    : []
}

export default function ReportesEntrenadorPage() {
  const router = useRouter()
  const [entrenador, setEntrenador] = useState<any>(null)
  const [planes, setPlanes] = useState<PlanMes[]>([])
  const [reportes, setReportes] = useState<ReporteEntrenador[]>([])
  const [formularios, setFormularios] = useState<Record<string, FormReporte>>({})
  const [mesSeleccionado, setMesSeleccionado] = useState(currentMonth)
  const [loading, setLoading] = useState(true)
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null)
  const [savingExerciseKey, setSavingExerciseKey] = useState<string | null>(null)
  const [editingExerciseKey, setEditingExerciseKey] = useState<string | null>(null)

  useEffect(() => {
    const entrenadorData = localStorage.getItem('entrenador')
    if (!entrenadorData) {
      router.push('/entrenador/login')
      return
    }

    const entrenadorParsed = JSON.parse(entrenadorData)
    setEntrenador(entrenadorParsed)
  }, [router])

  useEffect(() => {
    if (!entrenador?.id) return
    void fetchData(entrenador.id, mesSeleccionado)
  }, [entrenador?.id, mesSeleccionado])

  const fetchData = async (entrenadorId: string, month: string) => {
    try {
      setLoading(true)

      const planesRes = await fetch(`/api/planes-entrenamiento?entrenadorId=${entrenadorId}`, {
        cache: 'no-store',
      })

      if (!planesRes.ok) {
        throw new Error('No se pudieron cargar las planificaciones del mes')
      }

      const planesData = await planesRes.json()
      let reportesData: ReporteEntrenador[] = []

      try {
        const reportesRes = await fetch(`/api/reportes-entrenador?entrenadorId=${entrenadorId}&month=${month}`, {
          cache: 'no-store',
        })

        if (!reportesRes.ok) {
          throw new Error('No se pudieron cargar los reportes del mes')
        }

        const parsed = await reportesRes.json()
        reportesData = Array.isArray(parsed) ? parsed : []
      } catch (reportesError) {
        console.error('Error al cargar reportes existentes del entrenador:', reportesError)
        toast.error('Se cargaron las sesiones, pero no se pudieron recuperar los reportes guardados')
      }

      const planesDelMes = (Array.isArray(planesData) ? planesData : []).filter((plan: PlanMes) =>
        plan.fecha.slice(0, 7) === month
      )

      setPlanes(planesDelMes)
      setReportes(reportesData)

      const forms: Record<string, FormReporte> = {}
      planesDelMes.forEach((plan: PlanMes) => {
        const reporte = reportesData.find(
          (item: ReporteEntrenador) => item.planEntrenamientoId === plan.id
        )

        forms[plan.id] = {
          id: reporte?.id,
          completada: reporte?.completada ?? true,
          observaciones: reporte?.observaciones ?? '',
          motivoIncompleta: reporte?.motivoIncompleta ?? '',
          requerimientos: reporte?.requerimientos ?? '',
          detalleEjercicios: buildDetalleEjercicios(plan, reporte),
        }
      })
      setFormularios(forms)
    } catch (error) {
      console.error('Error al cargar reportes del entrenador:', error)
      toast.error('No se pudieron cargar los reportes del mes')
      setPlanes([])
      setReportes([])
      setFormularios({})
    } finally {
      setLoading(false)
    }
  }

  const resumen = useMemo(() => {
    const total = planes.length
    const reportados = Object.values(formularios).filter((form) => form.id || form.observaciones || form.requerimientos || form.motivoIncompleta).length
    const completadas = Object.values(formularios).filter((form) => form.completada).length

    return { total, reportados, completadas, pendientes: Math.max(total - reportados, 0) }
  }, [formularios, planes.length])

  const updateForm = (planId: string, changes: Partial<FormReporte>) => {
    setFormularios((current) => ({
      ...current,
      [planId]: {
        ...current[planId],
        ...changes,
      },
    }))
  }

  const updateDetalleEjercicio = (
    planId: string,
    ejercicioId: string,
    changes: Partial<DetalleEjercicioReporte>
  ) => {
    setFormularios((current) => {
      const form = current[planId]
      if (!form) return current

      return {
        ...current,
        [planId]: {
          ...form,
          detalleEjercicios: form.detalleEjercicios.map((ejercicio) =>
            ejercicio.ejercicioId === ejercicioId
              ? { ...ejercicio, ...changes }
              : ejercicio
          ),
        },
      }
    })
  }

  const guardarReporte = async (plan: PlanMes) => {
    const form = formularios[plan.id]
    if (!form) return

    const confirmado = await confirmDialog({
      title: 'Guardar reporte',
      description: '¿Está seguro de guardar reporte? Este envío quedará disponible para administración.',
      cancelText: 'No',
      confirmText: 'Sí, enviar',
    })

    if (!confirmado) return

    setSavingPlanId(plan.id)
    try {
      const payload = {
        entrenadorId: entrenador.id,
        turnoId: plan.turnoId,
        planEntrenamientoId: plan.id,
        fechaSesion: plan.fecha.split('T')[0],
        completada: form.completada,
        observaciones: form.observaciones,
        motivoIncompleta: form.completada ? '' : form.motivoIncompleta,
        requerimientos: form.requerimientos,
        detalleEjercicios: form.detalleEjercicios,
        actorType: 'entrenador',
        entrenadorNombre: `${entrenador.nombre || ''} ${entrenador.apellidos || ''}`.trim(),
      }

      const response = await fetch(
        form.id ? `/api/reportes-entrenador/${form.id}` : '/api/reportes-entrenador',
        {
          method: form.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo guardar el reporte')
      }

      const saved = await response.json()
      updateForm(plan.id, { id: saved.id })
      toast.success('Reporte enviado correctamente')
      void fetchData(entrenador.id, mesSeleccionado)
    } catch (error: any) {
      console.error('Error al guardar reporte del entrenador:', error)
      toast.error(error.message || 'No se pudo guardar el reporte')
    } finally {
      setSavingPlanId(null)
    }
  }

  const updatePlanExerciseField = (
    planId: string,
    ejercicioId: string,
    field: 'titulo' | 'descripcion' | 'duracion',
    value: string
  ) => {
    setPlanes((current) =>
      current.map((plan) =>
        plan.id !== planId
          ? plan
          : {
              ...plan,
              ejercicios: Array.isArray(plan.ejercicios)
                ? plan.ejercicios.map((ejercicio, index) => {
                    const currentId = ejercicio.id || `ejercicio-${index + 1}`
                    if (currentId !== ejercicioId) return ejercicio

                    if (field === 'duracion') {
                      return {
                        ...ejercicio,
                        duracion: Number(value) || 0,
                      }
                    }

                    return {
                      ...ejercicio,
                      [field]: value,
                    }
                  })
                : [],
            }
      )
    )
  }

  const guardarEjercicio = async (plan: PlanMes, ejercicioId: string) => {
    const exerciseKey = `${plan.id}:${ejercicioId}`
    setSavingExerciseKey(exerciseKey)
    try {
      const response = await fetch(`/api/planes-entrenamiento/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: plan.titulo,
          fecha: plan.fecha.split('T')[0],
          turnoId: plan.turnoId,
          notas: plan.notas || '',
          ejercicios: plan.ejercicios || [],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo actualizar el ejercicio')
      }

      setEditingExerciseKey(null)
      toast.success('Ejercicio actualizado correctamente')
      void fetchData(entrenador.id, mesSeleccionado)
    } catch (error: any) {
      console.error('Error al actualizar ejercicio desde reporte:', error)
      toast.error(error.message || 'No se pudo actualizar el ejercicio')
    } finally {
      setSavingExerciseKey(null)
    }
  }

  if (loading && !entrenador) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/entrenador" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reportes del Mes</h1>
              <p className="text-gray-600 mt-1">Cada planificación del mes debe tener su reporte operativo y observaciones.</p>
            </div>
            <div className="w-full lg:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
              <input
                type="month"
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card><CardContent className="py-5"><p className="text-sm text-gray-600">Sesiones del mes</p><p className="text-3xl font-bold text-gray-900 mt-2">{resumen.total}</p></CardContent></Card>
          <Card><CardContent className="py-5"><p className="text-sm text-gray-600">Reportadas</p><p className="text-3xl font-bold text-primary-700 mt-2">{resumen.reportados}</p></CardContent></Card>
          <Card><CardContent className="py-5"><p className="text-sm text-gray-600">Terminadas</p><p className="text-3xl font-bold text-green-700 mt-2">{resumen.completadas}</p></CardContent></Card>
          <Card><CardContent className="py-5"><p className="text-sm text-gray-600">Pendientes</p><p className="text-3xl font-bold text-amber-600 mt-2">{resumen.pendientes}</p></CardContent></Card>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-600">Cargando sesiones del mes...</CardContent>
          </Card>
        ) : planes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-700 font-medium">No hay planificaciones cargadas en este mes.</p>
              <p className="text-sm text-gray-500 mt-1">Los reportes se llenan sobre cada entrenamiento planificado por día.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {planes.map((plan) => {
              const form = formularios[plan.id]
              const saved = Boolean(form?.id)
              const reporteActual = reportes.find((item) => item.planEntrenamientoId === plan.id)

              return (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{plan.titulo}</h2>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(plan.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Lima' })}
                          </span>
                          <span>{plan.turno.nombre} · {plan.turno.hora}</span>
                        </div>
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-primary-700">
                          Reporte vinculado a esta planificación diaria
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        saved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {saved ? 'Reporte guardado' : 'Pendiente de reporte'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex flex-col gap-3 md:flex-row">
                      <button
                        type="button"
                        onClick={() => updateForm(plan.id, { completada: true })}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                          form?.completada
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Se terminó la práctica
                      </button>
                      <button
                        type="button"
                        onClick={() => updateForm(plan.id, { completada: false })}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                          !form?.completada
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-red-400'
                        }`}
                      >
                        <XCircle className="h-4 w-4" />
                        No se terminó
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones de la práctica</label>
                      <textarea
                        rows={4}
                        value={form?.observaciones || ''}
                        onChange={(e) => updateForm(plan.id, { observaciones: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500"
                        placeholder="Cómo se llevó la práctica, respuesta del grupo, ajustes que se hicieron..."
                      />
                    </div>

                    {saved && reporteActual?.feedbackAdmin && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm font-semibold text-blue-900">Feedback de administración</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-blue-950">
                          {reporteActual.feedbackAdmin}
                        </p>
                      </div>
                    )}

                    {!form?.completada && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">¿Por qué no se terminó?</label>
                        <textarea
                          rows={3}
                          value={form?.motivoIncompleta || ''}
                          onChange={(e) => updateForm(plan.id, { motivoIncompleta: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500"
                          placeholder="Falta de tiempo, asistencia, clima, competencia, lesión, otros..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Desarrollo por ejercicio</label>
                      <div className="space-y-4">
                        {form?.detalleEjercicios?.length ? form.detalleEjercicios.map((ejercicio, index) => {
                          const planEjercicio = plan.ejercicios?.[index]
                          const ejercicioKey = `${plan.id}:${ejercicio.ejercicioId}`
                          const editing = editingExerciseKey === ejercicioKey
                          const savingExercise = savingExerciseKey === ejercicioKey

                          return (
                          <div key={`${plan.id}-${ejercicio.ejercicioId}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{index + 1}. {planEjercicio?.titulo || ejercicio.titulo}</p>
                                {planEjercicio?.duracion ? (
                                  <p className="text-xs text-slate-500">{planEjercicio.duracion} min planificados</p>
                                ) : null}
                                {planEjercicio?.meta?.cantidad ? (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Meta: {planEjercicio.meta.cantidad} {planEjercicio.meta.unidad || ''}{' '}
                                    {planEjercicio.meta.tipoTiro
                                      ? `· ${planEjercicio.meta.tipoTiro === '2puntos' ? '2 puntos' : '3 puntos'}`
                                      : ''}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() => updateDetalleEjercicio(plan.id, ejercicio.ejercicioId, { completado: true })}
                                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                    ejercicio.completado
                                      ? 'border-green-500 bg-green-50 text-green-700'
                                      : 'border-gray-300 bg-white text-gray-600 hover:border-green-400'
                                  }`}
                                >
                                  Ejecutado
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateDetalleEjercicio(plan.id, ejercicio.ejercicioId, { completado: false })}
                                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                    !ejercicio.completado
                                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                                      : 'border-gray-300 bg-white text-gray-600 hover:border-amber-400'
                                  }`}
                                >
                                  Requiere ajuste
                                </button>
                                {!editing ? (
                                  <button
                                    type="button"
                                    onClick={() => setEditingExerciseKey(ejercicioKey)}
                                    className="rounded-lg border border-primary-300 bg-white px-3 py-2 text-xs font-semibold text-primary-700 transition hover:border-primary-400"
                                  >
                                    Modificar ejercicio
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void guardarEjercicio(plan, ejercicio.ejercicioId)}
                                      disabled={savingExercise}
                                      className="rounded-lg border border-primary-600 bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {savingExercise ? 'Guardando...' : 'Guardar ejercicio'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingExerciseKey(null)
                                        void fetchData(entrenador.id, mesSeleccionado)
                                      }}
                                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-400"
                                    >
                                      Cancelar edición
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {editing && planEjercicio && (
                              <div className="grid gap-4 rounded-2xl border border-primary-200 bg-white p-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">Título del ejercicio</label>
                                  <input
                                    type="text"
                                    value={planEjercicio.titulo}
                                    onChange={(e) => updatePlanExerciseField(plan.id, ejercicio.ejercicioId, 'titulo', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-2">Duración</label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={planEjercicio.duracion || 0}
                                    onChange={(e) => updatePlanExerciseField(plan.id, ejercicio.ejercicioId, 'duracion', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">Descripción</label>
                                  <textarea
                                    rows={4}
                                    value={planEjercicio.descripcion || ''}
                                    onChange={(e) => updatePlanExerciseField(plan.id, ejercicio.ejercicioId, 'descripcion', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500"
                                  />
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">Observaciones del ejercicio</label>
                              <textarea
                                rows={3}
                                value={ejercicio.observaciones}
                                onChange={(e) => updateDetalleEjercicio(plan.id, ejercicio.ejercicioId, { observaciones: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500"
                                placeholder="Cómo respondió el grupo, qué salió bien o qué debe reforzarse..."
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">Mejora o cambio sugerido</label>
                              <textarea
                                rows={3}
                                value={ejercicio.ajuste}
                                onChange={(e) => updateDetalleEjercicio(plan.id, ejercicio.ejercicioId, { ajuste: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500"
                                placeholder="Cambio de dinámica, progresión, corrección táctica o variante que recomiendas aplicar..."
                              />
                            </div>
                          </div>
                        )}) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                            Esta planificación no tiene ejercicios detallados cargados.
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Requerimientos o necesidades</label>
                      <textarea
                        rows={3}
                        value={form?.requerimientos || ''}
                        onChange={(e) => updateForm(plan.id, { requerimientos: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500"
                        placeholder="Materiales, apoyo, espacios, seguimiento especial, observaciones para administración..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => guardarReporte(plan)}
                        disabled={savingPlanId === plan.id}
                      >
                        {savingPlanId === plan.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Enviar reporte
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
