'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Save, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Deportista {
  id: string
  nombre: string
  apellidos: string
  email: string
  photoUrl: string | null
}

interface Turno {
  id: string
  nombre: string
  tipo: string
  hora: string
  deportistas: Deportista[]
}

interface AsistenciaForm {
  deportistaId: string
  presente: boolean
  notas: string
}

export default function TomarAsistenciaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [turno, setTurno] = useState<Turno | null>(null)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [asistencias, setAsistencias] = useState<AsistenciaForm[]>([])

  useEffect(() => {
    cargarTurno()
  }, [id])

  const cargarTurno = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/turnos/${id}`)
      if (response.ok) {
        const data = await response.json()
        setTurno(data)
        
        // Inicializar asistencias
        const asistenciasIniciales = data.deportistas.map((dep: Deportista) => ({
          deportistaId: dep.id,
          presente: false,
          notas: ''
        }))
        setAsistencias(asistenciasIniciales)
        
        // Cargar asistencias existentes para la fecha
        await cargarAsistenciasExistentes(id, fecha)
      }
    } catch (error) {
      console.error('Error al cargar turno:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarAsistenciasExistentes = async (turnoId: string, fechaSeleccionada: string) => {
    try {
      const response = await fetch(`/api/asistencias?turnoId=${turnoId}&fecha=${fechaSeleccionada}`)
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          const asistenciasExistentes = data.map((a: any) => ({
            deportistaId: a.deportistaId,
            presente: a.presente,
            notas: a.notas || ''
          }))
          setAsistencias(asistenciasExistentes)
        }
      }
    } catch (error) {
      console.error('Error al cargar asistencias:', error)
    }
  }

  const handlePresenciaChange = (deportistaId: string, presente: boolean) => {
    setAsistencias(prev =>
      prev.map(a =>
        a.deportistaId === deportistaId ? { ...a, presente } : a
      )
    )
  }

  const handleNotasChange = (deportistaId: string, notas: string) => {
    setAsistencias(prev =>
      prev.map(a =>
        a.deportistaId === deportistaId ? { ...a, notas } : a
      )
    )
  }

  const marcarTodosPresentes = () => {
    setAsistencias(prev => prev.map(a => ({ ...a, presente: true })))
  }

  const marcarTodosAusentes = () => {
    setAsistencias(prev => prev.map(a => ({ ...a, presente: false })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/asistencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          turnoId: id,
          fecha,
          asistencias
        })
      })

      if (response.ok) {
        alert('Asistencia registrada exitosamente')
        router.push(`/admin/turnos/${id}/asistencias`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar asistencia')
    } finally {
      setSaving(false)
    }
  }

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFecha = e.target.value
    setFecha(nuevaFecha)
    cargarAsistenciasExistentes(id, nuevaFecha)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!turno) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Turno no encontrado</p>
          <Link href="/admin/turnos">
            <Button className="mt-4">Volver a Turnos</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const presentesCount = asistencias.filter(a => a.presente).length
  const ausentesCount = asistencias.length - presentesCount

  return (
    <div>
      <div className="mb-8">
        <Link href={`/admin/turnos/${id}/asistencias`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Historial
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tomar Asistencia</h1>
        <p className="text-gray-600 mt-2">
          {turno.nombre} - {turno.tipo === 'diurno' ? 'Diurno' : 'Nocturno'} ({turno.hora})
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Controles superiores */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Registro de Asistencia</h2>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <Input
                      type="date"
                      value={fecha}
                      onChange={handleFechaChange}
                      className="w-auto"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={marcarTodosPresentes}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Todos Presentes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={marcarTodosAusentes}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Todos Ausentes
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Presentes:</span>
                  <span className="text-gray-600">{presentesCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-gray-900">Ausentes:</span>
                  <span className="text-gray-600">{ausentesCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de deportistas */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Deportistas del Turno</h2>
            </CardHeader>
            <CardContent>
              {turno.deportistas.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay deportistas en este turno
                </p>
              ) : (
                <div className="space-y-4">
                  {turno.deportistas.map((deportista) => {
                    const asistencia = asistencias.find(a => a.deportistaId === deportista.id)
                    return (
                      <div
                        key={deportista.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          asistencia?.presente
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {deportista.nombre} {deportista.apellidos}
                            </h3>
                            <p className="text-sm text-gray-600">{deportista.email}</p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handlePresenciaChange(deportista.id, true)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                asistencia?.presente
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                              }`}
                            >
                              <CheckCircle className="h-4 w-4 inline mr-1" />
                              Presente
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePresenciaChange(deportista.id, false)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                !asistencia?.presente
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                              }`}
                            >
                              <XCircle className="h-4 w-4 inline mr-1" />
                              Ausente
                            </button>
                          </div>
                        </div>

                        {/* Campo de notas */}
                        <div className="mt-3">
                          <Input
                            type="text"
                            placeholder="Notas (opcional)"
                            value={asistencia?.notas || ''}
                            onChange={(e) => handleNotasChange(deportista.id, e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <Link href={`/admin/turnos/${id}/asistencias`}>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Asistencia
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
