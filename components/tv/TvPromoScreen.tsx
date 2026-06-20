'use client'

// Espacio de diseño vertical: mismas constantes que TvSurveyScreen VerticalLayout.
// El canvas (TvCanvas) es siempre 1920×1080 sin rotación propia.
// Para vertical, rotamos el contenido -90° dentro del canvas.
const V_W = 675   // CANVAS_H / 1.6 = 1080 / 1.6
const V_H = 1200  // CANVAS_W / 1.6 = 1920 / 1.6
const V_SCALE = 1.6

interface Props {
  imageUrl: string
  orientation?: 'horizontal' | 'vertical'
}

export default function TvPromoScreen({ imageUrl, orientation = 'horizontal' }: Props) {
  if (orientation === 'vertical') {
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: V_W,
          height: V_H,
          transform: `translate(-50%, -50%) rotate(-90deg) scale(${V_SCALE})`,
          transformOrigin: 'center center',
          overflow: 'hidden',
        }}>
          <img
            src={imageUrl}
            alt="Promoción"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              backgroundColor: '#000',
              // Desactivar la rotación automática por EXIF del browser.
              // Sin esto, imágenes con metadatos de orientación se rotan dos veces (-180°).
              imageOrientation: 'none',
            } as React.CSSProperties}
          />
        </div>
      </div>
    )
  }

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
