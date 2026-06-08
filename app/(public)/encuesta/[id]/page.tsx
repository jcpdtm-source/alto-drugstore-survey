'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Survey, SurveyOption, SurveyResult } from '@/lib/types'

interface SurveyWithOptions extends Survey {
  survey_options: SurveyOption[]
}

export default function EncuestaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [survey, setSurvey] = useState<SurveyWithOptions | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/surveys/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError('Esta encuesta no está disponible.')
        else setSurvey(data)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (!selected || !survey) return
    setSubmitting(true)

    const fingerprint = navigator.userAgent + screen.width + screen.height

    const res = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        survey_id: survey.id,
        option_id: selected,
        device_fingerprint: fingerprint,
      }),
    })

    if (res.ok) {
      router.push(`/gracias?survey_id=${survey.id}`)
    } else {
      setError('Ocurrió un error, intentá de nuevo.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error || 'Encuesta no encontrada'}</p>
        </div>
      </div>
    )
  }

  const options = [...survey.survey_options].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 text-xs text-gray-400">
            LOGO
          </div>
          <h1 className="text-xl font-bold text-white">Alto Drugstore</h1>
          <p className="text-gray-400 text-sm mt-1">¡Gracias por participar!</p>
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6 shadow-xl">
          <h2 className="text-white text-xl font-bold leading-snug text-center">
            {survey.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`w-full py-4 px-5 rounded-xl text-left font-medium text-base transition-all border-2 ${
                selected === opt.id
                  ? 'bg-yellow-500 border-yellow-400 text-gray-900'
                  : 'bg-gray-800 border-gray-700 text-white hover:border-yellow-500'
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selected || submitting}
          className="w-full py-4 rounded-xl bg-yellow-500 text-gray-900 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors"
        >
          {submitting ? 'Enviando...' : 'Votar'}
        </button>
      </div>
    </div>
  )
}
