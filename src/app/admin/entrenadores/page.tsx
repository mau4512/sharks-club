'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserCog, Plus, Mail, Phone, Award, Clock } from 'lucide-react'

interface Turno {
  id: string
  nombre: string
  hora: string
  tipo: string
  activo: boolean
}

interface Entrenador {
  id: string
  nombre: string
  apellidos: string
  documentoIdentidad: string
  email: string
  celular?: string
  especialidad?: string[]
  turnoIds?: string[]
  turnos?: Turno[]
  activo: boolean
  createdAt: string
}

export default function EntrenadoresPage() {
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchEntrenadores()
  }, [])

  const fetchEntrenadores = async () => {
    try {
      const response = await fetch('/api/entrenadores')
      if (response.ok) {
        const data = await response.json()
        setEntrenadores(data)
      }
    } catch (error) {
      console.error('Error al cargar entrenadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este entrenador?')) return

    try {
      const response = await fetch(`/api/entrenadores/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setEntrenadores(entrenadores.filter(e => e.id !== id))
      } else {
        alert('Error al eliminar el entrenador')
      }
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar el entrenador')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Cargando entrenadores...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Entrenadores</h1>
            <p className="text-gray-600 mt-2">Gestiona el equipo de entrenadores de la academia</p>
          </div>
          <Link href="/admin/entrenadores/nuevo">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Entrenador
            </Button>
          </Link>
        </div>

        {entrenadores.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <UserCog className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay entrenadores registrados
              </h3>
              <p className="text-gray-600 mb-6">
                Comienza agregando tu primer entrenador
              </p>
              <Link href="/admin/entrenadores/nuevo">
                <Button>
                  <Plus className="h-5 w-5 mr-2" />
                  Registrar Entrenador
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entrenadores.map((entrenador) => (
              <Card key={entrenador.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <UserCog className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="ml-3">
                        <CardTitle className="text-lg">
                          {entrenador.nombre} {entrenador.apellidos}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{entrenador.documentoIdentidad}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        entrenador.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {entrenador.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {entrenador.email}
                    </div>
                    {entrenador.celular && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {entrenador.celular}
                      </div>
                    )}
                    {entrenador.especialidad && entrenador.especialidad.length > 0 && (
                      <div className="flex items-start text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {entrenador.especialidad.map((esp, idx) => (
                            <span key={idx} className="inline-block px-2 py-0.5 bg-primary-100 text-primary-800 rounded text-xs">
                              {esp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {entrenador.turnos && entrenador.turnos.length > 0 && (
                      <div className="flex items-start text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {entrenador.turnos.map((turno) => (
                            <span key={turno.id} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {turno.nombre} - {turno.hora}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/entrenadores/${entrenador.id}`)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(entrenador.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
