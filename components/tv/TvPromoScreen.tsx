'use client'

interface Props {
  imageUrl: string
  orientation?: 'horizontal' | 'vertical'
}

export default function TvPromoScreen({ imageUrl, orientation = 'horizontal' }: Props) {
  if (orientation === 'vertical') {
    // La pantalla Tizen es landscape (ej 1920×1080) pero el TV está físico en portrait.
    // Rotamos la imagen -90deg y le damos width=100vh, height=100vw para que
    // tras la rotación ocupe exactamente 100vw × 100vh sin necesitar scale.
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000', overflow: 'hidden' }}>
        <img
          src={imageUrl}
          alt="Promoción"
          style={{
            position: 'absolute',
            width: '100vh',
            height: '100vw',
            top: '50%',
            left: '50%',
            marginTop: '-50vw',
            marginLeft: '-50vh',
            transform: 'rotate(-90deg)',
            objectFit: 'cover',
          }}
        />
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
