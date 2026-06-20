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
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [addingVideo, setAddingVideo] = useState(false)
  const [videoError, setVideoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    const res = await fetch('/api/tv')
    if (res.ok) {
      const d = await res.json()
      setData(d)
      setPromoMessage(d.config?.promo_message || '')
      setRotationEnabled(d.config?.screen_rotation_enabled || false)
      setOrientation(d.config?.orientation || 'horizontal')
      setRotationInterval(d.config?.rotation_interval_seconds || 10)
    }
  }

  useEffect(() => { loadData() }, [])

  const saveConfig = async () => {
    setSaving(true)
    setSaveError('')
    const res = await fetch('/api/tv', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promo_message: promoMessage,
        screen_rotation_enabled: rotationEnabled,
        rotation_interval_seconds: rotationInterval,
        orientation,
      }),
    })
    const result = await res.json()
    setSaving(false)
    if (!res.ok) {
      setSaveError(result.error || `Error ${res.status}`)
    } else {
      // Recargar desde el servidor para confirmar lo guardado
      await loadData()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
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

  const updateDuration = async (screen: TvScreen, seconds: number | null) => {
    if (!data) return
    const updated = data.screens.map(s =>
      s.id === screen.id ? { ...s, duration_seconds: seconds } : s
    )
    setData({ ...data, screens: updated })
    await fetch(`/api/tv/screens/${screen.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_seconds: seconds }),
    })
  }

  const addVideoScreen = async () => {
    if (!videoUrl.trim()) return
    setAddingVideo(true)
    setVideoError('')
    const { data: screens } = await fetch('/api/tv').then(r => r.json()).then(d => ({ data: d.screens }))
    const nextOrder = ((screens?.sort((a: any, b: any) => b.display_order - a.display_order)?.[0]?.display_order ?? -1) + 1)
    const res = await fetch('/api/tv/screens/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: videoUrl.trim(), display_order: nextOrder }),
    })
    const result = await res.json()
    if (!res.ok) {
      setVideoError(result.error || 'Error al agregar video')
    } else {
      setVideoUrl('')
      await loadData()
    }
    setAddingVideo(false)
  }

  const deleteScreen = async (screen: TvScreen) => {
    const label = screen.screen_type === 'video' ? 'este video' : `la imagen "${screen.image_name || 'esta pantalla'}"`
    if (!confirm(`¿Eliminar ${label}?`)) return
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
  const videoScreens = data.screens.filter(s => s.screen_type === 'video')
  const gameScreen = data.screens.find(s => s.screen_type === 'game')
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
              <div className="flex items-center gap-2">
                <input
                  type="number" min="5" max="300"
                  placeholder={String(rotationInterval)}
                  value={surveyScreen.duration_seconds ?? ''}
                  onChange={e => updateDuration(surveyScreen, e.target.value ? Number(e.target.value) : null)}
                  className="w-16 bg-gray-600 text-white text-xs rounded-lg px-2 py-1.5 text-center outline-none"
                  title="Duración en segundos (vacío = global)"
                />
                <span className="text-gray-500 text-xs">seg</span>
                <button
                  onClick={() => toggleScreen(surveyScreen)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium ${surveyScreen.is_enabled ? 'bg-green-700 text-white' : 'bg-gray-600 text-gray-400'}`}>
                  {surveyScreen.is_enabled ? '✓ Activa' : 'Inactiva'}
                </button>
              </div>
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
                    <input
                      type="number" min="5" max="300"
                      placeholder={String(rotationInterval)}
                      value={screen.duration_seconds ?? ''}
                      onChange={e => updateDuration(screen, e.target.value ? Number(e.target.value) : null)}
                      className="w-14 bg-gray-600 text-white text-xs rounded-lg px-2 py-1.5 text-center outline-none"
                      title="Duración en segundos (vacío = global)"
                    />
                    <span className="text-gray-500 text-xs">seg</span>
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


          {/* Videos */}
          {videoScreens.length > 0 && (
            <div className="space-y-3 mb-4">
              {videoScreens.map(screen => (
                <div key={screen.id} className="flex items-center gap-3 bg-gray-700 rounded-xl p-3">
                  <span className="text-2xl">🎬</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{(screen as any).video_url}</p>
                    <p className="text-gray-400 text-xs">Video</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="number" min="5" max="300"
                      placeholder={String(rotationInterval)}
                      value={screen.duration_seconds ?? ''}
                      onChange={e => updateDuration(screen, e.target.value ? Number(e.target.value) : null)}
                      className="w-14 bg-gray-600 text-white text-xs rounded-lg px-2 py-1.5 text-center outline-none"
                      title="Duración en segundos (vacío = global)"
                    />
                    <span className="text-gray-500 text-xs">seg</span>
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

          {/* Agregar video por URL */}
          <div className="bg-gray-700 rounded-xl p-4 mb-4">
            <p className="text-white font-medium mb-2">🎬 Agregar video por URL</p>
            <p className="text-gray-400 text-xs mb-3">MP4, WebM, HLS — cualquier URL pública directa al archivo de video</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://ejemplo.com/video.mp4"
                className="flex-1 bg-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                onClick={addVideoScreen}
                disabled={addingVideo || !videoUrl.trim()}
                className="px-4 py-2 bg-yellow-500 text-gray-900 font-bold rounded-lg text-sm disabled:opacity-40">
                {addingVideo ? '...' : 'Agregar'}
              </button>
            </div>
            {videoError && <p className="text-red-400 text-xs mt-2">{videoError}</p>}
          </div>

          {/* Pantalla de juego */}
          {gameScreen && (
            <div className="flex items-center justify-between bg-gray-700 rounded-xl p-4 mb-3">
              <div>
                <p className="text-white font-medium">🎰 Pantalla Juego de Premios</p>
                <p className="text-gray-400 text-xs mt-0.5">Muestra QR y mensajes del juego</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="5" max="300"
                  placeholder={String(rotationInterval)}
                  value={gameScreen.duration_seconds ?? ''}
                  onChange={e => updateDuration(gameScreen, e.target.value ? Number(e.target.value) : null)}
                  className="w-16 bg-gray-600 text-white text-xs rounded-lg px-2 py-1.5 text-center outline-none"
                  title="Duración en segundos (vacío = global)"
                />
                <span className="text-gray-500 text-xs">seg</span>
                <button
                  onClick={() => toggleScreen(gameScreen)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium ${gameScreen.is_enabled ? 'bg-green-700 text-white' : 'bg-gray-600 text-gray-400'}`}>
                  {gameScreen.is_enabled ? '✓ Activa' : 'Inactiva'}
                </button>
              </div>
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
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            {uploading ? (
              <p className="text-yellow-400 animate-pulse">Subiendo imagen...</p>
            ) : (
              <>
                <p className="text-3xl mb-2">🖼️</p>
                <p className="text-white font-medium">Subir imagen publicitaria</p>
                <p className="text-gray-400 text-sm mt-1">JPG, PNG o WebP · Máximo 5MB</p>
                <p className="text-gray-500 text-xs mt-1">Hacé click o arrastrá la imagen aquí</p>
              </>
            )}
          </div>
          {uploadError && <p className="text-red-400 text-sm mt-2">{uploadError}</p>}
        </section>

        {/* Orientación */}
        <section className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">📐 Orientación de Pantalla</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'horizontal', icon: '🖥️', label: 'Horizontal', desc: 'TV apaisado (landscape)' },
              { value: 'vertical', icon: '📱', label: 'Vertical', desc: 'TV en portrait (girado 90°)' },
            ].map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setOrientation(opt.value as any)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${orientation === opt.value ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-700'}`}>
                <div className="text-2xl mb-1">{opt.icon}</div>
                <div className={`font-semibold text-sm ${orientation === opt.value ? 'text-yellow-400' : 'text-white'}`}>{opt.label}</div>
                <div className="text-gray-400 text-xs mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {saveError && (
          <div className="mb-3 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
            ❌ Error al guardar: {saveError}
          </div>
        )}
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
