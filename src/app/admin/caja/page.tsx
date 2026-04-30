'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowDownCircle, ArrowUpCircle, Banknote, CreditCard, Search, Wallet } from 'lucide-react'
import { toast } from 'sonner'

interface Deportista {
  id: string
  nombre: string
  apellidos: string
  documentoIdentidad: string
}

interface Pago {
  id: string
  concepto: string
  metodo: string
  monto: number
  fechaPago: string
  observacion?: string | null
  deportista: Deportista
}

interface Egreso {
  id: string
  categoria: string
  metodo: string
  beneficiario: string
  monto: number
  fechaEgreso: string
  observacion?: string | null
}

const conceptosIngreso = [
  { value: 'inscripcion', label: 'Inscripción' },
  { value: 'mensualidad', label: 'Mensualidad' },
  { value: 'uniforme', label: 'Uniforme' },
  { value: 'otro', label: 'Otro' },
]

const categoriasEgreso = [
  { value: 'sueldos', label: 'Sueldos' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'prestamos', label: 'Préstamos' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'otros', label: 'Otros' },
]

const metodos = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'otro', label: 'Otro' },
]

type MovimientoCaja =
  | {
      id: string
      tipo: 'ingreso'
      concepto: string
      metodo: string
      monto: number
      fecha: string
      titulo: string
      subtitulo: string
      observacion?: string | null
    }
  | {
      id: string
      tipo: 'egreso'
      concepto: string
      metodo: string
      monto: number
      fecha: string
      titulo: string
      subtitulo: string
      observacion?: string | null
    }

function CajaPageContent() {
  const searchParams = useSearchParams()
  const deportistaIdParam = searchParams.get('deportistaId') || ''

  const [deportistas, setDeportistas] = useState<Deportista[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [egresos, setEgresos] = useState<Egreso[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmittingIngreso, setIsSubmittingIngreso] = useState(false)
  const [isSubmittingEgreso, setIsSubmittingEgreso] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [ingresoData, setIngresoData] = useState({
    deportistaId: deportistaIdParam,
    concepto: 'mensualidad',
    metodo: 'efectivo',
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0],
    observacion: '',
  })
  const [egresoData, setEgresoData] = useState({
    categoria: 'sueldos',
    metodo: 'efectivo',
    beneficiario: '',
    monto: '',
    fechaEgreso: new Date().toISOString().split('T')[0],
    observacion: '',
  })

  useEffect(() => {
    fetchData(deportistaIdParam)
  }, [deportistaIdParam])

  const fetchData = async (deportistaId?: string) => {
    try {
      setLoading(true)

      const [deportistasRes, pagosRes, egresosRes] = await Promise.all([
        fetch('/api/deportistas'),
        fetch(deportistaId ? `/api/pagos?deportistaId=${deportistaId}` : '/api/pagos'),
        fetch('/api/egresos'),
      ])

      const deportistasData = await deportistasRes.json()
      const pagosData = await pagosRes.json()
      const egresosData = await egresosRes.json()

      setDeportistas(Array.isArray(deportistasData) ? deportistasData : [])
      setPagos(Array.isArray(pagosData) ? pagosData : [])
      setEgresos(Array.isArray(egresosData) ? egresosData : [])
    } catch (error) {
      console.error('Error al cargar caja:', error)
      setDeportistas([])
      setPagos([])
      setEgresos([])
    } finally {
      setLoading(false)
    }
  }

  const movimientos = useMemo<MovimientoCaja[]>(() => {
    const ingresosMap = pagos.map((pago) => ({
      id: pago.id,
      tipo: 'ingreso' as const,
      concepto: pago.concepto,
      metodo: pago.metodo,
      monto: pago.monto,
      fecha: pago.fechaPago,
      titulo: `${pago.deportista.nombre} ${pago.deportista.apellidos}`,
      subtitulo: `DNI: ${pago.deportista.documentoIdentidad}`,
      observacion: pago.observacion,
    }))

    const egresosMap = egresos.map((egreso) => ({
      id: egreso.id,
      tipo: 'egreso' as const,
      concepto: egreso.categoria,
      metodo: egreso.metodo,
      monto: egreso.monto,
      fecha: egreso.fechaEgreso,
      titulo: egreso.beneficiario,
      subtitulo: `Categoría: ${egreso.categoria}`,
      observacion: egreso.observacion,
    }))

    return [...ingresosMap, ...egresosMap].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )
  }, [pagos, egresos])

  const movimientosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return movimientos

    return movimientos.filter((movimiento) =>
      movimiento.titulo.toLowerCase().includes(term) ||
      movimiento.subtitulo.toLowerCase().includes(term) ||
      movimiento.concepto.toLowerCase().includes(term) ||
      movimiento.metodo.toLowerCase().includes(term)
    )
  }, [movimientos, busqueda])

  const resumen = useMemo(() => {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const ingresosMes = pagos.filter((pago) => new Date(pago.fechaPago) >= inicioMes)
    const egresosMes = egresos.filter((egreso) => new Date(egreso.fechaEgreso) >= inicioMes)

    const totalIngresos = pagos.reduce((acc, pago) => acc + pago.monto, 0)
    const totalEgresos = egresos.reduce((acc, egreso) => acc + egreso.monto, 0)
    const ingresosDelMes = ingresosMes.reduce((acc, pago) => acc + pago.monto, 0)
    const egresosDelMes = egresosMes.reduce((acc, egreso) => acc + egreso.monto, 0)

    return {
      totalIngresos,
      totalEgresos,
      saldoNeto: totalIngresos - totalEgresos,
      ingresosDelMes,
      egresosDelMes,
      movimientos: movimientos.length,
    }
  }, [pagos, egresos, movimientos.length])

  const handleIngresoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setIngresoData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleEgresoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setEgresoData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleIngresoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingIngreso(true)

    try {
      const response = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingresoData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo registrar el ingreso')
      }

      setIngresoData((prev) => ({
        ...prev,
        monto: '',
        observacion: '',
      }))

      await fetchData(ingresoData.deportistaId || deportistaIdParam)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al registrar el ingreso')
    } finally {
      setIsSubmittingIngreso(false)
    }
  }

  const handleEgresoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingEgreso(true)

    try {
      const response = await fetch('/api/egresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(egresoData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo registrar el egreso')
      }

      setEgresoData((prev) => ({
        ...prev,
        beneficiario: '',
        monto: '',
        observacion: '',
      }))

      await fetchData(ingresoData.deportistaId || deportistaIdParam)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al registrar el egreso')
    } finally {
      setIsSubmittingEgreso(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Caja</h1>
          <p className="text-gray-600 mt-2">Controla ingresos, egresos y el flujo real de caja del club.</p>
        </div>
        <Link href="/admin/deportistas" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            Volver a Deportistas
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
                <p className="text-3xl font-bold text-gray-900">S/ {resumen.totalIngresos.toFixed(2)}</p>
              </div>
              <Wallet className="h-10 w-10 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Egresos Totales</p>
                <p className="text-3xl font-bold text-gray-900">S/ {resumen.totalEgresos.toFixed(2)}</p>
              </div>
              <ArrowUpCircle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Neto</p>
                <p className={`text-3xl font-bold ${resumen.saldoNeto >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  S/ {resumen.saldoNeto.toFixed(2)}
                </p>
              </div>
              <Banknote className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos del Mes</p>
                <p className="text-3xl font-bold text-gray-900">S/ {resumen.ingresosDelMes.toFixed(2)}</p>
              </div>
              <ArrowDownCircle className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Movimientos</p>
                <p className="text-3xl font-bold text-gray-900">{resumen.movimientos}</p>
                <p className="text-xs text-gray-500 mt-1">Egresos del mes: S/ {resumen.egresosDelMes.toFixed(2)}</p>
              </div>
              <CreditCard className="h-10 w-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Registrar Ingreso</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIngresoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deportista</label>
                <select
                  name="deportistaId"
                  value={ingresoData.deportistaId}
                  onChange={handleIngresoChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  <option value="">Seleccionar deportista</option>
                  {deportistas.map((deportista) => (
                    <option key={deportista.id} value={deportista.id}>
                      {deportista.nombre} {deportista.apellidos} - {deportista.documentoIdentidad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                  <select
                    name="concepto"
                    value={ingresoData.concepto}
                    onChange={handleIngresoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    {conceptosIngreso.map((concepto) => (
                      <option key={concepto.value} value={concepto.value}>
                        {concepto.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                  <select
                    name="metodo"
                    value={ingresoData.metodo}
                    onChange={handleIngresoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    {metodos.map((metodo) => (
                      <option key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Monto (S/)"
                  name="monto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={ingresoData.monto}
                  onChange={handleIngresoChange}
                  required
                  placeholder="Ej: 150.00"
                />
                <Input
                  label="Fecha de ingreso"
                  name="fechaPago"
                  type="date"
                  value={ingresoData.fechaPago}
                  onChange={handleIngresoChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                <textarea
                  name="observacion"
                  value={ingresoData.observacion}
                  onChange={handleIngresoChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Detalle del pago, referencia o comentario"
                />
              </div>

              <Button type="submit" disabled={isSubmittingIngreso} className="w-full">
                {isSubmittingIngreso ? 'Registrando ingreso...' : 'Registrar Ingreso'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Registrar Egreso</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEgresoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    name="categoria"
                    value={egresoData.categoria}
                    onChange={handleEgresoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    {categoriasEgreso.map((categoria) => (
                      <option key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                  <select
                    name="metodo"
                    value={egresoData.metodo}
                    onChange={handleEgresoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    {metodos.map((metodo) => (
                      <option key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Beneficiario / Destino del pago"
                name="beneficiario"
                type="text"
                value={egresoData.beneficiario}
                onChange={handleEgresoChange}
                required
                placeholder="Ej: Profesor Juan Pérez, Alquiler del coliseo"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Monto (S/)"
                  name="monto"
                  type="number"
                  min="0"
                  step="0.01"
                  value={egresoData.monto}
                  onChange={handleEgresoChange}
                  required
                  placeholder="Ej: 600.00"
                />
                <Input
                  label="Fecha de egreso"
                  name="fechaEgreso"
                  type="date"
                  value={egresoData.fechaEgreso}
                  onChange={handleEgresoChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                <textarea
                  name="observacion"
                  value={egresoData.observacion}
                  onChange={handleEgresoChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Detalle del egreso, número de recibo o comentario"
                />
              </div>

              <Button type="submit" disabled={isSubmittingEgreso} className="w-full">
                {isSubmittingEgreso ? 'Registrando egreso...' : 'Registrar Egreso'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Movimientos de Caja</h2>
              <p className="text-sm text-gray-600 mt-1">Historial consolidado de ingresos y egresos</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por persona, categoría o método"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-gray-900"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600">Cargando movimientos...</p>
          ) : movimientosFiltrados.length === 0 ? (
            <p className="text-gray-600">No hay movimientos registrados todavía.</p>
          ) : (
            <div className="space-y-3">
              {movimientosFiltrados.map((movimiento) => (
                <div
                  key={`${movimiento.tipo}-${movimiento.id}`}
                  className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {movimiento.tipo === 'ingreso' ? (
                        <ArrowDownCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-600" />
                      )}
                      <p className="font-semibold text-gray-900">{movimiento.titulo}</p>
                    </div>
                    <div className="mt-1 flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-3">
                      <span>{movimiento.subtitulo}</span>
                      <span>Concepto: {movimiento.concepto}</span>
                      <span>Método: {movimiento.metodo}</span>
                      <span>Fecha: {new Date(movimiento.fecha).toLocaleDateString('es-PE')}</span>
                    </div>
                    {movimiento.observacion && (
                      <p className="text-sm text-gray-500 mt-2">{movimiento.observacion}</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-gray-500">{movimiento.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</p>
                    <p
                      className={`text-2xl font-bold ${
                        movimiento.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {movimiento.tipo === 'ingreso' ? '+' : '-'} S/ {movimiento.monto.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function CajaPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-600">Cargando caja...</div>}>
      <CajaPageContent />
    </Suspense>
  )
}
