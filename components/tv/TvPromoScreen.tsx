'use client'

interface Props {
  imageUrl: string
  orientation?: 'horizontal' | 'vertical'
}

export default function TvPromoScreen({ imageUrl, orientation = 'horizontal' }: Props) {
  if (orientation === 'vertical') {
    // La pantalla Tizen es landscape (ej 1920×1080) pero el TV está físico en portrait.
    // width=100vh y height=100vw: tras rotate(-90deg) la imagen queda 100vw×100vh visual.
    // Sin overflow:hidden en el wrapper — ese corta el layout antes de rotar y rompe la imagen.
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000' }}>
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
