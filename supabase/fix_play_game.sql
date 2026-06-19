-- Fix: UPDATE game_config necesita WHERE con el id de la fila
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
  -- Obtener config y lockear fila para update atómico
  SELECT * INTO v_config FROM game_config LIMIT 1 FOR UPDATE;

  IF NOT v_config.is_active THEN
    RETURN json_build_object('error', 'game_inactive');
  END IF;

  -- Avanzar contador
  v_counter := v_config.global_counter + 1;
  UPDATE game_config SET global_counter = v_counter, updated_at = now()
  WHERE id = v_config.id;

  -- Registrar entrada
  INSERT INTO game_entries (device_fingerprint, counter_value)
  VALUES (p_device, v_counter);

  -- Verificar si este dispositivo ya ganó alguna vez
  SELECT EXISTS (
    SELECT 1 FROM prize_deliveries WHERE device_fingerprint = p_device
  ) INTO v_already_won;

  IF v_already_won THEN
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

  -- Buscar premio que corresponda a este contador
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

NOTIFY pgrst, 'reload schema';
