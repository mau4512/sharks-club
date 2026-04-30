'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Camera, 
  Mail, 
  Phone, 
  Calendar, 
  Ruler, 
  Weight,
  TrendingUp,
  Target,
  Activity,
  Award,
  Loader2,
  Edit,
  Wallet
} from 'lucide-react'
import { formatDate, calculateIMC } from '@/lib/utils'
import Image from 'next/image'
import { toast } from 'sonner'

interface Deportista {
  id: string
  nombre: string
  apellidos: string
  documentoIdentidad: string
  email: string
  celular?: string
  nombreApoderado: string
  telefonoApoderado: string
  fechaNacimiento: string
  altura?: number
  peso?: number
  posicion?: string
  tallaCamiseta?: string
  numeroCamiseta?: string
  photoUrl?: string
  activo: boolean
  createdAt: string
  deudaStatus?: {
    mensualidadPendiente: boolean
    uniformePendiente: boolean
    tieneDeuda: boolean
    etiquetas: string[]
    cicloUniforme: {
      inicio: number
      fin: number
    }
  }
}

interface Estadisticas {
  totalSesiones: number
  sesionesUltimoMes: number
  promedioTiro: number
  mejorTiro: number
  ejerciciosCompletados: number
}

export default function PerfilDeportistaPage() {
  const params = useParams()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [deportista, setDeportista] = useState<Deportista | null>(null)
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalSesiones: 0,
    sesionesUltimoMes: 0,
    promedioTiro: 0,
    mejorTiro: 0,
    ejerciciosCompletados: 0
  })
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDeportista()
    fetchEstadisticas()
  }, [id])

  const fetchDeportista = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/deportistas/${id}`)
      
      if (!response.ok) {
        throw new Error('Deportista no encontrado')
      }
      
      const data = await response.json()
      setDeportista(data)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error al cargar deportista')
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      // Por ahora estadísticas de ejemplo, luego conectar a API real
      setEstadisticas({
        totalSesiones: 0,
        sesionesUltimoMes: 0,
        promedioTiro: 0,
        mejorTiro: 0,
        ejerciciosCompletados: 0
      })
    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5MB')
      return
    }

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/deportistas/${id}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error al subir imagen')
      }

      const data = await response.json()
      
      // Actualizar el estado local
      if (deportista) {
        setDeportista({
          ...deportista,
          photoUrl: data.photoUrl
        })
      }

      toast.success('Imagen actualizada exitosamente')
    } catch (err) {
      console.error('Error:', err)
      toast.error('Error al subir la imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !deportista) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-4">{error || 'Deportista no encontrado'}</p>
          <Link href="/admin/deportistas">
            <Button>Volver a Deportistas</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const edad = calcularEdad(deportista.fechaNacimiento)
  const imc = deportista.altura && deportista.peso 
    ? calculateIMC(deportista.peso, deportista.altura) 
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin/deportistas" className="w-full sm:w-auto">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Deportistas
          </Button>
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/admin/caja?deportistaId=${id}`} className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Wallet className="h-4 w-4 mr-2" />
              Ver Caja
            </Button>
          </Link>
          <Link href={`/admin/deportistas/${id}`} className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" className="w-full sm:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              Editar Información
            </Button>
          </Link>
        </div>
      </div>

      {/* Información Principal */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center">
              <div 
                className="relative w-48 h-48 bg-gray-100 rounded-full overflow-hidden border-4 border-primary-500 cursor-pointer group"
                onClick={handleImageClick}
              >
                {deportista.photoUrl ? (
                  <Image
                    src={deportista.photoUrl}
                    alt={`${deportista.nombre} ${deportista.apellidos}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera className="h-16 w-16" />
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                  <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-sm text-gray-600 mt-3 text-center">
                Click para cambiar foto
              </p>
              <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                deportista.activo 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {deportista.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Datos Personales */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {deportista.nombre} {deportista.apellidos}
              </h1>
              <p className="text-lg text-primary-600 font-medium mb-6">
                {deportista.posicion || 'Sin posición asignada'}
              </p>

              {deportista.deudaStatus && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {deportista.deudaStatus.tieneDeuda ? (
                    deportista.deudaStatus.etiquetas.map((etiqueta) => (
                      <span
                        key={etiqueta}
                        className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                      >
                        {etiqueta}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Pagos al día
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Mail className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="text-sm font-medium">{deportista.email}</p>
                  </div>
                </div>

                {deportista.celular && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Phone className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Celular</p>
                      <p className="text-sm font-medium">{deportista.celular}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Edad</p>
                    <p className="text-sm font-medium">{edad} años</p>
                  </div>
                </div>

                {deportista.altura && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Ruler className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Altura</p>
                      <p className="text-sm font-medium">{deportista.altura} cm</p>
                    </div>
                  </div>
                )}

                {deportista.peso && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Weight className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Peso</p>
                      <p className="text-sm font-medium">{deportista.peso} kg</p>
                    </div>
                  </div>
                )}

                {imc && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Activity className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">IMC</p>
                      <p className="text-sm font-medium">{imc}</p>
                    </div>
                  </div>
                )}

                {deportista.tallaCamiseta && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Award className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Talla de camiseta</p>
                      <p className="text-sm font-medium">{deportista.tallaCamiseta}</p>
                    </div>
                  </div>
                )}

                {deportista.numeroCamiseta && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Target className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Número de camiseta</p>
                      <p className="text-sm font-medium">#{deportista.numeroCamiseta}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Estadísticas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Sesiones</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.totalSesiones}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sesiones (mes)</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.sesionesUltimoMes}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">% Tiro Promedio</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.promedioTiro}%</p>
                </div>
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Target className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ejercicios</p>
                  <p className="text-3xl font-bold text-gray-900">{estadisticas.ejerciciosCompletados}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Información del Registro</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Documento de Identidad</p>
                <p className="font-medium">{deportista.documentoIdentidad}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
                <p className="font-medium">{formatDate(deportista.fechaNacimiento)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha de Registro</p>
                <p className="font-medium">{formatDate(deportista.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Padre o Apoderado</p>
                <p className="font-medium">{deportista.nombreApoderado}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Número del Padre o Apoderado</p>
                <p className="font-medium">{deportista.telefonoApoderado}</p>
              </div>
              {deportista.deudaStatus && (
                <div>
                  <p className="text-sm text-gray-600">Estado de pagos</p>
                  <p className="font-medium">
                    {deportista.deudaStatus.tieneDeuda
                      ? deportista.deudaStatus.etiquetas.join(' · ')
                      : 'Al día'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Control de uniforme ciclo {deportista.deudaStatus.cicloUniforme.inicio}-
                    {deportista.deudaStatus.cicloUniforme.fin}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center py-8">
              No hay actividad reciente
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
