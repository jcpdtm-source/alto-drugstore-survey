-- Función para crear encuesta con result_order (bypasea el schema cache de PostgREST)
CREATE OR REPLACE FUNCTION create_survey(
  p_title TEXT,
  p_question TEXT,
  p_created_by UUID,
  p_result_order TEXT DEFAULT 'rank'
)
RETURNS SETOF surveys
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO surveys (title, question, created_by, is_active, result_order)
  VALUES (p_title, p_question, p_created_by, false, p_result_order)
  RETURNING *;
END;
$$;

-- Función para actualizar result_order
CREATE OR REPLACE FUNCTION set_survey_result_order(p_id UUID, p_order TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE surveys SET result_order = p_order WHERE id = p_id;
END;
$$;

-- Función para editar encuesta completa
CREATE OR REPLACE FUNCTION update_survey(
  p_id UUID,
  p_title TEXT,
  p_question TEXT,
  p_result_order TEXT DEFAULT 'rank'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE surveys
  SET title = p_title, question = p_question, result_order = p_result_order
  WHERE id = p_id;
END;
$$;

-- Función para obtener result_order de una encuesta
CREATE OR REPLACE FUNCTION get_survey_result_order(p_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order TEXT;
BEGIN
  SELECT result_order INTO v_order FROM surveys WHERE id = p_id;
  RETURN COALESCE(v_order, 'rank');
END;
$$;
