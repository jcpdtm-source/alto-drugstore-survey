import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function getConfig(db: ReturnType<typeof supabaseAdmin>) {
  // get_tv_config() lee orientation directamente via SQL, bypaseando schema cache
  const { data: rpcData, error: rpcError } = await db.rpc('get_tv_config')
  if (!rpcError && rpcData) return rpcData

  // Fallback
  const { data } = await db.from('tv_config').select('*').single()
  return { ...data, orientation: (data as Record<string, unknown>)?.orientation || 'horizontal' }
}

export async function GET() {
  const db = supabaseAdmin()

  const [config, screensRes, activeSurveysRes, gameConfigRes] = await Promise.all([
    getConfig(db),
    db.from('tv_screens').select('*').order('display_order'),
    db.from('surveys')
      .select('id, question, title')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(2),
    db.rpc('get_game_config').then(r => Array.isArray(r.data) ? r.data[0] ?? null : r.data ?? null).then(d => d, () => null),
  ])

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
    gameConfig: gameConfigRes || null,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const db = supabaseAdmin()

  const { data: existing } = await db.from('tv_config').select('id').single()
  if (!existing) return NextResponse.json({ error: 'Config no encontrada' }, { status: 404 })

  // Actualizar todos los campos en un solo update
  // orientation ya está en el schema cache porque corrimos NOTIFY pgrst, 'reload schema'
  const updates: Record<string, unknown> = {}
  if (typeof body.promo_message === 'string') updates.promo_message = body.promo_message
  if (typeof body.screen_rotation_enabled === 'boolean') updates.screen_rotation_enabled = body.screen_rotation_enabled
  if (typeof body.rotation_interval_seconds === 'number') updates.rotation_interval_seconds = body.rotation_interval_seconds
  if (body.orientation === 'horizontal' || body.orientation === 'vertical') updates.orientation = body.orientation

  const { error } = await db.from('tv_config').update(updates).eq('id', existing.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const config = await getConfig(db)
  return NextResponse.json({ ok: true, config })
}
