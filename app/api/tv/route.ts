import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET: config pública de TV
export async function GET() {
  const db = supabaseAdmin()

  const [configRes, screensRes, activeSurveysRes] = await Promise.all([
    db.from('tv_config').select('*').single(),
    db.from('tv_screens').select('*').order('display_order'),
    // Hasta 2 encuestas activas
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
    // Compatibilidad hacia atrás
    activeSurvey: activeSurveysRes.data?.[0] || null,
  })
}

// PATCH: actualizar config TV
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const db = supabaseAdmin()

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: session.adminId,
  }

  if (typeof body.promo_message === 'string') updates.promo_message = body.promo_message
  if (typeof body.screen_rotation_enabled === 'boolean') updates.screen_rotation_enabled = body.screen_rotation_enabled
  if (typeof body.rotation_interval_seconds === 'number') updates.rotation_interval_seconds = body.rotation_interval_seconds
  if (body.orientation === 'horizontal' || body.orientation === 'vertical') updates.orientation = body.orientation

  const { data: existing } = await db.from('tv_config').select('id').single()
  if (!existing) return NextResponse.json({ error: 'Config no encontrada' }, { status: 404 })

  const { data, error } = await db.from('tv_config').update(updates).eq('id', existing.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
