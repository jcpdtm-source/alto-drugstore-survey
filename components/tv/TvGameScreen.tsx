'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  gameMessages: string[]
  orientation?: 'horizontal' | 'vertical'
  counter?: number
  imageUrl?: string | null
  textColor?: string
}

const MESSAGES_DEFAULT = [
  '¿Ya participaste?',
  'Cada intento es una chance de ganar',
  'Gratis · Rápido · Vale la pena',
  'Escaneá y participá ahora',
]

const V_SCALE = 1.6
const V_W = 1080 / V_SCALE  // 675
const V_H = 1920 / V_SCALE  // 1200

export default function TvGameScreen({ gameMessages, orientation = 'horizontal', imageUrl, textColor = '#ffffff' }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const gameUrl = `${appUrl}/juego`

  const messages = gameMessages.length > 0 ? gameMessages : MESSAGES_DEFAULT
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setMsgIndex(i => (i + 1) % messages.length), 5250)
    return () => clearInterval(t)
  }, [messages.length])

  if (orientation === 'vertical') {
    return <VerticalGame gameUrl={gameUrl} messages={messages} msgIndex={msgIndex} imageUrl={imageUrl} textColor={textColor} />
  }
  return <HorizontalGame gameUrl={gameUrl} messages={messages} msgIndex={msgIndex} imageUrl={imageUrl} textColor={textColor} />
}

function HorizontalGame({ gameUrl, messages, msgIndex, imageUrl, textColor }: any) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#1EABF1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', top: '-200px', left: '-100px' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', bottom: '-150px', right: '-100px' }} />
      </div>
      {imageUrl && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '33%', overflow: 'hidden', zIndex: 1 }}>
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ background: 'white', padding: 16, borderRadius: 20, boxShadow: '0 0 40px rgba(246,211,101,0.4)' }}>
          <QRCodeSVG value={gameUrl} size={180} />
        </div>
        <p style={{ color: textColor, fontSize: 20, margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700, textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
          Escaneá con tu celular · Gratis
        </p>
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '65%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 12, overflow: 'hidden' }}>
        <img src="/logo.png" alt="Alto Drugstore" style={{ height: 234, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ marginTop: 10, flexShrink: 0, background: 'linear-gradient(135deg, #f6d365, #fda085)', borderRadius: 50, padding: '10px 28px', fontSize: 20, fontWeight: 800, color: '#1a1a2e', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>
          🏆 Juego de Premios
        </div>
        <div style={{ marginTop: 12, padding: '0 48px', fontSize: 46, fontWeight: 900, color: textColor, fontFamily: 'Arial Black, Arial, sans-serif', lineHeight: 1.15, textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
          {messages[msgIndex]}
        </div>
      </div>
    </div>
  )
}

// Modo vertical: inner div V_W×V_H (675×1200) rotado -90° y escalado 1.6
function VerticalGame({ gameUrl, messages, msgIndex, imageUrl, textColor }: any) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#1EABF1' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: V_W, height: V_H,
        transform: `translate(-50%, -50%) rotate(-90deg) scale(${V_SCALE})`,
        transformOrigin: 'center center',
        backgroundColor: '#1EABF1',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', width: 600, height: 600, background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', top: '-200px', left: '-100px' }} />
          <div style={{ position: 'absolute', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', bottom: '-150px', right: '-100px' }} />
        </div>
        {imageUrl && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '33%', overflow: 'hidden', zIndex: 1 }}>
            <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'white', padding: 16, borderRadius: 20, boxShadow: '0 0 40px rgba(246,211,101,0.4)' }}>
            <QRCodeSVG value={gameUrl} size={180} />
          </div>
          <p style={{ color: textColor, fontSize: 20, margin: 0, fontFamily: 'Arial, sans-serif', fontWeight: 700, textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            Escaneá con tu celular · Gratis
          </p>
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '65%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 12, overflow: 'hidden' }}>
          <img src="/logo.png" alt="Alto Drugstore" style={{ height: 234, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ marginTop: 10, flexShrink: 0, background: 'linear-gradient(135deg, #f6d365, #fda085)', borderRadius: 50, padding: '10px 28px', fontSize: 20, fontWeight: 800, color: '#1a1a2e', letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>
            🏆 Juego de Premios
          </div>
          <div style={{ marginTop: 12, padding: '0 48px', fontSize: 46, fontWeight: 900, color: textColor, fontFamily: 'Arial Black, Arial, sans-serif', lineHeight: 1.15, textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            {messages[msgIndex]}
          </div>
        </div>
      </div>
    </div>
  )
}
