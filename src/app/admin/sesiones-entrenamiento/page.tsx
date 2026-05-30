import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, ClipboardList, FileText, MessageSquare, User } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import AdminFeedbackEditor from '@/components/reportes/AdminFeedbackEditor'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getMonthBounds(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)
  const start = new Date(year, monthIndex - 1, 1)
  const end = new Date(year, monthIndex, 1)
  return { start, end }
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function getWeekKey(dateValue: string | Date) {
  const date = new Date(dateValue)
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000)
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${date.getFullYear()}-W${week}`
}

function formatFecha(fecha: Date) {
  return fecha.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Lima',
  })
}

interface DetalleEjercicioReporte {
  ejercicioId: string
  titulo: string
  completado: boolean
  observaciones: string
  ajuste: string
}

async function getData(month: string) {
  const { start, end } = getMonthBounds(month)

  return prisma.planEntrenamiento.findMany({
    where: {
      fecha: {
        gte: start,
        lt: end,
      },
    },
    include: {
      turno: {
        select: {
          id: true,
          nombre: true,
          hora: true,
        },
      },
      entrenador: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
        },
      },
      reportesEntrenador: {
        orderBy: {
          updatedAt: 'desc',
        },
      },
    },
    orderBy: [
      { fecha: 'asc' },
      { createdAt: 'asc' },
    ],
  })
}

async function getAdminContext() {
  const admin = await prisma.admin.findFirst({
    select: {
      id: true,
      nombre: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return admin
}

export default async function SesionesEntrenamientoAdminPage({
  searchParams,
}: {
  searchParams?: { month?: string }
}) {
  const month = searchParams?.month || getCurrentMonth()
  const planes = await getData(month)
  const admin = await getAdminContext()

  const grouped = planes.reduce<Record<string, typeof planes>>((acc, plan) => {
    const key = getWeekKey(plan.fecha)
    if (!acc[key]) acc[key] = []
    acc[key].push(plan)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sesiones de Entrenamiento</h1>
          <p className="text-gray-600 mt-2">Vista semanal de la planificación de cada entrenador con sus reportes y PDF.</p>
        </div>
        <form className="w-full lg:w-56">
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
          <div className="flex gap-2">
            <input
              id="month"
              name="month"
              type="month"
              defaultValue={month}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
            <Button type="submit" variant="outline">Ver</Button>
          </div>
        </form>
      </div>

      {planes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-700 font-medium">No hay planificaciones registradas en este mes.</p>
            <p className="text-sm text-gray-500 mt-1">Cuando los entrenadores guarden sus sesiones, aparecerán aquí para revisión.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([weekKey, weekPlanes]) => (
            <section key={weekKey}>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-800">
                  {weekKey}
                </span>
                <p className="text-sm text-gray-500">{weekPlanes.length} sesión{weekPlanes.length !== 1 ? 'es' : ''} planificada{weekPlanes.length !== 1 ? 's' : ''}</p>
              </div>

              <div className="space-y-5">
                {weekPlanes.map((plan) => {
                  const reporte = plan.reportesEntrenador[0] || null
                  const detalleEjercicios = Array.isArray(reporte?.detalleEjercicios)
                    ? (reporte?.detalleEjercicios as unknown as DetalleEjercicioReporte[])
                    : []

                  return (
                    <Card key={plan.id}>
                      <CardHeader>
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">{plan.titulo}</h2>
                            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatFecha(plan.fecha)}
                              </span>
                              <span>{plan.turno.nombre} · {plan.turno.hora}</span>
                              <span className="inline-flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {plan.entrenador.nombre} {plan.entrenador.apellidos}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Link href={`/entrenador/entrenamientos/${plan.id}/pdf`} target="_blank">
                              <Button variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                Ver PDF
                              </Button>
                            </Link>
                            <span className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold ${
                              reporte
                                ? reporte.completada
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {reporte ? (reporte.completada ? 'Reporte: completada' : 'Reporte: incompleta') : 'Sin reporte'}
                            </span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-5">
                        {plan.notas && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-900">Notas de la planificación</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{plan.notas}</p>
                          </div>
                        )}

                        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
                          <p className="text-sm font-semibold text-primary-900">Resumen de ejercicios</p>
                          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {Array.isArray(plan.ejercicios) && plan.ejercicios.map((ejercicio: any, index: number) => (
                              <div key={`${plan.id}-ej-${index}`} className="rounded-xl bg-white px-3 py-2 text-sm text-gray-800">
                                <span className="font-semibold">{index + 1}. {ejercicio.titulo}</span>
                                <span className="ml-2 text-gray-500">· {ejercicio.duracion} min</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {detalleEjercicios.length > 0 && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-sm font-semibold text-slate-900">Observaciones por ejercicio</p>
                            <div className="mt-4 space-y-4">
                              {detalleEjercicios.map((ejercicio, index) => (
                                <div key={`${plan.id}-detalle-${ejercicio.ejercicioId}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                    <p className="text-sm font-semibold text-slate-900">{index + 1}. {ejercicio.titulo}</p>
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                      ejercicio.completado
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {ejercicio.completado ? 'Ejecutado' : 'Requiere ajuste'}
                                    </span>
                                  </div>
                                  <div className="mt-3 grid gap-4 lg:grid-cols-2">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observaciones</p>
                                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                        {ejercicio.observaciones || 'Sin observaciones en este ejercicio.'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mejora o cambio sugerido</p>
                                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                        {ejercicio.ajuste || 'Sin ajustes registrados.'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid gap-4 lg:grid-cols-3">
                          <div className="rounded-2xl border border-gray-200 p-4 lg:col-span-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-primary-700" />
                              <p className="text-sm font-semibold text-gray-900">Observaciones del entrenador</p>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                              {reporte?.observaciones || 'Sin observaciones registradas todavía.'}
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-2xl border border-gray-200 p-4">
                              <p className="text-sm font-semibold text-gray-900">Si no terminó</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                                {reporte?.motivoIncompleta || 'No aplica'}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 p-4">
                              <p className="text-sm font-semibold text-gray-900">Requerimientos</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                                {reporte?.requerimientos || 'Sin requerimientos registrados.'}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 p-4">
                              <p className="text-sm font-semibold text-gray-900">Feedback enviado</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                                {reporte?.feedbackAdmin || 'Aún no se ha enviado feedback al entrenador.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {reporte && (
                          <AdminFeedbackEditor
                            reporteId={reporte.id}
                            adminId={admin?.id}
                            adminNombre={admin?.nombre || 'Administración Sharks'}
                            initialFeedback={reporte.feedbackAdmin}
                          />
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
