import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

function unwrap(data: unknown) {
  return Array.isArray(data) ? data[0] ?? null : data
}

export async function GET() {
  const db = supabaseAdmin()
  const { data, error } = await db.rpc('get_game_config')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(unwrap(data))
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const db = supabaseAdmin()

  const updates: Record<string, unknown> = {}
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (typeof body.redemption_hours === 'number') updates.redemption_hours = body.redemption_hours
  if (typeof body.global_counter === 'number') updates.global_counter = body.global_counter
  if (typeof body.win_cooldown_days === 'number') updates.win_cooldown_days = body.win_cooldown_days
  if (Array.isArray(body.game_messages)) updates.game_messages = body.game_messages

  updates.updated_at = new Date().toISOString()

  const { error } = await db.from('game_config').update(updates).neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = await db.rpc('get_game_config')
  return NextResponse.json(unwrap(data))
}
