'use client'

interface Props {
  imageUrl: string
  orientation?: 'horizontal' | 'vertical'
}

// El canvas (TvCanvas) provee las dimensiones y la orientación correcta.
// Este componente simplemente llena el canvas con la imagen.
export default function TvPromoScreen({ imageUrl }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={imageUrl}
        alt="Promoción"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}
