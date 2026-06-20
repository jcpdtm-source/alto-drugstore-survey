import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Solo JPG o PNG' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Máximo 5MB' }, { status: 400 })

  const db = supabaseAdmin()
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/gif' ? 'gif' : 'jpg'
  const fileName = `game-screen-${Date.now()}.${ext}`

  const { error: uploadError } = await db.storage
    .from('tv-images')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = db.storage.from('tv-images').getPublicUrl(fileName)
  const publicUrl = urlData.publicUrl

  await db.from('game_config').update({ game_screen_image_url: publicUrl }).neq('id', '00000000-0000-0000-0000-000000000000')
  return NextResponse.json({ url: publicUrl })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = supabaseAdmin()
  await db.from('game_config').update({ game_screen_image_url: null }).neq('id', '00000000-0000-0000-0000-000000000000')
  return NextResponse.json({ ok: true })
}
