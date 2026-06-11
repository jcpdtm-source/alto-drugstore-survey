'use client'

import { useEffect, useState } from 'react'
import { Survey, SurveyResult } from '@/lib/types'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  survey: Survey | null
  results: SurveyResult[]
  promoMessage: string
  orientation?: 'horizontal' | 'vertical'
}

const BAR_COLORS = [
  '#0284c7',
  '#b45309',
  '#334155',
  '#166534',
  '#6d28d9',
  '#9f1239',
  '#0f766e',
]

export default function TvSurveyScreen({ survey, results, promoMessage, orientation = 'horizontal' }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const surveyUrl = survey ? `${appUrl}/encuesta/${survey.id}` : ''
  const [scanVisible, setScanVisible] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setScanVisible(v => !v), 1000)
    return () => clearInterval(t)
  }, [])

  if (orientation === 'vertical') {
    return <VerticalLayout survey={survey} results={results} promoMessage={promoMessage} surveyUrl={surveyUrl} scanVisible={scanVisible} />
  }
  return <HorizontalLayout survey={survey} results={results} promoMessage={promoMessage} surveyUrl={surveyUrl} scanVisible={scanVisible} />
}

function ResultsBars({ results }: { results: SurveyResult[] }) {
  const maxCount = results.length > 0 ? Math.max(...results.map(r => r.response_count)) : 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {results.map((r, i) => {
        const barWidth = maxCount > 0 ? (r.response_count / maxCount) * 100 : 0
        return (
          <div key={r.option_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#e6edf3' }}>{r.option_text}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#ffffff' }}>{r.percentage}%</span>
            </div>
            <div style={{ width: '100%', height: 32, background: 'rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${barWidth}%`,
                borderRadius: 16,
                background: BAR_COLORS[i % BAR_COLORS.length],
                transition: 'width 1.5s ease',
                minWidth: r.response_count > 0 ? 8 : 0,
              }} />
            </div>
          </div>
        )
      })}
      {results.length === 0 && (
        <p style={{ color: '#6b7280', fontSize: 18, textAlign: 'center', marginTop: 24 }}>¡Sé el primero en votar!</p>
      )}
    </div>
  )
}

function QRBlock({ survey, surveyUrl, size, scanVisible }: { survey: Survey | null; surveyUrl: string; size: number; scanVisible: boolean }) {
  return (
    <div style={{ background: '#0d1726', padding: 20, borderRadius: 24, border: '1px solid #1e3a5f', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {survey ? (
        <>
          <div style={{ background: 'white', borderRadius: 12, padding: 10 }}>
            <QRCodeSVG value={surveyUrl} size={size} level="H" includeMargin={false} />
          </div>
          <div style={{ marginTop: 14, fontSize: 14, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: scanVisible ? 1 : 0.35, transition: 'opacity 0.8s ease' }}>
            ESCANEÁ PARA VOTAR
          </div>
        </>
      ) : (
        <p style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }}>Sin encuesta activa</p>
      )}
    </div>
  )
}

function PromoBanner({ promoMessage }: { promoMessage: string }) {
  if (!promoMessage) return null
  return (
    <div style={{ flexShrink: 0, background: '#7c2d12', padding: '8px 20px', textAlign: 'center' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fed7aa', letterSpacing: '0.05em' }}>
        {promoMessage}
      </span>
    </div>
  )
}

function VerticalLayout({ survey, results, promoMessage, surveyUrl, scanVisible }: any) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#080c13', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>

      <div style={{ flex: '0 0 20%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 2.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 12, fontWeight: 600 }}>Alto Drugstore</div>
        {survey && (
          <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.1, color: '#ffffff', margin: 0 }}>
            {survey.question}
          </h1>
        )}
      </div>

      <div style={{ flex: '0 0 32%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <QRBlock survey={survey} surveyUrl={surveyUrl} size={180} scanVisible={scanVisible} />
      </div>

      <div style={{ flex: 1, padding: '1rem 2.5rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
        <ResultsBars results={results} />
      </div>

      <PromoBanner promoMessage={promoMessage} />
    </div>
  )
}

function HorizontalLayout({ survey, results, promoMessage, surveyUrl, scanVisible }: any) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#080c13', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', borderBottom: '1px solid #1a2a3a' }}>
        <div style={{ fontSize: 16, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 600, flexShrink: 0 }}>Alto Drugstore</div>
        {survey && (
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', margin: 0, flex: 1, textAlign: 'center', padding: '0 2rem' }}>
            {survey.question}
          </h1>
        )}
        {promoMessage
          ? <div style={{ background: '#7c2d12', color: '#fed7aa', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, maxWidth: 260, textAlign: 'center', flexShrink: 0 }}>{promoMessage}</div>
          : <div style={{ width: 260, flexShrink: 0 }} />
        }
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 2, padding: '32px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <ResultsBars results={results} />
        </div>
        <div style={{ flex: 1, background: '#0a1020', borderLeft: '1px solid #1a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <QRBlock survey={survey} surveyUrl={surveyUrl} size={200} scanVisible={scanVisible} />
        </div>
      </div>
    </div>
  )
}
