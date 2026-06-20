import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const CONFIG_ENV = process.env.NEXT_PUBLIC_APP_ENV || 'production'

async function getConfig(db: ReturnType<typeof supabaseAdmin>) {
  // Intentar con config_env filter; fallback si la columna no existe aún
  const { data, error } = await db
    .from('tv_config')
    .select('*')
    .eq('config_env', CONFIG_ENV)
    .single()

  if (!error && data) return data

  const { data: rpcData, error: rpcError } = await db.rpc('get_tv_config')
  if (!rpcError && rpcData) return rpcData

  const { data: fallback } = await db.from('tv_config').select('*').single()
  return { ...fallback, orientation: (fallback as Record<string, unknown>)?.orientation || 'horizontal' }
}

async function getScreens(db: ReturnType<typeof supabaseAdmin>) {
  const { data, error } = await db
    .from('tv_screens')
    .select('*')
    .eq('config_env', CONFIG_ENV)
    .order('display_order')

  if (!error && data) return data

  // Fallback sin columna config_env
  const { data: fallback } = await db.from('tv_screens').select('*').order('display_order')
  return fallback || []
}

export async function GET() {
  const db = supabaseAdmin()

  const [config, screens, activeSurveysRes, gameConfigRes] = await Promise.all([
    getConfig(db),
    getScreens(db),
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
    config_env: CONFIG_ENV,
  }

  return NextResponse.json({
    config: safeConfig,
    screens: screens || [],
    activeSurveys: activeSurveysRes.data || [],
    activeSurvey: activeSurveysRes.data?.[0] || null,
    gameConfig: gameConfigRes || null,
    configEnv: CONFIG_ENV,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const db = supabaseAdmin()

  // Buscar la fila correcta para este env; fallback a cualquier fila si la columna no existe
  let existing: { id: string } | null = null
  const { data: envRow } = await db.from('tv_config').select('id').eq('config_env', CONFIG_ENV).single()
  if (envRow) {
    existing = envRow
  } else {
    const { data: anyRow } = await db.from('tv_config').select('id').single()
    existing = anyRow
  }

  if (!existing) return NextResponse.json({ error: 'Config no encontrada' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  if (typeof body.promo_message === 'string') updates.promo_message = body.promo_message
  if (typeof body.screen_rotation_enabled === 'boolean') updates.screen_rotation_enabled = body.screen_rotation_enabled
  if (typeof body.rotation_interval_seconds === 'number') updates.rotation_interval_seconds = body.rotation_interval_seconds
  if (body.orientation === 'horizontal' || body.orientation === 'vertical') updates.orientation = body.orientation

  const { error } = await db.from('tv_config').update(updates).eq('id', existing.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const config = await getConfig(db)
  return NextResponse.json({ ok: true, config, configEnv: CONFIG_ENV })
}
