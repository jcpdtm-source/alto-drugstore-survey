'use client'

interface Props {
  videoUrl: string
  orientation?: 'horizontal' | 'vertical'
}

/**
 * TvCanvas maneja rotación/escala. Este componente solo muestra el video a pantalla completa.
 */
export default function TvVideoScreen({ videoUrl }: Props) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#000' }}>
      <video
        src={videoUrl}
        autoPlay muted loop playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}
