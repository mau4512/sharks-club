// @vitest-environment jsdom

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import BibliotecaEjerciciosPage from '@/app/admin/biblioteca-ejercicios/page'

describe('Biblioteca de ejercicios page', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('carga ejercicios y permite filtrarlos por búsqueda', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          json: async () => [
            {
              id: 'e1',
              nombre: 'Tiro corto',
              descripcion: 'Finalizaciones cerca del aro',
              categoria: 'Tiro',
              subcategoria: null,
              objetivos: null,
              materiales: ['Balon'],
              duracion: 10,
              intensidad: 'Media',
              nivel: 'Intermedio',
              series: 3,
              repeticiones: '8',
              descanso: null,
              instrucciones: null,
              videoUrl: null,
              imagenUrl: null,
              consejos: [],
              variantes: [],
              esPublico: true,
              creadoPor: { id: 'ent-1', nombre: 'Martina', apellidos: 'Lopez' },
              createdAt: '2026-04-20T10:00:00.000Z',
            },
            {
              id: 'e2',
              nombre: 'Closeout lateral',
              descripcion: 'Recuperación defensiva',
              categoria: 'Defensa',
              subcategoria: null,
              objetivos: null,
              materiales: [],
              duracion: 12,
              intensidad: 'Alta',
              nivel: 'Avanzado',
              series: 4,
              repeticiones: '6',
              descanso: null,
              instrucciones: null,
              videoUrl: null,
              imagenUrl: null,
              consejos: [],
              variantes: [],
              esPublico: false,
              creadoPor: { id: 'ent-2', nombre: 'Diego', apellidos: 'Ramirez' },
              createdAt: '2026-04-20T09:00:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          json: async () => [
            { id: 'ent-1', nombre: 'Martina', apellidos: 'Lopez', activo: true },
            { id: 'ent-2', nombre: 'Diego', apellidos: 'Ramirez', activo: true },
            { id: 'ent-3', nombre: 'Inactivo', apellidos: 'Club', activo: false },
          ],
        })
    )

    const user = userEvent.setup()
    render(React.createElement(BibliotecaEjerciciosPage))

    expect(await screen.findByText('Tiro corto')).toBeInTheDocument()
    expect(screen.getByText('Closeout lateral')).toBeInTheDocument()
    expect(screen.getByText('Entrenadores con registros')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/buscar por nombre, categoría o creador/i), 'diego')

    expect(screen.getByText('Closeout lateral')).toBeInTheDocument()
    expect(screen.queryByText('Tiro corto')).not.toBeInTheDocument()
  })

  it('permite a un entrenador crear un ejercicio nuevo', async () => {
    localStorage.setItem(
      'entrenador',
      JSON.stringify({ id: 'ent-1', nombre: 'Martina', apellidos: 'Lopez' })
    )

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => [] })
      .mockResolvedValueOnce({
        json: async () => [{ id: 'ent-1', nombre: 'Martina', apellidos: 'Lopez', activo: true }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'e9', nombre: 'Tiro con pase extra' }),
      })
      .mockResolvedValueOnce({
        json: async () => [
          {
            id: 'e9',
            nombre: 'Tiro con pase extra',
            descripcion: 'Lectura y definición',
            categoria: 'Tiro',
            subcategoria: null,
            objetivos: null,
            materiales: ['Balon', 'Conos'],
            duracion: 18,
            intensidad: null,
            nivel: null,
            series: 4,
            repeticiones: null,
            descanso: null,
            instrucciones: null,
            videoUrl: null,
            imagenUrl: null,
            consejos: ['Mantener ritmo'],
            variantes: ['Con ayuda'],
            esPublico: true,
            creadoPor: { id: 'ent-1', nombre: 'Martina', apellidos: 'Lopez' },
            createdAt: '2026-04-20T11:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        json: async () => [{ id: 'ent-1', nombre: 'Martina', apellidos: 'Lopez', activo: true }],
      })

    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(React.createElement(BibliotecaEjerciciosPage))

    await screen.findByRole('button', { name: /\+ nuevo ejercicio/i })
    await user.click(screen.getByRole('button', { name: /\+ nuevo ejercicio/i }))

    await user.type(screen.getByPlaceholderText(/ej: tiros libres en series/i), 'Tiro con pase extra')
    await user.type(screen.getByPlaceholderText(/balón, conos, escalera/i), 'Balon, Conos')
    await user.type(
      screen.getByPlaceholderText(/mantén la espalda recta, controla la respiración/i),
      'Mantener ritmo'
    )
    await user.type(
      screen.getByPlaceholderText(/aumentar distancia, cambiar ángulo, con defensor/i),
      'Con ayuda'
    )
    await user.type(screen.getByPlaceholderText('15'), '18')
    await user.type(screen.getByPlaceholderText('3'), '4')

    const categoriaSelect = screen
      .getByText('Categoría *')
      .parentElement
      ?.querySelector('select') as HTMLSelectElement

    await user.selectOptions(categoriaSelect, 'Tiro')
    await user.click(screen.getByRole('button', { name: /crear ejercicio/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/ejercicios-biblioteca',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    const postCall = fetchMock.mock.calls.find((call) => call[0] === '/api/ejercicios-biblioteca')
    const payload = JSON.parse(postCall?.[1]?.body as string)

    expect(payload).toMatchObject({
      nombre: 'Tiro con pase extra',
      categoria: 'Tiro',
      materiales: ['Balon', 'Conos'],
      consejos: ['Mantener ritmo'],
      variantes: ['Con ayuda'],
      duracion: 18,
      series: 4,
      creadoPorId: 'ent-1',
      esPublico: true,
    })

    expect(await screen.findByText('Tiro con pase extra')).toBeInTheDocument()
  })
})
