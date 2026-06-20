'use client'

interface Props {
  imageUrl: string
  orientation?: 'horizontal' | 'vertical'
}

/**
 * En horizontal: canvas 1920×1080, imagen a pantalla completa.
 * En vertical:   canvas 1080×1920 (portrait), imagen a pantalla completa.
 * TvCanvas maneja toda la rotación/escala — este componente no necesita rotar nada.
 */
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
