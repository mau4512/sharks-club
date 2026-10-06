// Datos ficticios para revisar Caja. Reejecutable sin duplicar ni reemplazar registros.
const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd(), true)
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
  const url = new URL(process.env[key] || process.env.DATABASE_URL)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Este script solo permite PostgreSQL local')
}
const prisma = new PrismaClient()
async function main() {
  const tablas = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tarifas_mensuales_deportistas'`
  if (tablas.length === 0) {
    const sql = fs.readFileSync('prisma/migrations/20260821113000_add_tarifas_mensuales_deportistas/migration.sql', 'utf8')
    await prisma.$transaction(async (tx) => {
      for (const statement of sql.split(';').map((s) => s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement)
    })
  }
  const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'egresos_caja' AND column_name IN ('gastoFijoId', 'mesObligacion')`
  if (columns.length === 0) {
    const sql = fs.readFileSync('prisma/migrations/20261006120000_link_egresos_gastos_fijos/migration.sql', 'utf8')
    await prisma.$transaction(async (tx) => {
      for (const statement of sql.split(';').map((s) => s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement)
    })
  } else if (columns.length !== 2) throw new Error('La migración está incompleta; revisar antes de continuar')
  const mes = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' }).slice(0, 7)
  const fecha = new Date(`${mes}-01T12:00:00.000Z`)
  const nombres = ['Lucía', 'Mateo', 'Valentina', 'Sebastián', 'Camila', 'Nicolás', 'Sofía', 'Diego', 'Renata', 'Gabriel', 'Andrea', 'Joaquín', 'Mariana', 'Adrián', 'Daniela', 'Leonardo', 'Paula', 'Emiliano', 'Catalina', 'Bruno', 'Isabella', 'Thiago', 'Elena', 'Samuel']
  const grupos = [
    ['Mañana · Prueba', '08:00', 'diurno', 'interdiario', 12],
    ['Tarde · Prueba', '16:00', 'diurno', 'interdiario', 12],
    ['Noche · Prueba', '19:00', 'nocturno', 'diario', 20],
    ['Fin de semana · Prueba', '10:00', 'diurno', 'interdiario', 8],
  ]
  await prisma.$transaction(async (tx) => {
    for (let g = 0; g < grupos.length; g++) {
      const [nombre, hora, tipo, modalidad, planSesiones] = grupos[g]
      const turnoId = `demo-caja-turno-${g + 1}`
      await tx.turno.upsert({ where: { id: turnoId }, update: {}, create: { id: turnoId, nombre, hora, tipo, modalidad, seccion: 'general', capacidadMaxima: 10 } })
      for (let i = 0; i < 6; i++) {
        const n = g * 6 + i
        const id = `demo-caja-deportista-${n + 1}`
        await tx.deportista.upsert({ where: { id }, update: {}, create: { id, nombre: nombres[n], apellidos: `Demo ${String(n + 1).padStart(2, '0')}`, turnoId, planSesiones, activo: true, periodosInactividad: [] } })
        const esperado = planSesiones === 8 ? 120 : 180
        const monto = [esperado, esperado / 2, 0, esperado, esperado / 3, 0][i]
        if (monto) {
          const pagoId = `demo-caja-pago-${mes}-${n + 1}`
          await tx.pagoDeportista.upsert({ where: { id: pagoId }, update: {}, create: { id: pagoId, deportistaId: id, concepto: 'mensualidad', metodo: ['efectivo', 'yape', 'transferencia'][i % 3], monto, montoEsperado: esperado, fechaPago: fecha, mesCoberturaInicio: fecha, mesCoberturaFin: fecha, observacion: 'Dato ficticio para pruebas locales de Caja' } })
        }
      }
    }
    for (const [slug, nombre, categoria, monto, pagado] of [
      ['profesor', 'Profesor · Prueba', 'sueldos', 1000, 300],
      ['sunat', 'SUNAT · Prueba', 'impuestos', 150, 150],
      ['alquiler', 'Cancha · Prueba', 'alquiler', 800, 0],
    ]) {
      const id = `demo-caja-gasto-${slug}`
      await tx.gastoFijo.upsert({ where: { id }, update: {}, create: { id, nombre, categoria, monto, metodo: 'transferencia', activo: true, diaVencimiento: 10, createdAt: fecha, observacion: 'Dato ficticio para pruebas locales de Caja' } })
      if (pagado) {
        const egresoId = `demo-caja-egreso-${mes}-${slug}`
        await tx.egresoCaja.upsert({ where: { id: egresoId }, update: {}, create: { id: egresoId, categoria, metodo: 'transferencia', beneficiario: nombre, monto: pagado, fechaEgreso: fecha, gastoFijoId: id, mesObligacion: mes, observacion: 'Dato ficticio para pruebas locales de Caja' } })
      }
    }
  })
  console.log(JSON.stringify({ mes, turnosPrueba: await prisma.turno.count({ where: { id: { startsWith: 'demo-caja-' } } }), deportistasPrueba: await prisma.deportista.count({ where: { id: { startsWith: 'demo-caja-' } } }), totalTurnos: await prisma.turno.count(), totalDeportistas: await prisma.deportista.count() }))
}
main().catch((error) => { console.error(error.message); process.exitCode = 1 }).finally(() => prisma.$disconnect())
