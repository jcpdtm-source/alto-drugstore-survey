import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// DELETE: eliminar una pantalla del carrusel
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = supabaseAdmin()

  // Obtener la pantalla para borrar la imagen del storage
  const { data: screen } = await db.from('tv_screens').select('image_url, screen_type').eq('id', id).single()

  // No permitir borrar la pantalla de encuesta principal
  if (screen?.screen_type === 'survey') {
    return NextResponse.json({ error: 'No se puede eliminar la pantalla de encuesta' }, { status: 400 })
  }

  // Borrar imagen del storage si existe
  if (screen?.image_url) {
    const fileName = screen.image_url.split('/').pop()
    if (fileName) {
      await db.storage.from('tv-images').remove([fileName])
    }
  }

  const { error } = await db.from('tv_screens').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
