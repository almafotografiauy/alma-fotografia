-- Agregar campo allow_share_favorites a tabla galleries
-- Este campo controla si los clientes pueden compartir sus fotos favoritas

ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS allow_share_favorites BOOLEAN DEFAULT false;

COMMENT ON COLUMN galleries.allow_share_favorites IS
'Permite a los clientes compartir un enlace público con solo sus fotos favoritas';
