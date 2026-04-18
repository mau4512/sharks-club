import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Link from 'next/link'
import { Users, Activity, TrendingUp, Calendar, Target, Wallet } from 'lucide-react'
import { prisma } from '@/lib/prisma'

// Forzar rendering dinámico
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getEstadisticas() {
  // Obtener el total de deportistas y deportistas activos
  const totalDeportistas = await prisma.deportista.count()
  const deportistasActivos = await prisma.deportista.count({
    where: { activo: true }
  })

  // Obtener sesiones del mes actual
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  
  const sesionesDelMes = await prisma.sesion.count({
    where: {
      fecha: { gte: inicioMes }
    }
  })

  // Calcular estadísticas de mediciones de tiro del último mes
  const medicionesTiro = await prisma.medicionTiro.findMany({
    where: {
      sesion: {
        fecha: { gte: inicioMes }
      }
    },
    select: {
      porcentaje: true
    }
  })

  const promedioAsistencia = sesionesDelMes > 0 
    ? Math.round((sesionesDelMes / (deportistasActivos * 30)) * 100) 
    : 0

  // Calcular mejora promedio en tiro
  const mejoraPromedio = medicionesTiro.length > 0
    ? Math.round(medicionesTiro.reduce((acc, m) => acc + (m.porcentaje || 0), 0) / medicionesTiro.length)
    : 0

  return {
    totalDeportistas,
    deportistasActivos,
    sesionesDelMes,
    promedioAsistencia,
    mejoraPromedio
  }
}

export default async function AdminPage() {
  const stats = await getEstadisticas()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">Gestiona deportistas y monitorea el rendimiento general</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/deportistas">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Deportistas</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalDeportistas}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.deportistasActivos} Activos</p>
                </div>
                <Users className="h-10 w-10 text-primary-600" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sesiones del Mes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.sesionesDelMes}</p>
                <p className="text-xs text-gray-500 mt-1">Total registradas</p>
              </div>
              <Activity className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio Asistencia</p>
                <p className="text-3xl font-bold text-gray-900">{stats.promedioAsistencia}%</p>
                <p className="text-xs text-gray-500 mt-1">Último mes</p>
              </div>
              <Calendar className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio de Tiro</p>
                <p className="text-3xl font-bold text-gray-900">{stats.mejoraPromedio}%</p>
                <p className="text-xs text-gray-500 mt-1">Último mes</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Acciones Rápidas</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/deportistas/nuevo"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center"
            >
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Registrar Nuevo Deportista</p>
              <p className="text-sm text-gray-600">Añadir un nuevo atleta al sistema</p>
            </Link>
            
            <Link
              href="/admin/deportistas"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center"
            >
              <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Ver Lista de Deportistas</p>
              <p className="text-sm text-gray-600">Gestionar todos los deportistas</p>
            </Link>

            <Link
              href="/admin/turnos"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center"
            >
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Gestionar Turnos</p>
              <p className="text-sm text-gray-600">Administrar horarios de entrenamiento</p>
            </Link>

            <Link
              href="/admin/ejercicios-tiro"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center"
            >
              <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Ejercicios de Tiro</p>
              <p className="text-sm text-gray-600">Configurar ejercicios de tiro</p>
            </Link>

            <Link
              href="/admin/caja"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center"
            >
              <Wallet className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Caja</p>
              <p className="text-sm text-gray-600">Registrar y consultar pagos</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
