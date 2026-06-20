'use client'

interface Props {
  imageUrl: string
  orientation?: 'horizontal' | 'vertical'
}

export default function TvPromoScreen({ imageUrl, orientation = 'horizontal' }: Props) {
  if (orientation === 'vertical') {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 'calc(100vh / 1.6)',
          height: 'calc(100vw / 1.6)',
          transform: 'translate(-50%, -50%) rotate(-90deg) scale(1.6)',
          transformOrigin: 'center center',
          backgroundColor: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img src={imageUrl} alt="Promoción" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      backgroundColor: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <img src={imageUrl} alt="Promoción" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  )
}
