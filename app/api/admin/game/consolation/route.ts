import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const db = supabaseAdmin()
  const { data, error } = await db.from('consolation_messages').select('*').order('display_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { message, display_order } = await req.json()
  if (!message) return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })

  const db = supabaseAdmin()
  const { data, error } = await db.from('consolation_messages').insert({
    message,
    display_order: display_order ?? 0,
    is_active: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
