'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Clock, Users, Plus, Edit, Trash2, Sun, Moon } from 'lucide-react'
import { toast } from 'sonner'
import { confirmDialog } from '@/components/ui/confirm-dialog'

interface Turno {
  id: string
  nombre: string
  tipo: string
  hora: string
  modalidad: string
  activo: boolean
  entrenador?: {
    nombre: string
    apellidos: string
  } | null
  _count: {
    deportistas: number
  }
}

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarTurnos()
  }, [])

  const cargarTurnos = async () => {
    try {
      const response = await fetch('/api/turnos')
      const data = await response.json()
      
      // Asegurarse de que data es un array
      if (Array.isArray(data)) {
        setTurnos(data)
      } else {
        console.error('La respuesta no es un array:', data)
        setTurnos([])
      }
    } catch (error) {
      console.error('Error al cargar turnos:', error)
      setTurnos([])
    } finally {
      setLoading(false)
    }
  }

  const eliminarTurno = async (id: string) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar turno',
      description: '¿Estás seguro de que deseas eliminar este turno?',
      confirmText: 'Eliminar',
      variant: 'danger',
    })

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/turnos/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        cargarTurnos()
      } else {
        toast.error('Error al eliminar el turno')
      }
    } catch (error) {
      console.error('Error al eliminar turno:', error)
      toast.error('Error al eliminar el turno')
    }
  }

  const getTipoLabel = (tipo: string) => {
    return tipo === 'diurno' ? 'Diurno' : 'Nocturno'
  }

  const getModalidadLabel = (modalidad: string) => {
    return modalidad === 'interdiario' ? 'Interdiario (12 sesiones)' : 'Diario (20 sesiones)'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Cargando turnos...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Turnos</h1>
          <p className="text-gray-600 mt-2">Administra los turnos de entrenamiento</p>
        </div>
        <Link href="/admin/turnos/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Crear Turno
          </Button>
        </Link>
      </div>

      {turnos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No hay turnos registrados</p>
            <Link href="/admin/turnos/nuevo">
              <Button>Crear Primer Turno</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turnos.map((turno) => (
            <Card key={turno.id} className="hover:shadow-lg transition-shadow">
              <Link href={`/admin/turnos/${turno.id}/asistencias`}>
                <CardHeader className="cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {turno.tipo === 'diurno' ? (
                        <Sun className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Moon className="h-5 w-5 text-blue-500" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{turno.nombre}</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${turno.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {turno.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </CardHeader>
              </Link>
              <CardContent>
                <Link href={`/admin/turnos/${turno.id}/asistencias`}>
                  <div className="space-y-3 cursor-pointer">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {turno.hora} - {getTipoLabel(turno.tipo)}
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Modalidad:</span>
                      <span className="ml-2 text-gray-600">{getModalidadLabel(turno.modalidad)}</span>
                    </div>
                    
                    {turno.entrenador && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Entrenador:</span>
                        <span className="ml-2 text-gray-600">
                          {turno.entrenador.nombre} {turno.entrenador.apellidos}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm pt-3 border-t">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium text-gray-900">{turno._count.deportistas}</span>
                      <span className="text-gray-500 ml-1">deportistas inscritos</span>
                    </div>
                  </div>
                </Link>
                
                <div className="flex gap-2 pt-3 border-t mt-3">
                  <Link href={`/admin/turnos/${turno.id}`} className="flex-1">
                    <button className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center gap-2 transition">
                      <Edit className="h-4 w-4" />
                      Editar
                    </button>
                  </Link>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      eliminarTurno(turno.id)
                    }}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
