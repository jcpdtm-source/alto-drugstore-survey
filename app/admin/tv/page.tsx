'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TvConfig, TvScreen } from '@/lib/types'

interface TvData {
  config: TvConfig
  screens: TvScreen[]
}

export default function TvAdminPage() {
  const [data, setData] = useState<TvData | null>(null)
  const [promoMessage, setPromoMessage] = useState('')
  const [rotationEnabled, setRotationEnabled] = useState(false)
  const [rotationInterval, setRotationInterval] = useState(10)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tv')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setPromoMessage(d.config?.promo_message || '')
        setRotationEnabled(d.config?.screen_rotation_enabled || false)
        setRotationInterval(d.config?.rotation_interval_seconds || 10)
      })
  }, [])

  const saveConfig = async () => {
    setSaving(true)
    await fetch('/api/tv', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promo_message: promoMessage,
        screen_rotation_enabled: rotationEnabled,
        rotation_interval_seconds: rotationInterval,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleScreen = async (screen: TvScreen) => {
    if (!data) return
    const updated = data.screens.map(s =>
      s.id === screen.id ? { ...s, is_enabled: !s.is_enabled } : s
    )
    setData({ ...data, screens: updated })
    await fetch('/api/tv/screens', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screens: updated }),
    })
  }

  const uploadImage = async (screenId: string, file: File) => {
    setUploadingFor(screenId)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('screen_id', screenId)
    await fetch('/api/tv/upload', { method: 'POST', body: formData })
    const res = await fetch('/api/tv')
    const d = await res.json()
    setData(d)
    setUploadingFor(null)
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white animate-pulse">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/dashboard" className="text-gray-400 text-sm hover:text-white">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-white mt-2 mb-8">Configuración de Pantalla TV</h1>

        {/* Mensaje promocional */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Mensaje Promocional</h2>
          <textarea
            value={promoMessage}
            onChange={e => setPromoMessage(e.target.value)}
            rows={2}
            maxLength={120}
            placeholder="Ej: 10% de descuento en los próximos 15 minutos"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
          />
          <p className="text-gray-500 text-xs mt-1 text-right">{promoMessage.length}/120</p>
        </section>

        {/* Rotación */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Rotación de Pantallas</h2>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <div
              onClick={() => setRotationEnabled(!rotationEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${rotationEnabled ? 'bg-yellow-500' : 'bg-gray-600'} relative`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${rotationEnabled ? 'left-6' : 'left-0.5'}`} />
            </div>
            <span className="text-gray-300">{rotationEnabled ? 'Rotación activa' : 'Pantalla fija'}</span>
          </label>

          {rotationEnabled && (
            <div>
              <label className="text-gray-300 text-sm block mb-1">
                Intervalo: <strong className="text-white">{rotationInterval} segundos</strong>
              </label>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={rotationInterval}
                onChange={e => setRotationInterval(Number(e.target.value))}
                className="w-full accent-yellow-500"
              />
              <div className="flex justify-between text-gray-500 text-xs mt-1">
                <span>5s</span><span>60s</span>
              </div>
            </div>
          )}
        </section>

        {/* Pantallas */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Pantallas del Reel</h2>
          <div className="space-y-3">
            {data.screens.map(screen => (
              <div key={screen.id} className="flex items-center justify-between bg-gray-700 rounded-xl p-4">
                <div>
                  <p className="text-white font-medium">
                    {screen.screen_type === 'survey' ? '📊 Encuesta + QR' : '🖼️ Imagen publicitaria'}
                  </p>
                  {screen.image_name && (
                    <p className="text-gray-400 text-xs mt-0.5">{screen.image_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {screen.screen_type === 'promo_image' && (
                    <label className="cursor-pointer px-3 py-1.5 bg-gray-600 text-gray-300 text-sm rounded-lg hover:bg-gray-500">
                      {uploadingFor === screen.id ? 'Subiendo...' : 'Subir imagen'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && uploadImage(screen.id, e.target.files[0])}
                      />
                    </label>
                  )}
                  <button
                    onClick={() => toggleScreen(screen)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium ${screen.is_enabled ? 'bg-green-700 text-white' : 'bg-gray-600 text-gray-400'}`}
                  >
                    {screen.is_enabled ? 'Activa' : 'Inactiva'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={saveConfig}
          disabled={saving}
          className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-40 transition-colors"
        >
          {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
