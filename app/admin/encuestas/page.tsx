import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import SurveyActions from '@/components/admin/SurveyActions'

export default async function EncuestasPage() {
  const session = await getSession()
  if (!session || session.role !== 'super') redirect('/admin/dashboard')

  const db = supabaseAdmin()
  const { data: surveys } = await db
    .from('surveys')
    .select('*, survey_options(*)')
    .order('created_at', { ascending: false })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin/dashboard" className="text-gray-400 text-sm hover:text-white">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-white mt-1">Encuestas</h1>
          </div>
          <Link
            href="/admin/encuestas/nueva"
            className="px-5 py-2 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            + Nueva encuesta
          </Link>
        </div>

        <div className="space-y-4">
          {(surveys || []).map((survey: any) => (
            <div key={survey.id} className="bg-gray-800 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${survey.is_active ? 'bg-green-600 text-white' : survey.closed_at ? 'bg-gray-600 text-gray-300' : 'bg-gray-700 text-gray-400'}`}>
                      {survey.is_active ? 'ACTIVA' : survey.closed_at ? 'CERRADA' : 'INACTIVA'}
                    </span>
                    <h2 className="text-white font-bold">{survey.title}</h2>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{survey.question}</p>
                  <p className="text-gray-500 text-xs">
                    {survey.survey_options?.length || 0} opciones · Creada {new Date(survey.created_at).toLocaleDateString('es-AR')}
                  </p>
                  {survey.is_active && (
                    <p className="text-yellow-400 text-xs mt-1 font-mono truncate">
                      QR: {appUrl}/encuesta/{survey.id}
                    </p>
                  )}
                </div>
                <SurveyActions survey={survey} />
              </div>
            </div>
          ))}

          {(!surveys || surveys.length === 0) && (
            <div className="text-center text-gray-500 py-12">
              No hay encuestas aún.{' '}
              <Link href="/admin/encuestas/nueva" className="text-yellow-400 hover:underline">
                Crear la primera
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
