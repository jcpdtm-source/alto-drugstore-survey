'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { TvConfig, TvScreen, SurveyResult, Survey } from '@/lib/types'
import TvSurveyScreen from '@/components/tv/TvSurveyScreen'
import TvPromoScreen from '@/components/tv/TvPromoScreen'
import TvGameScreen from '@/components/tv/TvGameScreen'
import TvVideoScreen from '@/components/tv/TvVideoScreen'
import TvCanvas from '@/components/tv/TvCanvas'
import { GameConfig } from '@/lib/types'

interface TvData {
  config: TvConfig
  screens: TvScreen[]
  activeSurveys: Survey[]
  gameConfig: GameConfig | null
}

interface Slide {
  type: 'survey' | 'promo_image' | 'game' | 'video'
  survey?: Survey
  imageUrl?: string
  videoUrl?: string
  durationSeconds?: number | null
}

export default function TvPage() {
  const [tvData, setTvData] = useState<TvData | null>(null)
  const rotationRef = useRef<{ enabled: boolean; slides: Slide[]; defaultInterval: number }>({ enabled: false, slides: [], defaultInterval: 10 })
  const [rotationReady, setRotationReady] = useState(false)
  const [resultsBySurvey, setResultsBySurvey] = useState<Record<string, SurveyResult[]>>({})
  const [slideIndex, setSlideIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFsButton, setShowFsButton] = useState(true)

  const fetchTvData = useCallback(async () => {
    const res = await fetch('/api/tv')
    if (res.ok) {
      const data = await res.json()
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
    const surveyScreen = data.screens.find(s => s.screen_type === 'survey')
    data.activeSurveys.forEach(s => slides.push({ type: 'survey', survey: s, durationSeconds: surveyScreen?.duration_seconds }))
    data.screens
      .filter(s => s.is_enabled)
      .sort((a, b) => a.display_order - b.display_order)
      .forEach(s => {
        if (s.screen_type === 'promo_image' && s.image_url) {
          slides.push({ type: 'promo_image', imageUrl: s.image_url, durationSeconds: s.duration_seconds })
        } else if (s.screen_type === 'game' && data.gameConfig?.is_active) {
          slides.push({ type: 'game', durationSeconds: s.duration_seconds })
        } else if (s.screen_type === 'video' && s.video_url) {
          slides.push({ type: 'video', videoUrl: s.video_url, durationSeconds: s.duration_seconds })
        }
      })
    return slides
  }

  useEffect(() => {
    if (!tvData) return
    rotationRef.current = {
      enabled: tvData.config.screen_rotation_enabled,
      slides: buildSlides(tvData),
      defaultInterval: tvData.config.rotation_interval_seconds,
    }
    if (!rotationReady) setRotationReady(true)
  }, [tvData])

  useEffect(() => {
    if (!rotationReady) return
    const { enabled, slides, defaultInterval } = rotationRef.current
    if (!enabled || slides.length <= 1) return
    const current = slides[slideIndex] || slides[0]
    const duration = (current?.durationSeconds ?? defaultInterval) * 1000
    const t = setTimeout(() => {
      setSlideIndex(prev => (prev + 1) % rotationRef.current.slides.length)
    }, duration)
    return () => clearTimeout(t)
  }, [slideIndex, rotationReady])

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

  if (!currentSlide) return (
    <>
      <TvCanvas orientation={orientation}>
        <div style={{ width: '100%', height: '100%', backgroundColor: '#111' }} />
      </TvCanvas>
      {fsButton}
    </>
  )

  if (currentSlide.type === 'promo_image' && currentSlide.imageUrl) {
    return (
      <>
        <TvCanvas orientation={orientation}>
          <TvPromoScreen imageUrl={currentSlide.imageUrl} orientation={orientation} />
        </TvCanvas>
        {fsButton}
      </>
    )
  }

  if (currentSlide.type === 'video' && currentSlide.videoUrl) {
    return (
      <>
        <TvCanvas orientation={orientation}>
          <TvVideoScreen videoUrl={currentSlide.videoUrl} orientation={orientation} />
        </TvCanvas>
        {fsButton}
      </>
    )
  }

  if (currentSlide.type === 'game') {
    return (
      <>
        <TvCanvas orientation={orientation}>
          <TvGameScreen
            gameMessages={tvData.gameConfig?.game_messages ?? []}
            orientation={orientation}
            counter={tvData.gameConfig?.global_counter}
            imageUrl={tvData.gameConfig?.game_screen_image_url}
            textColor={tvData.gameConfig?.game_text_color ?? '#ffffff'}
          />
        </TvCanvas>
        {fsButton}
      </>
    )
  }

  return (
    <>
      <TvCanvas orientation={orientation}>
        <TvSurveyScreen
          survey={currentSlide.survey || null}
          results={currentSlide.survey ? (resultsBySurvey[currentSlide.survey.id] || []) : []}
          promoMessage={tvData.config.promo_message}
          orientation={orientation}
        />
      </TvCanvas>
      {fsButton}
    </>
  )
}
