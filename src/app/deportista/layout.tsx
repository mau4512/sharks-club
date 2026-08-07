'use client'

import { usePathname } from 'next/navigation'
import { FloatingLogoutButton } from '@/components/auth/LogoutButton'

export default function DeportistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showLogout = pathname !== '/deportista' && pathname !== '/deportista/login'

  return (
    <>
      {children}
      {showLogout && <FloatingLogoutButton />}
    </>
  )
}
