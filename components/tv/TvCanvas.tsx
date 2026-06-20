'use client'

import { useEffect, useState } from 'react'

const DESIGN_W = 1920
const DESIGN_H = 1080

/**
 * Canvas virtual para TV (enfoque ChatGPT).
 *
 * Horizontal: canvas 1920×1080, escala para llenar el viewport.
 * Vertical:   canvas 1080×1920 (portrait), rotate(-90deg) → aparece como 1920×1080 en browser.
 *             En el TV físico girado +90°, el contenido portrait queda derecho.
 *
 * Los componentes hijos siempre llenan 100%×100% del canvas — sin rotación interna.
 * Scale = min(vw/1920, vh/1080) es idéntico en ambos modos porque visualmente el canvas
 * ocupa 1920×1080 en los dos casos.
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
  // Portrait canvas: 1080 ancho × 1920 alto; landscape canvas: 1920 × 1080
  const cW = isVertical ? DESIGN_H : DESIGN_W
  const cH = isVertical ? DESIGN_W : DESIGN_H

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
        width: cW,
        height: cH,
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
