import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { encodeSession, SESSION_COOKIE_NAME } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const db = supabaseAdmin()
  const { data: admin, error } = await db
    .from('admins')
    .select('id, email, role, name, password_hash')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !admin) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, admin.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  const session = { adminId: admin.id, role: admin.role, name: admin.name }
  const encoded = encodeSession(session)

  const res = NextResponse.json({ role: admin.role, name: admin.name })
  res.cookies.set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
  })
  return res
}
