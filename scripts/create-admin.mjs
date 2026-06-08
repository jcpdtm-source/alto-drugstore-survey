import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = 'https://fvwfgrwmmjpiyvgqckyb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2d2ZncndtbWpwaXl2Z3Fja3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDg4OTAzNCwiZXhwIjoyMDk2NDY1MDM0fQ.qlf8msgjNsxx9fjtM_TshqCiKwHb75C3Itt2TmfVqvk'

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const admins = [
  {
    email: 'super@altoDrugstore.com',
    password: 'SuperAdmin2026!',
    role: 'super',
    name: 'Super Admin'
  },
  {
    email: 'local@altoDrugstore.com',
    password: 'LocalAdmin2026!',
    role: 'local',
    name: 'Admin Local'
  }
]

for (const admin of admins) {
  const hash = await bcrypt.hash(admin.password, 12)
  const { error } = await db.from('admins').upsert(
    { email: admin.email, password_hash: hash, role: admin.role, name: admin.name },
    { onConflict: 'email' }
  )
  if (error) {
    console.error(`❌ Error creando ${admin.email}:`, error.message)
  } else {
    console.log(`✅ ${admin.role.toUpperCase()} creado: ${admin.email} / ${admin.password}`)
  }
}
