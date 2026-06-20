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

export default function TvGameScreen({ gameMessages, orientation = 'horizontal' }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const gameUrl = `${appUrl}/juego`

  const messages = gameMessages.length > 0 ? gameMessages : MESSAGES_DEFAULT
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setMsgIndex(i => (i + 1) % messages.length)
    }, 5250)
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
    backgroundColor: '#1EABF1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  } : {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#1EABF1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  }

  return (
    <div style={{ ...outerStyle, position: 'fixed' }}>
      {/* Fondo decorativo */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          top: '-200px', left: '-100px',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          bottom: '-150px', right: '-100px',
        }} />
      </div>

      {/* QR anclado al centro — posición absoluta, nunca se mueve */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          background: 'white', padding: 16, borderRadius: 20,
          boxShadow: '0 0 40px rgba(246,211,101,0.4)',
        }}>
          <QRCodeSVG value={gameUrl} size={180} />
        </div>
        <p style={{
          color: 'white', fontSize: 20, margin: 0,
          fontFamily: 'Arial, sans-serif', fontWeight: 700,
          textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}>
          Escaneá con tu celular · Gratis
        </p>
      </div>

      {/* Contenido superior: nombre + badge + texto rotante */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 36,
      }}>
        {/* Logo del negocio */}
        <img src="/logo.png" alt="Alto Drugstore" style={{ height: 234, objectFit: 'contain' }} />

        {/* Badge */}
        <div style={{
          marginTop: 20,
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
          marginTop: 32, padding: '0 48px',
          fontSize: 46, fontWeight: 900, color: 'white',
          fontFamily: 'Arial Black, Arial, sans-serif',
          lineHeight: 1.15, textAlign: 'center',
          textShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
          {messages[msgIndex]}
        </div>
      </div>
    </div>
  )
}
