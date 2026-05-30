import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function buildTituloPartido(body: Record<string, any>, rivalFallback: string) {
  const rival = (body.rival !== undefined ? body.rival : rivalFallback)?.trim()
  const partes = [
    body.categoria?.trim(),
    body.competencia?.trim(),
    rival ? `vs ${rival}` : '',
  ].filter(Boolean)

  if (partes.length <= 1 && rival) {
    return `Partido vs ${rival}`
  }

  return partes.join(' · ')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const partidoExistente = await prisma.partidoEntrenador.findUnique({
      where: { id: params.id },
    })

    if (!partidoExistente) {
      return NextResponse.json(
        { error: 'Partido no encontrado' },
        { status: 404 }
      )
    }

    const partido = await prisma.partidoEntrenador.update({
      where: { id: params.id },
      data: {
        turnoId: body.turnoId !== undefined ? body.turnoId || null : partidoExistente.turnoId,
        rival: body.rival !== undefined ? body.rival.trim() : partidoExistente.rival,
        competencia: body.competencia !== undefined ? body.competencia?.trim() || null : partidoExistente.competencia,
        categoria: body.categoria !== undefined ? body.categoria?.trim() || null : partidoExistente.categoria,
        titulo: buildTituloPartido(
          {
            rival: body.rival !== undefined ? body.rival : partidoExistente.rival,
            competencia: body.competencia !== undefined ? body.competencia : partidoExistente.competencia,
            categoria: body.categoria !== undefined ? body.categoria : partidoExistente.categoria,
          },
          partidoExistente.rival
        ),
        sede: body.sede !== undefined ? body.sede?.trim() || null : partidoExistente.sede,
        fechaPartido: body.fechaPartido ? new Date(`${body.fechaPartido}T12:00:00`) : partidoExistente.fechaPartido,
        horaPartido: body.horaPartido !== undefined ? body.horaPartido : partidoExistente.horaPartido,
        estado: body.estado !== undefined ? body.estado : partidoExistente.estado,
        resultadoPropio: body.resultadoPropio !== undefined ? (Number.isFinite(body.resultadoPropio) ? body.resultadoPropio : null) : partidoExistente.resultadoPropio,
        resultadoRival: body.resultadoRival !== undefined ? (Number.isFinite(body.resultadoRival) ? body.resultadoRival : null) : partidoExistente.resultadoRival,
        analisisGeneral: body.analisisGeneral !== undefined ? body.analisisGeneral?.trim() || null : partidoExistente.analisisGeneral,
        erroresDeficiencias: body.erroresDeficiencias !== undefined ? body.erroresDeficiencias?.trim() || null : partidoExistente.erroresDeficiencias,
        correccionesProximaSemana: body.correccionesProximaSemana !== undefined ? body.correccionesProximaSemana?.trim() || null : partidoExistente.correccionesProximaSemana,
        microcicloTrabajo: body.microcicloTrabajo !== undefined ? body.microcicloTrabajo?.trim() || null : partidoExistente.microcicloTrabajo,
      },
    })

    return NextResponse.json(partido)
  } catch (error) {
    console.error('Error al actualizar partido del entrenador:', error)
    return NextResponse.json(
      { error: 'Error al actualizar partido del entrenador' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.partidoEntrenador.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al eliminar partido del entrenador:', error)
    return NextResponse.json(
      { error: 'Error al eliminar partido del entrenador' },
      { status: 500 }
    )
  }
}
