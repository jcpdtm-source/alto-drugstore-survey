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

  const isVertical = orientation === 'vertical'
  const canvasW = isVertical ? DESIGN_H : DESIGN_W  // 1080 o 1920
  const canvasH = isVertical ? DESIGN_W : DESIGN_H  // 1920 o 1080

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
        width: canvasW,
        height: canvasH,
        overflow: 'hidden',
        transformOrigin: 'center center',
        transform: isVertical
          ? `translate(-50%, -50%) rotate(-90deg) scale(${scale})`
          : `translate(-50%, -50%) scale(${scale})`,
      }}>
        {children}
      </div>
    </div>
  )
}
