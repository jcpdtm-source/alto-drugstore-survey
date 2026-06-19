import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { device_fingerprint } = await req.json()
  if (!device_fingerprint) {
    return NextResponse.json({ error: 'device_fingerprint requerido' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db.rpc('play_game', { p_device: device_fingerprint })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (data?.error === 'game_inactive') {
    return NextResponse.json({ error: 'game_inactive' }, { status: 403 })
  }

  return NextResponse.json(data)
}
