-- Agregar campo client_email a tabla testimonials
-- Este campo permite validar que cada cliente solo envíe un testimonio por galería

ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Crear índice para mejorar performance de búsquedas
CREATE INDEX IF NOT EXISTS idx_testimonials_gallery_email
ON testimonials (gallery_id, client_email);

COMMENT ON COLUMN testimonials.client_email IS
'Email del cliente (para validar unicidad: 1 testimonio por email por galería)';
