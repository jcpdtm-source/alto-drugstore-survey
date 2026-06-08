-- Agregar columna de orden de resultados a surveys
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS result_order TEXT DEFAULT 'rank' CHECK (result_order IN ('rank', 'original'));
