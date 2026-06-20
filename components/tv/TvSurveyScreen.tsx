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

const BG = '#1EABF1'
const BG_DARK = '#0e8fd4'   // panel lateral / header más oscuro
const BORDER = 'rgba(255,255,255,0.25)'

const BAR_COLORS = [
  '#ffffff',
  '#fde047',
  '#f97316',
  '#a3e635',
  '#f472b6',
  '#c4b5fd',
  '#67e8f9',
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

function ResultsBars({ results, large }: { results: SurveyResult[]; large?: boolean }) {
  const maxCount = results.length > 0 ? Math.max(...results.map(r => r.response_count)) : 1
  const labelSize = large ? 17 : 17
  const pctSize = large ? 17 : 18
  const barHeight = large ? 23 : 32
  const gap = large ? 9 : 14

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {results.map((r, i) => {
        const barWidth = maxCount > 0 ? (r.response_count / maxCount) * 100 : 0
        return (
          <div key={r.option_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
              <span style={{ fontSize: labelSize, fontWeight: 700, color: '#ffffff' }}>{r.option_text}</span>
              <span style={{ fontSize: pctSize, fontWeight: 900, color: '#ffffff', marginLeft: 12 }}>{r.percentage}%</span>
            </div>
            <div style={{ width: '100%', height: barHeight, background: 'rgba(0,0,0,0.2)', borderRadius: barHeight / 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${barWidth}%`,
                borderRadius: barHeight / 2,
                background: BAR_COLORS[i % BAR_COLORS.length],
                transition: 'width 1.5s ease',
                minWidth: r.response_count > 0 ? 8 : 0,
              }} />
            </div>
          </div>
        )
      })}
      {results.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: large ? 28 : 18, textAlign: 'center', marginTop: 24 }}>¡Sé el primero en votar!</p>
      )}
    </div>
  )
}

function QRBlock({ survey, surveyUrl, size, scanVisible }: { survey: Survey | null; surveyUrl: string; size: number; scanVisible: boolean }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.18)', padding: 16, borderRadius: 20, border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {survey ? (
        <>
          <div style={{ background: 'white', borderRadius: 10, padding: 8 }}>
            <QRCodeSVG value={surveyUrl} size={size} level="H" includeMargin={false} />
          </div>
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: scanVisible ? 1 : 0.35, transition: 'opacity 0.8s ease' }}>
            ESCANEÁ PARA VOTAR
          </div>
        </>
      ) : (
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' }}>Sin encuesta activa</p>
      )}
    </div>
  )
}

function PromoBanner({ promoMessage, large }: { promoMessage: string; large?: boolean }) {
  if (!promoMessage) return null
  return (
    <div style={{ flexShrink: 0, background: 'rgba(0,0,0,0.25)', padding: large ? '14px 24px' : '8px 20px', textAlign: 'center' }}>
      <span style={{ fontSize: large ? 18 : 30, fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>
        {promoMessage}
      </span>
    </div>
  )
}

function VerticalLayout({ survey, results, promoMessage, surveyUrl, scanVisible }: any) {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: BG, position: 'fixed', top: 0, left: 0 }}>
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width: 'calc(100vh / 1.6)',
        height: 'calc(100vw / 1.6)',
        transform: 'translate(-50%, -50%) rotate(-90deg) scale(1.6)',
        transformOrigin: 'center center',
        background: BG,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, Helvetica, sans-serif',
        overflow: 'hidden',
      }}>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 2rem 1rem', textAlign: 'center' }}>
          <img src="/logo.png" alt="Alto Drugstore" style={{ height: 48, marginBottom: 10, objectFit: 'contain' }} />
          {survey && (
            <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, color: '#ffffff', margin: 0 }}>
              {survey.question}
            </h1>
          )}
        </div>

        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem 0' }}>
          <QRBlock survey={survey} surveyUrl={surveyUrl} size={240} scanVisible={scanVisible} />
        </div>

        <div style={{ flex: 1, padding: '0.5rem 2rem 0.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
          <ResultsBars results={results} large />
        </div>

        <PromoBanner promoMessage={promoMessage} large />
      </div>
    </div>
  )
}

function HorizontalLayout({ survey, results, promoMessage, surveyUrl, scanVisible }: any) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: BG, color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', borderBottom: `1px solid ${BORDER}`, background: BG_DARK }}>
        <img src="/logo.png" alt="Alto Drugstore" style={{ height: 40, objectFit: 'contain', flexShrink: 0 }} />
        {survey && (
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', margin: 0, flex: 1, textAlign: 'center', padding: '0 2rem' }}>
            {survey.question}
          </h1>
        )}
        {promoMessage
          ? <div style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 23, maxWidth: 260, textAlign: 'center', flexShrink: 0 }}>{promoMessage}</div>
          : <div style={{ width: 260, flexShrink: 0 }} />
        }
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 2, padding: '32px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <ResultsBars results={results} />
        </div>
        <div style={{ flex: 1, background: BG_DARK, borderLeft: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <QRBlock survey={survey} surveyUrl={surveyUrl} size={200} scanVisible={scanVisible} />
        </div>
      </div>
    </div>
  )
}
