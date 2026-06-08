import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const screenId = formData.get('screen_id') as string

  if (!file || !screenId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()
  const fileName = `promo-${screenId}-${Date.now()}.${ext}`

  const { error: uploadError } = await db.storage
    .from('tv-images')
    .upload(fileName, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = db.storage.from('tv-images').getPublicUrl(fileName)

  await db.from('tv_screens').update({
    image_url: urlData.publicUrl,
    image_name: file.name,
  }).eq('id', screenId)

  return NextResponse.json({ url: urlData.publicUrl })
}
