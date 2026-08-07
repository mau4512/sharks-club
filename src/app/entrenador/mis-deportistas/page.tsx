'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpDown,
  CircleDollarSign,
  Eye,
  Filter,
  Loader2,
  Plus,
  Search,
  User,
  UserCheck,
  UserX,
} from 'lucide-react'
import { toast } from 'sonner'
import { confirmDialog } from '@/components/ui/confirm-dialog'

type Turno = {
  id: string
  nombre?: string | null
  hora?: string | null
  entrenadorId?: string | null
}

type DeudaStatus = {
  tieneDeuda: boolean
  etiquetas: string[]
}

type Deportista = {
  id: string
  nombre: string
  apellidos: string
  email?: string | null
  celular?: string | null
  telefonoApoderado?: string | null
  turnoId?: string | null
  createdAt?: string | null
  becado?: boolean
  activo: boolean
  turno?: Turno
  deudaStatus?: DeudaStatus
}

type Orden = 'recientes' | 'antiguos' | 'apellidos' | 'nombres'
type EstadoFiltro = 'todos' | 'activos' | 'inactivos'

const normalizarTexto = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')

const compararTexto = (a: string, b: string) =>
  a.localeCompare(b, 'es', { sensitivity: 'base' })

const obtenerFecha = (fecha?: string | null) => {
  if (!fecha) return 0
  const timestamp = new Date(fecha).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return 'Sin fecha'
  const fechaRegistro = new Date(fecha)
  if (Number.isNaN(fechaRegistro.getTime())) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(fechaRegistro)
}

export default function MisDeportistasPage() {
  const router = useRouter()
  const [deportistas, setDeportistas] = useState<Deportista[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<Orden>('recientes')
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('todos')
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoFiltro>('todos')
  const [actualizandoId, setActualizandoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const entrenadorData = localStorage.getItem('entrenador')
    if (!entrenadorData) {
      router.push('/entrenador/login')
      return
    }

    const entrenador = JSON.parse(entrenadorData)
    fetchDeportistas(entrenador.id)
  }, [router])

  const fetchDeportistas = async (entrenadorId: string) => {
    try {
      const [turnosRes, deportistasRes] = await Promise.all([
        fetch('/api/turnos'),
        fetch('/api/deportistas'),
      ])

      if (turnosRes.ok && deportistasRes.ok) {
        const allTurnos: Turno[] = await turnosRes.json()
        const allDeportistas: Deportista[] = await deportistasRes.json()
        const misTurnos = allTurnos.filter((turno) => turno.entrenadorId === entrenadorId)
        const turnoIds = new Set(misTurnos.map((turno) => turno.id))

        setTurnos(misTurnos)
        setDeportistas(
          allDeportistas
            .filter((deportista) => deportista.turnoId && turnoIds.has(deportista.turnoId))
            .map((deportista) => ({
              ...deportista,
              turno: misTurnos.find((turno) => turno.id === deportista.turnoId),
            }))
        )
      }
    } catch (error) {
      console.error('Error al cargar deportistas:', error)
    } finally {
      setLoading(false)
    }
  }

  const deportistasVisibles = useMemo(() => {
    const termino = normalizarTexto(busqueda.trim())
    const resultado = deportistas.filter((deportista) => {
      const coincideBusqueda = !termino || normalizarTexto(`${deportista.nombre} ${deportista.apellidos}`).includes(termino)
      const coincideTurno = turnoSeleccionado === 'todos' || deportista.turnoId === turnoSeleccionado
      const coincideEstado = estadoSeleccionado === 'todos'
        || (estadoSeleccionado === 'activos' ? deportista.activo : !deportista.activo)

      return coincideBusqueda && coincideTurno && coincideEstado
    })

    return [...resultado].sort((a, b) => {
      if (orden === 'antiguos') return obtenerFecha(a.createdAt) - obtenerFecha(b.createdAt)
      if (orden === 'apellidos') return compararTexto(a.apellidos, b.apellidos)
      if (orden === 'nombres') return compararTexto(a.nombre, b.nombre)
      return obtenerFecha(b.createdAt) - obtenerFecha(a.createdAt)
    })
  }, [busqueda, deportistas, estadoSeleccionado, orden, turnoSeleccionado])

  const cambiarEstado = async (deportista: Deportista) => {
    const nuevoEstado = !deportista.activo
    const confirmed = await confirmDialog({
      title: nuevoEstado ? 'Reactivar deportista' : 'Desactivar deportista',
      description: nuevoEstado
        ? `${deportista.nombre} volverá a aparecer en las listas de asistencia.`
        : `${deportista.nombre} dejará de aparecer en las listas de asistencia hasta que se reactive.`,
      confirmText: nuevoEstado ? 'Reactivar' : 'Desactivar',
      variant: nuevoEstado ? 'primary' : 'danger',
    })

    if (!confirmed) return

    try {
      setActualizandoId(deportista.id)
      const response = await fetch(`/api/deportistas/${deportista.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado }),
      })

      if (!response.ok) throw new Error('No se pudo actualizar el deportista')

      setDeportistas((actuales) =>
        actuales.map((actual) => actual.id === deportista.id ? { ...actual, activo: nuevoEstado } : actual)
      )
      toast.success(nuevoEstado ? 'Deportista reactivado' : 'Deportista desactivado')
    } catch (error) {
      console.error('Error al actualizar el estado del deportista:', error)
      toast.error('No se pudo actualizar el estado del deportista')
    } finally {
      setActualizandoId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/entrenador" className="mb-2 inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Deportistas</h1>
              <p className="mt-1 text-gray-600">{deportistas.length} deportistas a tu cargo</p>
            </div>
            <Link
              href="/entrenador/mis-deportistas/nuevo"
              className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Deportista
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {deportistas.length === 0 ? (
          <div className="border-y border-gray-200 bg-white py-12 text-center">
            <User className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600">No tienes deportistas asignados aún</p>
            <Link
              href="/entrenador/mis-deportistas/nuevo"
              className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar primer deportista
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_auto_auto_auto]">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por nombres o apellidos"
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 shrink-0 text-gray-500" />
                <select
                  value={turnoSeleccionado}
                  onChange={(event) => setTurnoSeleccionado(event.target.value)}
                  aria-label="Filtrar por grupo"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 xl:w-auto"
                >
                  <option value="todos">Todos los grupos</option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nombre || 'Grupo sin nombre'}{turno.hora ? ` - ${turno.hora}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={estadoSeleccionado}
                onChange={(event) => setEstadoSeleccionado(event.target.value as EstadoFiltro)}
                aria-label="Filtrar por estado"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 xl:w-auto"
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Solo activos</option>
                <option value="inactivos">Solo inactivos</option>
              </select>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 shrink-0 text-gray-500" />
                <select
                  value={orden}
                  onChange={(event) => setOrden(event.target.value as Orden)}
                  aria-label="Ordenar deportistas"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 sm:w-auto"
                >
                  <option value="recientes">Agregados recientemente</option>
                  <option value="antiguos">Agregados anteriormente</option>
                  <option value="apellidos">Apellidos A-Z</option>
                  <option value="nombres">Nombres A-Z</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border-y border-gray-200 bg-white">
              <table className="w-full min-w-[1040px] table-fixed text-left">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                  <tr>
                    <th className="w-[22%] px-4 py-3">Deportista</th>
                    <th className="w-[17%] px-4 py-3">Contacto</th>
                    <th className="w-[17%] px-4 py-3">Grupo</th>
                    <th className="w-[18%] px-4 py-3">Estado financiero</th>
                    <th className="w-[13%] px-4 py-3">Registro</th>
                    <th className="w-[13%] px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deportistasVisibles.map((deportista) => (
                    <tr key={deportista.id} className={deportista.activo ? 'hover:bg-gray-50' : 'bg-gray-50/70 text-gray-500'}>
                      <td className="px-4 py-3">
                        <p className={`font-semibold ${
                          deportista.activo
                            ? deportista.deudaStatus?.tieneDeuda ? 'text-red-700' : 'text-green-700'
                            : 'text-gray-500'
                        }`}>
                          {deportista.apellidos}, {deportista.nombre}
                        </p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          deportista.activo ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {deportista.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <p className="truncate">{deportista.email || 'Email pendiente'}</p>
                        <p>{deportista.celular || deportista.telefonoApoderado || 'Teléfono pendiente'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <p className="font-medium text-gray-800">{deportista.turno?.nombre || 'Sin turno'}</p>
                        <p>{deportista.turno?.hora || 'Horario pendiente'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {deportista.becado ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700">
                            <CircleDollarSign className="h-3.5 w-3.5" /> Becado
                          </span>
                        ) : deportista.deudaStatus?.tieneDeuda ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-700">
                              <CircleDollarSign className="h-3.5 w-3.5" /> Debe
                            </span>
                            <p className="mt-1 line-clamp-2 text-xs text-red-700" title={deportista.deudaStatus.etiquetas.join(' · ')}>
                              {deportista.deudaStatus.etiquetas.join(' · ')}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-700">
                            <CircleDollarSign className="h-3.5 w-3.5" /> Al día
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatearFecha(deportista.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/entrenador/deportistas/${deportista.id}`}
                            title="Ver perfil y progreso"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary-700 hover:bg-primary-50"
                          >
                            <Eye className="h-5 w-5" />
                            <span className="sr-only">Ver perfil de {deportista.nombre} {deportista.apellidos}</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => cambiarEstado(deportista)}
                            disabled={actualizandoId === deportista.id}
                            title={deportista.activo ? 'Desactivar deportista' : 'Reactivar deportista'}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-md disabled:cursor-wait disabled:opacity-50 ${
                              deportista.activo
                                ? 'text-red-700 hover:bg-red-50'
                                : 'text-green-700 hover:bg-green-50'
                            }`}
                          >
                            {actualizandoId === deportista.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : deportista.activo ? (
                              <UserX className="h-5 w-5" />
                            ) : (
                              <UserCheck className="h-5 w-5" />
                            )}
                            <span className="sr-only">
                              {deportista.activo ? 'Desactivar' : 'Reactivar'} a {deportista.nombre} {deportista.apellidos}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {deportistasVisibles.length === 0 && (
              <div className="border-b border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-600">
                No se encontraron deportistas para “{busqueda}”.
              </div>
            )}
            <p className="mt-3 text-sm text-gray-500">
              Mostrando {deportistasVisibles.length} de {deportistas.length} deportistas
            </p>
          </>
        )}
      </main>
    </div>
  )
}
