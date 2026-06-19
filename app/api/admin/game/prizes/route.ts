import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const db = supabaseAdmin()
  const { data, error } = await db.rpc('get_prizes_with_stats')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { name, message, activation_vote, frequency, priority, stock, is_active } = body

  if (!name || !message || !activation_vote || !frequency || !priority) {
    return NextResponse.json({ error: 'Campos requeridos incompletos' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db.from('prizes').insert({
    name,
    message,
    activation_vote: Number(activation_vote),
    frequency: Number(frequency),
    priority: Number(priority),
    stock: stock ? Number(stock) : null,
    stock_remaining: stock ? Number(stock) : null,
    is_active: is_active ?? true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
