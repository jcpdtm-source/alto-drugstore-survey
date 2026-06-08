import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const db = supabaseAdmin()

  // Verificar conexión y que la tabla admins existe
  const { data, error } = await db
    .from('admins')
    .select('email, role')

  return NextResponse.json({
    env_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    env_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    admins_found: data?.length ?? 0,
    admins: data?.map(a => a.email) ?? [],
    error: error?.message ?? null,
  })
}
