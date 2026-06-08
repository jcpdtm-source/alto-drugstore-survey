import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

// PATCH: habilitar/deshabilitar pantallas y reordenar (local y super admin)
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { screens } = await req.json()
  const db = supabaseAdmin()

  for (const screen of screens) {
    await db
      .from('tv_screens')
      .update({ is_enabled: screen.is_enabled, display_order: screen.display_order })
      .eq('id', screen.id)
  }

  const { data } = await db.from('tv_screens').select('*').order('display_order')
  return NextResponse.json(data)
}
