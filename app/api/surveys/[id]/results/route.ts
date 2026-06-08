import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = supabaseAdmin()

  // Obtener result_order via función SQL (bypasea schema cache)
  let orderByRank = true
  const { data: orderData } = await db.rpc('get_survey_result_order', { p_id: id })
  if (orderData) orderByRank = orderData === 'rank'

  const { data, error } = await db
    .from('survey_results')
    .select('*')
    .eq('survey_id', id)
    .order(orderByRank ? 'response_count' : 'display_order', { ascending: !orderByRank })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
