'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Calendar, Clock, Target, Activity } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Sesion {
  id: string
  fecha: string
  tipo: string
  duracion: number
  ejercicios: number
  tiros: { intentos: number; aciertos: number } | null
}

const sesionesEjemplo: Sesion[] = [
  {
    id: '1',
    fecha: '2026-01-26',
    tipo: 'Entrenamiento',
    duracion: 90,
    ejercicios: 5,
    tiros: { intentos: 50, aciertos: 35 }
  },
  {
    id: '2',
    fecha: '2026-01-24',
    tipo: 'Preparación Física',
    duracion: 60,
    ejercicios: 4,
    tiros: null
  },
  {
    id: '3',
    fecha: '2026-01-22',
    tipo: 'Entrenamiento',
    duracion: 120,
    ejercicios: 6,
    tiros: { intentos: 75, aciertos: 52 }
  },
  {
    id: '4',
    fecha: '2026-01-20',
    tipo: 'Test Físico',
    duracion: 45,
    ejercicios: 3,
    tiros: null
  },
  {
    id: '5',
    fecha: '2026-01-18',
    tipo: 'Entrenamiento',
    duracion: 90,
    ejercicios: 5,
    tiros: { intentos: 60, aciertos: 38 }
  }
]

export default function SesionesPage() {
  const [sesiones] = useState<Sesion[]>(sesionesEjemplo)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sesiones de Entrenamiento</h1>
          <p className="text-gray-600 mt-2">Registro completo de tus entrenamientos</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sesión
        </Button>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-xs text-gray-500">sesiones</p>
              </div>
              <Calendar className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Horas Totales</p>
                <p className="text-2xl font-bold text-gray-900">7.5h</p>
                <p className="text-xs text-gray-500">esta semana</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">% Tiro Promedio</p>
                <p className="text-2xl font-bold text-gray-900">67%</p>
                <p className="text-xs text-gray-500">últimas sesiones</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ejercicios</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
                <p className="text-xs text-gray-500">completados</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de sesiones */}
      <div className="space-y-4">
        {sesiones.map(sesion => (
          <Card key={sesion.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{sesion.tipo}</h3>
                    <p className="text-sm text-gray-600">{formatDate(sesion.fecha)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Duración</p>
                    <p className="text-lg font-semibold text-gray-900">{sesion.duracion} min</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">Ejercicios</p>
                    <p className="text-lg font-semibold text-gray-900">{sesion.ejercicios}</p>
                  </div>

                  {sesion.tiros && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Tiros</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {Math.round((sesion.tiros.aciertos / sesion.tiros.intentos) * 100)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {sesion.tiros.aciertos}/{sesion.tiros.intentos}
                      </p>
                    </div>
                  )}

                  <Button variant="secondary" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sesiones.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay sesiones registradas</p>
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Crear Primera Sesión
          </Button>
        </div>
      )}
    </div>
  )
}
