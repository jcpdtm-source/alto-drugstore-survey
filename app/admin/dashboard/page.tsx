import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/admin/LogoutButton'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
            <p className="text-gray-400 text-sm mt-1">
              Hola, <span className="text-yellow-400">{session.name}</span> ·{' '}
              {session.role === 'super' ? 'Super Admin' : 'Admin Local'}
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TV Config - accesible para todos */}
          <Link
            href="/admin/tv"
            className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-6 transition-colors group"
          >
            <div className="text-3xl mb-3">📺</div>
            <h2 className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">
              Configuración de Pantalla
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Mensaje promocional, rotación de pantallas
            </p>
          </Link>

          {/* Encuestas - solo super admin */}
          {session.role === 'super' && (
            <Link
              href="/admin/encuestas"
              className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-6 transition-colors group"
            >
              <div className="text-3xl mb-3">📊</div>
              <h2 className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">
                Encuestas
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Crear, activar y gestionar encuestas
              </p>
            </Link>
          )}

          {/* TV en vivo */}
          <a
            href="/tv"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 rounded-2xl p-6 transition-colors group"
          >
            <div className="text-3xl mb-3">🖥️</div>
            <h2 className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">
              Ver Pantalla TV
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Abrir pantalla pública en nueva pestaña
            </p>
          </a>
        </div>
      </div>
    </div>
  )
}
