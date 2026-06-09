import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const db = supabaseAdmin()

  const [configRes, screensRes, activeSurveysRes] = await Promise.all([
    db.rpc('get_tv_config'),
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

  const { data: existing } = await db.from('tv_config').select('id').single()
  if (!existing) return NextResponse.json({ error: 'Config no encontrada' }, { status: 404 })

  const { error } = await db.rpc('exec_update_tv_config', {
    p_id: existing.id,
    p_promo_message: typeof body.promo_message === 'string' ? body.promo_message : null,
    p_rotation_enabled: typeof body.screen_rotation_enabled === 'boolean' ? body.screen_rotation_enabled : null,
    p_rotation_seconds: typeof body.rotation_interval_seconds === 'number' ? body.rotation_interval_seconds : null,
    p_orientation: (body.orientation === 'horizontal' || body.orientation === 'vertical') ? body.orientation : null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Leer config actualizada via función SQL (bypasea schema cache)
  const { data: config } = await db.rpc('get_tv_config')
  return NextResponse.json(config)
}
