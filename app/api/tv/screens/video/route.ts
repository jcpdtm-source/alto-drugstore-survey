import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { video_url, display_order } = await req.json()
  if (!video_url?.trim()) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

  const db = supabaseAdmin()
  const { data: screens } = await db.from('tv_screens').select('display_order').order('display_order', { ascending: false }).limit(1)
  const nextOrder = display_order ?? ((screens?.[0]?.display_order ?? -1) + 1)

  const { data, error } = await db.from('tv_screens').insert({
    screen_type: 'video',
    display_order: nextOrder,
    is_enabled: true,
    video_url: video_url.trim(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ screen: data })
}
