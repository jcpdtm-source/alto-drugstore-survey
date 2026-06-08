'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Survey } from '@/lib/types'

interface Props {
  survey: Survey
}

export default function SurveyActions({ survey }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const patch = async (body: object) => {
    setLoading(true)
    await fetch(`/api/surveys/${survey.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    router.refresh()
    setLoading(false)
  }

  const deleteSurvey = async () => {
    if (!confirm(`¿Eliminar encuesta "${survey.title}"? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    await fetch(`/api/surveys/${survey.id}`, { method: 'DELETE' })
    router.refresh()
    setLoading(false)
  }

  const handleExport = () => {
    window.open(`/api/export?survey_id=${survey.id}`, '_blank')
  }

  return (
    <div className="flex flex-col gap-2 min-w-[120px]">
      {!survey.is_active && !survey.closed_at && (
        <button
          onClick={() => patch({ is_active: true })}
          disabled={loading}
          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 disabled:opacity-40"
        >
          Activar
        </button>
      )}
      {survey.is_active && (
        <button
          onClick={() => patch({ is_active: false })}
          disabled={loading}
          className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-500 disabled:opacity-40"
        >
          Pausar
        </button>
      )}
      {survey.is_active && (
        <button
          onClick={() => patch({ close: true })}
          disabled={loading}
          className="px-3 py-1.5 bg-red-700 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-40"
        >
          Cerrar
        </button>
      )}
      <button
        onClick={handleExport}
        className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500"
      >
        Exportar CSV
      </button>
      {!survey.is_active && (
        <button
          onClick={deleteSurvey}
          disabled={loading}
          className="px-3 py-1.5 bg-gray-700 text-red-400 text-sm rounded-lg hover:bg-gray-600 disabled:opacity-40"
        >
          Eliminar
        </button>
      )}
    </div>
  )
}
