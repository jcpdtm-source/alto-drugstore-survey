'use client'

export default function TvVideoScreen({ videoUrl }: { videoUrl: string }) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#000' }}>
      <video
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}
