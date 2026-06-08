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
    .select('*, survey_options(*))')
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

  const { title, question, options } = await req.json()
  if (!title || !question || !options || options.length < 2) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (options.length > 7) {
    return NextResponse.json({ error: 'Máximo 7 opciones' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data: survey, error: surveyError } = await db
    .from('surveys')
    .insert({ title, question, created_by: session.adminId, is_active: false })
    .select()
    .single()

  if (surveyError) return NextResponse.json({ error: surveyError.message }, { status: 500 })

  const optionRows = options.map((text: string, i: number) => ({
    survey_id: survey.id,
    text,
    display_order: i,
  }))

  const { error: optError } = await db.from('survey_options').insert(optionRows)
  if (optError) return NextResponse.json({ error: optError.message }, { status: 500 })

  return NextResponse.json(survey, { status: 201 })
}
