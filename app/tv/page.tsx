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

  useEffect(() => {
    fetchTvData()
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'survey_responses', filter: `survey_id=eq.${surveyId}` },
        () => fetchResults(surveyId)
      )
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

  if (!tvData) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Cargando...</div>
      </div>
    )
  }

  const enabledScreens = tvData.screens.filter(s => s.is_enabled)
  const currentScreen = enabledScreens[currentScreenIndex] || enabledScreens[0]

  if (!currentScreen) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Sin pantallas habilitadas</div>
      </div>
    )
  }

  if (currentScreen.screen_type === 'promo_image' && currentScreen.image_url) {
    return <TvPromoScreen imageUrl={currentScreen.image_url} />
  }

  return (
    <TvSurveyScreen
      survey={tvData.activeSurvey}
      results={results}
      promoMessage={tvData.config.promo_message}
    />
  )
}
