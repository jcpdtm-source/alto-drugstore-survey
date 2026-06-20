-- URGENTE: eliminar filas duplicadas creadas por la migración add_config_env.sql
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar pantallas duplicadas (las de config_env = 'dev')
DELETE FROM tv_screens WHERE config_env = 'dev';

-- 2. Eliminar configuración duplicada (la de config_env = 'dev')
DELETE FROM tv_config WHERE config_env = 'dev';

-- 3. (Opcional) Quitar la columna config_env si no se va a usar por ahora
-- ALTER TABLE tv_screens DROP COLUMN IF EXISTS config_env;
-- ALTER TABLE tv_config DROP COLUMN IF EXISTS config_env;
