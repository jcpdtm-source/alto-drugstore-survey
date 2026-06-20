import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function getConfig(db: ReturnType<typeof supabaseAdmin>) {
  const { data: rpcData, error: rpcError } = await db.rpc('get_tv_config')
  if (!rpcError && rpcData) return rpcData

  const { data: rows } = await db.from('tv_config').select('*').limit(1)
  const row = rows?.[0]
  return { ...row, orientation: (row as Record<string, unknown>)?.orientation || 'horizontal' }
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

  const { data: rows } = await db.from('tv_config').select('id').limit(1)
  const existingId = rows?.[0]?.id
  if (!existingId) return NextResponse.json({ error: 'Config no encontrada' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  if (typeof body.promo_message === 'string') updates.promo_message = body.promo_message
  if (typeof body.screen_rotation_enabled === 'boolean') updates.screen_rotation_enabled = body.screen_rotation_enabled
  if (typeof body.rotation_interval_seconds === 'number') updates.rotation_interval_seconds = body.rotation_interval_seconds
  if (body.orientation === 'horizontal' || body.orientation === 'vertical') updates.orientation = body.orientation

  const { error } = await db.from('tv_config').update(updates).eq('id', existingId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const config = await getConfig(db)
  return NextResponse.json({ ok: true, config })
}
