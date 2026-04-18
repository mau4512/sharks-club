'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, TrendingUp, Mail, Phone } from 'lucide-react'

export default function MisDeportistasPage() {
  const router = useRouter()
  const [entrenador, setEntrenador] = useState<any>(null)
  const [deportistas, setDeportistas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const entrenadorData = localStorage.getItem('entrenador')
    if (!entrenadorData) {
      router.push('/entrenador/login')
      return
    }
    
    const entrenadorParsed = JSON.parse(entrenadorData)
    setEntrenador(entrenadorParsed)
    fetchDeportistas(entrenadorParsed.id)
  }, [router])

  const fetchDeportistas = async (entrenadorId: string) => {
    try {
      const [turnosRes, deportistasRes] = await Promise.all([
        fetch('/api/turnos'),
        fetch('/api/deportistas')
      ])

      if (turnosRes.ok && deportistasRes.ok) {
        const allTurnos = await turnosRes.json()
        const allDeportistas = await deportistasRes.json()

        const misTurnos = allTurnos.filter((t: any) => t.entrenadorId === entrenadorId)
        const turnoIds = misTurnos.map((t: any) => t.id)

        const misDeportistas = allDeportistas.filter((d: any) => 
          turnoIds.includes(d.turnoId) && d.activo
        )

        const deportistasConTurno = misDeportistas.map((d: any) => ({
          ...d,
          turno: misTurnos.find((t: any) => t.id === d.turnoId)
        }))

        setDeportistas(deportistasConTurno)
      }
    } catch (error) {
      console.error('Error al cargar deportistas:', error)
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Mis Deportistas</h1>
          <p className="text-gray-600 mt-1">{deportistas.length} deportistas a tu cargo</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {deportistas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tienes deportistas asignados aún</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deportistas.map(deportista => (
              <Card key={deportista.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {deportista.nombre} {deportista.apellidos}
                      </h3>
                      <p className="text-sm text-gray-600">{deportista.turno?.nombre || 'Sin turno'}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {deportista.email}
                  </div>
                  {deportista.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {deportista.telefono}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Turno: {deportista.turno?.hora || 'N/A'}
                  </div>
                  <div className="pt-3 border-t">
                    <Link 
                      href={`/entrenador/deportistas/${deportista.id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Ver Perfil y Progreso
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
