import { prisma } from '@/lib/prisma'

export async function validarObligacion(gastoFijoId: unknown, mesObligacion: unknown) {
  if (!gastoFijoId) {
    if (mesObligacion) throw new Error('Selecciona el gasto fijo correspondiente al mes')
    return { gastoFijoId: null, mesObligacion: null }
  }
  if (typeof gastoFijoId !== 'string' || typeof mesObligacion !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mesObligacion)) {
    throw new Error('Selecciona un gasto fijo y un mes de obligación válido')
  }
  const gasto = await prisma.gastoFijo.findUnique({ where: { id: gastoFijoId } })
  if (!gasto) throw new Error('El gasto fijo no existe')
  return { gastoFijoId, mesObligacion }
}
