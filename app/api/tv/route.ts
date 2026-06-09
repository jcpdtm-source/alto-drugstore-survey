import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const db = supabaseAdmin()

  const [configRes, screensRes, activeSurveysRes] = await Promise.all([
    db.from('tv_config').select('*').single(),
    db.from('tv_screens').select('*').order('display_order'),
    db.from('surveys')
      .select('id, question, title')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(2),
  ])

  return NextResponse.json({
    config: configRes.data,
    screens: screensRes.data || [],
    activeSurveys: activeSurveysRes.data || [],
    activeSurvey: activeSurveysRes.data?.[0] || null,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const db = supabaseAdmin()

  // Usar SQL directo para evitar problemas de RLS/schema cache
  const { data: existing } = await db.from('tv_config').select('id').single()
  if (!existing) return NextResponse.json({ error: 'Config no encontrada' }, { status: 404 })

  const id = existing.id
  const sets: string[] = []
  const values: unknown[] = []
  let i = 1

  if (typeof body.promo_message === 'string') { sets.push(`promo_message = $${i++}`); values.push(body.promo_message) }
  if (typeof body.screen_rotation_enabled === 'boolean') { sets.push(`screen_rotation_enabled = $${i++}`); values.push(body.screen_rotation_enabled) }
  if (typeof body.rotation_interval_seconds === 'number') { sets.push(`rotation_interval_seconds = $${i++}`); values.push(body.rotation_interval_seconds) }
  if (body.orientation === 'horizontal' || body.orientation === 'vertical') { sets.push(`orientation = $${i++}`); values.push(body.orientation) }

  sets.push(`updated_at = $${i++}`)
  values.push(new Date().toISOString())
  values.push(id)

  if (sets.length > 1) {
    await db.rpc('exec_update_tv_config', {
      p_id: id,
      p_promo_message: typeof body.promo_message === 'string' ? body.promo_message : null,
      p_rotation_enabled: typeof body.screen_rotation_enabled === 'boolean' ? body.screen_rotation_enabled : null,
      p_rotation_seconds: typeof body.rotation_interval_seconds === 'number' ? body.rotation_interval_seconds : null,
      p_orientation: (body.orientation === 'horizontal' || body.orientation === 'vertical') ? body.orientation : null,
    })
  }

  const { data, error } = await db.from('tv_config').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
