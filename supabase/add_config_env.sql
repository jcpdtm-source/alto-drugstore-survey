-- Separación dev / producción para tv_config y tv_screens
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna config_env a tv_config
ALTER TABLE tv_config ADD COLUMN IF NOT EXISTS config_env TEXT NOT NULL DEFAULT 'production';

-- 2. Marcar la fila existente como producción
UPDATE tv_config SET config_env = 'production';

-- 3. Crear fila de configuración para dev (copia de producción)
INSERT INTO tv_config (promo_message, screen_rotation_enabled, rotation_interval_seconds, config_env)
SELECT promo_message, screen_rotation_enabled, rotation_interval_seconds, 'dev'
FROM tv_config
WHERE config_env = 'production'
LIMIT 1;

-- 4. Agregar columna config_env a tv_screens
ALTER TABLE tv_screens ADD COLUMN IF NOT EXISTS config_env TEXT NOT NULL DEFAULT 'production';

-- 5. Marcar las pantallas existentes como producción
UPDATE tv_screens SET config_env = 'production';

-- 6. Duplicar las pantallas como pantallas de dev
INSERT INTO tv_screens (screen_type, display_order, is_enabled, image_url, image_name, duration_seconds, video_url, config_env)
SELECT screen_type, display_order, is_enabled, image_url, image_name, duration_seconds, video_url, 'dev'
FROM tv_screens
WHERE config_env = 'production';
