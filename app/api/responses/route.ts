import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST: registrar respuesta de usuario
export async function POST(req: NextRequest) {
  const { survey_id, option_id, device_fingerprint } = await req.json()

  if (!survey_id || !option_id) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Verificar que la encuesta esté activa
  const { data: survey } = await db
    .from('surveys')
    .select('is_active')
    .eq('id', survey_id)
    .single()

  if (!survey?.is_active) {
    return NextResponse.json({ error: 'Encuesta no disponible' }, { status: 400 })
  }

  const { error } = await db.from('survey_responses').insert({
    survey_id,
    option_id,
    device_fingerprint: device_fingerprint || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
