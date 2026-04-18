import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Activity, Target, TrendingUp, ClipboardList } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido a tu panel de entrenamiento</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Sesiones esta semana"
          value="5"
          icon={<ClipboardList className="h-8 w-8 text-primary-600" />}
          trend="+2 vs semana pasada"
        />
        <StatCard
          title="% Tiro promedio"
          value="67%"
          icon={<Target className="h-8 w-8 text-green-600" />}
          trend="+5% este mes"
        />
        <StatCard
          title="Ejercicios completados"
          value="24"
          icon={<Activity className="h-8 w-8 text-blue-600" />}
          trend="Este mes"
        />
        <StatCard
          title="Progreso físico"
          value="+8%"
          icon={<TrendingUp className="h-8 w-8 text-purple-600" />}
          trend="Último mes"
        />
      </div>

      {/* Secciones principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Últimas Sesiones</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SessionItem
                date="26 Enero 2026"
                type="Entrenamiento"
                duration="90 min"
              />
              <SessionItem
                date="24 Enero 2026"
                type="Preparación Física"
                duration="60 min"
              />
              <SessionItem
                date="22 Enero 2026"
                type="Entrenamiento"
                duration="120 min"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Objetivos del Mes</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <GoalItem
                title="Tiros libres"
                current={75}
                target={80}
                unit="%"
              />
              <GoalItem
                title="Triples"
                current={38}
                target={45}
                unit="%"
              />
              <GoalItem
                title="Sesiones completadas"
                current={12}
                target={20}
                unit=""
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  trend 
}: { 
  title: string
  value: string
  icon: React.ReactNode
  trend: string
}) {
  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          </div>
          <div>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionItem({ 
  date, 
  type, 
  duration 
}: { 
  date: string
  type: string
  duration: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{type}</p>
        <p className="text-sm text-gray-600">{date}</p>
      </div>
      <span className="text-sm text-gray-500">{duration}</span>
    </div>
  )
}

function GoalItem({ 
  title, 
  current, 
  target, 
  unit 
}: { 
  title: string
  current: number
  target: number
  unit: string
}) {
  const percentage = (current / target) * 100

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <span className="text-sm text-gray-600">
          {current}{unit} / {target}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
