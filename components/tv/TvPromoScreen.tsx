'use client'

interface Props {
  imageUrl: string
  orientation?: 'horizontal' | 'vertical'
}

export default function TvPromoScreen({ imageUrl, orientation = 'horizontal' }: Props) {
  const isVertical = orientation === 'vertical'

  const imgStyle: React.CSSProperties = isVertical ? {
    width: '100vh',
    height: '100vw',
    objectFit: 'contain',
    transform: 'rotate(-90deg)',
    transformOrigin: 'center center',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: '-50vw',
    marginLeft: '-50vh',
  } : {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      backgroundColor: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative',
    }}>
      <img src={imageUrl} alt="Promoción" style={imgStyle} />
    </div>
  )
}
