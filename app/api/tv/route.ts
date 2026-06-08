import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET: config pública de TV
export async function GET() {
  const db = supabaseAdmin()

  const [configRes, screensRes, activeSurveyRes] = await Promise.all([
    db.from('tv_config').select('*').single(),
    db.from('tv_screens').select('*').order('display_order'),
    db.from('surveys').select('id, question, title').eq('is_active', true).single(),
  ])

  return NextResponse.json({
    config: configRes.data,
    screens: screensRes.data || [],
    activeSurvey: activeSurveyRes.data || null,
  })
}

// PATCH: actualizar config TV (local admin y super admin)
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const db = supabaseAdmin()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: session.adminId }

  // Local admin solo puede editar mensaje promo y rotación
  if (typeof body.promo_message === 'string') updates.promo_message = body.promo_message
  if (typeof body.screen_rotation_enabled === 'boolean') updates.screen_rotation_enabled = body.screen_rotation_enabled
  if (typeof body.rotation_interval_seconds === 'number') updates.rotation_interval_seconds = body.rotation_interval_seconds

  const { data, error } = await db.from('tv_config').update(updates).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
