'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { BookOpen, Filter, Search } from 'lucide-react'
import { toast } from 'sonner'
import { confirmDialog } from '@/components/ui/confirm-dialog'

interface Ejercicio {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string
  subcategoria: string | null
  objetivos: string | null
  materiales: string[]
  duracion: number | null
  intensidad: string | null
  nivel: string | null
  series: number | null
  repeticiones: string | null
  descanso: string | null
  instrucciones: string | null
  videoUrl: string | null
  imagenUrl: string | null
  consejos: string[]
  variantes: string[]
  esPublico: boolean
  creadoPor: {
    id: string
    nombre: string
    apellidos: string
  }
  createdAt: string
}

interface EntrenadorOption {
  id: string
  nombre: string
  apellidos: string
}

const CATEGORIAS = [
  'Tiro',
  'Defensa',
  'Físico',
  'Técnico',
  'Táctico',
  'Bote',
  'Pase',
  'Rebote',
  'Movilidad',
  'Condicional',
]

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado']
const INTENSIDADES = ['Baja', 'Media', 'Alta']

export default function BibliotecaEjerciciosPage() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [entrenadores, setEntrenadores] = useState<EntrenadorOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEjercicio, setEditingEjercicio] = useState<Ejercicio | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('')
  const [filtroEntrenador, setFiltroEntrenador] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [userId, setUserId] = useState('')
  const [isEntrenadorSession, setIsEntrenadorSession] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    subcategoria: '',
    objetivos: '',
    materiales: '',
    duracion: '',
    intensidad: '',
    nivel: '',
    series: '',
    repeticiones: '',
    descanso: '',
    instrucciones: '',
    videoUrl: '',
    imagenUrl: '',
    consejos: '',
    variantes: '',
    esPublico: true,
  })

  useEffect(() => {
    const entrenadorRaw = localStorage.getItem('entrenador')
    if (entrenadorRaw) {
      const entrenador = JSON.parse(entrenadorRaw)
      setUserId(entrenador.id)
      setIsEntrenadorSession(true)
      return
    }

    const adminRaw = localStorage.getItem('admin')
    if (adminRaw) {
      setIsEntrenadorSession(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [filtroCategoria, filtroNivel, filtroEntrenador])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      let url = '/api/ejercicios-biblioteca?'
      if (filtroCategoria) url += `categoria=${encodeURIComponent(filtroCategoria)}&`
      if (filtroNivel) url += `nivel=${encodeURIComponent(filtroNivel)}&`
      if (filtroEntrenador) url += `entrenadorId=${encodeURIComponent(filtroEntrenador)}&`

      const [ejerciciosRes, entrenadoresRes] = await Promise.all([
        fetch(url),
        fetch('/api/entrenadores'),
      ])

      const ejerciciosData = await ejerciciosRes.json()
      const entrenadoresData = await entrenadoresRes.json()

      setEjercicios(Array.isArray(ejerciciosData) ? ejerciciosData : [])
      setEntrenadores(
        Array.isArray(entrenadoresData)
          ? entrenadoresData.filter((entrenador: any) => entrenador.activo)
          : []
      )
    } catch (error) {
      console.error('Error al cargar ejercicios:', error)
      setEjercicios([])
      setEntrenadores([])
    } finally {
      setLoading(false)
    }
  }

  const ejerciciosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return ejercicios

    return ejercicios.filter((ejercicio) => {
      const creador = `${ejercicio.creadoPor.nombre} ${ejercicio.creadoPor.apellidos}`.toLowerCase()
      return (
        ejercicio.nombre.toLowerCase().includes(term) ||
        (ejercicio.descripcion || '').toLowerCase().includes(term) ||
        ejercicio.categoria.toLowerCase().includes(term) ||
        creador.includes(term)
      )
    })
  }, [ejercicios, busqueda])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast.error('No se pudo identificar al entrenador creador.')
      return
    }

    try {
      const payload = {
        ...formData,
        materiales: formData.materiales.split(',').map((m) => m.trim()).filter(Boolean),
        consejos: formData.consejos.split(',').map((c) => c.trim()).filter(Boolean),
        variantes: formData.variantes.split(',').map((v) => v.trim()).filter(Boolean),
        creadoPorId: userId,
        duracion: formData.duracion ? parseInt(formData.duracion) : null,
        series: formData.series ? parseInt(formData.series) : null,
      }

      const url = editingEjercicio
        ? `/api/ejercicios-biblioteca/${editingEjercicio.id}`
        : '/api/ejercicios-biblioteca'

      const method = editingEjercicio ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo guardar el ejercicio')
      }

      resetForm()
      await cargarDatos()
    } catch (error: any) {
      console.error('Error al guardar ejercicio:', error)
      toast.error(error.message || 'Error al guardar el ejercicio')
    }
  }

  const handleEdit = (ejercicio: Ejercicio) => {
    setEditingEjercicio(ejercicio)
    setFormData({
      nombre: ejercicio.nombre,
      descripcion: ejercicio.descripcion || '',
      categoria: ejercicio.categoria,
      subcategoria: ejercicio.subcategoria || '',
      objetivos: ejercicio.objetivos || '',
      materiales: ejercicio.materiales.join(', '),
      duracion: ejercicio.duracion?.toString() || '',
      intensidad: ejercicio.intensidad || '',
      nivel: ejercicio.nivel || '',
      series: ejercicio.series?.toString() || '',
      repeticiones: ejercicio.repeticiones || '',
      descanso: ejercicio.descanso || '',
      instrucciones: ejercicio.instrucciones || '',
      videoUrl: ejercicio.videoUrl || '',
      imagenUrl: ejercicio.imagenUrl || '',
      consejos: ejercicio.consejos.join(', '),
      variantes: ejercicio.variantes.join(', '),
      esPublico: ejercicio.esPublico,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar ejercicio',
      description: '¿Estás seguro de eliminar este ejercicio?',
      confirmText: 'Eliminar',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/ejercicios-biblioteca/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'No se pudo eliminar el ejercicio')
      }

      await cargarDatos()
    } catch (error: any) {
      console.error('Error al eliminar ejercicio:', error)
      toast.error(error.message || 'Error al eliminar el ejercicio')
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: '',
      subcategoria: '',
      objetivos: '',
      materiales: '',
      duracion: '',
      intensidad: '',
      nivel: '',
      series: '',
      repeticiones: '',
      descanso: '',
      instrucciones: '',
      videoUrl: '',
      imagenUrl: '',
      consejos: '',
      variantes: '',
      esPublico: true,
    })
    setEditingEjercicio(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Biblioteca de Ejercicios</h1>
          <p className="text-gray-600 mt-2">
            Base de datos de ejercicios creados por los entrenadores del club.
          </p>
        </div>
        {isEntrenadorSession && (
          <Button onClick={() => setShowForm((prev) => !prev)} className="w-full sm:w-auto">
            {showForm ? 'Cancelar' : '+ Nuevo Ejercicio'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ejercicios</p>
                <p className="text-3xl font-bold text-gray-900">{ejercicios.length}</p>
              </div>
              <BookOpen className="h-10 w-10 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entrenadores con registros</p>
                <p className="text-3xl font-bold text-gray-900">
                  {new Set(ejercicios.map((ejercicio) => ejercicio.creadoPor.id)).size}
                </p>
              </div>
              <Filter className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div>
              <p className="text-sm text-gray-600">Públicos</p>
              <p className="text-3xl font-bold text-gray-900">
                {ejercicios.filter((ejercicio) => ejercicio.esPublico).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div>
              <p className="text-sm text-gray-600">Privados</p>
              <p className="text-3xl font-bold text-gray-900">
                {ejercicios.filter((ejercicio) => !ejercicio.esPublico).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && isEntrenadorSession && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-900">
              {editingEjercicio ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre del Ejercicio *"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Tiros libres en series"
                />

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Categoría *</label>
                  <Select
                    value={formData.categoria}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, categoria: e.target.value })
                    }
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </div>

                <Input
                  label="Subcategoría"
                  value={formData.subcategoria}
                  onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                  placeholder="Ej: Tiro libre, triple, etc."
                />

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Nivel</label>
                  <Select
                    value={formData.nivel}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, nivel: e.target.value })
                    }
                  >
                    <option value="">Seleccionar nivel</option>
                    {NIVELES.map((nivel) => (
                      <option key={nivel} value={nivel}>
                        {nivel}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Intensidad</label>
                  <Select
                    value={formData.intensidad}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, intensidad: e.target.value })
                    }
                  >
                    <option value="">Seleccionar intensidad</option>
                    {INTENSIDADES.map((intensidad) => (
                      <option key={intensidad} value={intensidad}>
                        {intensidad}
                      </option>
                    ))}
                  </Select>
                </div>

                <Input
                  label="Duración (minutos)"
                  type="number"
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                  placeholder="15"
                />

                <Input
                  label="Series"
                  type="number"
                  value={formData.series}
                  onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                  placeholder="3"
                />

                <Input
                  label="Repeticiones"
                  value={formData.repeticiones}
                  onChange={(e) => setFormData({ ...formData, repeticiones: e.target.value })}
                  placeholder="10-15 o hasta fallo"
                />

                <Input
                  label="Descanso"
                  value={formData.descanso}
                  onChange={(e) => setFormData({ ...formData, descanso: e.target.value })}
                  placeholder="30 segundos"
                />

                <Input
                  label="Materiales (separados por coma)"
                  value={formData.materiales}
                  onChange={(e) => setFormData({ ...formData, materiales: e.target.value })}
                  placeholder="Balón, conos, escalera"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Descripción</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  rows={2}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Breve descripción del ejercicio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Objetivos</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  rows={2}
                  value={formData.objetivos}
                  onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
                  placeholder="Qué se busca mejorar con este ejercicio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Instrucciones</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  rows={4}
                  value={formData.instrucciones}
                  onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })}
                  placeholder="Paso a paso de cómo realizar el ejercicio"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="URL de Video"
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                />

                <Input
                  label="URL de Imagen"
                  type="url"
                  value={formData.imagenUrl}
                  onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <Input
                label="Consejos (separados por coma)"
                value={formData.consejos}
                onChange={(e) => setFormData({ ...formData, consejos: e.target.value })}
                placeholder="Mantén la espalda recta, controla la respiración"
              />

              <Input
                label="Variantes (separadas por coma)"
                value={formData.variantes}
                onChange={(e) => setFormData({ ...formData, variantes: e.target.value })}
                placeholder="Aumentar distancia, cambiar ángulo, con defensor"
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="esPublico"
                  checked={formData.esPublico}
                  onChange={(e) => setFormData({ ...formData, esPublico: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="esPublico" className="text-sm font-medium text-gray-700">
                  Hacer público para que otros entrenadores puedan usarlo
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" onClick={resetForm} variant="secondary" className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingEjercicio ? 'Actualizar' : 'Crear'} Ejercicio
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Base de Datos de Ejercicios</h2>
              <p className="text-sm text-gray-600 mt-1">
                Visualiza todo lo que los entrenadores han ido registrando en la biblioteca.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, categoría o creador"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-gray-900"
                />
              </div>

              <Select
                value={filtroEntrenador}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroEntrenador(e.target.value)}
              >
                <option value="">Todos los entrenadores</option>
                {entrenadores.map((entrenador) => (
                  <option key={entrenador.id} value={entrenador.id}>
                    {entrenador.nombre} {entrenador.apellidos}
                  </option>
                ))}
              </Select>

              <Select
                value={filtroCategoria}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>

              <Select
                value={filtroNivel}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFiltroNivel(e.target.value)}
              >
                <option value="">Todos los niveles</option>
                {NIVELES.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-600">Cargando ejercicios...</div>
          ) : ejerciciosFiltrados.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No se encontraron ejercicios con los filtros actuales.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ejerciciosFiltrados.map((ejercicio) => {
                const canManage = isEntrenadorSession && ejercicio.creadoPor.id === userId

                return (
                  <Card key={ejercicio.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-5">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-800">{ejercicio.nombre}</h3>
                        <span
                          className={`shrink-0 text-xs px-2 py-1 rounded ${
                            ejercicio.esPublico
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {ejercicio.esPublico ? 'Público' : 'Privado'}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {ejercicio.categoria}
                          </span>
                          {ejercicio.nivel && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                              {ejercicio.nivel}
                            </span>
                          )}
                          {ejercicio.intensidad && (
                            <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs">
                              {ejercicio.intensidad}
                            </span>
                          )}
                        </div>

                        {ejercicio.descripcion && (
                          <p className="text-gray-600 line-clamp-3">{ejercicio.descripcion}</p>
                        )}

                        {ejercicio.duracion && <p className="text-gray-500">Duración: {ejercicio.duracion} min</p>}

                        {ejercicio.series && (
                          <p className="text-gray-500">
                            Series: {ejercicio.series}
                            {ejercicio.repeticiones ? ` × ${ejercicio.repeticiones}` : ''}
                          </p>
                        )}

                        {ejercicio.materiales.length > 0 && (
                          <p className="text-gray-500">Materiales: {ejercicio.materiales.join(', ')}</p>
                        )}

                        <p className="text-xs text-gray-400 pt-2 border-t">
                          Creado por: {ejercicio.creadoPor.nombre} {ejercicio.creadoPor.apellidos}
                        </p>
                      </div>

                      {canManage && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <Button
                            onClick={() => handleEdit(ejercicio)}
                            variant="secondary"
                            className="w-full sm:w-auto"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDelete(ejercicio.id)}
                            variant="danger"
                            className="w-full sm:w-auto"
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
