'use client'

interface Props {
  imageUrl: string
}

export default function TvPromoScreen({ imageUrl }: Props) {
  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      <img
        src={imageUrl}
        alt="Promoción"
        className="w-full h-full object-contain"
      />
    </div>
  )
}
