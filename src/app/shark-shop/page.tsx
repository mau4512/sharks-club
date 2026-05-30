import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  BadgeDollarSign,
  CreditCard,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

const productosDestacados = [
  {
    nombre: 'Uniforme Oficial Sharks',
    precio: 'S/ 160',
    descripcion:
      'Kit completo obligatorio de competencia con camiseta y short institucional.',
    detalle: 'Renovación de modelo cada 2 años',
    nota: 'Cada juego individual equivale a S/ 80',
    icono: Shirt,
    etiqueta: 'Producto principal',
  },
  {
    nombre: 'Prendas de entrenamiento',
    precio: 'Consultar',
    descripcion:
      'Polos, shorts y prendas de uso diario para deportistas, familias y staff del club.',
    detalle: 'Disponibilidad por campañas y temporadas',
    nota: 'Stock sujeto a lanzamientos del club',
    icono: ShoppingBag,
    etiqueta: 'Campañas del club',
  },
  {
    nombre: 'Ediciones especiales',
    precio: 'Consultar',
    descripcion:
      'Colecciones por torneos, eventos institucionales y temporadas especiales Sharks.',
    detalle: 'Series limitadas',
    nota: 'Producción por preventa o campañas',
    icono: Sparkles,
    etiqueta: 'Lanzamientos',
  },
]

const pasosCompra = [
  {
    titulo: 'Consulta disponibilidad',
    descripcion:
      'Escríbenos por WhatsApp o correo para confirmar tallas, stock y campaña activa.',
    icono: ShoppingBag,
  },
  {
    titulo: 'Confirma talla y pedido',
    descripcion:
      'Definimos el producto, la talla y si corresponde uniforme completo o pedido especial.',
    icono: Ruler,
  },
  {
    titulo: 'Registra tu pago',
    descripcion:
      'El club registra el movimiento y deja trazabilidad del pago de uniforme o merchandising.',
    icono: CreditCard,
  },
  {
    titulo: 'Entrega coordinada',
    descripcion:
      'La entrega se coordina según campaña, sede y disponibilidad del club.',
    icono: PackageCheck,
  },
]

const datosPago = [
  'Uniforme oficial completo: S/ 160',
  'Juego individual de uniforme: S/ 80',
  'Pagos sujetos a confirmación de stock y campaña vigente',
]

export default function SharkShopPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-gray-600 transition hover:text-primary-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.35),_transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_42%,#0b1f4b_100%)] text-white">
          <div className="grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-primary-300/30 bg-primary-400/10 px-4 py-2 text-sm font-semibold text-primary-100">
                Uniforme oficial y merchandising del club
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Shark Shop
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
                Tienda oficial para uniforme, campañas de renovación y prendas Sharks. Aquí centralizamos
                el catálogo base del club y el canal directo para coordinar pedidos.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="https://wa.me/51900596258?text=Hola%2C%20quiero%20consultar%20por%20Shark%20Shop"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button size="lg" className="w-full bg-primary-500 hover:bg-primary-400">
                    Consultar por WhatsApp
                  </Button>
                </a>
                <a
                  href="mailto:faradaysharks@gmail.com?subject=Consulta%20Shark%20Shop"
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-white/25 text-white hover:bg-white/10"
                  >
                    Consultar por correo
                  </Button>
                </a>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <Image
                  src="/images/sharks-transparent.png"
                  alt="Sharks Basketball"
                  width={88}
                  height={88}
                  className="rounded-xl bg-white/95 p-1"
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-primary-200">
                    Producto principal
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">Uniforme Sharks</h2>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-primary-300/20 bg-primary-500/10 p-5">
                <div className="flex items-center gap-3 text-primary-100">
                  <BadgeDollarSign className="h-5 w-5" />
                  <p className="font-semibold">Precio base visible para el club</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-200">
                  {datosPago.map((dato) => (
                    <p key={dato}>{dato}</p>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-5">
                <div className="flex items-center gap-3 text-emerald-100">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="font-semibold">Control institucional</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">
                  Los pagos de uniforme quedan vinculados al control financiero del club para seguimiento y entrega.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="catalogo" className="py-16">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-primary-700 sm:text-4xl">
              Catálogo Sharks
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              Base actual para uniforme, campañas institucionales y merchandising del club.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {productosDestacados.map((producto) => {
              const Icono = producto.icono

              return (
                <Card
                  key={producto.nombre}
                  className="border-2 border-slate-200 hover:border-primary-300 hover:shadow-xl transition-all"
                >
                  <CardContent className="pt-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="inline-flex rounded-2xl bg-primary-100 p-4 text-primary-700">
                        <Icono className="h-7 w-7" />
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {producto.etiqueta}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900">{producto.nombre}</h3>
                    <p className="mt-3 text-gray-600">{producto.descripcion}</p>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Precio
                      </p>
                      <p className="mt-2 text-3xl font-bold text-primary-700">{producto.precio}</p>
                      <p className="mt-2 text-sm font-medium text-slate-700">{producto.detalle}</p>
                      <p className="mt-1 text-sm text-slate-500">{producto.nota}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="grid gap-6 pb-16 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-2 border-slate-200">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-primary-700">Cómo pedir</h2>
              <div className="mt-6 space-y-4">
                {pasosCompra.map((paso, index) => {
                  const Icono = paso.icono

                  return (
                    <div
                      key={paso.titulo}
                      className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                        <Icono className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                          Paso {index + 1}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-gray-900">{paso.titulo}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          {paso.descripcion}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary-200 bg-primary-50/50">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold text-primary-700">Datos útiles antes de comprar</h2>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-primary-200 bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Tallas
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">
                    La entrega de uniforme se coordina según talla disponible y categoría del deportista.
                  </p>
                </div>

                <div className="rounded-2xl border border-primary-200 bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Campañas
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">
                    Algunos productos se liberan por temporada, renovación institucional o preventa.
                  </p>
                </div>

                <div className="rounded-2xl border border-primary-200 bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Canales oficiales
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">
                    WhatsApp: <a className="font-semibold text-primary-700" href="https://wa.me/51900596258" target="_blank" rel="noreferrer">+51 900 596 258</a>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-700">
                    Correo: <a className="font-semibold text-primary-700" href="mailto:faradaysharks@gmail.com">faradaysharks@gmail.com</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
