'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { User, Edit, Save, X } from 'lucide-react'
import { POSICIONES } from '@/lib/constants'

export default function PerfilPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    nombre: 'Juan',
    apellidos: 'García López',
    email: 'juan.garcia@example.com',
    fechaNacimiento: '2000-05-15',
    altura: '188',
    peso: '82',
    posicion: 'Escolta'
  })

  const handleSave = () => {
    // Aquí se llamaría a la API para guardar los cambios
    setIsEditing(false)
    alert('Perfil actualizado correctamente')
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Perfil del Deportista</h1>
          <p className="text-gray-600 mt-2">Gestiona tu información personal</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foto de perfil */}
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center">
              <div className="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <User className="h-16 w-16 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.nombre} {profile.apellidos}
              </h2>
              <p className="text-gray-600">{profile.posicion}</p>
              {isEditing && (
                <Button variant="secondary" size="sm" className="mt-4">
                  Cambiar Foto
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información personal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-xl font-semibold text-gray-900">Información Personal</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                value={profile.nombre}
                disabled={!isEditing}
                onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
              />
              <Input
                label="Apellidos"
                value={profile.apellidos}
                disabled={!isEditing}
                onChange={(e) => setProfile({ ...profile, apellidos: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={profile.email}
                disabled={!isEditing}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
              <Input
                label="Fecha de Nacimiento"
                type="date"
                value={profile.fechaNacimiento}
                disabled={!isEditing}
                onChange={(e) => setProfile({ ...profile, fechaNacimiento: e.target.value })}
              />
              <Input
                label="Altura (cm)"
                type="number"
                value={profile.altura}
                disabled={!isEditing}
                onChange={(e) => setProfile({ ...profile, altura: e.target.value })}
              />
              <Input
                label="Peso (kg)"
                type="number"
                value={profile.peso}
                disabled={!isEditing}
                onChange={(e) => setProfile({ ...profile, peso: e.target.value })}
              />
              <Select
                label="Posición"
                value={profile.posicion}
                disabled={!isEditing}
                options={[
                  { value: '', label: 'Seleccionar posición' },
                  ...POSICIONES.map(pos => ({ value: pos, label: pos }))
                ]}
                onChange={(e) => setProfile({ ...profile, posicion: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">IMC</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary-600">23.2</p>
            <p className="text-sm text-gray-600 mt-1">Peso saludable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Edad</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary-600">26</p>
            <p className="text-sm text-gray-600 mt-1">Años</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Antigüedad</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary-600">3</p>
            <p className="text-sm text-gray-600 mt-1">Meses en la plataforma</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
