-- Agregar duración individual por pantalla
ALTER TABLE tv_screens ADD COLUMN IF NOT EXISTS duration_seconds integer;

-- RPC para actualizar duración de una pantalla
CREATE OR REPLACE FUNCTION set_screen_duration(p_id uuid, p_seconds integer)
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE tv_screens SET duration_seconds = p_seconds WHERE id = p_id;
$$;

NOTIFY pgrst, 'reload schema';
