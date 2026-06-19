'use client'

import { useEffect, useState, useCallback } from 'react'
import { PlayGameResult } from '@/lib/types'

function getDeviceFingerprint(): string {
  const key = 'game_device_fp'
  let fp = localStorage.getItem(key)
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(key, fp)
  }
  return fp
}

function formatExpiry(expiresAt: string): string {
  const d = new Date(expiresAt)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

type State = 'idle' | 'loading' | 'won' | 'lost' | 'inactive' | 'error'

export default function JuegoPage() {
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<PlayGameResult | null>(null)

  const play = useCallback(async () => {
    setState('loading')
    const device = getDeviceFingerprint()
    try {
      const res = await fetch('/api/game/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_fingerprint: device }),
      })
      const data: PlayGameResult = await res.json()

      if (res.status === 403 || data.error === 'game_inactive') {
        setState('inactive')
        return
      }
      if (!res.ok || data.error) {
        setState('error')
        return
      }

      setResult(data)
      setState(data.won ? 'won' : 'lost')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => { play() }, [play])

  // ── Pantalla ganador ────────────────────────────────────────
  if (state === 'won' && result) {
    const expiry = result.expires_at ? formatExpiry(result.expires_at) : ''
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px', fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🏆</div>
          <div style={{
            background: 'linear-gradient(135deg, #f6d365, #fda085)',
            borderRadius: 24, padding: '32px 24px', marginBottom: 24,
            boxShadow: '0 0 40px rgba(246,211,101,0.4)',
          }}>
            <p style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 12px' }}>
              ¡GANASTE UN PREMIO!
            </p>
            <p style={{ color: '#1a1a2e', fontSize: 22, fontWeight: 900, margin: '0 0 8px', lineHeight: 1.3 }}>
              {result.prize_message}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 16,
            padding: '20px 24px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 8px' }}>Mostrá esta pantalla en caja para canjear</p>
            {expiry && (
              <p style={{ color: '#fda085', fontSize: 15, fontWeight: 700, margin: 0 }}>
                Válido hasta las {expiry} hs
              </p>
            )}
          </div>

          <button
            onClick={() => { setState('idle'); play() }}
            style={{
              background: 'rgba(255,255,255,0.1)', color: 'white',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12,
              padding: '12px 24px', fontSize: 15, cursor: 'pointer', width: '100%',
            }}
          >
            Volver a participar
          </button>

          <p style={{ color: '#555', fontSize: 12, marginTop: 20 }}>
            Alto Drugstore · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    )
  }

  // ── Pantalla consolación ────────────────────────────────────
  if (state === 'lost' && result) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px', fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚽</div>
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 24,
            padding: '32px 24px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.4 }}>
              {result.consolation_message || '¡Gracias por participar!'}
            </p>
            <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
              Seguí intentando, el próximo premio puede ser tuyo
            </p>
          </div>

          <button
            onClick={play}
            style={{
              background: 'linear-gradient(135deg, #f6d365, #fda085)',
              color: '#1a1a2e', border: 'none', borderRadius: 12,
              padding: '14px 24px', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', width: '100%',
            }}
          >
            Intentar de nuevo
          </button>

          <p style={{ color: '#555', fontSize: 12, marginTop: 20 }}>
            Alto Drugstore · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    )
  }

  // ── Inactivo ────────────────────────────────────────────────
  if (state === 'inactive') {
    return (
      <div style={{
        minHeight: '100vh', background: '#111',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏸️</div>
          <p style={{ fontSize: 18, fontWeight: 700 }}>El juego está pausado</p>
          <p style={{ color: '#888', fontSize: 14 }}>Volvé en un momento</p>
        </div>
      </div>
    )
  }

  // ── Loading / error / idle ──────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#111',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
    }}>
      {state === 'error' ? (
        <div style={{ textAlign: 'center', color: 'white' }}>
          <p style={{ fontSize: 18 }}>Algo salió mal</p>
          <button onClick={play} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#fda085', color: '#111', fontWeight: 700, cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      ) : (
        <p style={{ color: 'white', fontSize: 18 }}>Participando...</p>
      )}
    </div>
  )
}
