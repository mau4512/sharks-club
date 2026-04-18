'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, UserCircle, Loader2, Eye, Wallet } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

interface Deportista {
  id: string
  nombre: string
  apellidos: string
  documentoIdentidad: string
  fechaNacimiento: string
  email: string
  celular?: string
  posicion?: string
  activo: boolean
}

export default function DeportistasPage() {
  const [deportistas, setDeportistas] = useState<Deportista[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar deportistas al montar el componente
  useEffect(() => {
    fetchDeportistas()
  }, [])

  const fetchDeportistas = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/deportistas')
      
      if (!response.ok) {
        throw new Error('Error al cargar deportistas')
      }
      
      const data = await response.json()
      setDeportistas(data)
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar los deportistas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este deportista?')) return

    try {
      const response = await fetch(`/api/deportistas/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar deportista')
      }

      // Actualizar la lista
      setDeportistas(deportistas.filter(d => d.id !== id))
    } catch (err) {
      console.error('Error:', err)
      alert('Error al eliminar el deportista')
    }
  }

  const deportistasFiltrados = deportistas.filter(d =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.documentoIdentidad.includes(busqueda)
  )

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Mostrar error si existe
  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDeportistas}>Reintentar</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Deportistas</h1>
          <p className="text-gray-600 mt-2">Administra el registro de atletas</p>
        </div>
        <Link href="/admin/deportistas/nuevo" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Deportista
          </Button>
        </Link>
      </div>

      {/* Información sobre credenciales */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Acceso de Deportistas</h3>
              <p className="text-sm text-blue-800">
                Cada deportista puede acceder a su portal usando el <strong>email</strong> y <strong>contraseña</strong> asignados durante su registro. 
                Las credenciales se establecen al crear el deportista y pueden modificarse en cualquier momento desde la opción de editar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Búsqueda */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellidos o documento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de deportistas */}
      {deportistasFiltrados.length > 0 ? (
        <div className="space-y-4">
          {deportistasFiltrados.map((deportista) => (
            <Card key={deportista.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserCircle className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 safe-wrap">
                        {deportista.nombre} {deportista.apellidos}
                      </h3>
                      <div className="mt-1 flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                        <span>ID: {deportista.documentoIdentidad}</span>
                        <span>Nacimiento: {formatDate(deportista.fechaNacimiento)}</span>
                        {deportista.posicion && (
                          <>
                            <span>{deportista.posicion}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      deportista.activo 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {deportista.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <Link href={`/admin/deportistas/${deportista.id}/perfil`} className="w-full sm:w-auto">
                      <Button variant="primary" size="sm" className="w-full sm:w-auto">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Perfil
                      </Button>
                    </Link>
                    <Link href={`/admin/deportistas/${deportista.id}`} className="w-full sm:w-auto">
                      <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                    <Link href={`/admin/caja?deportistaId=${deportista.id}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Wallet className="h-4 w-4 mr-1" />
                        Caja
                      </Button>
                    </Link>
                    <Button 
                      variant="danger" 
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => handleDelete(deportista.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {busqueda ? 'No se encontraron deportistas' : 'No hay deportistas registrados'}
            </h3>
            <p className="text-gray-600 mb-6">
              {busqueda 
                ? 'Intenta con otro término de búsqueda' 
                : 'Comienza registrando tu primer deportista'}
            </p>
            {!busqueda && (
              <Link href="/admin/deportistas/nuevo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primer Deportista
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
