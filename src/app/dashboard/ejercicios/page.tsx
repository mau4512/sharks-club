'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, FileText, Video, Edit, Trash2 } from 'lucide-react'
import { CATEGORIAS_EJERCICIO, DIFICULTAD } from '@/lib/constants'

interface Ejercicio {
  id: string
  titulo: string
  categoria: string
  dificultad: string
  descripcion: string
}

const ejerciciosEjemplo: Ejercicio[] = [
  {
    id: '1',
    titulo: 'Tiro en suspensión',
    categoria: 'Tiro',
    dificultad: 'Intermedio',
    descripcion: 'Trabajo de mecánica de tiro desde diferentes posiciones'
  },
  {
    id: '2',
    titulo: 'Desplazamientos defensivos',
    categoria: 'Defensa',
    dificultad: 'Principiante',
    descripcion: 'Ejercicios de footwork y posición defensiva'
  },
  {
    id: '3',
    titulo: 'Entrenamiento de fuerza',
    categoria: 'Físico',
    dificultad: 'Avanzado',
    descripcion: 'Circuito de fuerza para miembro inferior'
  }
]

export default function EjerciciosPage() {
  const [ejercicios] = useState<Ejercicio[]>(ejerciciosEjemplo)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas')

  const ejerciciosFiltrados = filtroCategoria === 'Todas' 
    ? ejercicios 
    : ejercicios.filter(e => e.categoria === filtroCategoria)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Biblioteca de Ejercicios</h1>
          <p className="text-gray-600 mt-2">Gestiona tus ejercicios y esquemas de entrenamiento</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ejercicio
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={filtroCategoria === 'Todas' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFiltroCategoria('Todas')}
        >
          Todas
        </Button>
        {CATEGORIAS_EJERCICIO.map(categoria => (
          <Button
            key={categoria}
            variant={filtroCategoria === categoria ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFiltroCategoria(categoria)}
          >
            {categoria}
          </Button>
        ))}
      </div>

      {/* Grid de ejercicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ejerciciosFiltrados.map(ejercicio => (
          <Card key={ejercicio.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{ejercicio.titulo}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                      {ejercicio.categoria}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {ejercicio.dificultad}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">{ejercicio.descripcion}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  PDF adjunto
                </div>
                <div className="flex items-center">
                  <Video className="h-4 w-4 mr-1" />
                  Sin video
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-2 w-full">
                <Button variant="secondary" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button variant="danger" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {ejerciciosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay ejercicios en esta categoría</p>
        </div>
      )}
    </div>
  )
}
