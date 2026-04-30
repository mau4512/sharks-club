import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Shield, UserCog, User, Clock, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

const accesos = [
  {
    titulo: 'Administración',
    descripcion: 'Control de caja, inscripciones, deportistas, turnos y operación general del club.',
    icono: Shield,
  },
  {
    titulo: 'Entrenadores',
    descripcion: 'Asistencias, planificación de entrenamientos, ejercicios y seguimiento de grupos.',
    icono: UserCog,
  },
  {
    titulo: 'Deportistas',
    descripcion: 'Sesiones asignadas, historial, estadísticas y acceso personal al portal.',
    icono: User,
  },
]

const servicios = [
  'Acceso con DNI, correo o usuario y contraseña',
  'Consulta rápida de pagos, asistencia y sesiones',
  'Ingreso unificado para administración, entrenadores y deportistas',
]

export default function PortalDelClubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-primary-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center text-sm text-primary-200 transition hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-primary-400/30 bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-100">
              Acceso de miembros y operación interna
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Portal del Club
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              Esta sección concentra el acceso para administración, entrenadores y deportistas. Aquí se gestiona el
              trabajo diario del club, separado de la página pública y promocional.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-primary-500 hover:bg-primary-400">
                  Ingresar al portal
                </Button>
              </Link>
              <Link href="/shark-shop" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                  Ir a Shark Shop
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="py-5">
                  <div className="flex items-center gap-3 text-sm font-semibold text-primary-100">
                    <Clock className="h-4 w-4" />
                    Operación diaria
                  </div>
                  <p className="mt-2 text-sm text-slate-300">Asistencias, sesiones, caja y seguimiento interno.</p>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="py-5">
                  <div className="flex items-center gap-3 text-sm font-semibold text-primary-100">
                    <Wallet className="h-4 w-4" />
                    Estado de pagos
                  </div>
                  <p className="mt-2 text-sm text-slate-300">Consulta de mensualidades, uniformes y movimientos.</p>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/5 text-white shadow-none">
                <CardContent className="py-5">
                  <div className="flex items-center gap-3 text-sm font-semibold text-primary-100">
                    <User className="h-4 w-4" />
                    Acceso unificado
                  </div>
                  <p className="mt-2 text-sm text-slate-300">Un solo login para los perfiles que ya forman parte del club.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
            <div className="mb-6 flex items-center gap-4">
              <Image
                src="/images/sharks-transparent.png"
                alt="Sharks Basketball"
                width={84}
                height={84}
                className="rounded-xl bg-white/95 p-1"
              />
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-primary-200">Miembros del club</p>
                <h2 className="mt-1 text-2xl font-bold">Accesos disponibles</h2>
              </div>
            </div>

            <div className="space-y-4">
              {accesos.map((acceso) => {
                const Icono = acceso.icono

                return (
                  <div key={acceso.titulo} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-primary-500/15 p-3 text-primary-200">
                        <Icono className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{acceso.titulo}</h3>
                        <p className="mt-1 text-sm text-slate-300">{acceso.descripcion}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-primary-400/20 bg-primary-500/10 p-5">
              <h3 className="font-semibold text-primary-100">Qué puedes hacer desde aquí</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {servicios.map((servicio) => (
                  <li key={servicio} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary-300" />
                    <span>{servicio}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
