'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { X, AlertCircle, Shield, UserCog, User } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

type TipoUsuario = 'admin' | 'entrenador' | 'deportista'

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter()
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('deportista')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          preferredRole: tipoUsuario,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Credenciales incorrectas')
        setLoading(false)
        return
      }

      localStorage.removeItem('isAdmin')
      localStorage.removeItem('admin')
      localStorage.removeItem('entrenador')
      localStorage.removeItem('deportista')

      if (data.role === 'admin') {
        localStorage.setItem('isAdmin', 'true')
        localStorage.setItem('admin', JSON.stringify(data.user))
        router.push('/admin')
        onClose()
        return
      }

      if (data.role === 'entrenador') {
        localStorage.setItem('entrenador', JSON.stringify(data.user))
        router.push('/entrenador')
        onClose()
        return
      }

      localStorage.setItem('deportista', JSON.stringify(data.user))
      router.push('/deportista')
      onClose()
    } catch (error) {
      console.error('Error:', error)
      setError('Error al iniciar sesión. Por favor, intenta de nuevo.')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Selector de tipo de usuario */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Usuario
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setTipoUsuario('admin')}
                  className={`flex flex-row items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all sm:flex-col sm:p-4 ${
                    tipoUsuario === 'admin'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Shield className="h-6 w-6" />
                  <span className="text-xs font-medium">Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoUsuario('entrenador')}
                  className={`flex flex-row items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all sm:flex-col sm:p-4 ${
                    tipoUsuario === 'entrenador'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <UserCog className="h-6 w-6" />
                  <span className="text-xs font-medium">Entrenador</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoUsuario('deportista')}
                  className={`flex flex-row items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all sm:flex-col sm:p-4 ${
                    tipoUsuario === 'deportista'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <User className="h-6 w-6" />
                  <span className="text-xs font-medium">Deportista</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  DNI, correo o usuario
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  placeholder="DNI, correo o usuario"
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              <p className="text-sm text-gray-500 text-center mt-4">
                Acceso para administradores, entrenadores y deportistas
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
