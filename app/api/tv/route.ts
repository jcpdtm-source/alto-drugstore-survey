import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { getDirectDb } from '@/lib/db-direct'

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

  // Campos que PostgREST conoce → usar cliente Supabase normal
  const knownFields: Record<string, unknown> = {}
  if (typeof body.promo_message === 'string') knownFields.promo_message = body.promo_message
  if (typeof body.screen_rotation_enabled === 'boolean') knownFields.screen_rotation_enabled = body.screen_rotation_enabled
  if (typeof body.rotation_interval_seconds === 'number') knownFields.rotation_interval_seconds = body.rotation_interval_seconds

  if (Object.keys(knownFields).length > 0) {
    const { error } = await db.from('tv_config').update(knownFields).eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // orientation → SQL directo (PostgREST no la conoce por schema cache)
  if (body.orientation === 'horizontal' || body.orientation === 'vertical') {
    try {
      const sql = getDirectDb()
      await sql`UPDATE tv_config SET orientation = ${body.orientation} WHERE id = ${existing.id}`
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al actualizar orientation'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  const config = await getConfig(db)
  return NextResponse.json({ ok: true, config })
}
