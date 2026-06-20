import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const screenId = formData.get('screen_id') as string | null

  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

  // Validar tipo
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Solo se permiten imágenes JPG, PNG o WebP' }, { status: 400 })
  }

  // Validar tamaño (máx 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 5MB' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const fileName = `promo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await db.storage
    .from('tv-images')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = db.storage.from('tv-images').getPublicUrl(fileName)
  const publicUrl = urlData.publicUrl

  if (screenId) {
    // Actualizar pantalla existente
    await db.from('tv_screens').update({ image_url: publicUrl, image_name: file.name }).eq('id', screenId)
    return NextResponse.json({ url: publicUrl, screen_id: screenId })
  } else {
    // Crear nueva pantalla en el carrusel
    const { data: screens } = await db.from('tv_screens').select('display_order').order('display_order', { ascending: false }).limit(1)
    const nextOrder = ((screens?.[0]?.display_order ?? -1) + 1)

    const { data: newScreen, error: screenError } = await db.from('tv_screens').insert({
      screen_type: 'promo_image',
      display_order: nextOrder,
      is_enabled: true,
      image_url: publicUrl,
      image_name: file.name,
    }).select().single()

    if (screenError) return NextResponse.json({ error: screenError.message }, { status: 500 })
    return NextResponse.json({ url: publicUrl, screen: newScreen })
  }
}
