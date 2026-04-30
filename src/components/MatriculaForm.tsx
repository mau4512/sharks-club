'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function MatriculaForm() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    documentoIdentidad: '',
    fechaNacimiento: '',
    nombreApoderado: '',
    telefonoApoderado: '',
  })
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/matriculas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al enviar el formulario')
      }

      setStatus('success')
      setFormData({
        nombre: '',
        apellidos: '',
        documentoIdentidad: '',
        fechaNacimiento: '',
        nombreApoderado: '',
        telefonoApoderado: '',
      })
      
      // Resetear el estado después de 5 segundos
      setTimeout(() => setStatus('idle'), 5000)
    } catch (error) {
      setStatus('error')
      setErrorMessage('Hubo un error al enviar tu solicitud. Por favor, inténtalo de nuevo.')
    }
  }

  if (status === 'success') {
    return (
      <Card className="border-2 border-green-400">
        <CardContent className="pt-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h3>
          <p className="text-gray-600 mb-6">
            Tu solicitud de contacto fue registrada correctamente. El club se pondra en contacto con el padre o apoderado para evaluar el posible ingreso.
          </p>
          <Button onClick={() => setStatus('idle')}>
            Enviar otra solicitud
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombres completos *
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder="Ej: Juan Carlos"
              />
            </div>
            <div>
              <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-2">
                Apellidos *
              </label>
              <input
                id="apellidos"
                name="apellidos"
                type="text"
                required
                value={formData.apellidos}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder="Ej: Pérez Gómez"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="documentoIdentidad" className="block text-sm font-medium text-gray-700 mb-2">
                Número de DNI *
              </label>
              <input
                id="documentoIdentidad"
                name="documentoIdentidad"
                type="text"
                required
                value={formData.documentoIdentidad}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder="Ej: 12345678"
              />
            </div>
            <div>
              <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Nacimiento *
              </label>
              <input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date"
                required
                value={formData.fechaNacimiento}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nombreApoderado" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Padre o Apoderado *
              </label>
              <input
                id="nombreApoderado"
                name="nombreApoderado"
                type="text"
                required
                value={formData.nombreApoderado}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder="Ej: Carlos Pérez"
              />
            </div>
            <div>
              <label htmlFor="telefonoApoderado" className="block text-sm font-medium text-gray-700 mb-2">
                Número del Padre o Apoderado *
              </label>
              <input
                id="telefonoApoderado"
                name="telefonoApoderado"
                type="tel"
                required
                value={formData.telefonoApoderado}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                placeholder="Ej: 999 888 777"
              />
            </div>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <Button 
            type="submit" 
            size="lg" 
            className="w-full text-lg"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Enviando...' : (
              <>
                <span className="sm:hidden">Enviar solicitud</span>
                <span className="hidden sm:inline">Enviar solicitud de contacto</span>
              </>
            )}
          </Button>

          <p className="text-sm text-gray-500 text-center">
            Al enviar este formulario, autorizas al club a contactarse con el padre o apoderado para brindar informacion y evaluar una posible inscripcion.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
