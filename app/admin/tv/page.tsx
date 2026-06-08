'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    const res = await fetch('/api/tv')
    if (res.ok) {
      const d = await res.json()
      setData(d)
      setPromoMessage(d.config?.promo_message || '')
      setRotationEnabled(d.config?.screen_rotation_enabled || false)
      setRotationInterval(d.config?.rotation_interval_seconds || 10)
    }
  }

  useEffect(() => { loadData() }, [])

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

  const deleteScreen = async (screen: TvScreen) => {
    if (!confirm(`¿Eliminar la imagen "${screen.image_name || 'esta pantalla'}"?`)) return
    await fetch(`/api/tv/screens/${screen.id}`, { method: 'DELETE' })
    loadData()
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setUploadError('')
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/tv/upload', { method: 'POST', body: formData })
    const result = await res.json()

    if (!res.ok) {
      setUploadError(result.error || 'Error al subir imagen')
    } else {
      await loadData()
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  if (!data) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white animate-pulse">Cargando...</div>
    </div>
  )

  const promoScreens = data.screens.filter(s => s.screen_type === 'promo_image')
  const surveyScreen = data.screens.find(s => s.screen_type === 'survey')

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/dashboard" className="text-gray-400 text-sm hover:text-white">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-white mt-2 mb-8">Configuración de Pantalla TV</h1>

        {/* Mensaje promocional */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-1">💬 Mensaje Promocional</h2>
          <p className="text-gray-400 text-sm mb-4">Aparece en la cabecera de la pantalla TV en tiempo real</p>
          <textarea
            value={promoMessage}
            onChange={e => setPromoMessage(e.target.value)}
            rows={2}
            maxLength={120}
            placeholder="Ej: 10% de descuento en los próximos 15 minutos"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-gray-500 text-xs">{promoMessage.length}/120 caracteres</span>
            {promoMessage && (
              <button onClick={() => setPromoMessage('')} className="text-gray-500 text-xs hover:text-red-400">
                Borrar mensaje
              </button>
            )}
          </div>
        </section>

        {/* Rotación */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">🔄 Rotación de Pantallas</h2>

          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <div onClick={() => setRotationEnabled(!rotationEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${rotationEnabled ? 'bg-yellow-500' : 'bg-gray-600'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${rotationEnabled ? 'left-6' : 'left-0.5'}`} />
            </div>
            <span className="text-gray-300">{rotationEnabled ? 'Rotación activa' : 'Pantalla fija (solo encuesta)'}</span>
          </label>

          {rotationEnabled && (
            <div>
              <label className="text-gray-300 text-sm block mb-1">
                Cada pantalla se muestra durante: <strong className="text-white">{rotationInterval} segundos</strong>
              </label>
              <input type="range" min={5} max={60} step={5} value={rotationInterval}
                onChange={e => setRotationInterval(Number(e.target.value))}
                className="w-full accent-yellow-500" />
              <div className="flex justify-between text-gray-500 text-xs mt-1"><span>5s</span><span>60s</span></div>
            </div>
          )}
        </section>

        {/* Pantalla de encuesta */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">📺 Pantallas del Carrusel</h2>

          {/* Pantalla fija de encuesta */}
          {surveyScreen && (
            <div className="flex items-center justify-between bg-gray-700 rounded-xl p-4 mb-3">
              <div>
                <p className="text-white font-medium">📊 Encuesta + QR</p>
                <p className="text-gray-400 text-xs mt-0.5">Pantalla principal — siempre disponible</p>
              </div>
              <button
                onClick={() => toggleScreen(surveyScreen)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium ${surveyScreen.is_enabled ? 'bg-green-700 text-white' : 'bg-gray-600 text-gray-400'}`}>
                {surveyScreen.is_enabled ? '✓ Activa' : 'Inactiva'}
              </button>
            </div>
          )}

          {/* Imágenes subidas */}
          {promoScreens.length > 0 && (
            <div className="space-y-3 mb-4">
              {promoScreens.map(screen => (
                <div key={screen.id} className="flex items-center gap-3 bg-gray-700 rounded-xl p-3">
                  {/* Miniatura */}
                  {screen.image_url && (
                    <img src={screen.image_url} alt={screen.image_name || ''} className="w-16 h-10 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{screen.image_name || 'Imagen'}</p>
                    <p className="text-gray-400 text-xs">🖼️ Imagen publicitaria</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleScreen(screen)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium ${screen.is_enabled ? 'bg-green-700 text-white' : 'bg-gray-600 text-gray-400'}`}>
                      {screen.is_enabled ? '✓ Activa' : 'Inactiva'}
                    </button>
                    <button
                      onClick={() => deleteScreen(screen)}
                      className="px-2 py-1.5 bg-gray-600 text-red-400 text-xs rounded-lg hover:bg-gray-500">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Zona de subida */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-yellow-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            {uploading ? (
              <p className="text-yellow-400 animate-pulse">Subiendo imagen...</p>
            ) : (
              <>
                <p className="text-3xl mb-2">🖼️</p>
                <p className="text-white font-medium">Subir imagen publicitaria</p>
                <p className="text-gray-400 text-sm mt-1">JPG o PNG · Máximo 5MB</p>
                <p className="text-gray-500 text-xs mt-1">Hacé click o arrastrá la imagen aquí</p>
              </>
            )}
          </div>
          {uploadError && <p className="text-red-400 text-sm mt-2">{uploadError}</p>}
        </section>

        <button
          onClick={saveConfig}
          disabled={saving}
          className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-40 transition-colors text-lg"
        >
          {saved ? '✓ ¡Guardado!' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
