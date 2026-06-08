'use client'

interface Props {
  imageUrl: string
}

export default function TvPromoScreen({ imageUrl }: Props) {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      backgroundColor: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <img
        src={imageUrl}
        alt="Promoción"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}
