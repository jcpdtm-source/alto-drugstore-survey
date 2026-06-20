'use client'

interface Props {
  imageUrl: string
  orientation?: 'horizontal' | 'vertical'
}

export default function TvPromoScreen({ imageUrl, orientation = 'horizontal' }: Props) {
  if (orientation === 'vertical') {
    return (
      <div style={{
        width: 'calc(100vh / 1.6)',
        height: 'calc(100vw / 1.6)',
        transform: 'rotate(-90deg) scale(1.6)',
        transformOrigin: 'center center',
        position: 'fixed',
        top: '50%',
        left: '50%',
        marginTop: 'calc(-100vw / 3.2)',
        marginLeft: 'calc(-100vh / 3.2)',
        backgroundColor: '#000',
        overflow: 'hidden',
      }}>
        <img src={imageUrl} alt="Promoción" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
