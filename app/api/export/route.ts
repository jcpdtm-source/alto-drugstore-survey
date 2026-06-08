import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const surveyId = searchParams.get('survey_id')

  const db = supabaseAdmin()
  let query = db
    .from('survey_responses')
    .select('id, survey_id, option_id, device_fingerprint, created_at, survey_options(text), surveys(title, question)')
    .order('created_at')

  if (surveyId) query = query.eq('survey_id', surveyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data || []).map((r: any) => ({
    id: r.id,
    encuesta: r.surveys?.title || '',
    pregunta: r.surveys?.question || '',
    respuesta: r.survey_options?.text || '',
    dispositivo: r.device_fingerprint || '',
    fecha: r.created_at,
  }))

  const header = 'id,encuesta,pregunta,respuesta,dispositivo,fecha\n'
  const csv = header + rows.map((r: any) =>
    `"${r.id}","${r.encuesta}","${r.pregunta}","${r.respuesta}","${r.dispositivo}","${r.fecha}"`
  ).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="respuestas-${surveyId || 'todas'}.csv"`,
    },
  })
}
