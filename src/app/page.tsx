'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Trophy, Users, Target, Calendar, CheckCircle, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import MatriculaForm from '@/components/MatriculaForm'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:h-20 sm:py-0">
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

            <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-4">
              <Link href="#matricula" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">Únete al Club</Button>
              </Link>
              <Link href="/portal-del-club" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Portal del Club</Button>
              </Link>
            </div>

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50 sm:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-gray-100 pb-4 pt-3 sm:hidden">
              <div className="flex flex-col gap-3">
                <Link href="/portal-del-club" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Portal del Club</Button>
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
      <section className="bg-gradient-to-br from-primary-50 to-white pb-20 pt-28 sm:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
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
              Entrenamiento estructurado según etapa formativa y nivel competitivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 hover:shadow-2xl transition-all">
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Formativo U13-U15</h3>
                <div className="text-4xl font-bold text-primary-600 mb-6">3 Días / Semana</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Fundamentos técnicos y coordinación</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Desarrollo de hábitos deportivos y disciplina</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Introducción a conceptos tácticos colectivos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Competencias internas y amistosos</span>
                  </li>
                </ul>
                <Link href="#matricula">
                  <Button className="w-full" variant="outline">Quiero este plantel</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary-400 hover:shadow-2xl transition-all transform scale-105">
              <div className="bg-primary-600 text-white text-center py-2 font-semibold rounded-t-lg">
                PLANTEL PRINCIPAL
              </div>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Competitivo U16-U19</h3>
                <div className="text-4xl font-bold text-primary-600 mb-6">5 Días / Semana</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Perfeccionamiento técnico por posición</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Sistemas ofensivos y ajustes defensivos</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Análisis de video y métricas de rendimiento</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Preparación para torneos y selectivos</span>
                  </li>
                </ul>
                <Link href="#matricula">
                  <Button className="w-full">Unirme al principal</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-2xl transition-all">
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Desarrollo Individual</h3>
                <div className="text-4xl font-bold text-primary-600 mb-6">Plan Personalizado</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Trabajo 1 a 1 técnico y físico</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Objetivos por fase y control de carga</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Reportes de progreso y retroalimentación</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Integración al plantel competitivo</span>
                  </li>
                </ul>
                <Link href="#matricula">
                  <Button className="w-full" variant="outline">Solicitar evaluación</Button>
                </Link>
              </CardContent>
            </Card>
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
