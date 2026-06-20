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

function useCountdown(expiresAt: string | undefined) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('00:00:00'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [expiresAt])

  return timeLeft
}

function GameLayout({ children, bg = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px', fontFamily: 'Arial, sans-serif',
    }}>
      <img src="/logo.png" alt="Alto Drugstore" style={{ height: 56, marginTop: 24, marginBottom: 32, objectFit: 'contain' }} />
      <div style={{ textAlign: 'center', maxWidth: 400, width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

function WonScreen({ result, onRetry }: { result: PlayGameResult; onRetry: () => void }) {
  const expiry = result.expires_at ? formatExpiry(result.expires_at) : ''
  const countdown = useCountdown(result.expires_at)
  const expired = countdown === '00:00:00'

  return (
    <GameLayout>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🏆</div>
      <div style={{
        background: 'linear-gradient(135deg, #f6d365, #fda085)',
        borderRadius: 24, padding: '32px 24px', marginBottom: 24,
        boxShadow: '0 0 40px rgba(246,211,101,0.4)',
      }}>
        <p style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 12px' }}>
          ¡GANASTE UN PREMIO!
        </p>
        <p style={{ color: '#1a1a2e', fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>
          {result.prize_message}
        </p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.08)', borderRadius: 16,
        padding: '20px 24px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.15)',
      }}>
        <p style={{ color: '#aaa', fontSize: 13, margin: '0 0 12px' }}>Mostrá esta pantalla en caja para canjear</p>
        {expired ? (
          <p style={{ color: '#ef4444', fontSize: 15, fontWeight: 700, margin: 0 }}>Premio vencido</p>
        ) : (
          <>
            <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 6px' }}>Válido hasta las {expiry} hs</p>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '10px 16px', display: 'inline-block' }}>
              <span style={{ color: '#f6d365', fontSize: 32, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 4 }}>
                {countdown}
              </span>
            </div>
          </>
        )}
      </div>

      <button onClick={onRetry} style={{
        background: 'rgba(255,255,255,0.1)', color: 'white',
        border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12,
        padding: '12px 24px', fontSize: 15, cursor: 'pointer', width: '100%',
      }}>
        Volver a participar
      </button>
    </GameLayout>
  )
}

type State = 'idle' | 'loading' | 'won' | 'lost' | 'cooldown' | 'enough' | 'inactive' | 'error'

const MAX_CONSECUTIVE_TRIES = 3

export default function JuegoPage() {
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<PlayGameResult | null>(null)
  const [consecutiveLosses, setConsecutiveLosses] = useState(0)

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
        setState('inactive'); return
      }
      if (!res.ok || data.error) {
        setState('error'); return
      }

      setResult(data)

      if (data.won) {
        setConsecutiveLosses(0)
        setState('won')
      } else if (data.already_won_cooldown) {
        setState('cooldown')
      } else {
        const newLosses = consecutiveLosses + 1
        setConsecutiveLosses(newLosses)
        if (newLosses >= MAX_CONSECUTIVE_TRIES) {
          setState('enough')
        } else {
          setState('lost')
        }
      }
    } catch {
      setState('error')
    }
  }, [consecutiveLosses])

  useEffect(() => { play() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (state === 'won' && result) {
    return <WonScreen result={result} onRetry={() => { setConsecutiveLosses(0); play() }} />
  }

  if (state === 'lost' && result) {
    return (
      <GameLayout>
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
        <button onClick={play} style={{
          background: 'linear-gradient(135deg, #f6d365, #fda085)',
          color: '#1a1a2e', border: 'none', borderRadius: 12,
          padding: '14px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%',
        }}>
          Intentar de nuevo
        </button>
      </GameLayout>
    )
  }

  if (state === 'enough') {
    return (
      <GameLayout>
        <div style={{ fontSize: 56, marginBottom: 16 }}>😄</div>
        <div style={{
          background: 'rgba(255,255,255,0.08)', borderRadius: 24,
          padding: '32px 24px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
            ¡Ya participaste mucho!
          </p>
          <p style={{ color: '#9CA3AF', fontSize: 15, margin: 0, lineHeight: 1.5 }}>
            Volvé en un rato para tener otra chance de ganar. Los premios se siguen repartiendo.
          </p>
        </div>
        <button onClick={() => { setConsecutiveLosses(0); play() }} style={{
          background: 'rgba(255,255,255,0.1)', color: 'white',
          border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12,
          padding: '12px 24px', fontSize: 15, cursor: 'pointer', width: '100%',
        }}>
          Igual quiero intentar de nuevo
        </button>
      </GameLayout>
    )
  }

  if (state === 'cooldown') {
    return (
      <GameLayout>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🌟</div>
        <div style={{
          background: 'rgba(255,255,255,0.08)', borderRadius: 24,
          padding: '32px 24px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.15)',
        }}>
          <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
            ¡Ya ganaste un premio!
          </p>
          <p style={{ color: '#9CA3AF', fontSize: 15, margin: 0, lineHeight: 1.5 }}>
            Podés seguir participando pero los premios se reparten para que todos tengan su chance. Volvé en unos días.
          </p>
        </div>
      </GameLayout>
    )
  }

  if (state === 'inactive') {
    return (
      <GameLayout bg="#111">
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏸️</div>
        <p style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>El juego está pausado</p>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>Volvé en un momento</p>
      </GameLayout>
    )
  }

  return (
    <GameLayout bg="#111">
      {state === 'error' ? (
        <>
          <p style={{ color: 'white', fontSize: 18, marginBottom: 16 }}>Algo salió mal</p>
          <button onClick={play} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#fda085', color: '#111', fontWeight: 700, cursor: 'pointer' }}>
            Reintentar
          </button>
        </>
      ) : (
        <p style={{ color: 'white', fontSize: 18 }}>Participando...</p>
      )}
    </GameLayout>
  )
}
