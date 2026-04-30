import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ShoppingBag, Shirt, Trophy, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

const productos = [
  {
    nombre: 'Uniforme Oficial Sharks',
    descripcion: 'Camiseta y short del club para competencia y presentación institucional.',
    detalle: 'Tallajes formativos y adultos',
    icono: Shirt,
  },
  {
    nombre: 'Merch de entrenamiento',
    descripcion: 'Polos, shorts y prendas de uso diario para deportistas y familiares del club.',
    detalle: 'Stock por campañas y temporadas',
    icono: ShoppingBag,
  },
  {
    nombre: 'Ediciones especiales',
    descripcion: 'Lanzamientos por temporadas, renovaciones de uniforme y eventos del club.',
    detalle: 'Disponibilidad limitada',
    icono: Trophy,
  },
]

export default function SharkShopPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center text-sm text-gray-600 transition hover:text-primary-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-primary-950 text-white">
          <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-primary-400/30 bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-100">
                Merchandising y uniforme oficial
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Shark Shop
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
                Espacio oficial para uniforme, prendas del club y artículos de identidad Sharks. Aquí concentraremos
                los lanzamientos, renovaciones de camiseta y stock disponible.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="mailto:faradaysharks@gmail.com?subject=Consulta%20Shark%20Shop"
                  className="w-full sm:w-auto"
                >
                  <Button size="lg" className="w-full bg-primary-500 hover:bg-primary-400">
                    Consultar disponibilidad
                  </Button>
                </a>
                <Link href="#catalogo" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                    Ver catálogo inicial
                  </Button>
                </Link>
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
                  <p className="text-sm uppercase tracking-[0.2em] text-primary-200">Colección oficial</p>
                  <h2 className="mt-1 text-2xl font-bold">Uniforme y merch</h2>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-primary-400/20 bg-primary-500/10 p-5">
                <div className="flex items-center gap-3 text-primary-100">
                  <PackageCheck className="h-5 w-5" />
                  <p className="font-semibold">Renovación de modelo cada 2 años</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">
                  Esta tienda también servirá para comunicar renovaciones de uniforme, campañas de entrega y control de
                  pagos de indumentaria del club.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="catalogo" className="py-16">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Catálogo inicial</h2>
            <p className="mt-3 text-lg text-gray-600">
              Base para merchandising, uniforme y campañas de temporada del club.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {productos.map((producto) => {
              const Icono = producto.icono

              return (
                <Card key={producto.nombre} className="border-2 hover:border-primary-300 hover:shadow-xl transition-all">
                  <CardContent className="pt-6">
                    <div className="mb-5 inline-flex rounded-2xl bg-primary-100 p-4 text-primary-700">
                      <Icono className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{producto.nombre}</h3>
                    <p className="mt-3 text-gray-600">{producto.descripcion}</p>
                    <p className="mt-4 text-sm font-medium text-primary-700">{producto.detalle}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

        </section>
      </div>
    </div>
  )
}
