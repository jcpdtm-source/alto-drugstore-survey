'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditarEncuestaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [resultOrder, setResultOrder] = useState<'rank' | 'original'>('rank')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    fetch(`/api/surveys/${id}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title || '')
        setQuestion(data.question || '')
        setResultOrder(data.result_order || 'rank')
        setIsActive(data.is_active || false)
        const opts = (data.survey_options || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((o: any) => o.text)
        setOptions(opts.length >= 2 ? opts : ['', ''])
      })
      .finally(() => setLoading(false))
  }, [id])

  const addOption = () => { if (options.length < 7) setOptions([...options, '']) }
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)) }
  const updateOption = (i: number, val: string) => setOptions(options.map((o, idx) => idx === i ? val : o))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const filledOptions = options.filter(o => o.trim())
    if (filledOptions.length < 2) { setError('Necesitás al menos 2 opciones.'); return }
    setSaving(true); setError('')

    const res = await fetch(`/api/surveys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), question: question.trim(), options: filledOptions, result_order: resultOrder }),
    })

    if (res.ok) {
      router.push('/admin/encuestas')
    } else {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white animate-pulse">Cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-xl mx-auto">
        <Link href="/admin/encuestas" className="text-gray-400 text-sm hover:text-white">← Encuestas</Link>
        <h1 className="text-2xl font-bold text-white mt-2 mb-2">Editar Encuesta</h1>
        {isActive && (
          <div className="bg-yellow-600/20 border border-yellow-600 text-yellow-400 text-sm rounded-lg px-4 py-2 mb-6">
            ⚠️ Esta encuesta está activa. Los cambios se aplican en tiempo real.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-1">Nombre interno</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium block mb-1">Pregunta</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} required rows={3}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500 resize-none" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 text-sm font-medium">Opciones ({options.length}/7)</label>
              {options.length < 7 && (
                <button type="button" onClick={addOption} className="text-yellow-400 text-sm hover:text-yellow-300">+ Agregar opción</button>
              )}
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={opt} onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Opción ${i + 1}`}
                    className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-yellow-500" />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)}
                      className="px-3 py-2 bg-gray-700 text-gray-400 rounded-lg hover:text-red-400">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium block mb-3">Orden de resultados en pantalla</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'rank', icon: '📊', label: 'Por ranking', desc: 'La más votada aparece primera' },
                { value: 'original', icon: '📋', label: 'Orden original', desc: 'Como las escribiste' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setResultOrder(opt.value as any)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${resultOrder === opt.value ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-800'}`}>
                  <div className="text-lg mb-1">{opt.icon}</div>
                  <div className={`font-semibold text-sm ${resultOrder === opt.value ? 'text-yellow-400' : 'text-white'}`}>{opt.label}</div>
                  <div className="text-gray-400 text-xs mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <Link href="/admin/encuestas"
              className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors text-center">
              Cancelar
            </Link>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-40 transition-colors">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
