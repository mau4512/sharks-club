'use client'

import { usePathname } from 'next/navigation'
import { FloatingLogoutButton } from '@/components/auth/LogoutButton'

export default function EntrenadorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showLogout = pathname !== '/entrenador' && pathname !== '/entrenador/login'

  return (
    <>
      {children}
      {showLogout && <FloatingLogoutButton />}
    </>
  )
}
