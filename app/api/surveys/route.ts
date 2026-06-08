import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET: lista todas las encuestas (admin)
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('surveys')
    .select('id, title, question, is_active, closed_at, created_at, created_by, survey_options(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: crear nueva encuesta (solo super admin)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { title, question, options, result_order } = await req.json()
  if (!title || !question || !options || options.length < 2) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (options.length > 7) {
    return NextResponse.json({ error: 'Máximo 7 opciones' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const order = result_order || 'rank'

  // Usar SQL directo para evitar problemas con el schema cache de PostgREST
  const { data: surveyRows, error: surveyError } = await db.rpc('create_survey', {
    p_title: title,
    p_question: question,
    p_created_by: session.adminId,
    p_result_order: order,
  })

  if (surveyError) {
    // Fallback: insertar sin result_order si la función no existe aún
    const { data: survey, error: insertError } = await db
      .from('surveys')
      .insert({ title, question, created_by: session.adminId, is_active: false })
      .select()
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    // Actualizar result_order con SQL raw
    await db.rpc('set_survey_result_order', { p_id: survey.id, p_order: order }).maybeSingle()

    const optionRows = options.map((text: string, i: number) => ({
      survey_id: survey.id, text, display_order: i,
    }))
    const { error: optError } = await db.from('survey_options').insert(optionRows)
    if (optError) return NextResponse.json({ error: optError.message }, { status: 500 })

    return NextResponse.json(survey, { status: 201 })
  }

  const survey = Array.isArray(surveyRows) ? surveyRows[0] : surveyRows
  const optionRows = options.map((text: string, i: number) => ({
    survey_id: survey.id, text, display_order: i,
  }))
  const { error: optError } = await db.from('survey_options').insert(optionRows)
  if (optError) return NextResponse.json({ error: optError.message }, { status: 500 })

  return NextResponse.json(survey, { status: 201 })
}
