-- =============================================
-- ALTO DRUGSTORE SURVEY - Schema v1
-- =============================================

-- Tabla de administradores
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super', 'local')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de encuestas
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Tabla de opciones de respuesta
CREATE TABLE survey_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de respuestas
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES survey_options(id),
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de configuración de pantalla TV
CREATE TABLE tv_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_message TEXT DEFAULT '',
  screen_rotation_enabled BOOLEAN DEFAULT false,
  rotation_interval_seconds INTEGER DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES admins(id)
);

-- Tabla de pantallas del carrusel
CREATE TABLE tv_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_type TEXT NOT NULL CHECK (screen_type IN ('survey', 'promo_image')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  image_url TEXT,
  image_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar config inicial de TV
INSERT INTO tv_config (promo_message, screen_rotation_enabled, rotation_interval_seconds)
VALUES ('', false, 10);

-- Insertar pantalla de encuesta por defecto
INSERT INTO tv_screens (screen_type, display_order, is_enabled)
VALUES ('survey', 0, true);

-- =============================================
-- VISTAS útiles
-- =============================================

-- Vista de resultados por encuesta
CREATE OR REPLACE VIEW survey_results AS
SELECT
  s.id AS survey_id,
  s.question,
  so.id AS option_id,
  so.text AS option_text,
  so.display_order,
  COUNT(sr.id) AS response_count,
  ROUND(
    COUNT(sr.id) * 100.0 / NULLIF(SUM(COUNT(sr.id)) OVER (PARTITION BY s.id), 0)
  )::INTEGER AS percentage
FROM surveys s
JOIN survey_options so ON so.survey_id = s.id
LEFT JOIN survey_responses sr ON sr.option_id = so.id
GROUP BY s.id, s.question, so.id, so.text, so.display_order
ORDER BY s.id, response_count DESC;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_screens ENABLE ROW LEVEL SECURITY;

-- Acceso público de lectura para encuestas activas y opciones
CREATE POLICY "public_read_active_survey" ON surveys
  FOR SELECT USING (is_active = true);

CREATE POLICY "public_read_options" ON survey_options
  FOR SELECT USING (true);

CREATE POLICY "public_insert_responses" ON survey_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_read_tv_config" ON tv_config
  FOR SELECT USING (true);

CREATE POLICY "public_read_tv_screens" ON tv_screens
  FOR SELECT USING (true);

-- Service role puede hacer todo (usado desde el backend con service key)
CREATE POLICY "service_all_admins" ON admins
  USING (true) WITH CHECK (true);

CREATE POLICY "service_all_surveys" ON surveys
  USING (true) WITH CHECK (true);

CREATE POLICY "service_all_options" ON survey_options
  USING (true) WITH CHECK (true);

CREATE POLICY "service_all_responses" ON survey_responses
  USING (true) WITH CHECK (true);

CREATE POLICY "service_all_tv_config" ON tv_config
  USING (true) WITH CHECK (true);

CREATE POLICY "service_all_tv_screens" ON tv_screens
  USING (true) WITH CHECK (true);

-- =============================================
-- REALTIME: habilitar para resultados en vivo
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE survey_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE tv_config;
ALTER PUBLICATION supabase_realtime ADD TABLE surveys;
ALTER PUBLICATION supabase_realtime ADD TABLE tv_screens;
