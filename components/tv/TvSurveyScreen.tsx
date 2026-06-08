'use client'

import { Survey, SurveyResult } from '@/lib/types'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  survey: Survey | null
  results: SurveyResult[]
  promoMessage: string
}

const INSTRUCTION_TEXT = 'Escaneá el código QR y sumáte al humor de la hinchada'

export default function TvSurveyScreen({ survey, results, promoMessage }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const surveyUrl = survey ? `${appUrl}/encuesta/${survey.id}` : ''
  const maxCount = results.length > 0 ? Math.max(...results.map(r => r.response_count)) : 1

  return (
    <div style={{
      width: '100vw', height: '100vh', backgroundColor: '#111827',
      color: 'white', display: 'flex', flexDirection: 'column',
      fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden'
    }}>
      {/* HEADER */}
      <div style={{
        backgroundColor: '#1f2937', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '2px solid #374151', flexShrink: 0
      }}>
        {/* Logo + nombre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            backgroundColor: '#374151', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: '#9ca3af'
          }}>LOGO</div>
          <span style={{ fontSize: 22, fontWeight: 'bold' }}>Alto Drugstore</span>
        </div>

        {/* Instrucción */}
        <p style={{ color: '#fde047', fontSize: 18, fontWeight: '600', textAlign: 'center', flex: 1, margin: '0 24px' }}>
          {INSTRUCTION_TEXT}
        </p>

        {/* Mensaje promo */}
        {promoMessage ? (
          <div style={{
            backgroundColor: '#dc2626', color: 'white',
            padding: '8px 16px', borderRadius: 10,
            fontWeight: 'bold', fontSize: 15,
            maxWidth: 280, textAlign: 'right'
          }}>
            {promoMessage}
          </div>
        ) : (
          <div style={{ width: 280 }} />
        )}
      </div>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT 2/3 — Resultados */}
        <div style={{
          flex: 2, padding: '32px 48px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center'
        }}>
          {survey ? (
            <>
              <h2 style={{
                fontSize: 32, fontWeight: 'bold', textAlign: 'center',
                marginBottom: 32, lineHeight: 1.3, color: 'white'
              }}>
                {survey.question}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {results.map((r, i) => {
                  const barWidth = maxCount > 0 ? (r.response_count / maxCount) * 100 : 0
                  return (
                    <div key={r.option_id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Número ranking */}
                      <span style={{ color: '#9ca3af', fontSize: 14, fontWeight: 'bold', width: 20, textAlign: 'right' }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        {/* Etiqueta y % */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>{r.option_text}</span>
                          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#fde047' }}>{r.percentage}%</span>
                        </div>
                        {/* Barra */}
                        <div style={{ width: '100%', backgroundColor: '#374151', borderRadius: 8, height: 36 }}>
                          <div style={{
                            width: `${barWidth}%`, height: 36, borderRadius: 8,
                            background: 'linear-gradient(90deg, #eab308, #ca8a04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                            paddingRight: 10,
                            transition: 'width 1s ease-out',
                            minWidth: r.response_count > 0 ? 40 : 0
                          }}>
                            {r.response_count > 0 && (
                              <span style={{ color: '#1f2937', fontWeight: 'bold', fontSize: 13 }}>
                                {r.response_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {results.length === 0 && (
                  <p style={{ color: '#6b7280', fontSize: 22, textAlign: 'center', marginTop: 32 }}>
                    ¡Sé el primero en votar!
                  </p>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: '#6b7280', fontSize: 24, textAlign: 'center' }}>
              Sin encuesta activa en este momento
            </p>
          )}
        </div>

        {/* RIGHT 1/3 — QR */}
        <div style={{
          flex: 1, backgroundColor: '#1f2937',
          borderLeft: '2px solid #374151',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20
        }}>
          {survey ? (
            <>
              <p style={{ color: '#d1d5db', fontSize: 18, fontWeight: '600', textAlign: 'center', padding: '0 16px' }}>
                Escaneá y votá
              </p>
              <div style={{
                backgroundColor: 'white', padding: 16,
                borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}>
                <QRCodeSVG value={surveyUrl} size={220} level="H" includeMargin={false} />
              </div>
              <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '0 16px' }}>
                {survey.title}
              </p>
            </>
          ) : (
            <p style={{ color: '#6b7280', fontSize: 16, textAlign: 'center', padding: '0 24px' }}>
              El QR aparece cuando hay una encuesta activa
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
