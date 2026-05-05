'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowDownCircle, ArrowUpCircle, Banknote, CreditCard, Pencil, Search, Trash2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { getRecurringMonthsCount, inferExpectedAmount, TARIFA_MENSUAL_OPTIONS, type TarifaMensual } from '@/lib/pagos-config'

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
  montoEsperado?: number | null
  fechaPago: string
  createdAt?: string
  mesCoberturaInicio?: string | null
  mesCoberturaFin?: string | null
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
  createdAt?: string
  observacion?: string | null
}

const conceptosIngreso = [
  { value: 'inscripcion', label: 'Inscripción' },
  { value: 'mensualidad', label: 'Mensualidad' },
  { value: 'anualidad', label: 'Anual' },
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
      registradoEn?: string
      deportistaId?: string
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
      registradoEn?: string
      observacion?: string | null
    }

function CajaPageContent() {
  const searchParams = useSearchParams()
  const deportistaIdParam = searchParams.get('deportistaId') || ''
  const pagoDirecto = Boolean(deportistaIdParam)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [deportistas, setDeportistas] = useState<Deportista[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [egresos, setEgresos] = useState<Egreso[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmittingIngreso, setIsSubmittingIngreso] = useState(false)
  const [isSubmittingEgreso, setIsSubmittingEgreso] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [mesSeleccionado, setMesSeleccionado] = useState(currentMonth)
  const [tipoMovimiento, setTipoMovimiento] = useState<'ingreso' | 'egreso'>('ingreso')
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null)
  const [ingresoData, setIngresoData] = useState({
    deportistaId: deportistaIdParam,
    concepto: 'mensualidad',
    metodo: 'efectivo',
    modoPago: 'total' as 'total' | 'parcial',
    tarifaMensual: 'regular' as TarifaMensual,
    montoEspecialComoTotal: false,
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0],
    mesCoberturaInicio: new Date().toISOString().slice(0, 7),
    mesCoberturaFin: new Date().toISOString().slice(0, 7),
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

  const formatLimaDate = (value: string) =>
    new Date(value).toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
    })

  const formatLimaTime = (value: string) =>
    new Date(value).toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
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
        deportistaId ? Promise.resolve(null) : fetch('/api/egresos'),
      ])

      const deportistasData = await deportistasRes.json()
      const pagosData = await pagosRes.json()
      const egresosData = egresosRes ? await egresosRes.json() : []

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
    const ingresosMap = pagos.map((pago) => {
      const coverageInicio = pago.mesCoberturaInicio?.slice(0, 7)
      const coverageFin = pago.mesCoberturaFin?.slice(0, 7)
      const coverageLabel =
        (pago.concepto === 'mensualidad' || pago.concepto === 'anualidad') && coverageInicio
          ? coverageInicio === coverageFin || !coverageFin
            ? `Cubre: ${coverageInicio}`
            : `Cubre: ${coverageInicio} a ${coverageFin}`
          : null
      const paymentStatus =
        pago.montoEsperado && pago.montoEsperado > 0
          ? pago.monto >= pago.montoEsperado
            ? 'Pago total'
            : `Pago parcial (${Math.round((pago.monto / pago.montoEsperado) * 100)}%)`
          : null

      const observacion = [coverageLabel, paymentStatus, pago.observacion].filter(Boolean).join(' · ') || null

      return {
        id: pago.id,
        tipo: 'ingreso' as const,
        concepto: pago.concepto,
        metodo: pago.metodo,
        monto: pago.monto,
        fecha: pago.fechaPago,
        registradoEn: pago.createdAt || pago.fechaPago,
        deportistaId: pago.deportista.id,
        titulo: `${pago.deportista.nombre} ${pago.deportista.apellidos}`,
        subtitulo: `DNI: ${pago.deportista.documentoIdentidad}`,
        observacion,
      }
    })

    const egresosMap = egresos.map((egreso) => ({
      id: egreso.id,
      tipo: 'egreso' as const,
      concepto: egreso.categoria,
      metodo: egreso.metodo,
      monto: egreso.monto,
      fecha: egreso.fechaEgreso,
      registradoEn: egreso.createdAt || egreso.fechaEgreso,
      titulo: egreso.beneficiario,
      subtitulo: `Categoría: ${egreso.categoria}`,
      observacion: egreso.observacion,
    }))

    return [...ingresosMap, ...egresosMap].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )
  }, [pagos, egresos])

  const mesesDisponibles = useMemo(() => {
    const months = new Set<string>([currentMonth])

    pagos.forEach((pago) => months.add(pago.fechaPago.slice(0, 7)))
    egresos.forEach((egreso) => months.add(egreso.fechaEgreso.slice(0, 7)))

    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [currentMonth, pagos, egresos])

  const movimientosDelPeriodo = useMemo(() => {
    if (pagoDirecto) return movimientos
    return movimientos.filter((movimiento) => movimiento.fecha.slice(0, 7) === mesSeleccionado)
  }, [movimientos, pagoDirecto, mesSeleccionado])

  const movimientosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return movimientosDelPeriodo

    return movimientosDelPeriodo.filter((movimiento) =>
      movimiento.titulo.toLowerCase().includes(term) ||
      movimiento.subtitulo.toLowerCase().includes(term) ||
      movimiento.concepto.toLowerCase().includes(term) ||
      movimiento.metodo.toLowerCase().includes(term)
    )
  }, [movimientosDelPeriodo, busqueda])

  const resumen = useMemo(() => {
    const ingresosPeriodo = pagoDirecto
      ? pagos
      : pagos.filter((pago) => pago.fechaPago.slice(0, 7) === mesSeleccionado)
    const egresosPeriodo = pagoDirecto
      ? egresos
      : egresos.filter((egreso) => egreso.fechaEgreso.slice(0, 7) === mesSeleccionado)

    const totalIngresos = ingresosPeriodo.reduce((acc, pago) => acc + pago.monto, 0)
    const totalEgresos = egresosPeriodo.reduce((acc, egreso) => acc + egreso.monto, 0)

    return {
      totalIngresos,
      totalEgresos,
      saldoNeto: totalIngresos - totalEgresos,
      movimientos: movimientosDelPeriodo.length,
    }
  }, [egresos, mesSeleccionado, movimientosDelPeriodo.length, pagoDirecto, pagos])

  const deportistaSeleccionado = deportistas.find((deportista) => deportista.id === ingresoData.deportistaId)

  const montoEsperadoSugerido = useMemo(
    () =>
      inferExpectedAmount({
        concepto: ingresoData.concepto,
        mesCoberturaInicio: ingresoData.mesCoberturaInicio,
        mesCoberturaFin: ingresoData.mesCoberturaFin,
        tarifaMensual: ingresoData.tarifaMensual as TarifaMensual,
      }),
    [ingresoData.concepto, ingresoData.mesCoberturaFin, ingresoData.mesCoberturaInicio, ingresoData.tarifaMensual]
  )

  const montoEsperado = useMemo(() => {
    const montoIngresado = Number(ingresoData.monto)
    if (
      ingresoData.modoPago === 'total' &&
      ingresoData.montoEspecialComoTotal &&
      !Number.isNaN(montoIngresado) &&
      montoIngresado > 0
    ) {
      return montoIngresado
    }

    return montoEsperadoSugerido
  }, [ingresoData.modoPago, ingresoData.monto, ingresoData.montoEspecialComoTotal, montoEsperadoSugerido])

  const porcentajeCubierto = useMemo(() => {
    const monto = Number(ingresoData.monto)
    if (!montoEsperado || Number.isNaN(monto) || monto <= 0) return 0
    return Math.max(0, Math.min(100, Math.round((monto / montoEsperado) * 100)))
  }, [ingresoData.monto, montoEsperado])

  useEffect(() => {
    if (ingresoData.modoPago !== 'total' || ingresoData.montoEspecialComoTotal) return
    setIngresoData((prev) => ({
      ...prev,
      monto: String(montoEsperado),
    }))
  }, [
    ingresoData.concepto,
    ingresoData.mesCoberturaFin,
    ingresoData.mesCoberturaInicio,
    ingresoData.montoEspecialComoTotal,
    ingresoData.modoPago,
    ingresoData.tarifaMensual,
    montoEsperado,
  ])

  const setCoberturaMensual = (inicio: Date, fin?: Date) => {
    const start = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`
    const endDate = fin || inicio
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`

    setIngresoData((prev) => ({
      ...prev,
      concepto: 'mensualidad',
      mesCoberturaInicio: start,
      mesCoberturaFin: end,
    }))
  }

  const cargarPagoEnFormulario = (pago: Pago) => {
    const recurringMonths = getRecurringMonthsCount(
      pago.mesCoberturaInicio?.slice(0, 7),
      pago.mesCoberturaFin?.slice(0, 7) || pago.mesCoberturaInicio?.slice(0, 7)
    )
    const monthlyExpected =
      pago.montoEsperado && recurringMonths > 0 ? Math.round(pago.montoEsperado / recurringMonths) : null

    setEditingPagoId(pago.id)
    const tarifaMensual =
      pago.concepto === 'mensualidad' || pago.concepto === 'anualidad'
        ? monthlyExpected === 165
          ? 'hermanas'
          : monthlyExpected === 120
            ? 'finSemana'
            : monthlyExpected === 110
              ? 'finSemanaHermanas'
              : monthlyExpected === 60
                ? 'finSemana4'
                : 'regular'
        : 'regular'
    const montoEsperadoBase = inferExpectedAmount({
      concepto: pago.concepto,
      mesCoberturaInicio: pago.mesCoberturaInicio?.slice(0, 7),
      mesCoberturaFin: pago.mesCoberturaFin?.slice(0, 7) || pago.mesCoberturaInicio?.slice(0, 7),
      tarifaMensual,
    })

    setIngresoData({
      deportistaId: pago.deportista.id,
      concepto: pago.concepto,
      metodo: pago.metodo,
      modoPago: pago.montoEsperado && pago.monto < pago.montoEsperado ? 'parcial' : 'total',
      tarifaMensual,
      montoEspecialComoTotal:
        Boolean(pago.montoEsperado) &&
        pago.monto === pago.montoEsperado &&
        pago.montoEsperado !== montoEsperadoBase,
      monto: String(pago.monto),
      fechaPago: pago.fechaPago.slice(0, 10),
      mesCoberturaInicio: pago.mesCoberturaInicio?.slice(0, 7) || new Date().toISOString().slice(0, 7),
      mesCoberturaFin: pago.mesCoberturaFin?.slice(0, 7) || pago.mesCoberturaInicio?.slice(0, 7) || new Date().toISOString().slice(0, 7),
      observacion: pago.observacion || '',
    })
  }

  const resetIngresoForm = () => {
    setEditingPagoId(null)
    setIngresoData({
      deportistaId: deportistaIdParam,
      concepto: 'mensualidad',
      metodo: 'efectivo',
      modoPago: 'total',
      tarifaMensual: 'regular',
      montoEspecialComoTotal: false,
      monto: '',
      fechaPago: new Date().toISOString().split('T')[0],
      mesCoberturaInicio: new Date().toISOString().slice(0, 7),
      mesCoberturaFin: new Date().toISOString().slice(0, 7),
      observacion: '',
    })
  }

  const handleIngresoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    const isCheckbox = e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
    const nextValue = isCheckbox ? e.target.checked : value

    setIngresoData((prev) => {
      const next = {
        ...prev,
        [name]: nextValue,
      }

      if (
        next.modoPago === 'total' &&
        !next.montoEspecialComoTotal &&
        ['concepto', 'mesCoberturaInicio', 'mesCoberturaFin', 'tarifaMensual', 'modoPago'].includes(name)
      ) {
        next.monto = String(
          inferExpectedAmount({
            concepto: next.concepto,
            mesCoberturaInicio: next.mesCoberturaInicio,
            mesCoberturaFin: next.mesCoberturaFin,
            tarifaMensual: next.tarifaMensual as TarifaMensual,
          })
        )
      }

      if (
        name === 'concepto' &&
        value !== 'mensualidad' &&
        value !== 'anualidad'
      ) {
        next.tarifaMensual = 'regular'
      }

      if (name === 'modoPago' && value === 'parcial') {
        next.montoEspecialComoTotal = false
      }

      return next
    })
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

    const confirmed = await confirmDialog({
      title: 'Confirmar pago',
      description: '¿Estás seguro de realizar esta transacción?',
      confirmText: 'Registrar pago',
    })

    if (!confirmed) return

    setIsSubmittingIngreso(true)

    try {
      const targetResponse = await fetch(editingPagoId ? `/api/pagos/${editingPagoId}` : '/api/pagos', {
        method: editingPagoId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ingresoData,
          montoEsperado,
        }),
      })

      const data = await targetResponse.json()
      if (!targetResponse.ok) {
        throw new Error(data.error || 'No se pudo registrar el ingreso')
      }

      resetIngresoForm()
      toast.success(editingPagoId ? 'Pago actualizado exitosamente' : 'Pago registrado exitosamente')
      await fetchData(ingresoData.deportistaId || deportistaIdParam)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al registrar el ingreso')
    } finally {
      setIsSubmittingIngreso(false)
    }
  }

  const handleDeletePago = async (pago: Pago) => {
    const confirmed = await confirmDialog({
      title: 'Anular pago',
      description: '¿Estás seguro de anular este pago? Esta acción eliminará el registro.',
      confirmText: 'Anular pago',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/pagos/${pago.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo eliminar el pago')
      }

      if (editingPagoId === pago.id) {
        resetIngresoForm()
      }

      toast.success('Pago anulado exitosamente')
      await fetchData(ingresoData.deportistaId || deportistaIdParam)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al anular el pago')
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{pagoDirecto ? 'Registrar Pago' : 'Caja'}</h1>
          <p className="text-gray-600 mt-2">
            {pagoDirecto
              ? 'Registra el pago del deportista y revisa su historial mensual.'
              : 'Controla ingresos, egresos y el flujo real de caja del club.'}
          </p>
        </div>
        <Link href="/admin/deportistas" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            Volver a Deportistas
          </Button>
        </Link>
      </div>

      {pagoDirecto && deportistaSeleccionado && (
        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="py-5">
            <p className="text-sm font-medium text-primary-700">Deportista seleccionado</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {deportistaSeleccionado.nombre} {deportistaSeleccionado.apellidos}
            </p>
            <p className="text-sm text-gray-600">DNI: {deportistaSeleccionado.documentoIdentidad}</p>
          </CardContent>
        </Card>
      )}

      {!pagoDirecto && (
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Estado de cuenta por mes</p>
              <p className="text-sm text-gray-600">Selecciona el periodo para revisar caja.</p>
            </div>
            <div className="w-full sm:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                {mesesDisponibles.map((mes) => (
                  <option key={mes} value={mes}>
                    {new Date(`${mes}-01T00:00:00`).toLocaleDateString('es-PE', {
                      timeZone: 'America/Lima',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {!pagoDirecto && (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos del mes</p>
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
                <p className="text-sm text-gray-600">Egresos del mes</p>
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
                <p className="text-sm text-gray-600">Saldo neto del mes</p>
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
                <p className="text-sm text-gray-600">Periodo seleccionado</p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {new Date(`${mesSeleccionado}-01T00:00:00`).toLocaleDateString('es-PE', {
                    timeZone: 'America/Lima',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <ArrowDownCircle className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Movimientos del mes</p>
                <p className="text-3xl font-bold text-gray-900">{resumen.movimientos}</p>
                <p className="text-xs text-gray-500 mt-1">Consulta mensual activa</p>
              </div>
              <CreditCard className="h-10 w-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {pagoDirecto ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Ventana de pago</h2>
            <p className="text-sm text-gray-600">Selecciona el concepto y el periodo exacto que está cancelando.</p>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pago</label>
                  <select
                    name="modoPago"
                    value={ingresoData.modoPago}
                    onChange={handleIngresoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="total">Pago total</option>
                    <option value="parcial">Pago parcial</option>
                  </select>
                </div>

                {(ingresoData.concepto === 'mensualidad' || ingresoData.concepto === 'anualidad') ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa mensual</label>
                    <select
                      name="tarifaMensual"
                      value={ingresoData.tarifaMensual}
                      onChange={handleIngresoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      {TARIFA_MENSUAL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    Precio fijo sugerido para este concepto.
                  </div>
                )}
              </div>

              {ingresoData.modoPago === 'total' && (
                <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <input
                    type="checkbox"
                    name="montoEspecialComoTotal"
                    checked={ingresoData.montoEspecialComoTotal}
                    onChange={handleIngresoChange}
                    className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Marcar como pago completo con monto especial. Úsalo para descuentos autorizados sin dejar deuda.
                  </span>
                </label>
              )}

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
                  label="Fecha de pago"
                  name="fechaPago"
                  type="date"
                  value={ingresoData.fechaPago}
                  onChange={handleIngresoChange}
                  required
                />
              </div>

              {(ingresoData.concepto === 'mensualidad' || ingresoData.concepto === 'anualidad') && (
                <>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">Atajos de periodo</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCoberturaMensual(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                      >
                        Mes actual
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCoberturaMensual(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1))
                        }
                      >
                        Mes siguiente
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCoberturaMensual(
                            new Date(new Date().getFullYear(), 0, 1),
                            new Date(new Date().getFullYear(), 11, 1)
                          )
                        }
                      >
                        Anual
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Mes que cancela desde"
                      name="mesCoberturaInicio"
                      type="month"
                      value={ingresoData.mesCoberturaInicio}
                      onChange={handleIngresoChange}
                      required
                    />
                    <Input
                      label="Mes que cancela hasta"
                      name="mesCoberturaFin"
                      type="month"
                      value={ingresoData.mesCoberturaFin}
                      onChange={handleIngresoChange}
                      required
                    />
                  </div>
                </>
              )}

              {montoEsperado > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <p>
                    Monto esperado: <span className="font-semibold">S/ {montoEsperado.toFixed(2)}</span>
                  </p>
                  <p>
                    Cobertura del pago: <span className="font-semibold">{porcentajeCubierto}%</span>
                  </p>
                  {Number(ingresoData.monto || 0) < montoEsperado && (
                    <p>
                      Saldo pendiente: <span className="font-semibold">S/ {(montoEsperado - Number(ingresoData.monto || 0)).toFixed(2)}</span>
                    </p>
                  )}
                </div>
              )}

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
                {isSubmittingIngreso ? (editingPagoId ? 'Actualizando pago...' : 'Registrando pago...') : editingPagoId ? 'Guardar cambios' : 'Registrar Pago'}
              </Button>
              {editingPagoId && (
                <Button type="button" variant="outline" className="w-full" onClick={resetIngresoForm}>
                  Cancelar edición
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Tipo de movimiento</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar</label>
              <select
                value={tipoMovimiento}
                onChange={(e) => setTipoMovimiento(e.target.value as 'ingreso' | 'egreso')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <p className="text-sm text-gray-600">
              Muestra solo el formulario que necesitas para evitar ruido en caja.
            </p>
          </CardContent>
        </Card>

        {tipoMovimiento === 'ingreso' ? (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pago</label>
                  <select
                    name="modoPago"
                    value={ingresoData.modoPago}
                    onChange={handleIngresoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="total">Pago total</option>
                    <option value="parcial">Pago parcial</option>
                  </select>
                </div>

                {(ingresoData.concepto === 'mensualidad' || ingresoData.concepto === 'anualidad') ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa mensual</label>
                    <select
                      name="tarifaMensual"
                      value={ingresoData.tarifaMensual}
                      onChange={handleIngresoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      {TARIFA_MENSUAL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    Precio fijo sugerido para este concepto.
                  </div>
                )}
              </div>

              {ingresoData.modoPago === 'total' && (
                <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <input
                    type="checkbox"
                    name="montoEspecialComoTotal"
                    checked={ingresoData.montoEspecialComoTotal}
                    onChange={handleIngresoChange}
                    className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Marcar como pago completo con monto especial. Úsalo para descuentos autorizados sin dejar deuda.
                  </span>
                </label>
              )}

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

              {(ingresoData.concepto === 'mensualidad' || ingresoData.concepto === 'anualidad') && (
                <>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-800">Atajos de periodo</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCoberturaMensual(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                      >
                        Mes actual
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCoberturaMensual(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1))
                        }
                      >
                        Mes siguiente
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCoberturaMensual(
                            new Date(new Date().getFullYear(), 0, 1),
                            new Date(new Date().getFullYear(), 11, 1)
                          )
                        }
                      >
                        Anual
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Mes que cancela desde"
                      name="mesCoberturaInicio"
                      type="month"
                      value={ingresoData.mesCoberturaInicio}
                      onChange={handleIngresoChange}
                      required
                    />
                    <Input
                      label="Mes que cancela hasta"
                      name="mesCoberturaFin"
                      type="month"
                      value={ingresoData.mesCoberturaFin}
                      onChange={handleIngresoChange}
                      required
                    />
                  </div>
                </>
              )}

              {montoEsperado > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <p>
                    Monto esperado: <span className="font-semibold">S/ {montoEsperado.toFixed(2)}</span>
                  </p>
                  <p>
                    Cobertura del pago: <span className="font-semibold">{porcentajeCubierto}%</span>
                  </p>
                  {Number(ingresoData.monto || 0) < montoEsperado && (
                    <p>
                      Saldo pendiente: <span className="font-semibold">S/ {(montoEsperado - Number(ingresoData.monto || 0)).toFixed(2)}</span>
                    </p>
                  )}
                </div>
              )}

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
                {isSubmittingIngreso ? (editingPagoId ? 'Actualizando ingreso...' : 'Registrando ingreso...') : editingPagoId ? 'Guardar cambios' : 'Registrar Ingreso'}
              </Button>
              {editingPagoId && (
                <Button type="button" variant="outline" className="w-full" onClick={resetIngresoForm}>
                  Cancelar edición
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
        ) : (
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
        )}
      </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {pagoDirecto ? 'Historial de pagos' : 'Movimientos de Caja'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {pagoDirecto ? 'Pagos registrados para este deportista.' : 'Historial consolidado de ingresos y egresos'}
              </p>
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
                      <span>Fecha: {formatLimaDate(movimiento.fecha)}</span>
                      <span>
                        Hora de registro: {formatLimaTime(
                          movimiento.registradoEn || movimiento.fecha
                        )}
                      </span>
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
                    {movimiento.tipo === 'ingreso' && (
                      <div className="mt-3 flex flex-wrap justify-start gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const pago = pagos.find((item) => item.id === movimiento.id)
                            if (pago) cargarPagoEnFormulario(pago)
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            const pago = pagos.find((item) => item.id === movimiento.id)
                            if (pago) handleDeletePago(pago)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Anular
                        </Button>
                      </div>
                    )}
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
