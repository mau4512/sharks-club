'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const dataTiro = [
  { mes: 'Sep', tirosLibres: 72, triples: 35, mediaDistancia: 48 },
  { mes: 'Oct', tirosLibres: 75, triples: 38, mediaDistancia: 52 },
  { mes: 'Nov', tirosLibres: 78, triples: 40, mediaDistancia: 55 },
  { mes: 'Dic', tirosLibres: 76, triples: 42, mediaDistancia: 58 },
  { mes: 'Ene', tirosLibres: 80, triples: 45, mediaDistancia: 60 },
]

const dataFisico = [
  { mes: 'Sep', saltoVertical: 65, velocidad: 4.2, fuerza: 85 },
  { mes: 'Oct', saltoVertical: 67, velocidad: 4.3, fuerza: 90 },
  { mes: 'Nov', saltoVertical: 68, velocidad: 4.4, fuerza: 95 },
  { mes: 'Dic', saltoVertical: 70, velocidad: 4.5, fuerza: 100 },
  { mes: 'Ene', saltoVertical: 72, velocidad: 4.6, fuerza: 105 },
]

const dataSesiones = [
  { semana: 'S1', sesiones: 4, horas: 6 },
  { semana: 'S2', sesiones: 5, horas: 7.5 },
  { semana: 'S3', sesiones: 4, horas: 6 },
  { semana: 'S4', sesiones: 6, horas: 9 },
]

export default function EstadisticasPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Estadísticas y Evolución</h1>
        <p className="text-gray-600 mt-2">Visualiza tu progreso a lo largo del tiempo</p>
      </div>

      {/* Evolución de Tiro */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Evolución de Porcentajes de Tiro</h2>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dataTiro}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="tirosLibres" 
                stroke="#f97316" 
                strokeWidth={2}
                name="Tiros Libres (%)"
              />
              <Line 
                type="monotone" 
                dataKey="triples" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Triples (%)"
              />
              <Line 
                type="monotone" 
                dataKey="mediaDistancia" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Media Distancia (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Progreso Físico */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Progreso Físico</h2>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataFisico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="saltoVertical" fill="#f97316" name="Salto Vertical (cm)" />
              <Bar dataKey="fuerza" fill="#3b82f6" name="Fuerza (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volumen de Entrenamiento */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Volumen de Entrenamiento (Último Mes)</h2>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataSesiones}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sesiones" fill="#10b981" name="Sesiones" />
              <Bar dataKey="horas" fill="#8b5cf6" name="Horas totales" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumen de estadísticas clave */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-600">Mejor % Tiro Libre</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary-600">80%</p>
            <p className="text-sm text-gray-500 mt-1">+8% vs inicio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-600">Salto Vertical</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">72cm</p>
            <p className="text-sm text-gray-500 mt-1">+7cm vs inicio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-600">Total Sesiones</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">19</p>
            <p className="text-sm text-gray-500 mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-600">Horas Entrenadas</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">28.5h</p>
            <p className="text-sm text-gray-500 mt-1">Este mes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
