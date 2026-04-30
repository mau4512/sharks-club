import Link from 'next/link'
import Image from 'next/image'

export function SiteFooter() {
  return (
    <footer className="bg-gray-900 py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center">
              <Image
                src="/images/sharks-transparent.png"
                alt="Faraday Sharks Logo"
                width={64}
                height={64}
                className="rounded-md bg-white/95 p-1 shadow-sm object-contain"
              />
              <span className="ml-3 text-xl font-bold">Sharks Basketball</span>
            </div>
            <p className="text-gray-400">
              Club de desarrollo y competencia en baloncesto
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Contacto</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="mailto:faradaysharks@gmail.com" className="hover:text-primary-400">
                  faradaysharks@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+51900596258" className="hover:text-primary-400">
                  +51 900 596 258
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#programas" className="text-gray-400 hover:text-primary-400">
                  Planteles
                </Link>
              </li>
              <li>
                <Link href="/#contacto" className="text-gray-400 hover:text-primary-400">
                  Contacto
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

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Sharks Basketball. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
