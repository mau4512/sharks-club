'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Users, Home, Clock, Calendar, UserCog, User, BookOpen, Wallet, ClipboardList } from 'lucide-react'
import { useEffect, useState } from 'react'
import NotificationsBell from '@/components/notificaciones/NotificationsBell'
import { LogoutButton } from '@/components/auth/LogoutButton'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [adminId, setAdminId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const adminRaw = localStorage.getItem('admin')
    if (!adminRaw) return

    try {
      const admin = JSON.parse(adminRaw)
      setAdminId(admin.id)
    } catch (error) {
      console.error('Error al leer admin local:', error)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md border-b-4 border-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:py-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:space-x-8">
              <Link href="/admin" className="flex items-center">
                <Image
                  src="/images/sharks-transparent.png"
                  alt="Faraday Sharks Logo"
                  width={52}
                  height={52}
                  className="object-contain bg-white/95 rounded-md p-1 shadow-sm"
                />
                <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">Sharks Admin</span>
              </Link>
              
              <div className="-mx-1 flex items-center gap-2 overflow-x-auto pb-1 lg:mx-0 lg:gap-4 lg:overflow-visible lg:pb-0">
                <Link
                  href="/admin"
                  className="flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  <Home className="h-5 w-5 lg:mr-2" />
                  Inicio
                </Link>
                <Link
                  href="/admin/deportistas"
                  className="flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  <Users className="h-5 w-5 lg:mr-2" />
                  Deportistas
                </Link>
                <Link
                  href="/admin/entrenadores"
                  className="flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  <UserCog className="h-5 w-5 lg:mr-2" />
                  Entrenadores
                </Link>
                <Link
                  href="/admin/turnos"
                  className="flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  <Clock className="h-5 w-5 lg:mr-2" />
                  Turnos
                </Link>
                <Link
                  href="/admin/asistencias"
                  className="flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  <Calendar className="h-5 w-5 lg:mr-2" />
                  Asistencias
                </Link>
                <Link
                  href="/admin/caja"
                  className="flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  <Wallet className="h-5 w-5 lg:mr-2" />
                  Caja
                </Link>
                <Link
                  href="/admin/sesiones-entrenamiento"
                  className="flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  <ClipboardList className="h-5 w-5 lg:mr-2" />
                  Sesiones
                </Link>
                <Link
                  href="/admin/biblioteca-ejercicios"
                  className="flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  <BookOpen className="h-5 w-5 lg:mr-2" />
                  Ejercicios
                </Link>
                {adminId ? (
                  <NotificationsBell recipientType="admin" recipientId={adminId} href="/admin/notificaciones" label="Notificaciones" />
                ) : (
                  <Link
                    href="/admin/notificaciones"
                    className="flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                  >
                    Notificaciones
                  </Link>
                )}
                <Link
                  href="/admin/perfil"
                  className="flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  <User className="h-5 w-5 lg:mr-2" />
                  Perfil
                </Link>
              </div>
            </div>
            
            <div className="flex items-center justify-end">
              <LogoutButton className="w-full sm:w-auto" />
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
