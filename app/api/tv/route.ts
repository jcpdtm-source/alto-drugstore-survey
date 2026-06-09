import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function getConfig(db: ReturnType<typeof supabaseAdmin>) {
  // Intentar con función SQL que lee orientation correctamente
  const { data: rpcData, error: rpcError } = await db.rpc('get_tv_config')
  if (!rpcError && rpcData) return rpcData

  // Fallback: select directo (sin orientation si el schema cache no la tiene)
  const { data } = await db.from('tv_config').select('*').single()
  return { ...data, orientation: data?.orientation || 'horizontal' }
}

export async function GET() {
  const db = supabaseAdmin()

  const [config, screensRes, activeSurveysRes] = await Promise.all([
    getConfig(db),
    db.from('tv_screens').select('*').order('display_order'),
    db.from('surveys')
      .select('id, question, title')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(2),
  ])

  // Garantizar que config nunca sea null
  const safeConfig = config || {
    promo_message: '',
    screen_rotation_enabled: false,
    rotation_interval_seconds: 10,
    orientation: 'horizontal',
  }

  return NextResponse.json({
    config: safeConfig,
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

  const config = await getConfig(db)
  return NextResponse.json({ ok: true, config })
}
