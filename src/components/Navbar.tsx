'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Activity, User, ClipboardList, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Perfil', href: '/dashboard/perfil', icon: User },
  { name: 'Ejercicios', href: '/dashboard/ejercicios', icon: Activity },
  { name: 'Sesiones', href: '/dashboard/sesiones', icon: ClipboardList },
  { name: 'Estadísticas', href: '/dashboard/estadisticas', icon: TrendingUp },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <div className="flex items-center justify-center sm:justify-start">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/images/sharks-transparent.png"
                alt="Faraday Sharks Logo"
                width={52}
                height={52}
                className="object-contain bg-white/95 rounded-md p-1 shadow-sm"
              />
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">Sharks</span>
            </Link>
          </div>
          
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto pb-1 sm:mx-0 sm:gap-4 sm:overflow-visible sm:pb-0">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex shrink-0 items-center px-3 py-2 rounded-lg text-sm font-medium transition',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5 sm:mr-2" />
                  <span className="ml-2 sm:ml-0">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
