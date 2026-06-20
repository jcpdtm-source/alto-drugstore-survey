'use client'

const CANVAS_H = 1080
const CANVAS_W = 1920
const V_SCALE = 1.6
const V_W = CANVAS_H / V_SCALE  // 675
const V_H = CANVAS_W / V_SCALE  // 1200

interface Props {
  imageUrl: string
  orientation?: 'horizontal' | 'vertical'
}

export default function TvPromoScreen({ imageUrl, orientation = 'horizontal' }: Props) {
  if (orientation === 'vertical') {
    // Mismo patrón de rotación que TvSurveyScreen VerticalLayout.
    // El espacio V_W × V_H (675×1200), rotado -90deg y escalado 1.6,
    // ocupa exactamente el canvas 1920×1080 y el TV físico (girado) lo muestra en portrait.
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
            style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
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
