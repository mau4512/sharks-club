'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type LogoutButtonProps = {
  className?: string
  compact?: boolean
  variant?: 'outline' | 'ghost' | 'danger'
}

const SESSION_KEYS = ['isAdmin', 'admin', 'entrenador', 'deportista']

export function clearLocalSession() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key))
}

export function LogoutButton({ className, compact = false, variant = 'outline' }: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = () => {
    clearLocalSession()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={handleLogout} className={className}>
      <LogOut className="h-4 w-4" />
      {!compact && <span>Cerrar sesión</span>}
    </Button>
  )
}

export function FloatingLogoutButton({ className }: { className?: string }) {
  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      <LogoutButton className="shadow-lg" />
    </div>
  )
}
