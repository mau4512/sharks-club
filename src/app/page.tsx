'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Trophy, Users, Target, Calendar, CheckCircle, Menu, X, Shield, ShoppingBag, UserCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import MatriculaForm from '@/components/MatriculaForm'

const planteles = [
  { nombre: 'U13 Varones', frecuencia: '3 días por semana', horario: '16:30 hrs' },
  { nombre: 'U13 Damas', frecuencia: '3 días por semana', horario: '17:30 hrs' },
  { nombre: 'U15 Damas', frecuencia: '5 días por semana', horario: '17:30 hrs' },
  { nombre: 'U15 Varones', frecuencia: '5 días por semana', horario: '18:30 hrs' },
  { nombre: 'U17 Damas', frecuencia: '3 sesiones por semana', horario: '19:30 hrs' },
  { nombre: 'Superior Damas', frecuencia: '3 sesiones por semana', horario: '19:30 hrs' },
  { nombre: 'U17-U19 Varones', frecuencia: '5 sesiones por semana', horario: '20:30 hrs' },
  { nombre: 'Superior Varones (PRO)', frecuencia: '5 sesiones por semana', horario: '21:30 hrs', destacado: true },
]

const competencias = [
  { nombre: 'Interclubes', archivo: '/images/interclubes.png' },
  { nombre: 'Liga Femenina de Basket', archivo: '/images/lba_femenina.png', claseLogo: 'max-h-[7.5rem]' },
  { nombre: 'Liga Masculina de Basket', archivo: '/images/lba_masculina.png', claseLogo: 'max-h-[10.5rem]' },
]

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden border-b border-gray-100 md:flex md:items-center md:justify-end md:gap-6 md:py-2">
            <Link href="/portal-del-club" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary-600">
              <Users className="h-4 w-4" />
              Miembros del Club
            </Link>
            <Link href="/portal-del-club" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary-600">
              <Shield className="h-4 w-4" />
              Portal del Club
            </Link>
            <Link href="/shark-shop" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary-600">
              <ShoppingBag className="h-4 w-4" />
              Shark Shop
            </Link>
          </div>

          <div className="flex items-center justify-between py-3 md:py-4">
            <div className="flex min-w-0 items-center">
              <Image 
                src="/images/sharks-transparent.png" 
                alt="Faraday Sharks Logo" 
                width={72} 
                height={72} 
                className="object-contain bg-white/95 rounded-md p-1 shadow-sm" 
              />
              <span className="ml-3 text-lg font-bold text-gray-900 sm:text-2xl">Sharks Basketball</span>
            </div>

            <div className="hidden md:flex md:flex-row md:items-center md:gap-4">
              <Link href="#programas" className="w-full md:w-auto">
                <Button variant="ghost" className="w-full md:w-auto">Planteles</Button>
              </Link>
              <Link href="#matricula" className="w-full md:w-auto">
                <Button className="w-full md:w-auto">Inscripción</Button>
              </Link>
            </div>

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50 md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-gray-100 pb-4 pt-3 md:hidden">
              <div className="flex flex-col gap-3">
                <Link href="/portal-del-club" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Portal del Club</Button>
                </Link>
                <Link href="/portal-del-club" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">Miembros del Club</Button>
                </Link>
                <Link href="/shark-shop" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Shark Shop</Button>
                </Link>
                <Link href="#programas" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">Planteles</Button>
                </Link>
                <Link href="#matricula" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Inscripción</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white pb-20 pt-28 md:pt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm">
                Club, formación y competencia
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Formamos Jugadores para <span className="text-primary-600">Competir y Crecer</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                Sharks Basketball es un club enfocado en formación integral: fundamentos técnicos, preparación física,
                disciplina táctica y desarrollo personal. Trabajamos por categorías y objetivos reales de competencia.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="#matricula" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-base sm:text-lg px-8">
                    Sumarme al Club
                  </Button>
                </Link>
                <Link href="#programas" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full text-base sm:text-lg px-8">
                    Ver Planteles
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl transform rotate-3"></div>
              <div className="absolute inset-0 bg-gray-900 rounded-3xl overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Trophy className="h-32 w-32 mx-auto mb-4 text-primary-400" />
                    <p className="text-2xl font-bold">Identidad, Equipo y Competencia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-300">Ecosistema Sharks</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Tu club también vive fuera de la cancha</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Separamos la presentación pública del club de los accesos internos para miembros, operación deportiva y merchandising oficial.
              </p>
            </div>
            <Link href="/portal-del-club" className="w-full md:w-auto">
              <Button className="w-full bg-primary-500 hover:bg-primary-400 md:w-auto">
                Ir al portal
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card className="border border-white/10 bg-white/5 text-white shadow-none">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-2xl bg-primary-500/15 p-4 text-primary-200">
                  <UserCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold">Miembros del Club</h3>
                <p className="mt-3 text-slate-300">
                  Entrada clara para quienes ya forman parte de Sharks y necesitan acceder a sus herramientas del día a día.
                </p>
                <Link href="/portal-del-club" className="mt-5 inline-flex items-center text-sm font-semibold text-primary-200 hover:text-white">
                  Ver accesos
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-white/5 text-white shadow-none">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-2xl bg-primary-500/15 p-4 text-primary-200">
                  <Shield className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold">Portal del Club</h3>
                <p className="mt-3 text-slate-300">
                  Administración, entrenadores y deportistas comparten un acceso centralizado para sesiones, pagos y control interno.
                </p>
                <Link href="/login" className="mt-5 inline-flex items-center text-sm font-semibold text-primary-200 hover:text-white">
                  Ingresar
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-white/5 text-white shadow-none">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-2xl bg-primary-500/15 p-4 text-primary-200">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold">Shark Shop</h3>
                <p className="mt-3 text-slate-300">
                  Uniforme oficial, campañas de renovación y merchandising del club con un punto de acceso propio.
                </p>
                <Link href="/shark-shop" className="mt-5 inline-flex items-center text-sm font-semibold text-primary-200 hover:text-white">
                  Ir a la tienda
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-600">Competencias del año</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Torneos en los que participa Sharks
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600">
              Nuestros planteles compiten a lo largo de la temporada en distintos frentes formativos y oficiales del calendario local.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {competencias.map((competencia) => (
              <Card key={competencia.nombre} className="border-2 hover:border-primary-300 hover:shadow-xl transition-all">
                <CardContent className="pt-6">
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-6">
                    <img
                      src={competencia.archivo}
                      alt={`Logo ${competencia.nombre}`}
                      className={`w-auto object-contain ${competencia.claseLogo || 'max-h-full'}`}
                    />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-gray-900">{competencia.nombre}</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Presencia competitiva del club durante la temporada, según categoría y rama.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué Sharks Basketball?
            </h2>
            <p className="text-xl text-gray-600">
              Un modelo de club para formar deportistas completos dentro y fuera de la cancha
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 hover:border-primary-400 transition-all hover:shadow-xl">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Cuerpo Técnico de Club</h3>
                <p className="text-gray-600">
                  Entrenadores con metodología por categorías, planificación semanal y seguimiento individual.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary-400 transition-all hover:shadow-xl">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Desarrollo Técnico-Táctico</h3>
                <p className="text-gray-600">
                  Trabajo de fundamentos, lectura de juego y toma de decisiones aplicada al partido.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary-400 transition-all hover:shadow-xl">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Microciclos de Entrenamiento</h3>
                <p className="text-gray-600">
                  Organización semanal por objetivos: volumen, intensidad, recuperación y evaluación.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary-400 transition-all hover:shadow-xl">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Competencia y Proyección</h3>
                <p className="text-gray-600">
                  Participación en torneos, preparación para pruebas y progresión deportiva medible.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Programas */}
      <section id="programas" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planteles del Club
            </h2>
            <p className="text-xl text-gray-600">
              Categorías y horarios reales de entrenamiento para la temporada actual
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {planteles.map((plantel) => (
              <Card
                key={plantel.nombre}
                className={`border-2 transition-all hover:-translate-y-1 hover:shadow-2xl ${
                  plantel.destacado ? 'border-primary-500 shadow-xl' : 'hover:border-primary-300'
                }`}
              >
                {plantel.destacado && (
                  <div className="rounded-t-lg bg-primary-600 py-2 text-center text-sm font-semibold text-white">
                    PLANTEL DE ALTA COMPETENCIA
                  </div>
                )}
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold text-gray-900">{plantel.nombre}</h3>
                  <div className="mt-4 text-3xl font-bold text-primary-600">{plantel.horario}</div>
                  <div className="mt-2 text-sm font-medium uppercase tracking-wide text-gray-500">
                    {plantel.frecuencia}
                  </div>

                  <ul className="mb-8 mt-6 space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span className="text-gray-600">Planificación adaptada a la categoría y etapa competitiva.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span className="text-gray-600">Trabajo técnico, táctico y físico según el grupo asignado.</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      <span className="text-gray-600">Seguimiento del club para asistencia, pagos y progresión deportiva.</span>
                    </li>
                  </ul>

                  <Link href="#matricula">
                    <Button className="w-full" variant={plantel.destacado ? 'primary' : 'outline'}>
                      Solicitar cupo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario de Matrícula */}
      <section id="matricula" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Inscripción Sharks Basketball
            </h2>
            <p className="text-xl text-gray-600">
              Completa el formulario y el cuerpo técnico te contactará para evaluación y asignación de plantel.
            </p>
          </div>

          <MatriculaForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Image 
                  src="/images/sharks-transparent.png" 
                  alt="Faraday Sharks Logo" 
                  width={64} 
                  height={64} 
                  className="object-contain bg-white/95 rounded-md p-1 shadow-sm" 
                />
                <span className="ml-3 text-xl font-bold">Sharks Basketball</span>
              </div>
              <p className="text-gray-400">
                Club de desarrollo y competencia en baloncesto
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: contacto@sharksbasketball.com</li>
                <li>Teléfono: +52 000 000 0000</li>
                <li>Dirección: Sede Club Faraday</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Enlaces</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#programas" className="text-gray-400 hover:text-primary-400">
                    Planteles
                  </Link>
                </li>
                <li>
                  <Link href="#matricula" className="text-gray-400 hover:text-primary-400">
                    Inscripción
                  </Link>
                </li>
                <li>
                  <Link href="/portal-del-club" className="text-gray-400 hover:text-primary-400">
                    Portal del Club
                  </Link>
                </li>
                <li>
                  <Link href="/shark-shop" className="text-gray-400 hover:text-primary-400">
                    Shark Shop
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Sharks Basketball. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
