export interface PizarraEditableState {
  strokes?: Array<{
    points: Array<{ x: number; y: number }>
    color: string
    lineWidth: number
  }>
  shapes?: Array<{
    type: string
    x: number
    y: number
    endX?: number
    endY?: number
    label?: string
  }>
}

export interface PizarraEjercicio {
  tipo: 'media' | 'completa'
  data: string
  state?: PizarraEditableState
}

export interface EjercicioConPizarras {
  tipoRecurso?: string
  pizarra?: PizarraEjercicio | null
  pizarras?: PizarraEjercicio[] | null
}

export function getPizarrasEjercicio(ejercicio?: EjercicioConPizarras | null): PizarraEjercicio[] {
  if (!ejercicio || ejercicio.tipoRecurso !== 'pizarra') return []

  const pizarras = Array.isArray(ejercicio.pizarras)
    ? ejercicio.pizarras.filter(
        (pizarra): pizarra is PizarraEjercicio =>
          Boolean(pizarra?.data && (pizarra.tipo === 'media' || pizarra.tipo === 'completa'))
      )
    : []

  if (pizarras.length > 0) return pizarras

  if (ejercicio.pizarra?.data && (ejercicio.pizarra.tipo === 'media' || ejercicio.pizarra.tipo === 'completa')) {
    return [ejercicio.pizarra]
  }

  return []
}
