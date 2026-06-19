-- ============================================================
-- SISTEMA DE PREMIOS — ejecutar en Supabase SQL Editor
-- Rama: feature/premios
-- ============================================================

-- 1. Configuración global del juego
CREATE TABLE IF NOT EXISTS game_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  global_counter integer NOT NULL DEFAULT 0,
  redemption_hours integer NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insertar fila única de config
INSERT INTO game_config (is_active, global_counter, redemption_hours)
VALUES (false, 0, 2)
ON CONFLICT DO NOTHING;

-- 2. Premios configurables
CREATE TABLE IF NOT EXISTS prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message text NOT NULL,
  activation_vote integer NOT NULL DEFAULT 1,
  frequency integer NOT NULL DEFAULT 1000,
  priority integer NOT NULL DEFAULT 1,
  stock integer,
  stock_remaining integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Mensajes de consolación
CREATE TABLE IF NOT EXISTS consolation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Mensajes de ejemplo
INSERT INTO consolation_messages (message, display_order) VALUES
  ('¡Muy cerca! El próximo premio se viene', 1),
  ('Tu voto cuenta. Seguí participando', 2),
  ('¡Casi! Intentá de nuevo', 3),
  ('El premio está a la vuelta de la esquina', 4)
ON CONFLICT DO NOTHING;

-- 4. Entradas al juego (una por participación)
CREATE TABLE IF NOT EXISTS game_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint text NOT NULL,
  counter_value integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_entries_device ON game_entries(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_game_entries_counter ON game_entries(counter_value);

-- 5. Premios entregados
CREATE TABLE IF NOT EXISTS prize_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_id uuid NOT NULL REFERENCES prizes(id),
  device_fingerprint text NOT NULL,
  counter_value integer NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prize_deliveries_device ON prize_deliveries(device_fingerprint);

-- ============================================================
-- FUNCIONES RPC (bypass schema cache)
-- ============================================================

-- Obtener config del juego
CREATE OR REPLACE FUNCTION get_game_config()
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT row_to_json(g)
  FROM game_config g
  LIMIT 1;
$$;

-- Registrar participación y resolver premio
-- Devuelve: { counter, won, prize_message, prize_id, delivery_id, expires_at, consolation_message }
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
    -- No puede ganar, dar consolación
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

  -- Buscar premio que corresponda a este contador (puede haber colisión — tomar mayor prioridad)
  SELECT p.* INTO v_prize
  FROM prizes p
  WHERE p.is_active = true
    AND v_counter >= p.activation_vote
    AND (v_counter - p.activation_vote) % p.frequency = 0
    AND (p.stock IS NULL OR p.stock_remaining > 0)
  ORDER BY p.priority ASC
  LIMIT 1;

  IF v_prize.id IS NOT NULL THEN
    -- Calcular expiración
    v_expires_at := now() + (v_config.redemption_hours || ' hours')::interval;

    -- Registrar entrega
    INSERT INTO prize_deliveries (prize_id, device_fingerprint, counter_value, expires_at)
    VALUES (v_prize.id, p_device, v_counter, v_expires_at)
    RETURNING id INTO v_delivery_id;

    -- Descontar stock si corresponde
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
    -- Sin premio: consolación
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

-- Listar premios con stats
CREATE OR REPLACE FUNCTION get_prizes_with_stats()
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'name', p.name,
      'message', p.message,
      'activation_vote', p.activation_vote,
      'frequency', p.frequency,
      'priority', p.priority,
      'stock', p.stock,
      'stock_remaining', p.stock_remaining,
      'is_active', p.is_active,
      'deliveries_count', (SELECT COUNT(*) FROM prize_deliveries pd WHERE pd.prize_id = p.id),
      'created_at', p.created_at
    ) ORDER BY p.priority ASC
  )
  FROM prizes p;
$$;

-- Historial de entregas
CREATE OR REPLACE FUNCTION get_prize_deliveries()
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_agg(
    json_build_object(
      'id', pd.id,
      'prize_name', p.name,
      'prize_message', p.message,
      'device_fingerprint', pd.device_fingerprint,
      'counter_value', pd.counter_value,
      'expires_at', pd.expires_at,
      'created_at', pd.created_at
    ) ORDER BY pd.created_at DESC
  )
  FROM prize_deliveries pd
  JOIN prizes p ON p.id = pd.prize_id;
$$;

-- Recargar schema cache de PostgREST
NOTIFY pgrst, 'reload schema';
