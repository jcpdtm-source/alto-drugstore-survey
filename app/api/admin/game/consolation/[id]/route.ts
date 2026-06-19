import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const db = supabaseAdmin()

  const updates: Record<string, unknown> = {}
  if (typeof body.message === 'string') updates.message = body.message
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (typeof body.display_order === 'number') updates.display_order = body.display_order

  const { data, error } = await db.from('consolation_messages').update(updates).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { error } = await db.from('consolation_messages').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
