'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, Play, Plus, Save, Trophy, Trash2 } from 'lucide-react'
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
  localia?: 'local' | 'visitante'
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
}

interface EstadisticasPartido {
  propio: EstadisticaEquipo
  rival: EstadisticaEquipo
  periodos: PeriodoPartido[]
  jugadores: EstadisticaJugador[]
}

interface PeriodoPartido {
  periodo: string
  propio: number
  rival: number
}

interface EstadisticaJugador {
  id: string
  numero: string
  nombre: string
  minutos: number
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
}

const statFields: Array<{ key: keyof EstadisticaEquipo; label: string }> = [
  { key: 't2Convertidos', label: '2P conv.' },
  { key: 't2Intentados', label: '2P int.' },
  { key: 't3Convertidos', label: '3P conv.' },
  { key: 't3Intentados', label: '3P int.' },
  { key: 'tlConvertidos', label: 'TL conv.' },
  { key: 'tlIntentados', label: 'TL int.' },
  { key: 'rebotesOfensivos', label: 'RO' },
  { key: 'rebotesDefensivos', label: 'RD' },
  { key: 'asistencias', label: 'AST' },
  { key: 'perdidas', label: 'PER' },
  { key: 'robos', label: 'ROB' },
  { key: 'bloqueos', label: 'BLK' },
  { key: 'faltas', label: 'Faltas' },
]

const playerFields: Array<{ key: keyof Omit<EstadisticaJugador, 'id' | 'numero' | 'nombre'>; label: string }> = [
  { key: 'minutos', label: 'MIN' },
  { key: 't2Convertidos', label: '2C' },
  { key: 't2Intentados', label: '2I' },
  { key: 't3Convertidos', label: '3C' },
  { key: 't3Intentados', label: '3I' },
  { key: 'tlConvertidos', label: 'TLC' },
  { key: 'tlIntentados', label: 'TLI' },
  { key: 'rebotesOfensivos', label: 'RO' },
  { key: 'rebotesDefensivos', label: 'RD' },
  { key: 'asistencias', label: 'AST' },
  { key: 'perdidas', label: 'PER' },
  { key: 'robos', label: 'ROB' },
  { key: 'bloqueos', label: 'BLK' },
  { key: 'faltas', label: 'F' },
]

const defaultPeriodos: PeriodoPartido[] = [
  { periodo: '1C', propio: 0, rival: 0 },
  { periodo: '2C', propio: 0, rival: 0 },
  { periodo: '3C', propio: 0, rival: 0 },
  { periodo: '4C', propio: 0, rival: 0 },
]

function normalizeStats(stats?: EstadisticasPartido | null): EstadisticasPartido {
  return {
    propio: { ...emptyStats, ...(stats?.propio || {}) },
    rival: { ...emptyStats, ...(stats?.rival || {}) },
    periodos: Array.isArray(stats?.periodos) && stats.periodos.length > 0
      ? stats.periodos.map((periodo, index) => ({
          periodo: periodo.periodo || defaultPeriodos[index]?.periodo || `P${index + 1}`,
          propio: Number(periodo.propio) || 0,
          rival: Number(periodo.rival) || 0,
        }))
      : defaultPeriodos,
    jugadores: Array.isArray(stats?.jugadores)
      ? stats.jugadores.map((jugador) => ({
          id: jugador.id || crypto.randomUUID(),
          numero: jugador.numero || '',
          nombre: jugador.nombre || '',
          minutos: Number(jugador.minutos) || 0,
          t2Convertidos: Number(jugador.t2Convertidos) || 0,
          t2Intentados: Number(jugador.t2Intentados) || 0,
          t3Convertidos: Number(jugador.t3Convertidos) || 0,
          t3Intentados: Number(jugador.t3Intentados) || 0,
          tlConvertidos: Number(jugador.tlConvertidos) || 0,
          tlIntentados: Number(jugador.tlIntentados) || 0,
          rebotesOfensivos: Number(jugador.rebotesOfensivos) || 0,
          rebotesDefensivos: Number(jugador.rebotesDefensivos) || 0,
          asistencias: Number(jugador.asistencias) || 0,
          perdidas: Number(jugador.perdidas) || 0,
          robos: Number(jugador.robos) || 0,
          bloqueos: Number(jugador.bloqueos) || 0,
          faltas: Number(jugador.faltas) || 0,
        }))
      : [],
  }
}

function pct(convertidos: number, intentados: number) {
  if (!intentados) return '0%'
  return `${Math.round((convertidos / intentados) * 100)}%`
}

function totalRebotes(stats: EstadisticaEquipo) {
  return stats.rebotesOfensivos + stats.rebotesDefensivos
}

function puntosCalculados(stats: EstadisticaEquipo) {
  return stats.t2Convertidos * 2 + stats.t3Convertidos * 3 + stats.tlConvertidos
}

function puntosJugador(stats: EstadisticaJugador) {
  return stats.t2Convertidos * 2 + stats.t3Convertidos * 3 + stats.tlConvertidos
}

function marcadorDesdePeriodos(stats: EstadisticasPartido) {
  return stats.periodos.reduce(
    (total, periodo) => ({
      propio: total.propio + periodo.propio,
      rival: total.rival + periodo.rival,
    }),
    { propio: 0, rival: 0 }
  )
}

function equipoDesdeJugadores(jugadores: EstadisticaJugador[]): EstadisticaEquipo {
  return jugadores.reduce(
    (total, jugador) => ({
      t2Convertidos: total.t2Convertidos + jugador.t2Convertidos,
      t2Intentados: total.t2Intentados + jugador.t2Intentados,
      t3Convertidos: total.t3Convertidos + jugador.t3Convertidos,
      t3Intentados: total.t3Intentados + jugador.t3Intentados,
      tlConvertidos: total.tlConvertidos + jugador.tlConvertidos,
      tlIntentados: total.tlIntentados + jugador.tlIntentados,
      rebotesOfensivos: total.rebotesOfensivos + jugador.rebotesOfensivos,
      rebotesDefensivos: total.rebotesDefensivos + jugador.rebotesDefensivos,
      asistencias: total.asistencias + jugador.asistencias,
      perdidas: total.perdidas + jugador.perdidas,
      robos: total.robos + jugador.robos,
      bloqueos: total.bloqueos + jugador.bloqueos,
      faltas: total.faltas + jugador.faltas,
    }),
    { ...emptyStats }
  )
}

function emptyPlayer(): EstadisticaJugador {
  return {
    id: crypto.randomUUID(),
    numero: '',
    nombre: '',
    minutos: 0,
    ...emptyStats,
  }
}

function posesionesEstimadas(stats: EstadisticaEquipo) {
  const tirosCampo = stats.t2Intentados + stats.t3Intentados
  return Math.max(0, Math.round(tirosCampo + stats.perdidas + stats.tlIntentados * 0.44 - stats.rebotesOfensivos))
}

function StatsEditor({
  title,
  stats,
  onChange,
}: {
  title: string
  stats: EstadisticasPartido
  onChange: (stats: EstadisticasPartido) => void
}) {
  const currentStats = normalizeStats(stats)
  const resumen = [
    { label: 'Puntos calc.', propio: puntosCalculados(currentStats.propio), rival: puntosCalculados(currentStats.rival) },
    { label: '% 2P', propio: pct(currentStats.propio.t2Convertidos, currentStats.propio.t2Intentados), rival: pct(currentStats.rival.t2Convertidos, currentStats.rival.t2Intentados) },
    { label: '% 3P', propio: pct(currentStats.propio.t3Convertidos, currentStats.propio.t3Intentados), rival: pct(currentStats.rival.t3Convertidos, currentStats.rival.t3Intentados) },
    { label: '% TL', propio: pct(currentStats.propio.tlConvertidos, currentStats.propio.tlIntentados), rival: pct(currentStats.rival.tlConvertidos, currentStats.rival.tlIntentados) },
    { label: 'REB', propio: totalRebotes(currentStats.propio), rival: totalRebotes(currentStats.rival) },
    { label: 'Pos. est.', propio: posesionesEstimadas(currentStats.propio), rival: posesionesEstimadas(currentStats.rival) },
  ]
  const marcadorPeriodos = marcadorDesdePeriodos(currentStats)
  const totalesJugadores = equipoDesdeJugadores(currentStats.jugadores)

  const updateEquipoStat = (
    equipo: 'propio' | 'rival',
    field: keyof EstadisticaEquipo,
    value: number
  ) => {
    onChange({
      ...currentStats,
      [equipo]: {
        ...currentStats[equipo],
        [field]: Math.max(0, value || 0),
      },
    })
  }

  const updatePeriodo = (index: number, equipo: 'propio' | 'rival', value: number) => {
    onChange({
      ...currentStats,
      periodos: currentStats.periodos.map((periodo, periodoIndex) =>
        periodoIndex === index ? { ...periodo, [equipo]: Math.max(0, value || 0) } : periodo
      ),
    })
  }

  const updateJugador = (
    id: string,
    field: keyof EstadisticaJugador,
    value: string | number
  ) => {
    onChange({
      ...currentStats,
      jugadores: currentStats.jugadores.map((jugador) =>
        jugador.id === id
          ? {
              ...jugador,
              [field]: field === 'numero' || field === 'nombre' ? value : Math.max(0, Number(value) || 0),
            }
          : jugador
      ),
    })
  }

  const addJugador = () => {
    onChange({
      ...currentStats,
      jugadores: [...currentStats.jugadores, emptyPlayer()],
    })
  }

  const removeJugador = (id: string) => {
    onChange({
      ...currentStats,
      jugadores: currentStats.jugadores.filter((jugador) => jugador.id !== id),
    })
  }

  const aplicarTotalesJugadores = () => {
    onChange({
      ...currentStats,
      propio: totalesJugadores,
    })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary-700" />
          <p className="text-sm font-semibold text-slate-900">{title}</p>
        </div>
        <div className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900">
          Marcador: {marcadorPeriodos.propio} - {marcadorPeriodos.rival}
        </div>
      </div>

      <div className="mb-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {resumen.map((item) => (
          <div key={item.label} className="rounded-lg bg-white px-3 py-2 text-xs">
            <p className="font-semibold text-slate-500">{item.label}</p>
            <p className="mt-1 text-slate-900">Nosotros: {item.propio}</p>
            <p className="text-slate-700">Rival: {item.rival}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="border border-slate-300 px-2 py-2 text-left">Periodo</th>
              {currentStats.periodos.map((periodo) => (
                <th key={periodo.periodo} className="border border-slate-300 px-2 py-2 text-center">{periodo.periodo}</th>
              ))}
              <th className="border border-slate-300 px-2 py-2 text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            {(['propio', 'rival'] as const).map((equipo) => (
              <tr key={equipo} className="bg-white">
                <td className="border border-slate-200 px-2 py-2 font-semibold text-slate-900">
                  {equipo === 'propio' ? 'Nosotros' : 'Rival'}
                </td>
                {currentStats.periodos.map((periodo, index) => (
                  <td key={periodo.periodo} className="border border-slate-200 px-1 py-1">
                    <input
                      type="number"
                      min="0"
                      value={periodo[equipo]}
                      onChange={(event) => updatePeriodo(index, equipo, Number(event.target.value))}
                      className="w-full rounded border border-slate-200 px-2 py-1 text-center text-slate-900"
                    />
                  </td>
                ))}
                <td className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-900">
                  {currentStats.periodos.reduce((total, periodo) => total + periodo[equipo], 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="border border-slate-300 px-2 py-2 text-left">Totales equipo</th>
              {statFields.map((field) => (
                <th key={field.key} className="border border-slate-300 px-2 py-2 text-center">{field.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(['propio', 'rival'] as const).map((equipo) => (
              <tr key={equipo} className="bg-white">
                <td className="border border-slate-200 px-2 py-2 font-semibold text-slate-900">
                  {equipo === 'propio' ? 'Nosotros' : 'Rival'}
                </td>
                {statFields.map((field) => (
                  <td key={field.key} className="border border-slate-200 px-1 py-1">
                    <input
                      type="number"
                      min="0"
                      value={currentStats[equipo][field.key]}
                      onChange={(event) => updateEquipoStat(equipo, field.key, Number(event.target.value))}
                      className="w-full rounded border border-slate-200 px-2 py-1 text-center text-slate-900"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Planilla de jugadores</p>
            <p className="mt-1 text-xs text-slate-600">
              Total jugadores: {puntosCalculados(totalesJugadores)} pts, {totalRebotes(totalesJugadores)} reb, {totalesJugadores.asistencias} ast
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={aplicarTotalesJugadores}>
              Actualizar totales
            </Button>
            <Button type="button" variant="outline" onClick={addJugador}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar jugador
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="border border-slate-300 px-2 py-2 text-center">#</th>
                <th className="border border-slate-300 px-2 py-2 text-left">Jugador</th>
                <th className="border border-slate-300 px-2 py-2 text-center">PTS</th>
                {playerFields.map((field) => (
                  <th key={field.key} className="border border-slate-300 px-2 py-2 text-center">{field.label}</th>
                ))}
                <th className="border border-slate-300 px-2 py-2 text-center">REB</th>
                <th className="border border-slate-300 px-2 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {currentStats.jugadores.length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={playerFields.length + 6} className="border border-slate-200 px-3 py-6 text-center text-slate-500">
                    Agrega jugadores para llevar la planilla individual del partido.
                  </td>
                </tr>
              ) : (
                currentStats.jugadores.map((jugador) => (
                  <tr key={jugador.id} className="bg-white">
                    <td className="border border-slate-200 px-1 py-1">
                      <input
                        value={jugador.numero}
                        onChange={(event) => updateJugador(jugador.id, 'numero', event.target.value)}
                        className="w-14 rounded border border-slate-200 px-2 py-1 text-center text-slate-900"
                      />
                    </td>
                    <td className="border border-slate-200 px-1 py-1">
                      <input
                        value={jugador.nombre}
                        onChange={(event) => updateJugador(jugador.id, 'nombre', event.target.value)}
                        className="w-44 rounded border border-slate-200 px-2 py-1 text-slate-900"
                        placeholder="Nombre"
                      />
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-900">
                      {puntosJugador(jugador)}
                    </td>
                    {playerFields.map((field) => (
                      <td key={field.key} className="border border-slate-200 px-1 py-1">
                        <input
                          type="number"
                          min="0"
                          value={jugador[field.key]}
                          onChange={(event) => updateJugador(jugador.id, field.key, Number(event.target.value))}
                          className="w-full rounded border border-slate-200 px-2 py-1 text-center text-slate-900"
                        />
                      </td>
                    ))}
                    <td className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-900">
                      {totalRebotes(jugador)}
                    </td>
                    <td className="border border-slate-200 px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeJugador(jugador.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 text-red-700 hover:bg-red-50"
                        aria-label="Eliminar jugador"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
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
    localia: 'local',
    fechaPartido: new Date().toISOString().split('T')[0],
    horaPartido: '18:00',
    turnoId: '',
    estado: 'programado',
    resultadoPropio: '',
    resultadoRival: '',
    estadisticas: normalizeStats(),
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
          estadisticas: nuevoPartido.estadisticas,
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
        localia: 'local',
        fechaPartido: new Date().toISOString().split('T')[0],
        horaPartido: '18:00',
        turnoId: '',
        estado: 'programado',
        resultadoPropio: '',
        resultadoRival: '',
        estadisticas: normalizeStats(),
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

  const setPartidoStats = (id: string, estadisticas: EstadisticasPartido) => {
    const normalizedStats = normalizeStats(estadisticas)
    const marcador = marcadorDesdePeriodos(normalizedStats)
    setPartidos((current) =>
      current.map((partido) =>
        partido.id === id
          ? {
              ...partido,
              estadisticas: normalizedStats,
              resultadoPropio: marcador.propio,
              resultadoRival: marcador.rival,
            }
          : partido
      )
    )
  }

  const updateNuevoPartidoStats = (estadisticas: EstadisticasPartido) => {
    const normalizedStats = normalizeStats(estadisticas)
    const marcador = marcadorDesdePeriodos(normalizedStats)
    setNuevoPartido((current) => ({
      ...current,
      resultadoPropio: String(marcador.propio),
      resultadoRival: String(marcador.rival),
      estadisticas: normalizedStats,
    }))
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
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={nuevoPartido.localia} onChange={(e) => setNuevoPartido((c) => ({ ...c, localia: e.target.value as 'local' | 'visitante' }))}>
                <option value="local">Somos locales</option>
                <option value="visitante">Somos visitantes</option>
              </select>
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

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Las estadísticas se registran desde la ventana en vivo después de crear el partido.
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
                    <select className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" value={partido.localia || 'local'} onChange={(e) => updatePartidoField(partido.id, 'localia', e.target.value)}>
                      <option value="local">Somos locales</option>
                      <option value="visitante">Somos visitantes</option>
                    </select>
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

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Estadísticas del partido</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Marcador registrado: {partido.resultadoPropio ?? 0} - {partido.resultadoRival ?? 0}
                        </p>
                      </div>
                      <Link
                        href={`/entrenador/partidos/${partido.id}/estadisticas`}
                        className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Tomar estadísticas
                      </Link>
                      <Link
                        href={`/entrenador/partidos/${partido.id}/reporte`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Reporte final
                      </Link>
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
