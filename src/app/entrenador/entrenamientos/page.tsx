'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Plus, Trash2, Save, Clipboard, Edit, Calendar, Clock, BookOpen } from 'lucide-react'
import Link from 'next/link'
import PizarraTactica from '@/components/PizarraTactica'
import SelectorEjerciciosBiblioteca from '@/components/SelectorEjerciciosBiblioteca'

interface PuntoTiro {
  posicion: 'esquina_izq' | 'codo_izq' | 'medio' | 'codo_der' | 'esquina_der'
  cantidad: number
  amboLados: boolean
}

interface Ejercicio {
  id: string
  titulo: string
  descripcion: string
  duracion: number
  meta: {
    tipo: 'conversiones' | 'repeticiones' | 'tiempo'
    cantidad: number
    unidad: string // "tiros", "repeticiones", "minutos", etc.
    tipoTiro?: '2puntos' | '3puntos' // Nuevo campo para diferenciar tipos de tiro
  }
  puntosTiro?: PuntoTiro[] // Nuevo: configuración de puntos de tiro
  tipoRecurso: 'pizarra' | 'video' | 'ninguno'
  pizarra?: {
    tipo: 'media' | 'completa'
    data: string
  }
  videoUrl?: string
}

interface PlanEntrenamiento {
  titulo: string
  fecha: string
  turno: string
  ejercicios: Ejercicio[]
  notas: string
}

export default function PrepararEntrenamientoPage() {
  const router = useRouter()
  const [entrenador, setEntrenador] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [turnos, setTurnos] = useState<any[]>([])
  const [planesGuardados, setPlanesGuardados] = useState<any[]>([])
  const [planEditando, setPlanEditando] = useState<string | null>(null)
  
  const [plan, setPlan] = useState<PlanEntrenamiento>({
    titulo: '',
    fecha: new Date().toISOString().split('T')[0],
    turno: '',
    ejercicios: [],
    notas: ''
  })

  const [nuevoEjercicio, setNuevoEjercicio] = useState({
    titulo: '',
    descripcion: '',
    duracion: 15,
    metaTipo: 'conversiones' as 'conversiones' | 'repeticiones' | 'tiempo',
    metaCantidad: 10,
    metaUnidad: 'tiros',
    metaTipoTiro: '2puntos' as '2puntos' | '3puntos',
    usarPuntosTiro: false,
    puntosTiro: [] as Array<{posicion: string, cantidad: number, amboLados: boolean}>,
    tipoRecurso: 'ninguno' as 'pizarra' | 'video' | 'ninguno',
    tipoPizarra: 'media' as 'media' | 'completa',
    pizarraData: '',
    videoFile: null as File | null
  })

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarSelectorBiblioteca, setMostrarSelectorBiblioteca] = useState(false)

  const categorias = [
    'Calentamiento',
    'Técnica Individual',
    'Tiro',
    'Defensa',
    'Ataque',
    'Físico',
    'Táctico',
    'Enfriamiento'
  ]

  useEffect(() => {
    const entrenadorData = localStorage.getItem('entrenador')
    if (!entrenadorData) {
      router.push('/entrenador/login')
      return
    }
    
    const entrenadorParsed = JSON.parse(entrenadorData)
    setEntrenador(entrenadorParsed)
    fetchTurnos(entrenadorParsed.id)
    fetchPlanesGuardados(entrenadorParsed.id)
    setLoading(false)
  }, [router])

  const fetchTurnos = async (entrenadorId: string) => {
    try {
      const response = await fetch('/api/turnos')
      if (response.ok) {
        const data = await response.json()
        const turnosFiltrados = data.filter((t: any) => t.entrenadorId === entrenadorId)
        setTurnos(turnosFiltrados)
      }
    } catch (error) {
      console.error('Error al cargar turnos:', error)
    }
  }

  const fetchPlanesGuardados = async (entrenadorId: string) => {
    try {
      const response = await fetch(`/api/planes-entrenamiento?entrenadorId=${entrenadorId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Planes guardados cargados:', data)
        console.log('Primer plan con ejercicios:', data[0]?.ejercicios)
        setPlanesGuardados(data)
      }
    } catch (error) {
      console.error('Error al cargar planes:', error)
    }
  }

  const agregarEjercicio = async () => {
    if (!nuevoEjercicio.titulo.trim()) {
      alert('El título del ejercicio es obligatorio')
      return
    }

    const ejercicio: Ejercicio = {
      id: Date.now().toString(),
      titulo: nuevoEjercicio.titulo,
      descripcion: nuevoEjercicio.descripcion,
      duracion: nuevoEjercicio.duracion,
      meta: {
        tipo: nuevoEjercicio.metaTipo,
        cantidad: nuevoEjercicio.metaCantidad,
        unidad: nuevoEjercicio.metaUnidad,
        ...(nuevoEjercicio.metaTipo === 'conversiones' && {
          tipoTiro: nuevoEjercicio.metaTipoTiro
        })
      },
      tipoRecurso: nuevoEjercicio.tipoRecurso
    }

    // Agregar puntos de tiro si están configurados
    if (nuevoEjercicio.usarPuntosTiro && nuevoEjercicio.puntosTiro.length > 0) {
      ejercicio.puntosTiro = nuevoEjercicio.puntosTiro as PuntoTiro[]
    }

    // Agregar datos según el tipo de recurso
    if (nuevoEjercicio.tipoRecurso === 'pizarra' && nuevoEjercicio.pizarraData) {
      ejercicio.pizarra = {
        tipo: nuevoEjercicio.tipoPizarra,
        data: nuevoEjercicio.pizarraData
      }
    } else if (nuevoEjercicio.tipoRecurso === 'video' && nuevoEjercicio.videoFile) {
      // Aquí podrías subir el video a un servidor
      // Por ahora guardamos el nombre del archivo
      ejercicio.videoUrl = nuevoEjercicio.videoFile.name
    }

    setPlan({
      ...plan,
      ejercicios: [...plan.ejercicios, ejercicio]
    })

    if (entrenador?.id) {
      try {
        await fetch('/api/ejercicios-biblioteca', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nuevoEjercicio.titulo,
            descripcion: nuevoEjercicio.descripcion,
            categoria: 'Técnico',
            duracion: nuevoEjercicio.duracion,
            series: nuevoEjercicio.metaTipo === 'repeticiones' ? nuevoEjercicio.metaCantidad : null,
            repeticiones: nuevoEjercicio.metaUnidad,
            instrucciones: nuevoEjercicio.descripcion,
            videoUrl: ejercicio.videoUrl || null,
            esPublico: true,
            creadoPorId: entrenador.id,
          }),
        })
      } catch (error) {
        console.error('Error al sincronizar ejercicio con biblioteca:', error)
      }
    }

    // Resetear formulario
    setNuevoEjercicio({
      titulo: '',
      descripcion: '',
      duracion: 15,
      metaTipo: 'conversiones',
      metaCantidad: 10,
      metaUnidad: 'tiros',
      metaTipoTiro: '2puntos',
      usarPuntosTiro: false,
      puntosTiro: [],
      tipoRecurso: 'ninguno',
      tipoPizarra: 'media',
      pizarraData: '',
      videoFile: null
    })
    setMostrarFormulario(false)
  }

  const eliminarEjercicio = (id: string) => {
    setPlan({
      ...plan,
      ejercicios: plan.ejercicios.filter(e => e.id !== id)
    })
  }

  const seleccionarEjercicioBiblioteca = (ejercicioBiblioteca: any) => {
    // Convertir ejercicio de biblioteca a ejercicio del plan
    const nuevoEjercicioDelPlan: Ejercicio = {
      id: Date.now().toString(),
      titulo: ejercicioBiblioteca.nombre,
      descripcion: ejercicioBiblioteca.descripcion || ejercicioBiblioteca.instrucciones || '',
      duracion: ejercicioBiblioteca.duracion || 15,
      meta: {
        tipo: 'repeticiones',
        cantidad: ejercicioBiblioteca.series || 1,
        unidad: ejercicioBiblioteca.repeticiones || 'repeticiones',
      },
      tipoRecurso: ejercicioBiblioteca.videoUrl ? 'video' : 'ninguno',
      videoUrl: ejercicioBiblioteca.videoUrl || undefined,
    };

    setPlan({
      ...plan,
      ejercicios: [...plan.ejercicios, nuevoEjercicioDelPlan]
    });

    setMostrarSelectorBiblioteca(false);
    alert(`Ejercicio "${ejercicioBiblioteca.nombre}" agregado al plan`);
  }

  const calcularDuracionTotal = () => {
    return plan.ejercicios.reduce((total, ej) => total + ej.duracion, 0)
  }

  const guardarPlan = async () => {
    if (!plan.titulo.trim()) {
      alert('El título del plan es obligatorio')
      return
    }

    if (!plan.turno) {
      alert('Debes seleccionar un turno')
      return
    }

    if (plan.ejercicios.length === 0) {
      alert('Agrega al menos un ejercicio')
      return
    }

    console.log('Guardando plan con ejercicios:', plan.ejercicios)

    setSaving(true)

    try {
      const url = planEditando 
        ? `/api/planes-entrenamiento/${planEditando}`
        : '/api/planes-entrenamiento'
      
      const method = planEditando ? 'PUT' : 'POST'

      const dataToSend = {
        titulo: plan.titulo,
        fecha: plan.fecha,
        turnoId: plan.turno,
        entrenadorId: entrenador.id,
        notas: plan.notas,
        ejercicios: plan.ejercicios
      }

      console.log('Datos enviados al servidor:', dataToSend)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const responseData = await response.json()
      console.log('Respuesta del servidor:', responseData)

      if (response.ok) {
        alert(planEditando ? 'Plan actualizado exitosamente' : 'Plan guardado exitosamente')
        await fetchPlanesGuardados(entrenador.id)
        
        // Resetear formulario
        setPlan({
          titulo: '',
          fecha: new Date().toISOString().split('T')[0],
          turno: '',
          ejercicios: [],
          notas: ''
        })
        setPlanEditando(null)
      } else {
        alert('Error al guardar el plan')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar el plan')
    } finally {
      setSaving(false)
    }
  }

  const editarPlan = (planId: string) => {
    const planAEditar = planesGuardados.find(p => p.id === planId)
    if (planAEditar) {
      setPlan({
        titulo: planAEditar.titulo,
        fecha: planAEditar.fecha.split('T')[0],
        turno: planAEditar.turnoId,
        ejercicios: planAEditar.ejercicios,
        notas: planAEditar.notas || ''
      })
      setPlanEditando(planId)
    }
  }

  const eliminarPlan = async (planId: string) => {
    if (!confirm('¿Estás seguro de eliminar este plan?')) return

    try {
      const response = await fetch(`/api/planes-entrenamiento/${planId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Plan eliminado exitosamente')
        await fetchPlanesGuardados(entrenador.id)
      } else {
        alert('Error al eliminar el plan')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el plan')
    }
  }

  const cancelarEdicion = () => {
    setPlan({
      titulo: '',
      fecha: new Date().toISOString().split('T')[0],
      turno: '',
      ejercicios: [],
      notas: ''
    })
    setPlanEditando(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/entrenador">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Preparar Entrenamiento</h1>
              <p className="text-sm text-gray-600">Crea y organiza tu sesión de entrenamiento</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Plan */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Información del Plan</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Plan *
                  </label>
                  <Input
                    value={plan.titulo}
                    onChange={(e) => setPlan({ ...plan, titulo: e.target.value })}
                    placeholder="Ej: Entrenamiento Técnica de Tiro"
                    className="text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha *
                    </label>
                    <Input
                      type="date"
                      value={plan.fecha}
                      onChange={(e) => setPlan({ ...plan, fecha: e.target.value })}
                      className="text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Turno *
                    </label>
                    <select
                      value={plan.turno}
                      onChange={(e) => setPlan({ ...plan, turno: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                    >
                      <option value="">Seleccionar turno</option>
                      {turnos.map((turno) => (
                        <option key={turno.id} value={turno.id}>
                          {turno.nombre} - {turno.hora}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas del Entrenamiento
                  </label>
                  <textarea
                    value={plan.notas}
                    onChange={(e) => setPlan({ ...plan, notas: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                    placeholder="Objetivos, observaciones o notas especiales..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lista de Ejercicios */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Ejercicios ({plan.ejercicios.length})
                  </h2>
                  <span className="text-sm text-gray-600">
                    Duración total: {calcularDuracionTotal()} min
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {plan.ejercicios.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No hay ejercicios agregados. Usa el panel de la derecha para agregar ejercicios.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {plan.ejercicios.map((ejercicio, index) => (
                      <div
                        key={ejercicio.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                              <h3 className="font-semibold text-gray-900">{ejercicio.titulo}</h3>
                            </div>
                            
                            {/* Descripción */}
                            {ejercicio.descripcion && (
                              <p className="text-sm text-gray-600 mb-2">{ejercicio.descripcion}</p>
                            )}

                            {/* Meta del ejercicio */}
                            <div className="mb-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                              <p className="text-xs font-semibold text-primary-800 mb-1">Meta del Ejercicio:</p>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-primary-900">
                                  {ejercicio.meta.cantidad} {ejercicio.meta.unidad}
                                </p>
                                {ejercicio.meta.tipoTiro && (
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    ejercicio.meta.tipoTiro === '2puntos' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {ejercicio.meta.tipoTiro === '2puntos' ? '🏀 2 Puntos' : '🎯 3 Puntos'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Puntos de Tiro Configurados */}
                            {ejercicio.puntosTiro && ejercicio.puntosTiro.length > 0 && (
                              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs font-semibold text-green-800 mb-2">📍 Puntos de Tiro:</p>
                                <div className="space-y-1">
                                  {ejercicio.puntosTiro.map((punto: PuntoTiro, idx: number) => {
                                    const nombrePunto = {
                                      'esquina_izq': 'Esquina Izq',
                                      'codo_izq': 'Codo Izq',
                                      'medio': 'Centro',
                                      'codo_der': 'Codo Der',
                                      'esquina_der': 'Esquina Der'
                                    }[punto.posicion]
                                    
                                    return (
                                      <div key={idx} className="text-xs text-green-900 flex items-center justify-between">
                                        <span className="font-medium">{nombrePunto}</span>
                                        <span>
                                          {punto.cantidad} tiros{punto.amboLados && ' × 2 lados'}
                                          {punto.amboLados && ` = ${punto.cantidad * 2} total`}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Pizarra */}
                            {ejercicio.tipoRecurso === 'pizarra' && ejercicio.pizarra && (
                              <div className="mt-3 mb-2">
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                  Pizarra: {ejercicio.pizarra.tipo === 'media' ? 'Media Cancha' : 'Cancha Completa'}
                                </p>
                                <img
                                  src={ejercicio.pizarra.data}
                                  alt="Pizarra táctica"
                                  className="border border-gray-300 rounded max-w-full h-auto"
                                />
                              </div>
                            )}

                            {/* Video */}
                            {ejercicio.tipoRecurso === 'video' && ejercicio.videoUrl && (
                              <div className="mt-3 mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-xs text-blue-800">
                                  📹 Video: {ejercicio.videoUrl}
                                </p>
                              </div>
                            )}

                            {/* Duración */}
                            <div className="flex gap-2 mt-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                ⏱️ {ejercicio.duracion} min
                              </span>
                              {ejercicio.tipoRecurso !== 'ninguno' && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  {ejercicio.tipoRecurso === 'pizarra' ? '🏀 Con pizarra' : '📹 Con video'}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => eliminarEjercicio(ejercicio.id)}
                            className="text-red-600 hover:text-red-700 p-1 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel para Agregar Ejercicios */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Agregar Ejercicio</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {!mostrarFormulario ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => setMostrarFormulario(true)}
                      className="w-full"
                      variant="secondary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Nuevo Ejercicio
                    </Button>
                    <Button
                      onClick={() => setMostrarSelectorBiblioteca(true)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Seleccionar de Biblioteca
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Título */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título del Ejercicio *
                      </label>
                      <Input
                        value={nuevoEjercicio.titulo}
                        onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, titulo: e.target.value })}
                        placeholder="Nombre del ejercicio"
                        autoFocus
                        className="text-gray-900"
                      />
                    </div>

                    {/* Meta del Ejercicio */}
                    <div className="border-2 border-primary-200 bg-primary-50 rounded-lg p-4 space-y-3">
                      <label className="block text-sm font-semibold text-primary-900 mb-2">
                        Meta del Ejercicio *
                      </label>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Tipo de Meta
                        </label>
                        <select
                          value={nuevoEjercicio.metaTipo}
                          onChange={(e) => {
                            const tipo = e.target.value as 'conversiones' | 'repeticiones' | 'tiempo'
                            const unidad = tipo === 'conversiones' ? 'tiros' : tipo === 'repeticiones' ? 'repeticiones' : 'minutos'
                            setNuevoEjercicio({ 
                              ...nuevoEjercicio, 
                              metaTipo: tipo,
                              metaUnidad: unidad
                            })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                        >
                          <option value="conversiones">Conversiones (tiros, puntos, etc.)</option>
                          <option value="repeticiones">Repeticiones (series, ejercicios)</option>
                          <option value="tiempo">Tiempo (minutos, segundos)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cantidad
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={nuevoEjercicio.metaCantidad}
                            onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, metaCantidad: Number(e.target.value) })}
                            placeholder="10"
                            className="text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unidad
                          </label>
                          <Input
                            value={nuevoEjercicio.metaUnidad}
                            onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, metaUnidad: e.target.value })}
                            placeholder="tiros"
                            className="text-gray-900"
                          />
                        </div>
                      </div>

                      {/* Selector de tipo de tiro (2 o 3 puntos) */}
                      {nuevoEjercicio.metaTipo === 'conversiones' && (
                        <div className="mt-3 pt-3 border-t border-primary-300">
                          <label className="block text-xs font-semibold text-primary-900 mb-2">
                            Tipo de Tiro
                          </label>
                          <div className="flex gap-2">
                            <label className="flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-primary-100 transition">
                              <input
                                type="radio"
                                name="metaTipoTiro"
                                value="2puntos"
                                checked={nuevoEjercicio.metaTipoTiro === '2puntos'}
                                onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, metaTipoTiro: '2puntos' })}
                                className="mr-2"
                              />
                              <span className="text-sm font-medium text-gray-700">🏀 2 Puntos</span>
                            </label>
                            <label className="flex-1 flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-primary-100 transition">
                              <input
                                type="radio"
                                name="metaTipoTiro"
                                value="3puntos"
                                checked={nuevoEjercicio.metaTipoTiro === '3puntos'}
                                onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, metaTipoTiro: '3puntos' })}
                                className="mr-2"
                              />
                              <span className="text-sm font-medium text-gray-700">🎯 3 Puntos</span>
                            </label>
                          </div>
                          <p className="text-xs text-primary-700 mt-2">
                            Los porcentajes se calcularán por separado según el tipo de tiro
                          </p>

                          {/* Configuración de Puntos de Tiro */}
                          <div className="mt-4 pt-4 border-t border-primary-300">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-xs font-semibold text-primary-900">
                                ¿Especificar puntos de tiro en la cancha?
                              </label>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={nuevoEjercicio.usarPuntosTiro}
                                  onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, usarPuntosTiro: e.target.checked, puntosTiro: [] })}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                              </label>
                            </div>

                            {nuevoEjercicio.usarPuntosTiro && (
                              <div className="space-y-3">
                                <p className="text-xs text-gray-600 mb-2">
                                  Selecciona los puntos de la cancha y especifica cuántos tiros desde cada uno:
                                </p>
                                
                                {/* Lista de puntos disponibles */}
                                {[
                                  { key: 'esquina_izq', label: '📍 Esquina Izquierda' },
                                  { key: 'codo_izq', label: '📍 Codo Izquierdo' },
                                  { key: 'medio', label: '📍 Centro' },
                                  { key: 'codo_der', label: '📍 Codo Derecho' },
                                  { key: 'esquina_der', label: '📍 Esquina Derecha' }
                                ].map((punto) => {
                                  const puntoExistente = nuevoEjercicio.puntosTiro.find(p => p.posicion === punto.key)
                                  const isSelected = !!puntoExistente
                                  
                                  return (
                                    <div key={punto.key} className="border border-gray-200 rounded-lg p-3 bg-white">
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="flex items-center cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setNuevoEjercicio({
                                                  ...nuevoEjercicio,
                                                  puntosTiro: [...nuevoEjercicio.puntosTiro, { posicion: punto.key, cantidad: 10, amboLados: false }]
                                                })
                                              } else {
                                                setNuevoEjercicio({
                                                  ...nuevoEjercicio,
                                                  puntosTiro: nuevoEjercicio.puntosTiro.filter(p => p.posicion !== punto.key)
                                                })
                                              }
                                            }}
                                            className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                          />
                                          <span className="text-sm font-medium text-gray-900">{punto.label}</span>
                                        </label>
                                      </div>
                                      
                                      {isSelected && (
                                        <div className="ml-6 space-y-2">
                                          <div className="flex items-center gap-3">
                                            <label className="text-xs text-gray-700 min-w-[80px]">Cantidad:</label>
                                            <input
                                              type="number"
                                              min="1"
                                              value={puntoExistente?.cantidad || 10}
                                              onChange={(e) => {
                                                setNuevoEjercicio({
                                                  ...nuevoEjercicio,
                                                  puntosTiro: nuevoEjercicio.puntosTiro.map(p =>
                                                    p.posicion === punto.key ? { ...p, cantidad: Number(e.target.value) } : p
                                                  )
                                                })
                                              }}
                                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                            />
                                            <span className="text-xs text-gray-600">tiros</span>
                                          </div>
                                          
                                          <label className="flex items-center text-xs text-gray-700 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={puntoExistente?.amboLados || false}
                                              onChange={(e) => {
                                                setNuevoEjercicio({
                                                  ...nuevoEjercicio,
                                                  puntosTiro: nuevoEjercicio.puntosTiro.map(p =>
                                                    p.posicion === punto.key ? { ...p, amboLados: e.target.checked } : p
                                                  )
                                                })
                                              }}
                                              className="mr-2 h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span>Lanzar a ambos lados (izq. y der.)</span>
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                                
                                {nuevoEjercicio.puntosTiro.length > 0 && (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-xs font-semibold text-green-800 mb-1">Resumen:</p>
                                    <p className="text-sm text-green-900">
                                      Total de tiros: {nuevoEjercicio.puntosTiro.reduce((sum, p) => sum + p.cantidad * (p.amboLados ? 2 : 1), 0)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-primary-700 mt-2">
                        Ejemplo: &quot;10 tiros libres&quot;, &quot;20 repeticiones&quot;, &quot;5 minutos&quot;
                      </p>
                    </div>

                    {/* Tipo de Recurso */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ¿Necesitas usar algún recurso?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="tipoRecurso"
                            value="ninguno"
                            checked={nuevoEjercicio.tipoRecurso === 'ninguno'}
                            onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, tipoRecurso: 'ninguno' })}
                            className="mr-3"
                          />
                          <span className="text-sm text-gray-700">Solo descripción (sin recursos)</span>
                        </label>
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="tipoRecurso"
                            value="pizarra"
                            checked={nuevoEjercicio.tipoRecurso === 'pizarra'}
                            onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, tipoRecurso: 'pizarra' })}
                            className="mr-3"
                          />
                          <span className="text-sm text-gray-700">Usar pizarra táctica</span>
                        </label>
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="tipoRecurso"
                            value="video"
                            checked={nuevoEjercicio.tipoRecurso === 'video'}
                            onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, tipoRecurso: 'video' })}
                            className="mr-3"
                          />
                          <span className="text-sm text-gray-700">Subir video</span>
                        </label>
                      </div>
                    </div>

                    {/* Si selecciona Pizarra */}
                    {nuevoEjercicio.tipoRecurso === 'pizarra' && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Tipo de cancha
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNuevoEjercicio({ ...nuevoEjercicio, tipoPizarra: 'media' })}
                            className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                              nuevoEjercicio.tipoPizarra === 'media'
                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            Media Cancha
                          </button>
                          <button
                            type="button"
                            onClick={() => setNuevoEjercicio({ ...nuevoEjercicio, tipoPizarra: 'completa' })}
                            className={`flex-1 py-2 px-4 rounded-lg border-2 transition ${
                              nuevoEjercicio.tipoPizarra === 'completa'
                                ? 'border-primary-600 bg-primary-50 text-primary-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            Cancha Completa
                          </button>
                        </div>
                        <div className="border-2 border-gray-200 rounded-lg p-2">
                          <PizarraTactica
                            tipo={nuevoEjercicio.tipoPizarra}
                            onSave={(data) => setNuevoEjercicio({ ...nuevoEjercicio, pizarraData: data })}
                            initialData={nuevoEjercicio.pizarraData}
                          />
                        </div>
                      </div>
                    )}

                    {/* Si selecciona Video */}
                    {nuevoEjercicio.tipoRecurso === 'video' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subir Video
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            setNuevoEjercicio({ ...nuevoEjercicio, videoFile: file })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        />
                        {nuevoEjercicio.videoFile && (
                          <p className="text-xs text-gray-600 mt-1">
                            Archivo: {nuevoEjercicio.videoFile.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Duración */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración (minutos)
                      </label>
                      <Input
                        type="number"
                        min="5"
                        max="120"
                        value={nuevoEjercicio.duracion}
                        onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, duracion: parseInt(e.target.value) })}
                        className="text-gray-900"
                      />
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={nuevoEjercicio.descripcion}
                        onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, descripcion: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                        placeholder="Detalles del ejercicio, objetivos, instrucciones..."
                      />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2">
                      <Button
                        onClick={agregarEjercicio}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Ejercicio
                      </Button>
                      <Button
                        onClick={() => {
                          setMostrarFormulario(false)
                          setNuevoEjercicio({
                            titulo: '',
                            descripcion: '',
                            duracion: 15,
                            metaTipo: 'conversiones',
                            metaCantidad: 0,
                            metaUnidad: '',
                            metaTipoTiro: '2puntos',
                            usarPuntosTiro: false,
                            puntosTiro: [],
                            tipoRecurso: 'ninguno',
                            tipoPizarra: 'media',
                            pizarraData: '',
                            videoFile: null
                          })
                        }}
                        variant="outline"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Botón Guardar Plan */}
            <div className="space-y-2">
              <Button
                onClick={guardarPlan}
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : planEditando ? 'Actualizar Plan' : 'Guardar Plan de Entrenamiento'}
              </Button>
              
              {planEditando && (
                <Button
                  onClick={cancelarEdicion}
                  variant="outline"
                  className="w-full"
                >
                  Cancelar Edición
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Planes Guardados */}
        {planesGuardados.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Planes Guardados
              </h2>
              <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-semibold">
                {planesGuardados.length} plan{planesGuardados.length !== 1 ? 'es' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planesGuardados.map((plan: any) => (
                <Card key={plan.id} className="hover:shadow-lg transition">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{plan.titulo}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => editarPlan(plan.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Editar plan"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar este plan?')) {
                              eliminarPlan(plan.id)
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Eliminar plan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(plan.fecha).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{plan.turno.nombre} - {plan.turno.hora}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clipboard className="h-4 w-4 mr-2" />
                        <span>{Array.isArray(plan.ejercicios) ? plan.ejercicios.length : 0} ejercicio{Array.isArray(plan.ejercicios) && plan.ejercicios.length !== 1 ? 's' : ''}</span>
                      </div>
                      {plan.notas && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                          <strong>Notas:</strong> {plan.notas.substring(0, 100)}{plan.notas.length > 100 ? '...' : ''}
                        </div>
                      )}
                      
                      {/* Mostrar ejercicios con tipo de tiro */}
                      {Array.isArray(plan.ejercicios) && plan.ejercicios.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {plan.ejercicios.slice(0, 3).map((ejercicio: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-primary-50 rounded text-xs">
                              <span className="font-medium text-gray-800">{ejercicio.titulo}</span>
                              {ejercicio.meta?.tipoTiro && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  ejercicio.meta.tipoTiro === '2puntos' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {ejercicio.meta.tipoTiro === '2puntos' ? '2pts' : '3pts'}
                                </span>
                              )}
                            </div>
                          ))}
                          {plan.ejercicios.length > 3 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{plan.ejercicios.length - 3} ejercicio{plan.ejercicios.length - 3 !== 1 ? 's' : ''} más
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selector de Ejercicios de Biblioteca */}
      {mostrarSelectorBiblioteca && (
        <SelectorEjerciciosBiblioteca
          onSeleccionar={seleccionarEjercicioBiblioteca}
          onCerrar={() => setMostrarSelectorBiblioteca(false)}
        />
      )}
    </div>
  )
}
