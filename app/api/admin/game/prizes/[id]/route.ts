import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const db = supabaseAdmin()

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.name === 'string') updates.name = body.name
  if (typeof body.message === 'string') updates.message = body.message
  if (typeof body.activation_vote === 'number') updates.activation_vote = body.activation_vote
  if (typeof body.frequency === 'number') updates.frequency = body.frequency
  if (typeof body.priority === 'number') updates.priority = body.priority
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (body.stock !== undefined) {
    updates.stock = body.stock ? Number(body.stock) : null
    updates.stock_remaining = body.stock ? Number(body.stock) : null
  }

  const { data, error } = await db.from('prizes').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  const db = supabaseAdmin()

  // Borrar entregas asociadas primero (FK constraint)
  await db.from('prize_deliveries').delete().eq('prize_id', id)

  const { error } = await db.from('prizes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
