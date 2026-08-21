'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowDownCircle, ArrowUpCircle, Banknote, CalendarDays, CreditCard, FileText, Pencil, PlusCircle, Repeat, Search, ShoppingCart, Target, Trash2, Wallet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { getRecurringMonthsCount, inferExpectedAmount, TARIFA_MENSUAL_OPTIONS, type TarifaMensual } from '@/lib/pagos-config'

interface Deportista {
  id: string
  nombre: string
  apellidos: string
  documentoIdentidad?: string | null
  planSesiones?: number | null
  becado?: boolean
  activo?: boolean
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

interface GastoFijo {
  id: string
  nombre: string
  categoria: string
  metodo?: string | null
  monto: number
  diaVencimiento?: number | null
  activo: boolean
  observacion?: string | null
  createdAt?: string
}

interface ExoneracionMensualidad {
  id: string
  deportistaId: string
  mes: string
  motivo: string
  observacion?: string | null
  deportista: Deportista
}

interface TarifaMensualHistorica {
  id: string
  deportistaId: string
  anio: number
  monto: number
  tipo: string
}

interface IngresoFormData {
  deportistaId: string
  concepto: string
  metodo: string
  modoPago: 'total' | 'parcial'
  tarifaMensual: TarifaMensual
  montoEspecialComoTotal: boolean
  monto: string
  fechaPago: string
  mesCoberturaInicio: string
  mesCoberturaFin: string
  observacion: string
}

interface CarritoIngresoItem extends IngresoFormData {
  id: string
  montoEsperado: number
  deportistaNombre: string
}

const conceptosIngreso = [
  { value: 'inscripcion', label: 'Inscripción' },
  { value: 'mensualidad', label: 'Mensualidad' },
  { value: 'anualidad', label: 'Anual' },
  { value: 'uniforme', label: 'Uniforme' },
  { value: 'prenda', label: 'Prenda / tienda' },
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

const motivosExoneracion = [
  { value: 'lesion', label: 'Lesión' },
  { value: 'enfermedad', label: 'Enfermedad' },
  { value: 'viaje', label: 'Viaje' },
  { value: 'caso_familiar', label: 'Caso familiar' },
  { value: 'apoyo_club', label: 'Apoyo del club' },
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
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([])
  const [exoneraciones, setExoneraciones] = useState<ExoneracionMensualidad[]>([])
  const [tarifasMensuales, setTarifasMensuales] = useState<TarifaMensualHistorica[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmittingIngreso, setIsSubmittingIngreso] = useState(false)
  const [isSubmittingCarrito, setIsSubmittingCarrito] = useState(false)
  const [isSubmittingEgreso, setIsSubmittingEgreso] = useState(false)
  const [isSubmittingGastoFijo, setIsSubmittingGastoFijo] = useState(false)
  const [isSubmittingExoneracion, setIsSubmittingExoneracion] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [mesSeleccionado, setMesSeleccionado] = useState(currentMonth)
  const [tipoMovimiento, setTipoMovimiento] = useState<'ingreso' | 'egreso'>('ingreso')
  const [vistaMovimientos, setVistaMovimientos] = useState<'todos' | 'ingresos' | 'egresos'>('todos')
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null)
  const [editingEgresoId, setEditingEgresoId] = useState<string | null>(null)
  const [editingGastoFijoId, setEditingGastoFijoId] = useState<string | null>(null)
  const [carritoIngresos, setCarritoIngresos] = useState<CarritoIngresoItem[]>([])
  const [ingresoData, setIngresoData] = useState<IngresoFormData>({
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
    recurrente: false,
  })
  const [gastoFijoData, setGastoFijoData] = useState({
    nombre: '',
    categoria: 'alquiler',
    metodo: 'transferencia',
    monto: '',
    diaVencimiento: '',
    observacion: '',
  })
  const [exoneracionData, setExoneracionData] = useState({
    deportistaId: deportistaIdParam,
    mes: new Date().toISOString().slice(0, 7),
    motivo: 'lesion',
    observacion: '',
  })
  const [metaMargen, setMetaMargen] = useState('20')

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

  const getFetchScope = () => (pagoDirecto ? deportistaIdParam : undefined)

  const getConceptoLabel = (value: string) =>
    conceptosIngreso.find((concepto) => concepto.value === value)?.label || value

  const getEgresoLabel = (value: string) =>
    categoriasEgreso.find((categoria) => categoria.value === value)?.label || value

  const getMetodoLabel = (value: string) =>
    metodos.find((metodo) => metodo.value === value)?.label || value

  const getMotivoExoneracionLabel = (value: string) =>
    motivosExoneracion.find((motivo) => motivo.value === value)?.label || value

  const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`

  const getPreviousMonth = (month: string) => {
    const [year, monthIndex] = month.split('-').map(Number)
    const date = new Date(year, monthIndex - 2, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  const getMonthKey = (value?: string | null) => {
    if (!value) return ''
    return value.slice(0, 7)
  }

  const belongsToMonth = (value: string | null | undefined, month: string) =>
    getMonthKey(value) === month

  const getExpectedMonthlyFee = (deportista: Deportista) => {
    if (deportista.becado || deportista.activo === false) return 0

    switch (deportista.planSesiones) {
      case 8:
        return 120
      case 4:
        return 60
      case 12:
      case 20:
      default:
        return 180
    }
  }

  const getVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  useEffect(() => {
    fetchData(deportistaIdParam)
    setExoneracionData((prev) => ({
      ...prev,
      deportistaId: deportistaIdParam,
    }))
  }, [deportistaIdParam])

  const fetchData = async (deportistaId?: string) => {
    try {
      setLoading(true)

      const [deportistasRes, pagosRes, egresosRes, gastosFijosRes, exoneracionesRes, tarifasRes] = await Promise.all([
        fetch('/api/deportistas'),
        fetch(deportistaId ? `/api/pagos?deportistaId=${deportistaId}` : '/api/pagos'),
        deportistaId ? Promise.resolve(null) : fetch('/api/egresos'),
        deportistaId ? Promise.resolve(null) : fetch('/api/gastos-fijos'),
        fetch(deportistaId ? `/api/exoneraciones-mensualidad?deportistaId=${deportistaId}` : '/api/exoneraciones-mensualidad'),
        fetch(deportistaId ? `/api/tarifas-mensuales?deportistaId=${deportistaId}` : '/api/tarifas-mensuales'),
      ])

      const deportistasData = await deportistasRes.json()
      const pagosData = await pagosRes.json()
      const egresosData = egresosRes ? await egresosRes.json() : []
      const gastosFijosData = gastosFijosRes ? await gastosFijosRes.json() : []
      const exoneracionesData = await exoneracionesRes.json()
      const tarifasData = tarifasRes ? await tarifasRes.json() : []

      setDeportistas(Array.isArray(deportistasData) ? deportistasData : [])
      setPagos(Array.isArray(pagosData) ? pagosData : [])
      setEgresos(Array.isArray(egresosData) ? egresosData : [])
      setGastosFijos(Array.isArray(gastosFijosData) ? gastosFijosData : [])
      setExoneraciones(Array.isArray(exoneracionesData) ? exoneracionesData : [])
      setTarifasMensuales(Array.isArray(tarifasData) ? tarifasData : [])
    } catch (error) {
      console.error('Error al cargar caja:', error)
      setDeportistas([])
      setPagos([])
      setEgresos([])
      setGastosFijos([])
      setExoneraciones([])
      setTarifasMensuales([])
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
        subtitulo: `DNI: ${pago.deportista.documentoIdentidad || 'Pendiente'}`,
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

    pagos.forEach((pago) => months.add(getMonthKey(pago.fechaPago)))
    egresos.forEach((egreso) => months.add(getMonthKey(egreso.fechaEgreso)))

    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [currentMonth, pagos, egresos])

  const movimientosDelPeriodo = useMemo(() => {
    if (pagoDirecto) return movimientos
    return movimientos.filter((movimiento) => belongsToMonth(movimiento.fecha, mesSeleccionado))
  }, [movimientos, pagoDirecto, mesSeleccionado])

  const movimientosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    const movimientosPorVista = pagoDirecto
      ? movimientosDelPeriodo
      : movimientosDelPeriodo.filter((movimiento) => {
          if (vistaMovimientos === 'todos') return true
          return vistaMovimientos === 'ingresos'
            ? movimiento.tipo === 'ingreso'
            : movimiento.tipo === 'egreso'
        })

    if (!term) return movimientosPorVista

    return movimientosPorVista.filter((movimiento) =>
      movimiento.titulo.toLowerCase().includes(term) ||
      movimiento.subtitulo.toLowerCase().includes(term) ||
      movimiento.concepto.toLowerCase().includes(term) ||
      movimiento.metodo.toLowerCase().includes(term)
    )
  }, [movimientosDelPeriodo, busqueda, pagoDirecto, vistaMovimientos])

  const categoriasEgresoOptions = useMemo(() => {
    const categorias = new Set(categoriasEgreso.map((categoria) => categoria.value))
    egresos.forEach((egreso) => {
      if (egreso.categoria) categorias.add(egreso.categoria)
    })
    gastosFijos.forEach((gasto) => {
      if (gasto.categoria) categorias.add(gasto.categoria)
    })

    return Array.from(categorias)
      .sort((a, b) => getEgresoLabel(a).localeCompare(getEgresoLabel(b), 'es'))
      .map((value) => ({ value, label: getEgresoLabel(value) }))
  }, [egresos, gastosFijos])

  const conceptosIngresoOptions = useMemo(() => {
    const conceptos = new Set(conceptosIngreso.map((concepto) => concepto.value))
    pagos.forEach((pago) => {
      if (pago.concepto) conceptos.add(pago.concepto)
    })

    return Array.from(conceptos)
      .sort((a, b) => getConceptoLabel(a).localeCompare(getConceptoLabel(b), 'es'))
      .map((value) => ({ value, label: getConceptoLabel(value) }))
  }, [pagos])

  const getIngresosPorFecha = (month: string) =>
    pagos
      .filter((pago) => belongsToMonth(pago.fechaPago, month))
      .reduce((acc, pago) => acc + pago.monto, 0)

  const getMensualidadesPorFecha = (month: string) =>
    pagos
      .filter((pago) => belongsToMonth(pago.fechaPago, month) && (pago.concepto === 'mensualidad' || pago.concepto === 'anualidad'))
      .reduce((acc, pago) => acc + pago.monto, 0)

  const getEgresosVariablesPorFecha = (month: string) =>
    egresos
      .filter((egreso) => belongsToMonth(egreso.fechaEgreso, month))
      .reduce((acc, egreso) => acc + egreso.monto, 0)

  const isGastoFijoAplicableAlMes = (gasto: GastoFijo, month: string) => {
    if (!gasto.activo) return false
    if (!gasto.createdAt) return true

    return getMonthKey(gasto.createdAt) <= month
  }

  const getGastosFijosAplicables = (month: string) =>
    gastosFijos.filter((gasto) => isGastoFijoAplicableAlMes(gasto, month))

  const getGastosFijosActivosTotal = (month: string) =>
    getGastosFijosAplicables(month).reduce((acc, gasto) => acc + gasto.monto, 0)

  const getMensualidadesCubiertasPorMes = (month: string) =>
    pagos
      .filter((pago) => pago.concepto === 'mensualidad' || pago.concepto === 'anualidad')
      .reduce((acc, pago) => {
        const inicio = getMonthKey(pago.mesCoberturaInicio) || getMonthKey(pago.fechaPago)
        const fin = getMonthKey(pago.mesCoberturaFin) || inicio
        if (month < inicio || month > fin) return acc

        const months = getRecurringMonthsCount(inicio, fin)
        return acc + pago.monto / months
      }, 0)

  const getIngresoMetaMensual = (month: string) => {
    const exonerados = new Set(
      exoneraciones
        .filter((exoneracion) => belongsToMonth(exoneracion.mes, month))
        .map((exoneracion) => exoneracion.deportistaId)
    )

    return deportistas.reduce((acc, deportista) => {
      if (exonerados.has(deportista.id) || deportista.becado || deportista.activo === false) return acc

      // Si el mes tuvo un prorrateo o monto especial, el monto esperado del pago
      // congela la obligación histórica de ese periodo.
      const pagoDelMes = pagos
        .filter((pago) => {
          if (pago.deportista.id !== deportista.id) return false
          if (pago.concepto !== 'mensualidad' && pago.concepto !== 'anualidad') return false
          const inicio = getMonthKey(pago.mesCoberturaInicio) || getMonthKey(pago.fechaPago)
          const fin = getMonthKey(pago.mesCoberturaFin) || inicio
          return month >= inicio && month <= fin && Boolean(pago.montoEsperado)
        })
        .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime())[0]

      if (pagoDelMes?.montoEsperado) {
        const inicio = getMonthKey(pagoDelMes.mesCoberturaInicio) || month
        const fin = getMonthKey(pagoDelMes.mesCoberturaFin) || inicio
        return acc + pagoDelMes.montoEsperado / getRecurringMonthsCount(inicio, fin)
      }

      const anio = Number(month.slice(0, 4))
      const tarifaHistorica = tarifasMensuales.find(
        (tarifa) => tarifa.deportistaId === deportista.id && tarifa.anio === anio
      )
      return acc + (tarifaHistorica?.monto ?? getExpectedMonthlyFee(deportista))
    }, 0)
  }

  const resumen = useMemo(() => {
    const previousMonth = getPreviousMonth(mesSeleccionado)
    const totalIngresos = pagoDirecto
      ? pagos.reduce((acc, pago) => acc + pago.monto, 0)
      : getIngresosPorFecha(mesSeleccionado)
    const ingresosMensualidades = pagoDirecto
      ? pagos
          .filter((pago) => pago.concepto === 'mensualidad' || pago.concepto === 'anualidad')
          .reduce((acc, pago) => acc + pago.monto, 0)
      : getMensualidadesPorFecha(mesSeleccionado)
    const egresosVariables = pagoDirecto ? 0 : getEgresosVariablesPorFecha(mesSeleccionado)
    const totalEgresos = pagoDirecto ? 0 : egresosVariables
    const previousIngresos = getIngresosPorFecha(previousMonth)
    const previousEgresos = getEgresosVariablesPorFecha(previousMonth)
    const previousSaldo = previousIngresos - previousEgresos

    return {
      totalIngresos,
      ingresosMensualidades,
      egresosVariables,
      totalEgresos,
      saldoNeto: totalIngresos - totalEgresos,
      movimientos: movimientosDelPeriodo.length,
      variacionIngresos: getVariation(totalIngresos, previousIngresos),
      variacionEgresos: getVariation(totalEgresos, previousEgresos),
      variacionSaldo: getVariation(totalIngresos - totalEgresos, previousSaldo),
    }
  }, [egresos, mesSeleccionado, movimientosDelPeriodo.length, pagoDirecto, pagos])

  const carritoTotal = useMemo(
    () => carritoIngresos.reduce((acc, item) => acc + Number(item.monto || 0), 0),
    [carritoIngresos]
  )

  const egresosDelMesAgrupados = useMemo(() => {
    const grouped = egresos
      .filter((egreso) => belongsToMonth(egreso.fechaEgreso, mesSeleccionado))
      .reduce<Record<string, Egreso[]>>((acc, egreso) => {
        acc[egreso.categoria] = acc[egreso.categoria] || []
        acc[egreso.categoria].push(egreso)
        return acc
      }, {})

    return Object.entries(grouped)
      .map(([categoria, items]) => ({
        categoria,
        total: items.reduce((acc, egreso) => acc + egreso.monto, 0),
        items,
      }))
      .sort((a, b) => b.total - a.total)
  }, [egresos, mesSeleccionado])

  const reporteFinanciero = useMemo(() => {
    const ingresosPeriodo = pagos.filter((pago) => belongsToMonth(pago.fechaPago, mesSeleccionado))
    const egresosPeriodo = egresos.filter((egreso) => belongsToMonth(egreso.fechaEgreso, mesSeleccionado))
    const gastosFijosActivos = getGastosFijosAplicables(mesSeleccionado)
    const totalGastosFijos = gastosFijosActivos.reduce((acc, gasto) => acc + gasto.monto, 0)
    const totalIngresos = ingresosPeriodo.reduce((acc, pago) => acc + pago.monto, 0)
    const totalEgresosVariables = egresosPeriodo.reduce((acc, egreso) => acc + egreso.monto, 0)
    const totalEgresos = totalEgresosVariables
    const saldo = totalIngresos - totalEgresos
    const margen = totalIngresos > 0 ? Math.round((saldo / totalIngresos) * 100) : 0
    const puntoEquilibrio = totalGastosFijos
    const margenObjetivo = Math.max(0, Math.min(80, Number(metaMargen) || 0))
    const metaIngresos =
      margenObjetivo >= 80
        ? puntoEquilibrio
        : puntoEquilibrio / (1 - margenObjetivo / 100)
    const faltanteEquilibrio = Math.max(puntoEquilibrio - totalIngresos, 0)
    const faltanteMeta = Math.max(metaIngresos - totalIngresos, 0)
    const ingresoMetaMensual = getIngresoMetaMensual(mesSeleccionado)
    const mensualidadesCubiertas = getMensualidadesCubiertasPorMes(mesSeleccionado)
    const pendientePorCobrar = Math.max(ingresoMetaMensual - mensualidadesCubiertas, 0)
    const avanceMetaMensual = ingresoMetaMensual > 0
      ? Math.min(100, Math.round((mensualidadesCubiertas / ingresoMetaMensual) * 100))
      : 0
    const estadoEquilibrio = totalIngresos >= puntoEquilibrio ? 'encima' : 'debajo'

    const groupPagos = (field: 'concepto' | 'metodo') =>
      Object.entries(
        ingresosPeriodo.reduce<Record<string, number>>((acc, pago) => {
          acc[pago[field]] = (acc[pago[field]] || 0) + pago.monto
          return acc
        }, {})
      )
        .map(([label, total]) => ({ label, total }))
        .sort((a, b) => b.total - a.total)

    const groupEgresos = (field: 'categoria' | 'metodo') =>
      Object.entries(
        egresosPeriodo.reduce<Record<string, number>>((acc, egreso) => {
          acc[egreso[field]] = (acc[egreso[field]] || 0) + egreso.monto
          return acc
        }, {})
      )
        .map(([label, total]) => ({ label, total }))
        .sort((a, b) => b.total - a.total)

    const meses = Array.from(
      new Set([
        ...pagos.map((pago) => getMonthKey(pago.fechaPago)),
        ...egresos.map((egreso) => getMonthKey(egreso.fechaEgreso)),
        currentMonth,
      ])
    )
      .sort((a, b) => a.localeCompare(b))
      .slice(-6)

    const evolucion = meses.map((mes) => {
      const ingresos = pagos
        .filter((pago) => belongsToMonth(pago.fechaPago, mes))
        .reduce((acc, pago) => acc + pago.monto, 0)
      const egresosMes = egresos
        .filter((egreso) => belongsToMonth(egreso.fechaEgreso, mes))
        .reduce((acc, egreso) => acc + egreso.monto, 0)

      return {
        mes,
        mesLabel: new Date(`${mes}-01T00:00:00`).toLocaleDateString('es-PE', {
          timeZone: 'America/Lima',
          month: 'short',
        }),
        ingresos,
        egresos: egresosMes,
        saldo: ingresos - egresosMes,
      }
    })

    const conceptosChart = groupPagos('concepto').map((item) => ({
      concepto: getConceptoLabel(item.label),
      monto: item.total,
    }))

    const egresosChart = groupEgresos('categoria').map((item) => ({
      categoria: getEgresoLabel(item.label),
      monto: item.total,
    }))

    return {
      totalIngresos,
      totalEgresos,
      totalEgresosVariables,
      totalGastosFijos,
      puntoEquilibrio,
      metaIngresos,
      faltanteEquilibrio,
      faltanteMeta,
      ingresoMetaMensual,
      mensualidadesCubiertas,
      pendientePorCobrar,
      avanceMetaMensual,
      estadoEquilibrio,
      saldo,
      margen,
      margenObjetivo,
      gastosFijosActivos,
      ingresosPorConcepto: groupPagos('concepto'),
      ingresosPorMetodo: groupPagos('metodo'),
      egresosPorCategoria: groupEgresos('categoria'),
      egresosPorMetodo: groupEgresos('metodo'),
      evolucion,
      conceptosChart,
      egresosChart,
    }
  }, [currentMonth, deportistas, egresos, exoneraciones, gastosFijos, mesSeleccionado, metaMargen, pagos, tarifasMensuales])

  const deportistaSeleccionado = deportistas.find((deportista) => deportista.id === ingresoData.deportistaId)

  const tarifaHistoricaSeleccionada = useMemo(() => {
    const anio = Number(ingresoData.mesCoberturaInicio.slice(0, 4))
    return tarifasMensuales.find(
      (tarifa) => tarifa.deportistaId === ingresoData.deportistaId && tarifa.anio === anio
    )
  }, [ingresoData.deportistaId, ingresoData.mesCoberturaInicio, tarifasMensuales])

  const montoEsperadoSugerido = useMemo(
    () => {
      if (
        (ingresoData.concepto === 'mensualidad' || ingresoData.concepto === 'anualidad') &&
        tarifaHistoricaSeleccionada
      ) {
        return tarifaHistoricaSeleccionada.monto * getRecurringMonthsCount(
          ingresoData.mesCoberturaInicio,
          ingresoData.mesCoberturaFin
        )
      }

      return inferExpectedAmount({
        concepto: ingresoData.concepto,
        mesCoberturaInicio: ingresoData.mesCoberturaInicio,
        mesCoberturaFin: ingresoData.mesCoberturaFin,
        tarifaMensual: ingresoData.tarifaMensual as TarifaMensual,
      })
    },
    [ingresoData.concepto, ingresoData.mesCoberturaFin, ingresoData.mesCoberturaInicio, ingresoData.tarifaMensual, tarifaHistoricaSeleccionada]
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
    const target = e.target
    const { name, value } = target
    const nextValue =
      target instanceof HTMLInputElement && target.type === 'checkbox'
        ? target.checked
        : value

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

  const agregarIngresoAlCarrito = () => {
    if (editingPagoId) {
      toast.error('Termina o cancela la edición antes de usar el carrito')
      return
    }

    const deportista = deportistas.find((item) => item.id === ingresoData.deportistaId)
    const monto = Number(ingresoData.monto)

    if (!deportista) {
      toast.error('Selecciona un deportista')
      return
    }

    if (Number.isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    setCarritoIngresos((current) => [
      ...current,
      {
        ...ingresoData,
        id: crypto.randomUUID(),
        montoEsperado,
        deportistaNombre: `${deportista.nombre} ${deportista.apellidos}`.trim(),
      },
    ])

    setIngresoData((prev) => ({
      ...prev,
      concepto: 'mensualidad',
      modoPago: 'total',
      tarifaMensual: 'regular',
      montoEspecialComoTotal: false,
      monto: String(
        inferExpectedAmount({
          concepto: 'mensualidad',
          mesCoberturaInicio: prev.mesCoberturaInicio,
          mesCoberturaFin: prev.mesCoberturaFin,
          tarifaMensual: 'regular',
        })
      ),
      observacion: '',
    }))
    toast.success('Concepto agregado al carrito')
  }

  const quitarIngresoDelCarrito = (itemId: string) => {
    setCarritoIngresos((current) => current.filter((item) => item.id !== itemId))
  }

  const cobrarCarrito = async () => {
    if (carritoIngresos.length === 0) {
      toast.error('Agrega al menos un concepto al carrito')
      return
    }

    const confirmed = await confirmDialog({
      title: 'Cobrar carrito',
      description: `Se registrarán ${carritoIngresos.length} pagos por S/ ${carritoTotal.toFixed(2)} en una sola operación.`,
      confirmText: 'Cobrar carrito',
    })

    if (!confirmed) return

    setIsSubmittingCarrito(true)

    try {
      const response = await fetch('/api/pagos/lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: carritoIngresos.map(({ id, deportistaNombre, ...item }) => item),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo cobrar el carrito')
      }

      setCarritoIngresos([])
      resetIngresoForm()
      toast.success('Carrito cobrado correctamente')
      await fetchData(getFetchScope())
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al cobrar el carrito')
    } finally {
      setIsSubmittingCarrito(false)
    }
  }

  const handleEgresoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target
    const nextValue =
      target instanceof HTMLInputElement && target.type === 'checkbox'
        ? target.checked
        : target.value

    setEgresoData((prev) => ({
      ...prev,
      [target.name]: nextValue,
    }))
  }

  const handleGastoFijoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setGastoFijoData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const cargarEgresoEnFormulario = (egreso: Egreso) => {
    setTipoMovimiento('egreso')
    setEditingEgresoId(egreso.id)
    setEgresoData({
      categoria: egreso.categoria,
      metodo: egreso.metodo,
      beneficiario: egreso.beneficiario,
      monto: String(egreso.monto),
      fechaEgreso: egreso.fechaEgreso.slice(0, 10),
      observacion: egreso.observacion || '',
      recurrente: false,
    })
  }

  const resetEgresoForm = () => {
    setEditingEgresoId(null)
    setEgresoData({
      categoria: 'sueldos',
      metodo: 'efectivo',
      beneficiario: '',
      monto: '',
      fechaEgreso: new Date().toISOString().split('T')[0],
      observacion: '',
      recurrente: false,
    })
  }

  const cargarGastoFijoEnFormulario = (gasto: GastoFijo) => {
    setEditingGastoFijoId(gasto.id)
    setGastoFijoData({
      nombre: gasto.nombre,
      categoria: gasto.categoria,
      metodo: gasto.metodo || 'transferencia',
      monto: String(gasto.monto),
      diaVencimiento: gasto.diaVencimiento ? String(gasto.diaVencimiento) : '',
      observacion: gasto.observacion || '',
    })
  }

  const resetGastoFijoForm = () => {
    setEditingGastoFijoId(null)
    setGastoFijoData({
      nombre: '',
      categoria: 'alquiler',
      metodo: 'transferencia',
      monto: '',
      diaVencimiento: '',
      observacion: '',
    })
  }

  const handleExoneracionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setExoneracionData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleExoneracionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const deportista = deportistas.find((item) => item.id === exoneracionData.deportistaId)
    if (!deportista) {
      toast.error('Selecciona un deportista')
      return
    }

    const confirmed = await confirmDialog({
      title: 'Exonerar mensualidad',
      description: `Se marcará ${exoneracionData.mes} como exonerado para ${deportista.nombre} ${deportista.apellidos}. No se registrará ingreso de caja.`,
      confirmText: 'Exonerar mes',
    })

    if (!confirmed) return

    setIsSubmittingExoneracion(true)

    try {
      const response = await fetch('/api/exoneraciones-mensualidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exoneracionData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo registrar la exoneración')
      }

      setExoneracionData((prev) => ({
        ...prev,
        observacion: '',
      }))
      toast.success('Mensualidad exonerada')
      await fetchData(getFetchScope())
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al registrar la exoneración')
    } finally {
      setIsSubmittingExoneracion(false)
    }
  }

  const eliminarExoneracion = async (exoneracion: ExoneracionMensualidad) => {
    const confirmed = await confirmDialog({
      title: 'Anular exoneración',
      description: `¿Anular la exoneración de ${exoneracion.mes.slice(0, 7)}? El mes volverá a contarse en la deuda si no tiene pago.`,
      confirmText: 'Anular',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/exoneraciones-mensualidad/${exoneracion.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo anular la exoneración')
      }

      toast.success('Exoneración anulada')
      await fetchData(getFetchScope())
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al anular la exoneración')
    }
  }

  const handleGastoFijoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingGastoFijo(true)
    const isEditing = Boolean(editingGastoFijoId)

    try {
      const response = await fetch(editingGastoFijoId ? `/api/gastos-fijos/${editingGastoFijoId}` : '/api/gastos-fijos', {
        method: editingGastoFijoId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gastoFijoData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo guardar el gasto fijo')
      }

      resetGastoFijoForm()
      toast.success(isEditing ? 'Gasto fijo actualizado' : 'Gasto fijo creado')
      await fetchData(getFetchScope())
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al guardar el gasto fijo')
    } finally {
      setIsSubmittingGastoFijo(false)
    }
  }

  const toggleGastoFijo = async (gasto: GastoFijo) => {
    try {
      const response = await fetch(`/api/gastos-fijos/${gasto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !gasto.activo }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el gasto fijo')
      }

      await fetchData(getFetchScope())
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al actualizar el gasto fijo')
    }
  }

  const eliminarGastoFijo = async (gasto: GastoFijo) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar gasto fijo',
      description: `¿Eliminar ${gasto.nombre}? Esta acción quitará el gasto de las proyecciones.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/gastos-fijos/${gasto.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo eliminar el gasto fijo')
      }

      toast.success('Gasto fijo eliminado')
      await fetchData(getFetchScope())
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al eliminar el gasto fijo')
    }
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
      await fetchData(getFetchScope())
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
      await fetchData(getFetchScope())
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al anular el pago')
    }
  }

  const handleEgresoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingEgreso(true)
    const isEditing = Boolean(editingEgresoId)

    try {
      if (egresoData.recurrente && !editingEgresoId) {
        const response = await fetch('/api/gastos-fijos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: egresoData.beneficiario,
            categoria: egresoData.categoria,
            metodo: egresoData.metodo,
            monto: egresoData.monto,
            diaVencimiento: new Date(`${egresoData.fechaEgreso}T00:00:00`).getDate(),
            observacion: egresoData.observacion,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'No se pudo registrar el gasto fijo')
        }

        resetEgresoForm()
        toast.success('Gasto recurrente creado como gasto fijo')
        await fetchData(getFetchScope())
        return
      }

      const response = await fetch(editingEgresoId ? `/api/egresos/${editingEgresoId}` : '/api/egresos', {
        method: editingEgresoId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(egresoData),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo guardar el egreso')
      }

      resetEgresoForm()
      toast.success(isEditing ? 'Egreso actualizado' : 'Egreso registrado')

      await fetchData(getFetchScope())
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al guardar el egreso')
    } finally {
      setIsSubmittingEgreso(false)
    }
  }

  const eliminarEgreso = async (egreso: Egreso) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar egreso',
      description: `¿Eliminar el egreso de ${egreso.beneficiario}? Esta acción quitará el movimiento del mes.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/egresos/${egreso.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo eliminar el egreso')
      }

      if (editingEgresoId === egreso.id) {
        resetEgresoForm()
      }

      toast.success('Egreso eliminado')
      await fetchData(getFetchScope())
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al eliminar el egreso')
    }
  }

  return (
    <div className="space-y-6">
      <datalist id="categorias-egreso">
        {categoriasEgresoOptions.map((categoria) => (
          <option key={categoria.value} value={categoria.value}>
            {categoria.label}
          </option>
        ))}
      </datalist>
      <datalist id="conceptos-ingreso">
        {conceptosIngresoOptions.map((concepto) => (
          <option key={concepto.value} value={concepto.value}>
            {concepto.label}
          </option>
        ))}
      </datalist>

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
            <p className="text-sm text-gray-600">DNI: {deportistaSeleccionado.documentoIdentidad || 'Pendiente'}</p>
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-green-100 bg-green-50">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-800">Ingresos del mes</p>
                <p className="text-3xl font-bold text-green-950">{formatCurrency(resumen.totalIngresos)}</p>
                <p className="mt-1 text-xs text-green-800">
                  Mensualidades: {formatCurrency(resumen.ingresosMensualidades)} · {resumen.variacionIngresos >= 0 ? '+' : ''}{resumen.variacionIngresos}% vs mes anterior
                </p>
              </div>
              <Wallet className="h-10 w-10 text-green-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-800">Egresos del mes</p>
                <p className="text-3xl font-bold text-red-950">{formatCurrency(resumen.totalEgresos)}</p>
                <p className="mt-1 text-xs text-red-800">
                  Solo egresos registrados en caja
                </p>
              </div>
              <ArrowUpCircle className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={resumen.saldoNeto >= 0 ? 'border-blue-100 bg-blue-50' : 'border-amber-100 bg-amber-50'}>
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Saldo neto</p>
                <p className={`text-3xl font-bold ${resumen.saldoNeto >= 0 ? 'text-blue-950' : 'text-amber-950'}`}>
                  {formatCurrency(resumen.saldoNeto)}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {resumen.variacionSaldo >= 0 ? '+' : ''}{resumen.variacionSaldo}% vs mes anterior
                </p>
              </div>
              <Banknote className="h-10 w-10 text-blue-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-indigo-50">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-800">Ingreso meta 100%</p>
                <p className="text-3xl font-bold text-indigo-950">{formatCurrency(reporteFinanciero.ingresoMetaMensual)}</p>
                <p className="mt-1 text-xs text-indigo-800">Pendiente: {formatCurrency(reporteFinanciero.pendientePorCobrar)}</p>
              </div>
              <Target className="h-10 w-10 text-indigo-700" />
            </div>
          </CardContent>
        </Card>

        <Card className={reporteFinanciero.estadoEquilibrio === 'encima' ? 'border-emerald-100 bg-emerald-50' : 'border-orange-100 bg-orange-50'}>
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Punto de equilibrio</p>
                <p className="text-3xl font-bold text-gray-950">{formatCurrency(reporteFinanciero.puntoEquilibrio)}</p>
                <p className="mt-1 text-xs text-gray-600">
                  {reporteFinanciero.estadoEquilibrio === 'encima' ? 'Mes por encima' : `Falta ${formatCurrency(reporteFinanciero.faltanteEquilibrio)}`}
                </p>
              </div>
              <CalendarDays className="h-10 w-10 text-orange-700" />
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {!pagoDirecto && (
        <Card>
          <CardContent className="py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-gray-900">Avance de mensualidades cobradas</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {reporteFinanciero.avanceMetaMensual}% · {formatCurrency(reporteFinanciero.mensualidadesCubiertas)} de {formatCurrency(reporteFinanciero.ingresoMetaMensual)}
                  </p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-3 rounded-full bg-indigo-600"
                    style={{ width: `${reporteFinanciero.avanceMetaMensual}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:w-[420px]">
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-gray-500">Movimientos</p>
                  <p className="text-lg font-bold text-gray-900">{resumen.movimientos}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-gray-500">Periodo</p>
                  <p className="text-sm font-bold capitalize text-gray-900">
                    {new Date(`${mesSeleccionado}-01T00:00:00`).toLocaleDateString('es-PE', {
                      timeZone: 'America/Lima',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2 col-span-2 sm:col-span-1">
                  <p className="text-gray-500">Fijos referenciales</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(reporteFinanciero.totalGastosFijos)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!pagoDirecto && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <FileText className="h-5 w-5 text-primary-700" />
                  Estado financiero del club
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Lectura ejecutiva del periodo seleccionado para reportes administrativos.
                </p>
              </div>
              <div className={`rounded-lg px-4 py-3 text-white ${reporteFinanciero.saldo >= 0 ? 'bg-green-700' : 'bg-red-700'}`}>
                <p className="text-xs uppercase tracking-wide text-white/80">Margen operativo</p>
                <p className="text-2xl font-bold">{reporteFinanciero.margen}%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Ingresos operativos</p>
                <p className="mt-2 text-2xl font-bold text-green-700">S/ {reporteFinanciero.totalIngresos.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Egresos registrados</p>
                <p className="mt-2 text-2xl font-bold text-red-700">S/ {reporteFinanciero.totalEgresos.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Resultado neto</p>
                <p className={`mt-2 text-2xl font-bold ${reporteFinanciero.saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  S/ {reporteFinanciero.saldo.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Fijos referenciales</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">S/ {reporteFinanciero.totalGastosFijos.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Punto de equilibrio</p>
                <p className="mt-2 text-2xl font-bold text-amber-700">S/ {reporteFinanciero.puntoEquilibrio.toFixed(2)}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Falta: S/ {reporteFinanciero.faltanteEquilibrio.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <label className="text-sm font-medium text-gray-600">Meta margen (%)</label>
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={metaMargen}
                  onChange={(e) => setMetaMargen(e.target.value)}
                  className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xl font-bold text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Meta ingresos: S/ {reporteFinanciero.metaIngresos.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Lectura de equilibrio</p>
                <p className="mt-2 text-sm text-amber-950">
                  El club tiene S/ {reporteFinanciero.totalGastosFijos.toFixed(2)} en compromisos fijos referenciales. Los pagos reales se reflejan cuando se registran como egreso.
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">Meta comercial</p>
                <p className="mt-2 text-sm text-blue-950">
                  Para un margen de {reporteFinanciero.margenObjetivo}%, la meta de ingresos es S/ {reporteFinanciero.metaIngresos.toFixed(2)}.
                </p>
              </div>
              <div className={`rounded-lg border p-4 ${reporteFinanciero.faltanteMeta > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <p className={`text-sm font-semibold ${reporteFinanciero.faltanteMeta > 0 ? 'text-red-900' : 'text-green-900'}`}>
                  Avance contra meta
                </p>
                <p className={`mt-2 text-sm ${reporteFinanciero.faltanteMeta > 0 ? 'text-red-950' : 'text-green-950'}`}>
                  {reporteFinanciero.faltanteMeta > 0
                    ? `Faltan S/ ${reporteFinanciero.faltanteMeta.toFixed(2)} para llegar a la meta.`
                    : 'La meta del periodo ya está cubierta.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4 xl:col-span-2">
                <p className="font-semibold text-gray-900">Tendencia de ingresos, egresos y saldo</p>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reporteFinanciero.evolucion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mesLabel" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#15803d" strokeWidth={2} />
                      <Line type="monotone" dataKey="egresos" name="Egresos" stroke="#b91c1c" strokeWidth={2} />
                      <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#1d4ed8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">Meta del periodo</p>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { indicador: 'Ingresos', monto: reporteFinanciero.totalIngresos },
                        { indicador: 'Equilibrio', monto: reporteFinanciero.puntoEquilibrio },
                        { indicador: 'Meta', monto: reporteFinanciero.metaIngresos },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="indicador" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="monto" name="S/" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">Ingresos por concepto</p>
                <div className="mt-3 space-y-3">
                  {reporteFinanciero.ingresosPorConcepto.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin ingresos en el periodo.</p>
                  ) : reporteFinanciero.ingresosPorConcepto.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{getConceptoLabel(item.label)}</span>
                        <span className="font-semibold text-gray-900">S/ {item.total.toFixed(2)}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-green-600"
                          style={{ width: `${reporteFinanciero.totalIngresos ? Math.round((item.total / reporteFinanciero.totalIngresos) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">Egresos por categoría</p>
                <div className="mt-3 space-y-3">
                  {reporteFinanciero.egresosPorCategoria.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin egresos en el periodo.</p>
                  ) : reporteFinanciero.egresosPorCategoria.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{getEgresoLabel(item.label)}</span>
                        <span className="font-semibold text-gray-900">S/ {item.total.toFixed(2)}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-red-600"
                          style={{ width: `${reporteFinanciero.totalEgresos ? Math.round((item.total / reporteFinanciero.totalEgresos) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">Cobros por método</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {reporteFinanciero.ingresosPorMetodo.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin cobros registrados.</p>
                  ) : reporteFinanciero.ingresosPorMetodo.map((item) => (
                    <div key={item.label} className="rounded-lg bg-green-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase text-green-800">{getMetodoLabel(item.label)}</p>
                      <p className="text-lg font-bold text-green-900">S/ {item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">Egresos por método</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {reporteFinanciero.egresosPorMetodo.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin egresos registrados.</p>
                  ) : reporteFinanciero.egresosPorMetodo.map((item) => (
                    <div key={item.label} className="rounded-lg bg-red-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase text-red-800">{getMetodoLabel(item.label)}</p>
                      <p className="text-lg font-bold text-red-900">S/ {item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="font-semibold text-gray-900">Evolución mensual</p>
              <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reporteFinanciero.conceptosChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="concepto" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="monto" name="Ingresos" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reporteFinanciero.egresosChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="monto" name="Egresos" fill="#dc2626" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="border border-slate-300 px-3 py-2 text-left">Mes</th>
                      <th className="border border-slate-300 px-3 py-2 text-right">Ingresos</th>
                      <th className="border border-slate-300 px-3 py-2 text-right">Egresos</th>
                      <th className="border border-slate-300 px-3 py-2 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteFinanciero.evolucion.map((item) => (
                      <tr key={item.mes}>
                        <td className="border border-slate-200 px-3 py-2 capitalize">
                          {new Date(`${item.mes}-01T00:00:00`).toLocaleDateString('es-PE', {
                            timeZone: 'America/Lima',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right text-green-700">S/ {item.ingresos.toFixed(2)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right text-red-700">S/ {item.egresos.toFixed(2)}</td>
                        <td className={`border border-slate-200 px-3 py-2 text-right font-semibold ${item.saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          S/ {item.saldo.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!pagoDirecto && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Gastos fijos</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Define obligaciones mensuales para proyectar equilibrio, metas y presión de caja.
                </p>
              </div>
              <div className="rounded-lg bg-slate-900 px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-slate-300">Fijos activos</p>
                <p className="text-2xl font-bold">S/ {reporteFinanciero.totalGastosFijos.toFixed(2)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <details className="rounded-lg border border-gray-200 bg-gray-50">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-gray-900">
                <span>{editingGastoFijoId ? 'Editar gasto fijo' : 'Agregar gasto fijo recurrente'}</span>
                <PlusCircle className="h-5 w-5 text-primary-700" />
              </summary>
              <form onSubmit={handleGastoFijoSubmit} className="grid grid-cols-1 gap-4 border-t border-gray-200 bg-white p-4 lg:grid-cols-6">
              <Input
                label="Nombre"
                name="nombre"
                type="text"
                value={gastoFijoData.nombre}
                onChange={handleGastoFijoChange}
                required
                placeholder="Ej: Alquiler cancha"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  name="categoria"
                  list="categorias-egreso"
                  value={gastoFijoData.categoria}
                  onChange={handleGastoFijoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Ej: alquiler, servicios"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                <select
                  name="metodo"
                  value={gastoFijoData.metodo}
                  onChange={handleGastoFijoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  {metodos.map((metodo) => (
                    <option key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Monto mensual"
                name="monto"
                type="number"
                min="0"
                step="0.01"
                value={gastoFijoData.monto}
                onChange={handleGastoFijoChange}
                required
                placeholder="0.00"
              />
              <Input
                label="Día venc."
                name="diaVencimiento"
                type="number"
                min="1"
                max="31"
                value={gastoFijoData.diaVencimiento}
                onChange={handleGastoFijoChange}
                placeholder="Ej: 5"
              />
              <div className="flex items-end">
                <Button type="submit" disabled={isSubmittingGastoFijo} className="w-full">
                  {isSubmittingGastoFijo ? 'Guardando...' : editingGastoFijoId ? 'Guardar fijo' : 'Agregar fijo'}
                </Button>
              </div>
              <div className="lg:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                <textarea
                  name="observacion"
                  value={gastoFijoData.observacion}
                  onChange={handleGastoFijoChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Contrato, responsable, condición o nota de pago"
                />
              </div>
              {editingGastoFijoId && (
                <div className="lg:col-span-6">
                  <Button type="button" variant="outline" onClick={resetGastoFijoForm}>
                    Cancelar edición
                  </Button>
                </div>
              )}
              </form>
            </details>

            {gastosFijos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-600">
                Todavía no hay gastos fijos definidos.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {gastosFijos.map((gasto) => (
                  <div key={gasto.id} className={`rounded-lg border p-4 ${gasto.activo ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">{gasto.nombre}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${gasto.activo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {gasto.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-3">
                          <span>{getEgresoLabel(gasto.categoria)}</span>
                          {gasto.metodo && <span>Método: {getMetodoLabel(gasto.metodo)}</span>}
                          {gasto.diaVencimiento && <span>Vence día {gasto.diaVencimiento}</span>}
                        </div>
                        {gasto.observacion && (
                          <p className="mt-2 text-sm text-gray-500">{gasto.observacion}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <p className="text-xl font-bold text-slate-900">S/ {gasto.monto.toFixed(2)}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => toggleGastoFijo(gasto)}>
                            {gasto.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => cargarGastoFijoEnFormulario(gasto)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button type="button" variant="danger" size="sm" onClick={() => eliminarGastoFijo(gasto)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
                      {deportista.nombre} {deportista.apellidos} - {deportista.documentoIdentidad || 'Pendiente'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                  <input
                    name="concepto"
                    list="conceptos-ingreso"
                    value={ingresoData.concepto}
                    onChange={handleIngresoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Ej: mensualidad, uniforme, prenda"
                  />
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

              {!editingPagoId && (
                <Button type="button" variant="outline" onClick={agregarIngresoAlCarrito} className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar al carrito
                </Button>
              )}

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
                      {deportista.nombre} {deportista.apellidos} - {deportista.documentoIdentidad || 'Pendiente'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                  <input
                    name="concepto"
                    list="conceptos-ingreso"
                    value={ingresoData.concepto}
                    onChange={handleIngresoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Ej: mensualidad, uniforme, prenda"
                  />
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

              {!editingPagoId && (
                <Button type="button" variant="outline" onClick={agregarIngresoAlCarrito} className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar al carrito
                </Button>
              )}

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
            <details open={Boolean(editingEgresoId)} className="rounded-lg border border-gray-200 bg-gray-50">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-gray-900">
                <span>{editingEgresoId ? 'Editar egreso puntual' : 'Agregar egreso puntual o recurrente'}</span>
                <Repeat className="h-5 w-5 text-primary-700" />
              </summary>
            <form onSubmit={handleEgresoSubmit} className="space-y-4 border-t border-gray-200 bg-white p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input
                    name="categoria"
                    list="categorias-egreso"
                    value={egresoData.categoria}
                    onChange={handleEgresoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Ej: sueldos, servicios"
                  />
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

              {!editingEgresoId && (
                <label className="flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
                  <input
                    type="checkbox"
                    name="recurrente"
                    checked={egresoData.recurrente}
                    onChange={handleEgresoChange}
                    className="mt-1 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    Marcar como gasto fijo mensual. Se guardará como recurrente activo y se aplicará automáticamente en cada mes.
                  </span>
                </label>
              )}

              <Button type="submit" disabled={isSubmittingEgreso} className="w-full">
                {isSubmittingEgreso ? 'Guardando egreso...' : editingEgresoId ? 'Guardar cambios' : egresoData.recurrente ? 'Crear gasto recurrente' : 'Registrar Egreso'}
              </Button>
              {editingEgresoId && (
                <Button type="button" variant="outline" className="w-full" onClick={resetEgresoForm}>
                  Cancelar edición
                </Button>
              )}
            </form>
            </details>
          </CardContent>
        </Card>
        )}
      </div>
      )}

      {(pagoDirecto || tipoMovimiento === 'ingreso') && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Exonerar mensualidad</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Marca un mes como justificado por lesión, enfermedad u otra razón. No genera ingreso en caja.
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 px-4 py-3 text-blue-900">
                <p className="text-xs font-semibold uppercase">Exoneraciones</p>
                <p className="text-2xl font-bold">{exoneraciones.length}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleExoneracionSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deportista</label>
                <select
                  name="deportistaId"
                  value={exoneracionData.deportistaId}
                  onChange={handleExoneracionChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  <option value="">Seleccionar deportista</option>
                  {deportistas.map((deportista) => (
                    <option key={deportista.id} value={deportista.id}>
                      {deportista.nombre} {deportista.apellidos} - {deportista.documentoIdentidad || 'Pendiente'}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Mes exonerado"
                name="mes"
                type="month"
                value={exoneracionData.mes}
                onChange={handleExoneracionChange}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <select
                  name="motivo"
                  value={exoneracionData.motivo}
                  onChange={handleExoneracionChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  {motivosExoneracion.map((motivo) => (
                    <option key={motivo.value} value={motivo.value}>
                      {motivo.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isSubmittingExoneracion} className="w-full">
                  {isSubmittingExoneracion ? 'Registrando...' : 'Exonerar mes'}
                </Button>
              </div>
              <div className="lg:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                <textarea
                  name="observacion"
                  value={exoneracionData.observacion}
                  onChange={handleExoneracionChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Detalle: lesión, enfermedad, acuerdo administrativo, fecha de retorno, etc."
                />
              </div>
            </form>

            {exoneraciones.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-gray-600">
                No hay mensualidades exoneradas en este alcance.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {exoneraciones.slice(0, 8).map((exoneracion) => (
                  <div key={exoneracion.id} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-blue-950">
                          {exoneracion.deportista.nombre} {exoneracion.deportista.apellidos}
                        </p>
                        <div className="mt-1 flex flex-col gap-1 text-sm text-blue-900 sm:flex-row sm:flex-wrap sm:gap-3">
                          <span>Mes: {exoneracion.mes.slice(0, 7)}</span>
                          <span>Motivo: {getMotivoExoneracionLabel(exoneracion.motivo)}</span>
                        </div>
                        {exoneracion.observacion && (
                          <p className="mt-2 text-sm text-blue-800">{exoneracion.observacion}</p>
                        )}
                      </div>
                      <Button type="button" variant="danger" size="sm" onClick={() => eliminarExoneracion(exoneracion)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Anular
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(pagoDirecto || tipoMovimiento === 'ingreso') && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                  <ShoppingCart className="h-5 w-5 text-primary-700" />
                  Carrito de cobro
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Agrupa mensualidades, inscripciones, uniformes o prendas antes de registrar el cobro.
                </p>
              </div>
              <div className="rounded-lg bg-slate-900 px-4 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-slate-300">Total carrito</p>
                <p className="text-2xl font-bold">S/ {carritoTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {carritoIngresos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-600">
                El carrito está vacío. Completa el formulario de ingreso y usa “Agregar al carrito”.
              </div>
            ) : (
              <div className="space-y-3">
                {carritoIngresos.map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {index + 1}. {item.deportistaNombre}
                        </p>
                        <div className="mt-1 flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-3">
                          <span>{getConceptoLabel(item.concepto)}</span>
                          <span>Método: {getMetodoLabel(item.metodo)}</span>
                          <span>Fecha: {formatLimaDate(item.fechaPago)}</span>
                          {(item.concepto === 'mensualidad' || item.concepto === 'anualidad') && (
                            <span>
                              Cobertura: {item.mesCoberturaInicio}
                              {item.mesCoberturaFin !== item.mesCoberturaInicio ? ` a ${item.mesCoberturaFin}` : ''}
                            </span>
                          )}
                        </div>
                        {item.observacion && (
                          <p className="mt-2 text-sm text-gray-500">{item.observacion}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <p className="text-xl font-bold text-green-700">S/ {Number(item.monto).toFixed(2)}</p>
                        <Button type="button" variant="danger" size="sm" onClick={() => quitarIngresoDelCarrito(item.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Quitar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    {carritoIngresos.length} concepto{carritoIngresos.length === 1 ? '' : 's'} listo{carritoIngresos.length === 1 ? '' : 's'} para cobrar.
                  </p>
                  <Button type="button" onClick={cobrarCarrito} disabled={isSubmittingCarrito}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isSubmittingCarrito ? 'Cobrando carrito...' : 'Cobrar carrito'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!pagoDirecto && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Egresos del mes por categoría</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Incluye solo egresos registrados en el periodo. Los gastos fijos son referencia de compromisos.
                </p>
              </div>
              <div className="rounded-lg bg-red-50 px-4 py-3 text-red-900">
                <p className="text-xs font-semibold uppercase">Registrados</p>
                <p className="text-2xl font-bold">{formatCurrency(reporteFinanciero.totalEgresosVariables)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {egresosDelMesAgrupados.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-gray-600">
                No hay egresos puntuales registrados en este mes.
              </div>
            ) : (
              <div className="space-y-4">
                {egresosDelMesAgrupados.map((grupo) => (
                  <div key={grupo.categoria} className="rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="font-semibold text-gray-900">{getEgresoLabel(grupo.categoria)}</p>
                      <p className="font-bold text-red-700">{formatCurrency(grupo.total)}</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {grupo.items.map((egreso) => (
                        <div key={egreso.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{egreso.beneficiario}</p>
                            <p className="text-sm text-gray-600">
                              {formatLimaDate(egreso.fechaEgreso)} · {getMetodoLabel(egreso.metodo)}
                              {egreso.observacion ? ` · ${egreso.observacion}` : ''}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <p className="mr-2 text-lg font-bold text-red-700">{formatCurrency(egreso.monto)}</p>
                            <Button type="button" variant="outline" size="sm" onClick={() => cargarEgresoEnFormulario(egreso)}>
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button type="button" variant="danger" size="sm" onClick={() => eliminarEgreso(egreso)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {!pagoDirecto && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={vistaMovimientos === 'todos' ? 'primary' : 'outline'}
                  onClick={() => setVistaMovimientos('todos')}
                >
                  Todos
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={vistaMovimientos === 'ingresos' ? 'primary' : 'outline'}
                  onClick={() => setVistaMovimientos('ingresos')}
                >
                  Ingresos
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={vistaMovimientos === 'egresos' ? 'primary' : 'outline'}
                  onClick={() => setVistaMovimientos('egresos')}
                >
                  Egresos
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {pagoDirecto
                  ? 'Historial de pagos'
                  : vistaMovimientos === 'ingresos'
                    ? 'Ingresos del Mes'
                    : vistaMovimientos === 'egresos'
                      ? 'Egresos del Mes'
                      : 'Movimientos de Caja'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {pagoDirecto
                  ? 'Pagos registrados para este deportista.'
                  : vistaMovimientos === 'ingresos'
                    ? 'Pagos e ingresos registrados durante el periodo seleccionado.'
                    : vistaMovimientos === 'egresos'
                      ? 'Egresos registrados durante el periodo seleccionado.'
                      : 'Historial consolidado de ingresos y egresos'}
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={
                  pagoDirecto
                    ? 'Buscar por concepto o método'
                    : vistaMovimientos === 'egresos'
                      ? 'Buscar egresos por beneficiario, categoría o método'
                      : vistaMovimientos === 'ingresos'
                        ? 'Buscar ingresos por deportista, concepto o método'
                        : 'Buscar por persona, categoría o método'
                }
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-gray-900"
              />
            </div>
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
                    {movimiento.tipo === 'egreso' && (
                      <div className="mt-3 flex flex-wrap justify-start gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const egreso = egresos.find((item) => item.id === movimiento.id)
                            if (egreso) cargarEgresoEnFormulario(egreso)
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
                            const egreso = egresos.find((item) => item.id === movimiento.id)
                            if (egreso) eliminarEgreso(egreso)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
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
