'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SurveyResult } from '@/lib/types'

function GraciasContent() {
  const searchParams = useSearchParams()
  const surveyId = searchParams.get('survey_id')
  const [results, setResults] = useState<SurveyResult[]>([])

  useEffect(() => {
    if (!surveyId) return
    fetch(`/api/surveys/${surveyId}/results`)
      .then(r => r.json())
      .then(data => setResults(Array.isArray(data) ? data : []))
  }, [surveyId])

  const maxCount = results.length > 0 ? Math.max(...results.map(r => r.response_count)) : 1

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-md">
        {/* Thank you */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚽</div>
          <h1 className="text-2xl font-bold text-white">¡Gracias por votar!</h1>
          <p className="text-gray-400 text-sm mt-2">Mirá cómo va la votación</p>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg text-center mb-4">
              {results[0]?.question}
            </h2>
            {results.map((r, i) => (
              <div key={r.option_id}>
                <div className="flex justify-between mb-1">
                  <span className="text-white text-sm font-medium">{r.option_text}</span>
                  <span className="text-yellow-400 font-bold text-sm">{r.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-6">
                  <div
                    className="h-6 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-700"
                    style={{ width: `${maxCount > 0 ? (r.response_count / maxCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-gray-500 text-xs mt-8">
          Alto Drugstore · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

export default function GraciasPage() {
  return (
    <Suspense>
      <GraciasContent />
    </Suspense>
  )
}
