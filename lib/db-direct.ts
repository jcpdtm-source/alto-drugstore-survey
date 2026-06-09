import postgres from 'postgres'

// Conexión directa a PostgreSQL — bypasa PostgREST y su schema cache
// Solo se usa para columnas que PostgREST no reconoce (ej: orientation)
let sql: ReturnType<typeof postgres> | null = null

export function getDirectDb() {
  if (!sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL no configurado')
    sql = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 10 })
  }
  return sql
}
