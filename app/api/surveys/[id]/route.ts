import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET: datos públicos de una encuesta por id (para página de votación)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = supabaseAdmin()

  const { data: survey, error } = await db
    .from('surveys')
    .select('id, question, title, is_active, survey_options(id, text, display_order)')
    .eq('id', id)
    .single()

  if (error || !survey) return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
  return NextResponse.json(survey)
}

// PATCH: activar/desactivar/cerrar encuesta (super admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const db = supabaseAdmin()

  // Si se activa esta, desactivar todas las demás
  if (body.is_active === true) {
    await db.from('surveys').update({ is_active: false }).neq('id', id)
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (body.close === true) {
    updates.is_active = false
    updates.closed_at = new Date().toISOString()
  }

  const { data, error } = await db.from('surveys').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: eliminar encuesta (super admin)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const db = supabaseAdmin()
  const { error } = await db.from('surveys').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
