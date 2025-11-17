-- Agregar campo download_pin a tabla galleries
-- Este campo almacena el PIN requerido para descargar fotos de una galería

ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS download_pin TEXT;

COMMENT ON COLUMN galleries.download_pin IS
'PIN requerido para descargar fotos (opcional, null = sin PIN)';
