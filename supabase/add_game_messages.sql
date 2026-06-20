-- Mensajes rotantes para la pantalla de juego TV
ALTER TABLE game_config ADD COLUMN IF NOT EXISTS game_messages text[] DEFAULT '{}';

-- Actualizar RPC get_game_config para incluir game_messages
DROP FUNCTION IF EXISTS get_game_config();

CREATE OR REPLACE FUNCTION get_game_config()
RETURNS TABLE(
  id uuid,
  is_active boolean,
  global_counter integer,
  redemption_hours integer,
  win_cooldown_days integer,
  game_messages text[],
  updated_at timestamptz
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id, is_active, global_counter, redemption_hours, win_cooldown_days, game_messages, updated_at
  FROM game_config LIMIT 1;
$$;

NOTIFY pgrst, 'reload schema';
