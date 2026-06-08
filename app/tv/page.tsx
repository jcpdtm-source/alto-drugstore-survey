'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TvConfig, TvScreen, SurveyResult, Survey } from '@/lib/types'
import TvSurveyScreen from '@/components/tv/TvSurveyScreen'
import TvPromoScreen from '@/components/tv/TvPromoScreen'

interface TvData {
  config: TvConfig
  screens: TvScreen[]
  activeSurvey: Survey | null
}

export default function TvPage() {
  const [tvData, setTvData] = useState<TvData | null>(null)
  const [results, setResults] = useState<SurveyResult[]>([])
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFsButton, setShowFsButton] = useState(true)

  const fetchTvData = useCallback(async () => {
    const res = await fetch('/api/tv')
    if (res.ok) {
      const data = await res.json()
      setTvData(data)
    }
  }, [])

  const fetchResults = useCallback(async (surveyId: string) => {
    const res = await fetch(`/api/surveys/${surveyId}/results`)
    if (res.ok) setResults(await res.json())
  }, [])

  // Carga inicial
  useEffect(() => {
    fetchTvData()
  }, [fetchTvData])

  // Polling cada 10 segundos como fallback (para TVs sin WebSocket estable)
  useEffect(() => {
    const interval = setInterval(fetchTvData, 10000)
    return () => clearInterval(interval)
  }, [fetchTvData])

  useEffect(() => {
    if (tvData?.activeSurvey) {
      fetchResults(tvData.activeSurvey.id)
    }
  }, [tvData?.activeSurvey?.id, fetchResults])

  // Realtime: nuevas respuestas
  useEffect(() => {
    if (!tvData?.activeSurvey) return
    const surveyId = tvData.activeSurvey.id

    const channel = supabase
      .channel('tv-responses')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'survey_responses',
        filter: `survey_id=eq.${surveyId}`
      }, () => fetchResults(surveyId))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tvData?.activeSurvey?.id, fetchResults])

  // Realtime: cambios en config TV
  useEffect(() => {
    const channel = supabase
      .channel('tv-config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_config' }, fetchTvData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_screens' }, fetchTvData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'surveys' }, fetchTvData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTvData])

  // Rotación de pantallas
  useEffect(() => {
    if (!tvData) return
    const enabledScreens = tvData.screens.filter(s => s.is_enabled)
    if (!tvData.config.screen_rotation_enabled || enabledScreens.length <= 1) {
      setCurrentScreenIndex(0)
      return
    }
    const interval = setInterval(() => {
      setCurrentScreenIndex(prev => (prev + 1) % enabledScreens.length)
    }, tvData.config.rotation_interval_seconds * 1000)
    return () => clearInterval(interval)
  }, [tvData])

  // Ocultar botón de fullscreen después de 5 segundos de inactividad
  useEffect(() => {
    setShowFsButton(true)
    const timer = setTimeout(() => setShowFsButton(false), 5000)
    return () => clearTimeout(timer)
  }, [isFullscreen])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  if (!tvData) {
    return (
      <div style={{
        width: '100vw', height: '100vh', backgroundColor: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <p style={{ color: 'white', fontSize: 24 }}>Cargando...</p>
      </div>
    )
  }

  const enabledScreens = tvData.screens.filter(s => s.is_enabled)
  const currentScreen = enabledScreens[currentScreenIndex] || enabledScreens[0]

  const fsButton = (
    <button
      onClick={toggleFullscreen}
      onMouseEnter={() => setShowFsButton(true)}
      style={{
        position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
        fontSize: 14, fontFamily: 'Arial, sans-serif',
        opacity: showFsButton ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {isFullscreen ? '⛶ Salir' : '⛶ Pantalla completa'}
    </button>
  )

  if (!currentScreen) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white' }}>Sin pantallas habilitadas</p>
        {fsButton}
      </div>
    )
  }

  if (currentScreen.screen_type === 'promo_image' && currentScreen.image_url) {
    return <>{<TvPromoScreen imageUrl={currentScreen.image_url} />}{fsButton}</>
  }

  return (
    <>
      <TvSurveyScreen
        survey={tvData.activeSurvey}
        results={results}
        promoMessage={tvData.config.promo_message}
      />
      {fsButton}
    </>
  )
}
