'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  gameMessages: string[]
  orientation?: 'horizontal' | 'vertical'
  counter?: number
}

const MESSAGES_DEFAULT = [
  '¿Ya participaste?',
  'Cada intento es una chance de ganar',
  'Gratis · Rápido · Vale la pena',
  'Escaneá y participá ahora',
]

export default function TvGameScreen({ gameMessages, orientation = 'horizontal', counter }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const gameUrl = `${appUrl}/juego`

  const messages = gameMessages.length > 0 ? gameMessages : MESSAGES_DEFAULT
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setMsgIndex(i => (i + 1) % messages.length)
    }, 3500)
    return () => clearInterval(t)
  }, [messages.length])

  const isVertical = orientation === 'vertical'

  const outerStyle: React.CSSProperties = isVertical ? {
    width: 'calc(100vh / 1.6)',
    height: 'calc(100vw / 1.6)',
    transform: 'rotate(-90deg) scale(1.6)',
    transformOrigin: 'center center',
    position: 'fixed',
    top: '50%',
    left: '50%',
    marginTop: 'calc(-100vw / 3.2)',
    marginLeft: 'calc(-100vh / 3.2)',
    backgroundColor: '#0a0a1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } : {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#0a0a1a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  return (
    <div style={outerStyle}>
      {/* Fondo decorativo */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(246,211,101,0.08) 0%, transparent 70%)',
          top: '-200px', left: '-100px',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(253,160,133,0.06) 0%, transparent 70%)',
          bottom: '-150px', right: '-100px',
        }} />
      </div>

      {/* Contenido principal */}
      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        padding: '40px 60px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 32, maxWidth: 800,
      }}>
        {/* Badge */}
        <div style={{
          background: 'linear-gradient(135deg, #f6d365, #fda085)',
          borderRadius: 50, padding: '6px 20px',
          fontSize: 13, fontWeight: 800, color: '#1a1a2e',
          letterSpacing: 2, textTransform: 'uppercase',
          fontFamily: 'Arial, sans-serif',
        }}>
          🏆 Juego de Premios
        </div>

        {/* Mensaje rotante */}
        <div style={{
          fontSize: 52, fontWeight: 900, color: 'white',
          fontFamily: 'Arial Black, Arial, sans-serif',
          lineHeight: 1.1, minHeight: 120, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          textShadow: '0 0 40px rgba(246,211,101,0.3)',
          transition: 'opacity 0.4s ease',
        }}>
          {messages[msgIndex]}
        </div>

        {/* QR + instrucción */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: 'white', padding: 16, borderRadius: 20,
            boxShadow: '0 0 40px rgba(246,211,101,0.4)',
          }}>
            <QRCodeSVG value={gameUrl} size={180} />
          </div>
          <p style={{
            color: '#D1D5DB', fontSize: 20, margin: 0,
            fontFamily: 'Arial, sans-serif', fontWeight: 600,
          }}>
            Escaneá con tu celular · Gratis
          </p>
        </div>

        {/* Contador (opcional) */}
        {counter != null && counter > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 12,
            padding: '10px 24px', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ color: '#9CA3AF', fontSize: 14, fontFamily: 'Arial, sans-serif' }}>
              Participaciones totales:{' '}
              <span style={{ color: '#f6d365', fontWeight: 700 }}>{counter.toLocaleString()}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
