-- Migración: soporte de pantallas de video en el carrusel TV
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna video_url
ALTER TABLE tv_screens ADD COLUMN IF NOT EXISTS video_url text;

-- 2. Actualizar el constraint de screen_type para incluir 'video'
ALTER TABLE tv_screens DROP CONSTRAINT IF EXISTS tv_screens_screen_type_check;
ALTER TABLE tv_screens ADD CONSTRAINT tv_screens_screen_type_check
  CHECK (screen_type IN ('survey', 'promo_image', 'game', 'video'));
