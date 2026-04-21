// @vitest-environment jsdom

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('next/image', () => ({
  default: (props: any) => React.createElement('img', props),
}))

import LoginPage from '@/app/login/page'

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('redirects admins after successful login', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          role: 'admin',
          user: { id: 'default-admin', nombre: 'Administrador', email: 'admin' },
        }),
      })
    )

    render(React.createElement(LoginPage))

    await user.type(screen.getByLabelText(/correo o usuario/i), 'admin')
    await user.type(screen.getByLabelText(/contraseña/i), 'admin')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/admin')
    })

    expect(localStorage.getItem('isAdmin')).toBe('true')
    expect(localStorage.getItem('admin')).toContain('Administrador')
  })

  it('shows the backend error when credentials are invalid', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Credenciales incorrectas' }),
      })
    )

    render(React.createElement(LoginPage))

    await user.type(screen.getByLabelText(/correo o usuario/i), 'admin')
    await user.type(screen.getByLabelText(/contraseña/i), 'mala')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument()
  })
})
