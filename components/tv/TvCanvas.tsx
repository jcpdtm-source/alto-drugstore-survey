'use client'

import { useEffect, useState } from 'react'

const DESIGN_W = 1920
const DESIGN_H = 1080

/**
 * Canvas virtual 1920×1080 para TV.
 * Horizontal: canvas 1920×1080, scale proporcional al viewport.
 * Vertical: canvas 1080×1920 (portrait), rotado -90deg → llena 1920×1080.
 * El scale es identical en ambos modos: min(vw/1920, vh/1080).
 */
export default function TvCanvas({
  orientation = 'horizontal',
  children,
}: {
  orientation?: 'horizontal' | 'vertical'
  children: React.ReactNode
}) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Siempre usamos canvas 1920×1080. El TV Tizen no rota el browser via software —
  // la orientación portrait la maneja el sistema operativo del TV o la posición física.
  // El canvas solo provee escala uniforme para que el contenido se vea igual en cualquier TV.
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      backgroundColor: '#000',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width: DESIGN_W,
        height: DESIGN_H,
        overflow: 'hidden',
        transformOrigin: 'center center',
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}>
        {children}
      </div>
    </div>
  )
}
