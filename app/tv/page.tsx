'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TvConfig, TvScreen, SurveyResult, Survey } from '@/lib/types'
import TvSurveyScreen from '@/components/tv/TvSurveyScreen'
import TvPromoScreen from '@/components/tv/TvPromoScreen'

interface TvData {
  config: TvConfig
  screens: TvScreen[]
  activeSurveys: Survey[]
}

interface Slide {
  type: 'survey' | 'promo_image'
  survey?: Survey
  imageUrl?: string
}

export default function TvPage() {
  const [tvData, setTvData] = useState<TvData | null>(null)
  const [resultsBySurvey, setResultsBySurvey] = useState<Record<string, SurveyResult[]>>({})
  const [slideIndex, setSlideIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFsButton, setShowFsButton] = useState(true)

  const fetchTvData = useCallback(async () => {
    const res = await fetch('/api/tv')
    if (res.ok) {
      const data = await res.json()
      // Compatibilidad: si viene activeSurvey solo (viejo), convertir a array
      if (!data.activeSurveys && data.activeSurvey) {
        data.activeSurveys = [data.activeSurvey]
      } else if (!data.activeSurveys) {
        data.activeSurveys = []
      }
      setTvData(data)
    }
  }, [])

  const fetchResults = useCallback(async (surveyId: string) => {
    const res = await fetch(`/api/surveys/${surveyId}/results`)
    if (res.ok) {
      const data = await res.json()
      setResultsBySurvey(prev => ({ ...prev, [surveyId]: data }))
    }
  }, [])

  useEffect(() => { fetchTvData() }, [fetchTvData])

  useEffect(() => {
    const interval = setInterval(fetchTvData, 10000)
    return () => clearInterval(interval)
  }, [fetchTvData])

  useEffect(() => {
    tvData?.activeSurveys?.forEach(s => fetchResults(s.id))
  }, [JSON.stringify(tvData?.activeSurveys?.map(s => s.id)), fetchResults])

  // Realtime: respuestas
  useEffect(() => {
    if (!tvData?.activeSurveys?.length) return
    const channels = tvData.activeSurveys.map(survey =>
      supabase.channel(`responses-${survey.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public',
          table: 'survey_responses',
          filter: `survey_id=eq.${survey.id}`
        }, () => fetchResults(survey.id))
        .subscribe()
    )
    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [JSON.stringify(tvData?.activeSurveys?.map(s => s.id)), fetchResults])

  // Realtime: config
  useEffect(() => {
    const channel = supabase.channel('tv-config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_config' }, fetchTvData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_screens' }, fetchTvData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'surveys' }, fetchTvData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchTvData])

  const buildSlides = (data: TvData): Slide[] => {
    const slides: Slide[] = []
    data.activeSurveys.forEach(s => slides.push({ type: 'survey', survey: s }))
    data.screens
      .filter(s => s.screen_type === 'promo_image' && s.is_enabled && s.image_url)
      .sort((a, b) => a.display_order - b.display_order)
      .forEach(s => slides.push({ type: 'promo_image', imageUrl: s.image_url! }))
    return slides
  }

  // Rotación
  useEffect(() => {
    if (!tvData) return
    const slides = buildSlides(tvData)
    if (!tvData.config.screen_rotation_enabled || slides.length <= 1) {
      setSlideIndex(0)
      return
    }
    const interval = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % slides.length)
    }, tvData.config.rotation_interval_seconds * 1000)
    return () => clearInterval(interval)
  }, [tvData])

  useEffect(() => {
    setShowFsButton(true)
    const t = setTimeout(() => setShowFsButton(false), 5000)
    return () => clearTimeout(t)
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

  if (!tvData) return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'white', fontSize: 24 }}>Cargando...</p>
    </div>
  )

  const slides = buildSlides(tvData)
  const currentSlide = slides[slideIndex] || slides[0]
  const orientation = tvData.config?.orientation || 'horizontal'

  // Rotación CSS automática: si el admin eligió vertical pero el navegador
  // está en horizontal, rotamos toda la página 90° para simular portrait
  const isScreenHorizontal = typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  const needsCssRotation = orientation === 'vertical' && isScreenHorizontal

  const rotationStyle = needsCssRotation ? {
    transform: 'rotate(90deg)',
    transformOrigin: 'center center',
    width: '100vh',
    height: '100vw',
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    marginTop: '-50vw',
    marginLeft: '-50vh',
    overflow: 'hidden',
  } : {}

  const fsButton = (
    <button onClick={toggleFullscreen} onMouseEnter={() => setShowFsButton(true)}
      style={{
        position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
        border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8,
        padding: '8px 14px', cursor: 'pointer', fontSize: 14,
        fontFamily: 'Arial, sans-serif',
        opacity: showFsButton ? 1 : 0, transition: 'opacity 0.5s ease',
      }}>
      {isFullscreen ? '⛶ Salir' : '⛶ Pantalla completa'}
    </button>
  )

  if (!currentSlide) return <div style={{ width: '100vw', height: '100vh', backgroundColor: '#111' }}>{fsButton}</div>

  if (currentSlide.type === 'promo_image' && currentSlide.imageUrl) {
    return <><div style={rotationStyle}><TvPromoScreen imageUrl={currentSlide.imageUrl} /></div>{fsButton}</>
  }

  return (
    <>
      <div style={rotationStyle}>
        <TvSurveyScreen
          survey={currentSlide.survey || null}
          results={currentSlide.survey ? (resultsBySurvey[currentSlide.survey.id] || []) : []}
          promoMessage={tvData.config.promo_message}
          orientation={orientation}
        />
      </div>
      {fsButton}
    </>
  )
}
