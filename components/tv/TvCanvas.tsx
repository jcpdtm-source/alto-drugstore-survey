'use client'

import { useEffect, useState } from 'react'

const DESIGN_W = 1920
const DESIGN_H = 1080

/**
 * Canvas virtual 1920×1080 para TV.
 * Solo escala — NO rota. Los TV no tienen sensor de posición; el browser siempre
 * renderiza 1920×1080 landscape. Cada componente maneja su propia rotación CSS
 * cuando orientation='vertical'.
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
