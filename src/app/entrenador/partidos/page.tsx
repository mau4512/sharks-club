'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trophy, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { confirmDialog } from '@/components/ui/confirm-dialog'

interface PartidoEntrenador {
  id: string
  turnoId?: string | null
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
  analisisGeneral?: string | null
  erroresDeficiencias?: string | null
  correccionesProximaSemana?: string | null
  microcicloTrabajo?: string | null
}

function getCurrentWeekValue() {
  const now = new Date()
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function getWeekFromDate(dateValue: string) {
  const date = new Date(dateValue)
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = temp.getUTCDay() || 7
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${temp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export default function EntrenadorPartidosPage() {
  const router = useRouter()
  const [entrenador, setEntrenador] = useState<any>(null)
  const [turnos, setTurnos] = useState<any[]>([])
  const [partidos, setPartidos] = useState<PartidoEntrenador[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekValue())
  const [nuevoPartido, setNuevoPartido] = useState({
    rival: '',
    competencia: '',
    categoria: '',
    sede: '',
    fechaPartido: new Date().toISOString().split('T')[0],
    horaPartido: '18:00',
    turnoId: '',
    estado: 'programado',
    resultadoPropio: '',
    resultadoRival: '',
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

    const parsed = JSON.parse(entrenadorRaw)
    setEntrenador(parsed)
    void Promise.all([fetchTurnos(parsed.id), fetchPartidos(parsed.id)]).finally(() => setLoading(false))
  }, [router])

  const fetchTurnos = async (entrenadorId: string) => {
    const response = await fetch('/api/turnos')
    if (!response.ok) return
    const data = await response.json()
    setTurnos(data.filter((turno: any) => turno.entrenadorId === entrenadorId))
  }

  const fetchPartidos = async (entrenadorId: string) => {
    const response = await fetch(`/api/partidos-entrenador?entrenadorId=${entrenadorId}`)
    if (!response.ok) {
      toast.error('No se pudieron cargar los partidos')
      return
    }
    const data = await response.json()
    setPartidos(Array.isArray(data) ? data : [])
  }

  const partidosSemana = useMemo(
    () => partidos.filter((partido) => getWeekFromDate(partido.fechaPartido) === selectedWeek),
    [partidos, selectedWeek]
  )

  const crearPartido = async () => {
    if (!entrenador?.id) return
    if (!nuevoPartido.rival.trim()) {
      toast.error('El rival es obligatorio')
      return
    }

    try {
      setSavingId('nuevo')
      const response = await fetch('/api/partidos-entrenador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoPartido,
          entrenadorId: entrenador.id,
          turnoId: nuevoPartido.turnoId || null,
          resultadoPropio: nuevoPartido.resultadoPropio === '' ? undefined : Number(nuevoPartido.resultadoPropio),
          resultadoRival: nuevoPartido.resultadoRival === '' ? undefined : Number(nuevoPartido.resultadoRival),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo crear el partido')
      }

      toast.success('Partido programado correctamente')
      setNuevoPartido({
        rival: '',
        competencia: '',
        categoria: '',
        sede: '',
        fechaPartido: new Date().toISOString().split('T')[0],
        horaPartido: '18:00',
        turnoId: '',
        estado: 'programado',
        resultadoPropio: '',
        resultadoRival: '',
        analisisGeneral: '',
        erroresDeficiencias: '',
        correccionesProximaSemana: '',
        microcicloTrabajo: '',
      })
      void fetchPartidos(entrenador.id)
    } catch (error: any) {
      console.error('Error al crear partido:', error)
      toast.error(error.message || 'No se pudo crear el partido')
    } finally {
      setSavingId(null)
    }
  }

  const updatePartidoField = (id: string, field: keyof PartidoEntrenador, value: string | number | null) => {
    setPartidos((current) =>
      current.map((partido) => (partido.id === id ? { ...partido, [field]: value } : partido))
    )
  }

  const guardarPartido = async (partido: PartidoEntrenador) => {
    try {
      setSavingId(partido.id)
      const response = await fetch(`/api/partidos-entrenador/${partido.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...partido,
          fechaPartido: partido.fechaPartido.split('T')[0],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo actualizar el partido')
      }

      toast.success('Partido actualizado correctamente')
      if (entrenador?.id) {
        void fetchPartidos(entrenador.id)
      }
    } catch (error: any) {
      console.error('Error al actualizar partido:', error)
      toast.error(error.message || 'No se pudo actualizar el partido')
    } finally {
      setSavingId(null)
    }
  }

  const eliminarPartido = async (partidoId: string) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar partido',
      description: '¿Seguro que quieres eliminar este partido programado?',
      cancelText: 'No',
      confirmText: 'Sí, eliminar',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/partidos-entrenador/${partidoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo eliminar el partido')
      }

      toast.success('Partido eliminado')
      if (entrenador?.id) {
        void fetchPartidos(entrenador.id)
      }
    } catch (error: any) {
      console.error('Error al eliminar partido:', error)
      toast.error(error.message || 'No se pudo eliminar el partido')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
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
          <h1 className="text-2xl font-bold text-gray-900">Partidos de la Semana</h1>
          <p className="mt-1 text-gray-600">Programa partidos, registra resultado y deja el análisis técnico para la próxima semana o microciclo.</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Programar nuevo partido</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" placeholder="Rival" value={nuevoPartido.rival} onChange={(e) => setNuevoPartido((c) => ({ ...c, rival: e.target.value }))} />
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" placeholder="Competencia" value={nuevoPartido.competencia} onChange={(e) => setNuevoPartido((c) => ({ ...c, competencia: e.target.value }))} />
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" placeholder="Categoría" value={nuevoPartido.categoria} onChange={(e) => setNuevoPartido((c) => ({ ...c, categoria: e.target.value }))} />
              <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={nuevoPartido.fechaPartido} onChange={(e) => setNuevoPartido((c) => ({ ...c, fechaPartido: e.target.value }))} />
              <input type="time" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={nuevoPartido.horaPartido} onChange={(e) => setNuevoPartido((c) => ({ ...c, horaPartido: e.target.value }))} />
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" placeholder="Sede" value={nuevoPartido.sede} onChange={(e) => setNuevoPartido((c) => ({ ...c, sede: e.target.value }))} />
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={nuevoPartido.turnoId} onChange={(e) => setNuevoPartido((c) => ({ ...c, turnoId: e.target.value }))}>
                <option value="">Sin turno asociado</option>
                {turnos.map((turno) => (
                  <option key={turno.id} value={turno.id}>{turno.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={nuevoPartido.estado} onChange={(e) => setNuevoPartido((c) => ({ ...c, estado: e.target.value }))}>
                <option value="programado">Programado</option>
                <option value="jugado">Jugado</option>
                <option value="postergado">Postergado</option>
              </select>
              <input type="number" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" placeholder="Resultado propio" value={nuevoPartido.resultadoPropio} onChange={(e) => setNuevoPartido((c) => ({ ...c, resultadoPropio: e.target.value }))} />
              <input type="number" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" placeholder="Resultado rival" value={nuevoPartido.resultadoRival} onChange={(e) => setNuevoPartido((c) => ({ ...c, resultadoRival: e.target.value }))} />
              <div className="flex justify-end">
                <Button onClick={() => void crearPartido()} disabled={savingId === 'nuevo'}>
                  <Trophy className="h-4 w-4 mr-2" />
                  {savingId === 'nuevo' ? 'Guardando...' : 'Registrar partido'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Partidos programados</h2>
              <div className="w-full lg:w-56">
                <label className="block text-sm font-medium text-gray-700 mb-2">Semana</label>
                <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {partidosSemana.length === 0 ? (
              <div className="py-10 text-center text-gray-600">No hay partidos registrados en esta semana.</div>
            ) : (
              partidosSemana.map((partido) => (
                <div key={partido.id} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{partido.titulo}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={partido.rival} onChange={(e) => updatePartidoField(partido.id, 'rival', e.target.value)} />
                    <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" value={partido.competencia || ''} onChange={(e) => updatePartidoField(partido.id, 'competencia', e.target.value)} placeholder="Competencia" />
                    <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" value={partido.categoria || ''} onChange={(e) => updatePartidoField(partido.id, 'categoria', e.target.value)} placeholder="Categoría" />
                    <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={partido.fechaPartido.split('T')[0]} onChange={(e) => updatePartidoField(partido.id, 'fechaPartido', e.target.value)} />
                    <input type="time" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={partido.horaPartido} onChange={(e) => updatePartidoField(partido.id, 'horaPartido', e.target.value)} />
                    <input className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" value={partido.sede || ''} onChange={(e) => updatePartidoField(partido.id, 'sede', e.target.value)} placeholder="Sede" />
                    <select className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={partido.estado} onChange={(e) => updatePartidoField(partido.id, 'estado', e.target.value)}>
                      <option value="programado">Programado</option>
                      <option value="jugado">Jugado</option>
                      <option value="postergado">Postergado</option>
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <input type="number" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" value={partido.resultadoPropio ?? ''} onChange={(e) => updatePartidoField(partido.id, 'resultadoPropio', e.target.value === '' ? null : Number(e.target.value))} placeholder="Resultado propio" />
                    <input type="number" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" value={partido.resultadoRival ?? ''} onChange={(e) => updatePartidoField(partido.id, 'resultadoRival', e.target.value === '' ? null : Number(e.target.value))} placeholder="Resultado rival" />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Análisis general del partido</label>
                      <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" value={partido.analisisGeneral || ''} onChange={(e) => updatePartidoField(partido.id, 'analisisGeneral', e.target.value)} placeholder="Balance general, contexto y lectura del partido..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Errores o deficiencias detectadas</label>
                      <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" value={partido.erroresDeficiencias || ''} onChange={(e) => updatePartidoField(partido.id, 'erroresDeficiencias', e.target.value)} placeholder="Errores tácticos, técnicos o físicos a corregir..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Correcciones para la próxima semana</label>
                      <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" value={partido.correccionesProximaSemana || ''} onChange={(e) => updatePartidoField(partido.id, 'correccionesProximaSemana', e.target.value)} placeholder="Qué se debe trabajar la semana siguiente..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trabajo de microciclo</label>
                      <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500" value={partido.microcicloTrabajo || ''} onChange={(e) => updatePartidoField(partido.id, 'microcicloTrabajo', e.target.value)} placeholder="Objetivos para microciclos específicos de entrenamiento..." />
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3">
                    <Button variant="outline" onClick={() => void eliminarPartido(partido.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                    <Button onClick={() => void guardarPartido(partido)} disabled={savingId === partido.id}>
                      <Save className="h-4 w-4 mr-2" />
                      {savingId === partido.id ? 'Guardando...' : 'Guardar partido'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
