import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// GET: datos de una encuesta por id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = supabaseAdmin()

  const { data: survey, error } = await db
    .from('surveys')
    .select('id, question, title, is_active, survey_options(id, text, display_order)')
    .eq('id', id)
    .single()

  if (error || !survey) return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
  return NextResponse.json(survey)
}

// PUT: editar encuesta completa (super admin)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { title, question, options, result_order } = await req.json()
  if (!title || !question || !options || options.length < 2) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Usar función SQL para evitar el schema cache de PostgREST
  const { error: surveyError } = await db.rpc('update_survey', {
    p_id: id,
    p_title: title,
    p_question: question,
    p_result_order: result_order || 'rank',
  })

  if (surveyError) return NextResponse.json({ error: surveyError.message }, { status: 500 })

  // Borrar opciones viejas
  const { error: deleteError } = await db
    .from('survey_options')
    .delete()
    .eq('survey_id', id)

  if (deleteError) return NextResponse.json({ error: 'Error al borrar opciones: ' + deleteError.message }, { status: 500 })

  // Insertar opciones nuevas
  const optionRows = options.map((text: string, i: number) => ({
    survey_id: id,
    text,
    display_order: i,
  }))

  const { error: optError } = await db.from('survey_options').insert(optionRows)
  if (optError) return NextResponse.json({ error: 'Error al insertar opciones: ' + optError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// PATCH: activar/desactivar/cerrar encuesta (super admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const db = supabaseAdmin()

  // Si se activa esta, verificar que no haya ya 2 activas
  if (body.is_active === true) {
    const { data: activeNow } = await db
      .from('surveys')
      .select('id')
      .eq('is_active', true)
      .neq('id', id)
    if (activeNow && activeNow.length >= 2) {
      return NextResponse.json(
        { error: 'Ya hay 2 encuestas activas. Pausá una antes de activar otra.' },
        { status: 400 }
      )
    }
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (body.close === true) {
    updates.is_active = false
    updates.closed_at = new Date().toISOString()
  }

  const { data, error } = await db.from('surveys').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE: eliminar encuesta (super admin)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const db = supabaseAdmin()
  const { error } = await db.from('surveys').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
