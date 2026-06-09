'use client'

import { Survey, SurveyResult } from '@/lib/types'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  survey: Survey | null
  results: SurveyResult[]
  promoMessage: string
  orientation?: 'horizontal' | 'vertical'
}

const INSTRUCTION_TEXT = 'Escaneá el código QR y sumáte al humor de la hinchada'

export default function TvSurveyScreen({ survey, results, promoMessage, orientation = 'horizontal' }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const surveyUrl = survey ? `${appUrl}/encuesta/${survey.id}` : ''
  const maxCount = results.length > 0 ? Math.max(...results.map(r => r.response_count)) : 1

  if (orientation === 'vertical') {
    return <VerticalLayout survey={survey} results={results} promoMessage={promoMessage} surveyUrl={surveyUrl} maxCount={maxCount} />
  }
  return <HorizontalLayout survey={survey} results={results} promoMessage={promoMessage} surveyUrl={surveyUrl} maxCount={maxCount} />
}

function Header({ promoMessage, vertical }: { promoMessage: string; vertical?: boolean }) {
  return (
    <div style={{
      backgroundColor: '#1f2937', flexShrink: 0,
      padding: vertical ? '18px 24px' : '14px 28px',
      display: 'flex', flexDirection: vertical ? 'column' : 'row',
      alignItems: 'center', justifyContent: vertical ? 'center' : 'space-between',
      borderBottom: '2px solid #374151', gap: vertical ? 8 : 0, textAlign: vertical ? 'center' : 'left',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#9ca3af', flexShrink: 0 }}>LOGO</div>
        <span style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>Alto Drugstore</span>
      </div>
      <p style={{ color: '#fde047', fontSize: 16, fontWeight: '600', flex: vertical ? undefined : 1, margin: vertical ? 0 : '0 20px', textAlign: 'center' }}>
        {INSTRUCTION_TEXT}
      </p>
      {promoMessage
        ? <div style={{ backgroundColor: '#dc2626', color: 'white', padding: '6px 14px', borderRadius: 8, fontWeight: 'bold', fontSize: 14, maxWidth: vertical ? '100%' : 260, textAlign: 'center' }}>{promoMessage}</div>
        : <div style={{ width: vertical ? 0 : 260 }} />}
    </div>
  )
}

function ResultsBars({ survey, results, maxCount }: { survey: Survey | null; results: SurveyResult[]; maxCount: number }) {
  return (
    <>
      {survey && (
        <h2 style={{ fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: 'white', lineHeight: 1.3 }}>
          {survey.question}
        </h2>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {results.map((r, i) => {
          const barWidth = maxCount > 0 ? (r.response_count / maxCount) * 100 : 0
          return (
            <div key={r.option_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#9ca3af', fontSize: 13, fontWeight: 'bold', width: 18, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>{r.option_text}</span>
                  <span style={{ fontSize: 17, fontWeight: 'bold', color: '#fde047' }}>{r.percentage}%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#374151', borderRadius: 6, height: 30 }}>
                  <div style={{
                    width: `${barWidth}%`, height: 30, borderRadius: 6,
                    background: 'linear-gradient(90deg, #eab308, #ca8a04)',
                    transition: 'width 1s ease-out',
                    minWidth: r.response_count > 0 ? 6 : 0,
                  }} />
                </div>
              </div>
            </div>
          )
        })}
        {results.length === 0 && (
          <p style={{ color: '#6b7280', fontSize: 20, textAlign: 'center', marginTop: 24 }}>¡Sé el primero en votar!</p>
        )}
      </div>
    </>
  )
}

function QRBlock({ survey, surveyUrl, size }: { survey: Survey | null; surveyUrl: string; size: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {survey ? (
        <>
          <p style={{ color: '#d1d5db', fontSize: 15, fontWeight: '600', textAlign: 'center' }}>Escaneá y votá</p>
          <div style={{ backgroundColor: 'white', padding: 12, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <QRCodeSVG value={surveyUrl} size={size} level="H" includeMargin={false} />
          </div>
          <p style={{ color: '#6b7280', fontSize: 11, textAlign: 'center' }}>{survey.title}</p>
        </>
      ) : (
        <p style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }}>Sin encuesta activa</p>
      )}
    </div>
  )
}

// Layout horizontal — TV apaisado (default)
function HorizontalLayout({ survey, results, promoMessage, surveyUrl, maxCount }: any) {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#111827', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <Header promoMessage={promoMessage} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 2, padding: '28px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <ResultsBars survey={survey} results={results} maxCount={maxCount} />
        </div>
        <div style={{ flex: 1, backgroundColor: '#1f2937', borderLeft: '2px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <QRBlock survey={survey} surveyUrl={surveyUrl} size={220} />
        </div>
      </div>
    </div>
  )
}

// Layout vertical — TV en portrait (girado 90°)
function VerticalLayout({ survey, results, promoMessage, surveyUrl, maxCount }: any) {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#111827', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
      <Header promoMessage={promoMessage} vertical />
      <div style={{ backgroundColor: '#1f2937', borderBottom: '2px solid #374151', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <QRBlock survey={survey} surveyUrl={surveyUrl} size={160} />
      </div>
      <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
        <ResultsBars survey={survey} results={results} maxCount={maxCount} />
      </div>
    </div>
  )
}
