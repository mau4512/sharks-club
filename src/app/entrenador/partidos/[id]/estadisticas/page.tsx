'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RotateCcw, Save, Trash2, UserPlus } from 'lucide-react'
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
  turno?: {
    id: string
    nombre: string
    deportistas: Array<{
      id: string
      nombre: string
      apellidos: string
      numeroCamiseta?: string | null
    }>
  } | null
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

interface EventoEstadistica {
  id: string
  equipo: 'propio' | 'rival'
  jugadorId?: string
  jugadorNombre?: string
  periodo: number
  accion: AccionCodigo
  label: string
  canchaX?: number
  canchaY?: number
  detalle?: string
  tirosLibresGenerados?: number
  relacionadoConId?: string
  createdAt: string
}

interface EstadisticasPartido {
  propio: EstadisticaEquipo
  rival: EstadisticaEquipo
  periodos: PeriodoPartido[]
  jugadores: EstadisticaJugador[]
  eventos?: EventoEstadistica[]
}

type AccionCodigo = '2PM' | '2PA' | '3PM' | '3PA' | 'FTM' | 'FTA' | 'RO' | 'RD' | 'AST' | 'TO' | 'STL' | 'BLK' | 'PF' | 'OUT'

type PendingAction = {
  equipo: 'propio' | 'rival'
  accion: AccionCodigo
  label: string
}

type ShotLocation = {
  x: number
  y: number
}

type FollowUp =
  | { type: 'missed-shot'; eventId: string; equipo: 'propio' | 'rival' }
  | { type: 'turnover'; eventId: string; equipo: 'propio' | 'rival' }
  | { type: 'foul'; eventId: string; equipo: 'propio' | 'rival' }

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

const accionesTiro: Array<{ result: 'made' | 'missed'; label: string; tone: string }> = [
  { result: 'made', label: 'Encestó', tone: 'bg-emerald-600 hover:bg-emerald-700' },
  { result: 'missed', label: 'Falló', tone: 'bg-slate-700 hover:bg-slate-800' },
]

const accionesLibres: Array<{ code: AccionCodigo; label: string; tone: string }> = [
  { code: 'FTM', label: 'TL anotado', tone: 'bg-emerald-600 hover:bg-emerald-700' },
  { code: 'FTA', label: 'TL fallado', tone: 'bg-slate-700 hover:bg-slate-800' },
  { code: 'RO', label: 'Reb. ofensivo', tone: 'bg-blue-700 hover:bg-blue-800' },
  { code: 'RD', label: 'Reb. defensivo', tone: 'bg-blue-700 hover:bg-blue-800' },
  { code: 'AST', label: 'Asistencia', tone: 'bg-cyan-700 hover:bg-cyan-800' },
  { code: 'TO', label: 'Pérdida', tone: 'bg-amber-700 hover:bg-amber-800' },
  { code: 'STL', label: 'Robo', tone: 'bg-indigo-700 hover:bg-indigo-800' },
  { code: 'BLK', label: 'Bloqueo', tone: 'bg-violet-700 hover:bg-violet-800' },
  { code: 'PF', label: 'Falta', tone: 'bg-red-700 hover:bg-red-800' },
]

const periodosBase: PeriodoPartido[] = [
  { periodo: '1C', propio: 0, rival: 0 },
  { periodo: '2C', propio: 0, rival: 0 },
  { periodo: '3C', propio: 0, rival: 0 },
  { periodo: '4C', propio: 0, rival: 0 },
]

function emptyPlayer(): EstadisticaJugador {
  return {
    id: crypto.randomUUID(),
    numero: '',
    nombre: '',
    minutos: 0,
    ...emptyStats,
  }
}

function normalizeStats(stats?: EstadisticasPartido | null): EstadisticasPartido {
  return {
    propio: { ...emptyStats, ...(stats?.propio || {}) },
    rival: { ...emptyStats, ...(stats?.rival || {}) },
    periodos: Array.isArray(stats?.periodos) && stats.periodos.length > 0 ? stats.periodos : periodosBase,
    jugadores: Array.isArray(stats?.jugadores) ? stats.jugadores.map((jugador) => ({ ...emptyPlayer(), ...jugador })) : [],
    eventos: Array.isArray(stats?.eventos) ? stats.eventos : [],
  }
}

function applyAction<T extends EstadisticaEquipo>(stats: T, accion: AccionCodigo): T {
  if (accion === '2PM') return { ...stats, t2Convertidos: stats.t2Convertidos + 1, t2Intentados: stats.t2Intentados + 1 }
  if (accion === '2PA') return { ...stats, t2Intentados: stats.t2Intentados + 1 }
  if (accion === '3PM') return { ...stats, t3Convertidos: stats.t3Convertidos + 1, t3Intentados: stats.t3Intentados + 1 }
  if (accion === '3PA') return { ...stats, t3Intentados: stats.t3Intentados + 1 }
  if (accion === 'FTM') return { ...stats, tlConvertidos: stats.tlConvertidos + 1, tlIntentados: stats.tlIntentados + 1 }
  if (accion === 'FTA') return { ...stats, tlIntentados: stats.tlIntentados + 1 }
  if (accion === 'RO') return { ...stats, rebotesOfensivos: stats.rebotesOfensivos + 1 }
  if (accion === 'RD') return { ...stats, rebotesDefensivos: stats.rebotesDefensivos + 1 }
  if (accion === 'AST') return { ...stats, asistencias: stats.asistencias + 1 }
  if (accion === 'TO') return { ...stats, perdidas: stats.perdidas + 1 }
  if (accion === 'STL') return { ...stats, robos: stats.robos + 1 }
  if (accion === 'BLK') return { ...stats, bloqueos: stats.bloqueos + 1 }
  if (accion === 'PF') return { ...stats, faltas: stats.faltas + 1 }
  return stats
}

function puntosEquipo(stats: EstadisticaEquipo) {
  return stats.t2Convertidos * 2 + stats.t3Convertidos * 3 + stats.tlConvertidos
}

function pct(convertidos: number, intentados: number) {
  return intentados ? `${Math.round((convertidos / intentados) * 100)}%` : '0%'
}

function isShotAction(action: AccionCodigo) {
  return action === '2PM' || action === '2PA' || action === '3PM' || action === '3PA'
}

function inferShotAction(location: ShotLocation, result: 'made' | 'missed'): AccionCodigo {
  const attackingLeft = location.x < 50
  const hoopX = attackingLeft ? 5.6 : 94.4
  const dx = location.x - hoopX
  const dy = location.y - 50
  const distance = Math.sqrt(dx * dx + dy * dy)
  const isCornerThree = attackingLeft
    ? location.x > 22 && (location.y < 9 || location.y > 91)
    : location.x < 78 && (location.y < 9 || location.y > 91)
  const isThree = distance > 24.1 || isCornerThree

  if (isThree) return result === 'made' ? '3PM' : '3PA'
  return result === 'made' ? '2PM' : '2PA'
}

function shotLabel(action: AccionCodigo) {
  if (action === '2PM') return '2P anotado'
  if (action === '2PA') return '2P fallado'
  if (action === '3PM') return '3P anotado'
  if (action === '3PA') return '3P fallado'
  return action
}

function oppositeTeam(equipo: 'propio' | 'rival'): 'propio' | 'rival' {
  return equipo === 'propio' ? 'rival' : 'propio'
}

function deriveStats(base: EstadisticasPartido): EstadisticasPartido {
  const result: EstadisticasPartido = {
    propio: { ...emptyStats },
    rival: { ...emptyStats },
    periodos: periodosBase.map((periodo) => ({ ...periodo })),
    jugadores: base.jugadores.map((jugador) => ({ ...emptyPlayer(), id: jugador.id, numero: jugador.numero, nombre: jugador.nombre })),
    eventos: base.eventos || [],
  }

  for (const evento of result.eventos || []) {
    result[evento.equipo] = applyAction(result[evento.equipo], evento.accion)
    const periodoIndex = Math.max(0, Math.min(3, evento.periodo - 1))
    if (evento.accion === '2PM') result.periodos[periodoIndex][evento.equipo] += 2
    if (evento.accion === '3PM') result.periodos[periodoIndex][evento.equipo] += 3
    if (evento.accion === 'FTM') result.periodos[periodoIndex][evento.equipo] += 1

    if (evento.equipo === 'propio' && evento.jugadorId) {
      const playerIndex = result.jugadores.findIndex((jugador) => jugador.id === evento.jugadorId)
      if (playerIndex >= 0) {
        result.jugadores[playerIndex] = applyAction(result.jugadores[playerIndex], evento.accion)
      }
    }
  }

  return result
}

export default function EstadisticasEnVivoPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [partido, setPartido] = useState<PartidoEntrenador | null>(null)
  const [statsDraft, setStatsDraft] = useState<EstadisticasPartido>(normalizeStats())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [periodoActivo, setPeriodoActivo] = useState(1)
  const [accionPendiente, setAccionPendiente] = useState<PendingAction | null>(null)
  const [shotLocation, setShotLocation] = useState<ShotLocation | null>(null)
  const [followUp, setFollowUp] = useState<FollowUp | null>(null)

  useEffect(() => {
    const entrenadorRaw = localStorage.getItem('entrenador')
    if (!entrenadorRaw) {
      router.push('/entrenador/login')
      return
    }

    const fetchPartido = async () => {
      const response = await fetch(`/api/partidos-entrenador/${params.id}`)
      if (!response.ok) {
        toast.error('No se pudo cargar el partido')
        router.push('/entrenador/partidos')
        return
      }
      const data = await response.json()
      const normalized = normalizeStats(data.estadisticas)
      if (normalized.jugadores.length === 0 && data.turno?.deportistas?.length) {
        normalized.jugadores = data.turno.deportistas.map((deportista: any) => ({
          ...emptyPlayer(),
          id: deportista.id,
          numero: deportista.numeroCamiseta || '',
          nombre: `${deportista.nombre} ${deportista.apellidos}`.trim(),
        }))
      }
      setPartido(data)
      setStatsDraft(normalized)
      setLoading(false)
    }

    void fetchPartido()
  }, [params.id, router])

  const stats = useMemo(() => deriveStats(statsDraft), [statsDraft])
  const eventos = statsDraft.eventos || []

  const appendEvento = (evento: EventoEstadistica) => {
    setStatsDraft((current) => ({
      ...current,
      eventos: [...(current.eventos || []), evento],
    }))
  }

  const prepareLinkedAction = (equipo: 'propio' | 'rival', accion: AccionCodigo, label: string) => {
    setFollowUp(null)
    setShotLocation(null)
    setAccionPendiente({ equipo, accion, label })
  }

  const registrarEventoSinJugador = (
    equipo: 'propio' | 'rival',
    accion: AccionCodigo,
    label: string,
    relacionadoConId?: string
  ) => {
    appendEvento({
      id: crypto.randomUUID(),
      equipo,
      periodo: periodoActivo,
      accion,
      label,
      relacionadoConId,
      createdAt: new Date().toISOString(),
    })
    setFollowUp(null)
    setAccionPendiente(null)
    setShotLocation(null)
  }

  const registrarAccion = (jugador?: EstadisticaJugador, rivalNumero?: string) => {
    if (!accionPendiente) {
      toast.error('Primero selecciona la acción')
      return
    }

    const evento: EventoEstadistica = {
      id: crypto.randomUUID(),
      equipo: accionPendiente.equipo,
      jugadorId: accionPendiente.equipo === 'propio' ? jugador?.id : undefined,
      jugadorNombre: accionPendiente.equipo === 'propio'
        ? `${jugador?.numero ? `#${jugador.numero} ` : ''}${jugador?.nombre || 'Jugador'}`
        : `${partido?.rival || 'Rival'}${rivalNumero ? ` #${rivalNumero}` : ''}`,
      periodo: periodoActivo,
      accion: accionPendiente.accion,
      label: accionPendiente.label,
      canchaX: shotLocation?.x,
      canchaY: shotLocation?.y,
      createdAt: new Date().toISOString(),
    }

    appendEvento(evento)
    setAccionPendiente(null)
    setShotLocation(null)

    if (evento.accion === '2PA' || evento.accion === '3PA') {
      setFollowUp({ type: 'missed-shot', eventId: evento.id, equipo: evento.equipo })
    } else if (evento.accion === 'TO') {
      setFollowUp({ type: 'turnover', eventId: evento.id, equipo: evento.equipo })
    } else if (evento.accion === 'PF') {
      setFollowUp({ type: 'foul', eventId: evento.id, equipo: evento.equipo })
    }
  }

  const agregarJugador = () => {
    const jugador = emptyPlayer()
    setStatsDraft((current) => ({
      ...current,
      jugadores: [...current.jugadores, jugador],
    }))
  }

  const updateJugador = (id: string, field: 'numero' | 'nombre', value: string) => {
    setStatsDraft((current) => ({
      ...current,
      jugadores: current.jugadores.map((jugador) => jugador.id === id ? { ...jugador, [field]: value } : jugador),
    }))
  }

  const eliminarJugador = (id: string) => {
    setStatsDraft((current) => ({
      ...current,
      jugadores: current.jugadores.filter((jugador) => jugador.id !== id),
      eventos: (current.eventos || []).filter((evento) => evento.jugadorId !== id),
    }))
    setAccionPendiente(null)
    setShotLocation(null)
    setFollowUp(null)
  }

  const deshacerUltima = () => {
    setStatsDraft((current) => ({
      ...current,
      eventos: (current.eventos || []).slice(0, -1),
    }))
    setAccionPendiente(null)
    setShotLocation(null)
    setFollowUp(null)
  }

  const seleccionarAccion = (equipo: 'propio' | 'rival', accion: AccionCodigo, label: string) => {
    if (!shotLocation) {
      toast.error('Primero marca en la cancha dónde ocurrió la acción')
      return
    }
    setAccionPendiente({ equipo, accion, label })
  }

  const seleccionarTiro = (equipo: 'propio' | 'rival', result: 'made' | 'missed', label: string) => {
    if (!shotLocation) {
      toast.error('Primero marca en la cancha desde dónde se tomó el tiro')
      return
    }
    const accion = inferShotAction(shotLocation, result)
    setAccionPendiente({
      equipo,
      accion,
      label: shotLabel(accion),
    })
  }

  const handleCourtClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setShotLocation({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    })
    setAccionPendiente(null)
    setFollowUp(null)
  }

  const updateFoulType = (eventId: string, detalle: string, tirosLibresGenerados = 0) => {
    setStatsDraft((current) => ({
      ...current,
      eventos: (current.eventos || []).map((evento) =>
        evento.id === eventId
          ? {
              ...evento,
              label: `Falta - ${detalle}`,
              detalle,
              tirosLibresGenerados,
            }
          : evento
      ),
    }))
    setFollowUp(null)
  }

  const rivalNumbers = Array.from({ length: 15 }, (_, index) => String(index + 1))

  const ownLocationEvents = eventos.filter((evento) => evento.equipo === 'propio' && evento.canchaX !== undefined && evento.canchaY !== undefined)
  const rivalLocationEvents = eventos.filter((evento) => evento.equipo === 'rival' && evento.canchaX !== undefined && evento.canchaY !== undefined)
  const resumenVivo = [
    { label: '2P', propio: `${stats.propio.t2Convertidos}/${stats.propio.t2Intentados}`, rival: `${stats.rival.t2Convertidos}/${stats.rival.t2Intentados}` },
    { label: '3P', propio: `${stats.propio.t3Convertidos}/${stats.propio.t3Intentados}`, rival: `${stats.rival.t3Convertidos}/${stats.rival.t3Intentados}` },
    { label: 'TL', propio: `${stats.propio.tlConvertidos}/${stats.propio.tlIntentados}`, rival: `${stats.rival.tlConvertidos}/${stats.rival.tlIntentados}` },
    { label: 'REB', propio: stats.propio.rebotesOfensivos + stats.propio.rebotesDefensivos, rival: stats.rival.rebotesOfensivos + stats.rival.rebotesDefensivos },
    { label: 'AST', propio: stats.propio.asistencias, rival: stats.rival.asistencias },
    { label: 'PER', propio: stats.propio.perdidas, rival: stats.rival.perdidas },
    { label: 'ROB', propio: stats.propio.robos, rival: stats.rival.robos },
    { label: 'F', propio: stats.propio.faltas, rival: stats.rival.faltas },
  ]

  const guardar = async (estado?: string) => {
    if (!partido) return

    const finalStats = deriveStats(statsDraft)
    try {
      setSaving(true)
      const response = await fetch(`/api/partidos-entrenador/${partido.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...partido,
          fechaPartido: partido.fechaPartido.split('T')[0],
          estado: estado || partido.estado,
          resultadoPropio: puntosEquipo(finalStats.propio),
          resultadoRival: puntosEquipo(finalStats.rival),
          estadisticas: finalStats,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo guardar')
      }

      const updated = await response.json()
      setPartido(updated)
      setStatsDraft(normalizeStats(updated.estadisticas))
      toast.success(estado === 'jugado' ? 'Partido finalizado' : 'Estadísticas guardadas')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !partido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/entrenador/partidos" className="mb-2 inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a partidos
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Estadísticas en vivo</h1>
              <p className="mt-1 text-sm text-gray-600">{partido.titulo}</p>
            </div>
            <div className="rounded-lg bg-slate-900 px-5 py-3 text-center text-white">
              <p className="text-xs uppercase tracking-wide text-slate-300">Marcador</p>
              <p className="text-3xl font-bold">{puntosEquipo(stats.propio)} - {puntosEquipo(stats.rival)}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[300px_minmax(420px,1fr)_300px] lg:px-8">
        <section className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Periodo activo</p>
              <p className="mt-1 text-sm text-gray-600">
                Marca la ubicación en cancha, elige la acción y luego selecciona jugador o número.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((periodo) => (
                <button
                  key={periodo}
                  type="button"
                  onClick={() => setPeriodoActivo(periodo)}
                  className={`rounded-lg border px-5 py-3 text-sm font-semibold ${periodoActivo === periodo ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {periodo}C
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">Nosotros</p>
                <p className="text-sm text-gray-600">{puntosEquipo(stats.propio)} puntos · turno {partido.turno?.nombre || 'sin turno'}</p>
              </div>
              <button type="button" onClick={agregarJugador} className="inline-flex h-9 w-9 items-center justify-center rounded border border-primary-200 text-primary-700 hover:bg-primary-50" aria-label="Agregar jugador">
                <UserPlus className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-2 gap-2">
              {accionesTiro.map((accion) => (
                <button
                  key={accion.result}
                  type="button"
                  onClick={() => seleccionarTiro('propio', accion.result, accion.label)}
                  className={`min-h-[58px] rounded-lg px-3 py-2 text-sm font-bold text-white ${accion.tone} ${accionPendiente?.equipo === 'propio' && accionPendiente.accion === inferShotAction(shotLocation || { x: 50, y: 50 }, accion.result) && isShotAction(accionPendiente.accion) ? 'ring-4 ring-primary-200' : ''}`}
                >
                  {accion.label}
                </button>
              ))}
            </div>
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {accionesLibres.map((accion) => (
                <button
                  key={accion.code}
                  type="button"
                  onClick={() => seleccionarAccion('propio', accion.code, accion.label)}
                  className={`min-h-[48px] rounded-lg px-3 py-2 text-sm font-bold text-white ${accion.tone} ${accionPendiente?.equipo === 'propio' && accionPendiente.accion === accion.code ? 'ring-4 ring-primary-200' : ''}`}
                >
                  {accion.label}
                </button>
              ))}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-900">
                {accionPendiente?.equipo === 'propio' ? `Selecciona jugador para ${accionPendiente.label}` : 'Jugadores'}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {statsDraft.jugadores.map((jugador) => (
                  <div key={jugador.id} className="rounded-lg border border-gray-200 bg-slate-50 p-2">
                    <button
                      type="button"
                      onClick={() => registrarAccion(jugador)}
                      disabled={accionPendiente?.equipo !== 'propio'}
                      className="mb-2 flex min-h-[46px] w-full items-center gap-2 rounded bg-white px-2 py-2 text-left text-sm font-semibold text-gray-900 enabled:hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-900 text-base text-white">
                        {jugador.numero || '-'}
                      </span>
                      <span className="min-w-0 truncate text-xs">{jugador.nombre || 'Jugador sin nombre'}</span>
                    </button>
                    <div className="grid grid-cols-[52px_1fr_32px] gap-1">
                      <input value={jugador.numero} onChange={(event) => updateJugador(jugador.id, 'numero', event.target.value)} className="rounded border border-gray-200 px-2 py-1 text-xs" placeholder="#" />
                      <input value={jugador.nombre} onChange={(event) => updateJugador(jugador.id, 'nombre', event.target.value)} className="rounded border border-gray-200 px-2 py-1 text-xs" placeholder="Nombre" />
                      <button type="button" onClick={() => eliminarJugador(jugador.id)} className="inline-flex items-center justify-center rounded border border-red-200 text-red-700 hover:bg-red-50" aria-label="Eliminar jugador">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {statsDraft.jugadores.length === 0 && (
                  <button type="button" onClick={agregarJugador} className="rounded-lg border border-dashed border-gray-300 px-3 py-8 text-sm text-gray-600 hover:bg-gray-50 sm:col-span-2">
                    No hay jugadores cargados del turno. Agregar jugador manualmente.
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-900">Resumen por periodos</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="border border-slate-300 px-3 py-2 text-left">Equipo</th>
                    {stats.periodos.map((periodo) => <th key={periodo.periodo} className="border border-slate-300 px-3 py-2">{periodo.periodo}</th>)}
                    <th className="border border-slate-300 px-3 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(['propio', 'rival'] as const).map((equipo) => (
                    <tr key={equipo}>
                      <td className="border border-slate-200 px-3 py-2 font-semibold">{equipo === 'propio' ? 'Nosotros' : partido.rival}</td>
                      {stats.periodos.map((periodo) => <td key={periodo.periodo} className="border border-slate-200 px-3 py-2 text-center">{periodo[equipo]}</td>)}
                      <td className="border border-slate-200 px-3 py-2 text-center font-semibold">{puntosEquipo(stats[equipo])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Cancha</p>
                <p className="text-xs text-gray-600">
                  {shotLocation
                    ? accionPendiente
                      ? `Ubicación y acción listas. Ahora selecciona ${accionPendiente.equipo === 'propio' ? 'jugador' : 'número rival'}.`
                      : 'Ubicación marcada. Ahora selecciona la acción.'
                    : 'Marca primero dónde ocurrió la acción.'}
                </p>
              </div>
              {shotLocation && (
                <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
                  Ubicación lista
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleCourtClick}
              className="relative block aspect-[94/50] w-full overflow-hidden rounded border border-slate-300 bg-[#c79052]"
              aria-label="Cancha para marcar ubicación de acción"
            >
              <svg viewBox="0 0 940 500" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <defs>
                  <pattern id="court-wood" width="72" height="500" patternUnits="userSpaceOnUse">
                    <rect width="72" height="500" fill="#c79052" />
                    <rect x="0" width="36" height="500" fill="#d4a266" opacity=".55" />
                    <path d="M0 0V500M72 0V500" stroke="#b2763e" strokeWidth="2" opacity=".28" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="940" height="500" fill="url(#court-wood)" />
                <rect x="18" y="18" width="904" height="464" fill="none" stroke="white" strokeWidth="5" />
                <line x1="470" y1="18" x2="470" y2="482" stroke="white" strokeWidth="5" />
                <circle cx="470" cy="250" r="60" fill="none" stroke="white" strokeWidth="5" />
                <circle cx="470" cy="250" r="10" fill="white" opacity=".7" />

                <rect x="18" y="170" width="150" height="160" fill="none" stroke="white" strokeWidth="5" />
                <rect x="772" y="170" width="150" height="160" fill="none" stroke="white" strokeWidth="5" />
                <line x1="168" y1="170" x2="168" y2="330" stroke="white" strokeWidth="5" />
                <line x1="772" y1="170" x2="772" y2="330" stroke="white" strokeWidth="5" />
                <path d="M168 170a80 80 0 0 1 0 160" fill="none" stroke="white" strokeWidth="5" />
                <path d="M772 170a80 80 0 0 0 0 160" fill="none" stroke="white" strokeWidth="5" />
                <path d="M168 170a80 80 0 0 0 0 160" fill="none" stroke="white" strokeWidth="3" strokeDasharray="8 8" opacity=".8" />
                <path d="M772 170a80 80 0 0 1 0 160" fill="none" stroke="white" strokeWidth="3" strokeDasharray="8 8" opacity=".8" />

                <line x1="18" y1="45" x2="224" y2="45" stroke="white" strokeWidth="5" />
                <line x1="18" y1="455" x2="224" y2="455" stroke="white" strokeWidth="5" />
                <path d="M224 45a227 227 0 0 1 0 410" fill="none" stroke="white" strokeWidth="5" />
                <line x1="922" y1="45" x2="716" y2="45" stroke="white" strokeWidth="5" />
                <line x1="922" y1="455" x2="716" y2="455" stroke="white" strokeWidth="5" />
                <path d="M716 45a227 227 0 0 0 0 410" fill="none" stroke="white" strokeWidth="5" />

                <line x1="48" y1="218" x2="48" y2="282" stroke="white" strokeWidth="5" />
                <line x1="892" y1="218" x2="892" y2="282" stroke="white" strokeWidth="5" />
                <circle cx="56" cy="250" r="17" fill="none" stroke="white" strokeWidth="5" />
                <circle cx="884" cy="250" r="17" fill="none" stroke="white" strokeWidth="5" />
                <line x1="18" y1="250" x2="38" y2="250" stroke="white" strokeWidth="5" />
                <line x1="922" y1="250" x2="902" y2="250" stroke="white" strokeWidth="5" />
                <text x="258" y="42" fill="white" fontSize="24" fontWeight="700">3PT</text>
                <text x="642" y="42" fill="white" fontSize="24" fontWeight="700">3PT</text>
              </svg>

              {ownLocationEvents.map((evento) => (
                <span
                  key={evento.id}
                  className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white ${isShotAction(evento.accion) ? evento.accion === '2PM' || evento.accion === '3PM' ? 'bg-primary-700' : 'bg-white' : 'bg-cyan-500'}`}
                  style={{ left: `${evento.canchaX}%`, top: `${evento.canchaY}%` }}
                />
              ))}
              {rivalLocationEvents.map((evento) => (
                <span
                  key={evento.id}
                  className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white ${isShotAction(evento.accion) ? evento.accion === '2PM' || evento.accion === '3PM' ? 'bg-red-700' : 'bg-red-100' : 'bg-amber-500'}`}
                  style={{ left: `${evento.canchaX}%`, top: `${evento.canchaY}%` }}
                />
              ))}
              {shotLocation && (
                <span
                  className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900 bg-yellow-300 shadow"
                  style={{ left: `${shotLocation.x}%`, top: `${shotLocation.y}%` }}
                />
              )}
            </button>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-700">
              <div className="rounded bg-slate-50 px-2 py-1"><span className="font-semibold text-primary-700">Azul</span> nosotros</div>
              <div className="rounded bg-slate-50 px-2 py-1"><span className="font-semibold text-red-700">Rojo</span> rival</div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-900">Estadísticas en vivo</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {resumenVivo.map((item) => (
                <div key={item.label} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <p className="font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-1 text-slate-900">Nosotros: {item.propio}</p>
                  <p className="text-slate-700">Rival: {item.rival}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-900">Resumen de acciones</p>
            <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
              {eventos.slice().reverse().map((evento) => (
                <div key={evento.id} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <p className="font-semibold text-gray-900">{evento.label}</p>
                  <p className="text-xs text-gray-600">{evento.jugadorNombre || (evento.equipo === 'propio' ? 'Nosotros' : partido.rival)} · {evento.periodo}C</p>
                </div>
              ))}
              {eventos.length === 0 && <p className="py-8 text-center text-sm text-gray-500">Sin acciones registradas.</p>}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-lg font-bold text-gray-900">{partido.rival}</p>
              <p className="text-sm text-gray-600">{puntosEquipo(stats.rival)} puntos</p>
            </div>

            <div className="mb-2 grid grid-cols-2 gap-2">
              {accionesTiro.map((accion) => (
                <button
                  key={accion.result}
                  type="button"
                  onClick={() => seleccionarTiro('rival', accion.result, accion.label)}
                  className={`min-h-[58px] rounded-lg px-3 py-2 text-sm font-bold text-white ${accion.tone} ${accionPendiente?.equipo === 'rival' && accionPendiente.accion === inferShotAction(shotLocation || { x: 50, y: 50 }, accion.result) && isShotAction(accionPendiente.accion) ? 'ring-4 ring-primary-200' : ''}`}
                >
                  {accion.label}
                </button>
              ))}
            </div>
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {accionesLibres.map((accion) => (
                <button
                  key={accion.code}
                  type="button"
                  onClick={() => seleccionarAccion('rival', accion.code, accion.label)}
                  className={`min-h-[48px] rounded-lg px-3 py-2 text-sm font-bold text-white ${accion.tone} ${accionPendiente?.equipo === 'rival' && accionPendiente.accion === accion.code ? 'ring-4 ring-primary-200' : ''}`}
                >
                  {accion.label}
                </button>
              ))}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-900">
                {accionPendiente?.equipo === 'rival' ? `Selecciona número para ${accionPendiente.label}` : 'Números rival'}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {rivalNumbers.map((numero) => (
                  <button
                    key={numero}
                    type="button"
                    onClick={() => registrarAccion(undefined, numero)}
                    disabled={accionPendiente?.equipo !== 'rival'}
                    className="min-h-[48px] rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-900 enabled:hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    #{numero}
                  </button>
                ))}
              </div>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = event.currentTarget
                  const input = form.elements.namedItem('rivalNumero') as HTMLInputElement
                  if (!input.value.trim()) return
                  registrarAccion(undefined, input.value.trim())
                  input.value = ''
                }}
              >
                <input name="rivalNumero" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Otro número" />
                <Button type="submit" size="sm" disabled={accionPendiente?.equipo !== 'rival'}>Aplicar</Button>
              </form>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-gray-900">Planilla de nuestro equipo</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="border border-slate-300 px-2 py-2 text-left">Jugador</th>
                    <th className="border border-slate-300 px-2 py-2">PTS</th>
                    <th className="border border-slate-300 px-2 py-2">2P</th>
                    <th className="border border-slate-300 px-2 py-2">3P</th>
                    <th className="border border-slate-300 px-2 py-2">TL</th>
                    <th className="border border-slate-300 px-2 py-2">RO</th>
                    <th className="border border-slate-300 px-2 py-2">RD</th>
                    <th className="border border-slate-300 px-2 py-2">AST</th>
                    <th className="border border-slate-300 px-2 py-2">PER</th>
                    <th className="border border-slate-300 px-2 py-2">ROB</th>
                    <th className="border border-slate-300 px-2 py-2">BLK</th>
                    <th className="border border-slate-300 px-2 py-2">F</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.jugadores.map((jugador) => (
                    <tr key={jugador.id}>
                      <td className="border border-slate-200 px-2 py-2 font-semibold">#{jugador.numero} {jugador.nombre}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center font-semibold">{puntosEquipo(jugador)}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{jugador.t2Convertidos}/{jugador.t2Intentados}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{jugador.t3Convertidos}/{jugador.t3Intentados}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{jugador.tlConvertidos}/{jugador.tlIntentados}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{jugador.rebotesOfensivos}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{jugador.rebotesDefensivos}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{jugador.asistencias}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{jugador.perdidas}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{jugador.robos}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{jugador.bloqueos}</td>
                      <td className="border border-slate-200 px-2 py-2 text-center">{jugador.faltas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="space-y-4 lg:col-span-3">
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={deshacerUltima} disabled={eventos.length === 0}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Deshacer última acción
              </Button>
              {accionPendiente && (
                <button
                  type="button"
                  onClick={() => setAccionPendiente(null)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar {accionPendiente.label}
                </button>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="space-y-2">
              <Button className="w-full" onClick={() => void guardar()} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar avance'}
              </Button>
              <Button className="w-full" variant="secondary" onClick={() => void guardar('jugado')} disabled={saving}>
                Finalizar partido
              </Button>
            </div>
          </section>
        </aside>
      </main>

      {followUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            {followUp.type === 'missed-shot' && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Después del tiro fallado</h2>
                <p className="mt-1 text-sm text-gray-600">Registra cómo terminó la posesión.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => prepareLinkedAction(followUp.equipo, 'RO', 'Reb. ofensivo')}
                    className="rounded-lg bg-blue-700 px-3 py-3 text-sm font-bold text-white hover:bg-blue-800"
                  >
                    Rebote ofensivo
                  </button>
                  <button
                    type="button"
                    onClick={() => prepareLinkedAction(oppositeTeam(followUp.equipo), 'RD', 'Reb. defensivo')}
                    className="rounded-lg bg-blue-700 px-3 py-3 text-sm font-bold text-white hover:bg-blue-800"
                  >
                    Rebote defensivo
                  </button>
                  <button
                    type="button"
                    onClick={() => registrarEventoSinJugador(oppositeTeam(followUp.equipo), 'OUT', 'Balón fuera', followUp.eventId)}
                    className="rounded-lg bg-slate-700 px-3 py-3 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Fuera
                  </button>
                </div>
              </>
            )}

            {followUp.type === 'turnover' && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Detalle de la pérdida</h2>
                <p className="mt-1 text-sm text-gray-600">Indica si hubo recupero para asignar el robo.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => prepareLinkedAction(oppositeTeam(followUp.equipo), 'STL', 'Robo')}
                    className="rounded-lg bg-indigo-700 px-3 py-3 text-sm font-bold text-white hover:bg-indigo-800"
                  >
                    Con recupero
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowUp(null)}
                    className="rounded-lg bg-slate-700 px-3 py-3 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Sin recupero
                  </button>
                </div>
              </>
            )}

            {followUp.type === 'foul' && (
              <>
                <h2 className="text-lg font-bold text-gray-900">Tipo de falta</h2>
                <p className="mt-1 text-sm text-gray-600">Clasifica la falta para el análisis y tiros libres.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => updateFoulType(followUp.eventId, 'Normal')} className="rounded-lg bg-slate-700 px-3 py-3 text-sm font-bold text-white hover:bg-slate-800">
                    Normal
                  </button>
                  <button type="button" onClick={() => updateFoulType(followUp.eventId, 'De lanzamiento', 2)} className="rounded-lg bg-red-700 px-3 py-3 text-sm font-bold text-white hover:bg-red-800">
                    Lanzamiento 2TL
                  </button>
                  <button type="button" onClick={() => updateFoulType(followUp.eventId, 'De lanzamiento triple', 3)} className="rounded-lg bg-red-700 px-3 py-3 text-sm font-bold text-white hover:bg-red-800">
                    Lanzamiento 3TL
                  </button>
                  <button type="button" onClick={() => updateFoulType(followUp.eventId, 'Técnica', 1)} className="rounded-lg bg-amber-700 px-3 py-3 text-sm font-bold text-white hover:bg-amber-800">
                    Técnica
                  </button>
                  <button type="button" onClick={() => updateFoulType(followUp.eventId, 'Antideportiva', 2)} className="rounded-lg bg-purple-700 px-3 py-3 text-sm font-bold text-white hover:bg-purple-800 sm:col-span-2">
                    Antideportiva
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setFollowUp(null)}
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Omitir por ahora
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
