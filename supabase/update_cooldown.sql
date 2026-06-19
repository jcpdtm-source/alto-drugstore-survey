-- ============================================================
-- UPDATE: cooldown por días + reset de stock
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Agregar win_cooldown_days a game_config
ALTER TABLE game_config ADD COLUMN IF NOT EXISTS win_cooldown_days integer NOT NULL DEFAULT 2;

-- Actualizar función play_game: chequea si ganó en los últimos N días (no "alguna vez")
CREATE OR REPLACE FUNCTION play_game(p_device text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_config game_config;
  v_counter integer;
  v_already_won boolean;
  v_prize prizes%ROWTYPE;
  v_delivery_id uuid;
  v_expires_at timestamptz;
  v_consolation text;
BEGIN
  SELECT * INTO v_config FROM game_config LIMIT 1 FOR UPDATE;

  IF NOT v_config.is_active THEN
    RETURN json_build_object('error', 'game_inactive');
  END IF;

  v_counter := v_config.global_counter + 1;
  UPDATE game_config SET global_counter = v_counter, updated_at = now()
  WHERE id = v_config.id;

  INSERT INTO game_entries (device_fingerprint, counter_value)
  VALUES (p_device, v_counter);

  -- Verificar si ganó dentro del período de cooldown
  SELECT EXISTS (
    SELECT 1 FROM prize_deliveries
    WHERE device_fingerprint = p_device
      AND created_at > now() - (v_config.win_cooldown_days || ' days')::interval
  ) INTO v_already_won;

  IF v_already_won THEN
    SELECT message INTO v_consolation
    FROM consolation_messages
    WHERE is_active = true
    ORDER BY random()
    LIMIT 1;

    RETURN json_build_object(
      'won', false,
      'already_won_cooldown', true,
      'counter', v_counter,
      'consolation_message', v_consolation
    );
  END IF;

  SELECT p.* INTO v_prize
  FROM prizes p
  WHERE p.is_active = true
    AND v_counter >= p.activation_vote
    AND (v_counter - p.activation_vote) % p.frequency = 0
    AND (p.stock IS NULL OR p.stock_remaining > 0)
  ORDER BY p.priority ASC
  LIMIT 1;

  IF v_prize.id IS NOT NULL THEN
    v_expires_at := now() + (v_config.redemption_hours || ' hours')::interval;

    INSERT INTO prize_deliveries (prize_id, device_fingerprint, counter_value, expires_at)
    VALUES (v_prize.id, p_device, v_counter, v_expires_at)
    RETURNING id INTO v_delivery_id;

    IF v_prize.stock IS NOT NULL THEN
      UPDATE prizes SET stock_remaining = stock_remaining - 1, updated_at = now()
      WHERE id = v_prize.id;
    END IF;

    RETURN json_build_object(
      'won', true,
      'counter', v_counter,
      'prize_id', v_prize.id,
      'prize_name', v_prize.name,
      'prize_message', v_prize.message,
      'delivery_id', v_delivery_id,
      'expires_at', v_expires_at
    );
  ELSE
    SELECT message INTO v_consolation
    FROM consolation_messages
    WHERE is_active = true
    ORDER BY random()
    LIMIT 1;

    RETURN json_build_object(
      'won', false,
      'counter', v_counter,
      'consolation_message', v_consolation
    );
  END IF;
END;
$$;

-- Función para resetear stock de un premio
CREATE OR REPLACE FUNCTION reset_prize_stock(p_prize_id uuid, p_stock integer)
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE prizes SET stock = p_stock, stock_remaining = p_stock, updated_at = now()
  WHERE id = p_prize_id;
$$;

-- Actualizar get_game_config para incluir win_cooldown_days
CREATE OR REPLACE FUNCTION get_game_config()
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT row_to_json(g) FROM game_config g LIMIT 1;
$$;

NOTIFY pgrst, 'reload schema';
