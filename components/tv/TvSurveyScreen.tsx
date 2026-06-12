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

// Colores vivos que contrastan bien sobre fondo negro
const BAR_COLORS = [
  '#3b82f6',  // azul vivo
  '#f59e0b',  // ámbar
  '#10b981',  // esmeralda
  '#a855f7',  // violeta
  '#ef4444',  // rojo
  '#06b6d4',  // cyan
  '#f97316',  // naranja
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

// large=true para el layout vertical (tipografía duplicada)
function ResultsBars({ results, large }: { results: SurveyResult[]; large?: boolean }) {
  const maxCount = results.length > 0 ? Math.max(...results.map(r => r.response_count)) : 1
  const labelSize = large ? 24 : 17
  const pctSize = large ? 25 : 18
  const barHeight = large ? 36 : 32
  const gap = large ? 13 : 14

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {results.map((r, i) => {
        const barWidth = maxCount > 0 ? (r.response_count / maxCount) * 100 : 0
        return (
          <div key={r.option_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
              <span style={{ fontSize: labelSize, fontWeight: 700, color: '#e6edf3' }}>{r.option_text}</span>
              <span style={{ fontSize: pctSize, fontWeight: 900, color: '#ffffff', marginLeft: 12 }}>{r.percentage}%</span>
            </div>
            <div style={{ width: '100%', height: barHeight, background: 'rgba(255,255,255,0.1)', borderRadius: barHeight / 2, overflow: 'hidden' }}>
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
        <p style={{ color: '#6b7280', fontSize: large ? 28 : 18, textAlign: 'center', marginTop: 24 }}>¡Sé el primero en votar!</p>
      )}
    </div>
  )
}

function QRBlock({ survey, surveyUrl, size, scanVisible }: { survey: Survey | null; surveyUrl: string; size: number; scanVisible: boolean }) {
  return (
    <div style={{ background: '#0d1726', padding: 16, borderRadius: 20, border: '1px solid #1e3a5f', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {survey ? (
        <>
          <div style={{ background: 'white', borderRadius: 10, padding: 8 }}>
            <QRCodeSVG value={surveyUrl} size={size} level="H" includeMargin={false} />
          </div>
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: scanVisible ? 1 : 0.35, transition: 'opacity 0.8s ease' }}>
            ESCANEÁ PARA VOTAR
          </div>
        </>
      ) : (
        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center' }}>Sin encuesta activa</p>
      )}
    </div>
  )
}

function PromoBanner({ promoMessage, large }: { promoMessage: string; large?: boolean }) {
  if (!promoMessage) return null
  return (
    <div style={{ flexShrink: 0, background: '#7c2d12', padding: large ? '14px 24px' : '8px 20px', textAlign: 'center' }}>
      <span style={{ fontSize: large ? 20 : 13, fontWeight: 700, color: '#fed7aa', letterSpacing: '0.05em' }}>
        {promoMessage}
      </span>
    </div>
  )
}

function VerticalLayout({ survey, results, promoMessage, surveyUrl, scanVisible }: any) {
  // El Samsung Q6F ve landscape (1920×1080) aunque el TV esté físicamente vertical.
  // Rotamos -90° y compensamos con scale(1.6) + dimensiones ajustadas.
  // width: 100vh/1.6 y height: 100vw/1.6 → al escalar ×1.6 ocupa exactamente 100vh×100vw.
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080c13', position: 'fixed', top: 0, left: 0 }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 'calc(100vh / 1.6)',
        height: 'calc(100vw / 1.6)',
        transform: 'translate(-50%, -50%) rotate(-90deg) scale(1.6)',
        transformOrigin: 'center center',
        background: '#080c13',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, Helvetica, sans-serif',
        overflow: 'hidden',
      }}>

        {/* Header: "Alto Drugstore" + pregunta */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 2rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: 20, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 10, fontWeight: 700 }}>
            Alto Drugstore
          </div>
          {survey && (
            <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, color: '#ffffff', margin: 0 }}>
              {survey.question}
            </h1>
          )}
        </div>

        {/* QR: tamaño fijo pequeño para que no expulse contenido con 7 opciones */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem 0' }}>
          <QRBlock survey={survey} surveyUrl={surveyUrl} size={120} scanVisible={scanVisible} />
        </div>

        {/* Barras: ocupan el espacio restante */}
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
    <div style={{ width: '100vw', height: '100vh', background: '#080c13', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', borderBottom: '1px solid #1a2a3a' }}>
        <div style={{ fontSize: 18, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 700, flexShrink: 0 }}>Alto Drugstore</div>
        {survey && (
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', margin: 0, flex: 1, textAlign: 'center', padding: '0 2rem' }}>
            {survey.question}
          </h1>
        )}
        {promoMessage
          ? <div style={{ background: '#7c2d12', color: '#fed7aa', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 15, maxWidth: 260, textAlign: 'center', flexShrink: 0 }}>{promoMessage}</div>
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
