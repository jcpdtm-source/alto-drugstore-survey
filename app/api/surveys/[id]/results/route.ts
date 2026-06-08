import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET: resultados públicos de una encuesta, respetando el orden configurado
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = supabaseAdmin()

  // Obtener configuración de orden de la encuesta
  const { data: survey } = await db
    .from('surveys')
    .select('result_order')
    .eq('id', id)
    .single()

  const orderByRank = !survey || survey.result_order === 'rank'

  const { data, error } = await db
    .from('survey_results')
    .select('*')
    .eq('survey_id', id)
    .order(orderByRank ? 'response_count' : 'display_order', { ascending: !orderByRank })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
