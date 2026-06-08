'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NuevaEncuestaPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addOption = () => {
    if (options.length < 7) setOptions([...options, ''])
  }

  const removeOption = (i: number) => {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i))
  }

  const updateOption = (i: number, val: string) => {
    setOptions(options.map((o, idx) => idx === i ? val : o))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const filledOptions = options.filter(o => o.trim())
    if (filledOptions.length < 2) {
      setError('Necesitás al menos 2 opciones.')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), question: question.trim(), options: filledOptions }),
    })

    if (res.ok) {
      router.push('/admin/encuestas')
    } else {
      const data = await res.json()
      setError(data.error || 'Error al crear la encuesta')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-xl mx-auto">
        <Link href="/admin/encuestas" className="text-gray-400 text-sm hover:text-white">← Encuestas</Link>
        <h1 className="text-2xl font-bold text-white mt-2 mb-8">Nueva Encuesta</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-1">Nombre interno</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Ej: Encuesta Mundial Junio 2026"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium block mb-1">Pregunta</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              required
              rows={3}
              placeholder="Ej: ¿Quién ganará el Mundial 2026?"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 text-sm font-medium">Opciones ({options.length}/7)</label>
              {options.length < 7 && (
                <button type="button" onClick={addOption} className="text-yellow-400 text-sm hover:text-yellow-300">
                  + Agregar opción
                </button>
              )}
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Opción ${i + 1}`}
                    className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="px-3 py-2 bg-gray-700 text-gray-400 rounded-lg hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Guardando...' : 'Crear Encuesta'}
          </button>
        </form>
      </div>
    </div>
  )
}
