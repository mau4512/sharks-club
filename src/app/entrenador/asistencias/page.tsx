'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle, XCircle } from 'lucide-react'

export default function AsistenciasEntrenadorPage() {
  const router = useRouter()
  
  const [entrenador, setEntrenador] = useState<any>(null)
  const [turnos, setTurnos] = useState<any[]>([])
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<string>('')
  const [deportistas, setDeportistas] = useState<any[]>([])
  const [asistencias, setAsistencias] = useState<{ [key: string]: boolean }>({})
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const turnoId = query.get('turnoId')
    if (turnoId) {
      setTurnoSeleccionado(turnoId)
    }

    const entrenadorData = localStorage.getItem('entrenador')
    if (!entrenadorData) {
      router.push('/entrenador/login')
      return
    }
    
    const entrenadorParsed = JSON.parse(entrenadorData)
    setEntrenador(entrenadorParsed)
    fetchTurnos(entrenadorParsed.id)
  }, [router])

  useEffect(() => {
    if (turnoSeleccionado) {
      fetchDeportistas()
      fetchAsistenciasExistentes()
    }
  }, [turnoSeleccionado, fecha])

  const fetchTurnos = async (entrenadorId: string) => {
    try {
      const response = await fetch('/api/turnos')
      if (response.ok) {
        const allTurnos = await response.json()
        const misTurnos = allTurnos.filter((t: any) => t.entrenadorId === entrenadorId)
        setTurnos(misTurnos)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error al cargar turnos:', error)
      setLoading(false)
    }
  }

  const fetchDeportistas = async () => {
    try {
      const response = await fetch('/api/deportistas')
      if (response.ok) {
        const allDeportistas = await response.json()
        const deportistasDelTurno = allDeportistas.filter((d: any) => d.turnoId === turnoSeleccionado && d.activo)
        setDeportistas(deportistasDelTurno)
      }
    } catch (error) {
      console.error('Error al cargar deportistas:', error)
    }
  }

  const fetchAsistenciasExistentes = async () => {
    try {
      const response = await fetch(`/api/asistencias?turnoId=${turnoSeleccionado}&fecha=${fecha}`)
      if (response.ok) {
        const asistenciasExistentes = await response.json()
        const asistenciasMap: { [key: string]: boolean } = {}
        asistenciasExistentes.forEach((a: any) => {
          asistenciasMap[a.deportistaId] = a.presente
        })
        setAsistencias(asistenciasMap)
      }
    } catch (error) {
      console.error('Error al cargar asistencias:', error)
    }
  }

  const toggleAsistencia = (deportistaId: string) => {
    setAsistencias(prev => ({
      ...prev,
      [deportistaId]: !prev[deportistaId]
    }))
  }

  const guardarAsistencias = async () => {
    if (!turnoSeleccionado) {
      alert('Selecciona un turno')
      return
    }

    setSaving(true)
    try {
      const asistenciasArray = deportistas.map(deportista => ({
        deportistaId: deportista.id,
        presente: asistencias[deportista.id] || false
      }))

      const response = await fetch('/api/asistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          turnoId: turnoSeleccionado,
          fecha: fecha,
          asistencias: asistenciasArray 
        })
      })

      if (response.ok) {
        alert('Asistencias guardadas correctamente')
      } else {
        alert('Error al guardar asistencias')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar asistencias')
    } finally {
      setSaving(false)
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/entrenador" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Asistencias</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Tomar Asistencia</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Turno *
                </label>
                <select
                  value={turnoSeleccionado}
                  onChange={(e) => setTurnoSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                >
                  <option value="">Selecciona un turno</option>
                  {turnos.map(turno => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nombre} - {turno.hora}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                />
              </div>
            </div>

            {turnoSeleccionado && deportistas.length > 0 && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Lista de Deportistas ({deportistas.length})
                  </h3>
                  <div className="space-y-2">
                    {deportistas.map(deportista => (
                      <div
                        key={deportista.id}
                        onClick={() => toggleAsistencia(deportista.id)}
                        className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition ${
                          asistencias[deportista.id]
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {asistencias[deportista.id] ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <XCircle className="h-6 w-6 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {deportista.nombre} {deportista.apellidos}
                            </p>
                            <p className="text-sm text-gray-600">{deportista.email}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          asistencias[deportista.id]
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {asistencias[deportista.id] ? 'Presente' : 'Ausente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    onClick={guardarAsistencias}
                    disabled={saving}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Asistencias'}
                  </Button>
                </div>
              </>
            )}

            {turnoSeleccionado && deportistas.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No hay deportistas asignados a este turno
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
