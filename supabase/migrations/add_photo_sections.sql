-- =============================================
-- SISTEMA DE SECCIONES DE FOTOS
-- =============================================
-- Permite organizar fotos en secciones dentro de una galería
-- Ejemplo: "Ceremonia", "Fiesta", "Retratos", etc.

-- 1. Crear tabla de secciones
CREATE TABLE IF NOT EXISTS photo_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: nombre único por galería
    CONSTRAINT unique_section_name_per_gallery UNIQUE(gallery_id, name)
);

-- 2. Agregar columna section_id a tabla photos
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES photo_sections(id) ON DELETE SET NULL;

-- 3. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_photo_sections_gallery_id ON photo_sections(gallery_id);
CREATE INDEX IF NOT EXISTS idx_photo_sections_display_order ON photo_sections(gallery_id, display_order);
CREATE INDEX IF NOT EXISTS idx_photos_section_id ON photos(section_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE photo_sections ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para photo_sections
-- Permitir SELECT a todos (para galerías públicas/compartidas)
CREATE POLICY "Anyone can view photo sections"
    ON photo_sections FOR SELECT
    USING (true);

-- Permitir INSERT/UPDATE/DELETE solo a usuarios autenticados que son dueños de la galería
CREATE POLICY "Gallery owners can manage sections"
    ON photo_sections FOR ALL
    USING (
        gallery_id IN (
            SELECT id FROM galleries
            WHERE created_by = auth.uid()
        )
    );

-- 6. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_photo_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_photo_sections_updated_at
    BEFORE UPDATE ON photo_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_photo_sections_updated_at();

-- 7. Comentarios para documentación
COMMENT ON TABLE photo_sections IS 'Secciones para organizar fotos dentro de una galería';
COMMENT ON COLUMN photo_sections.gallery_id IS 'ID de la galería a la que pertenece esta sección';
COMMENT ON COLUMN photo_sections.name IS 'Nombre de la sección (ej: Ceremonia, Fiesta, Retratos)';
COMMENT ON COLUMN photo_sections.display_order IS 'Orden de visualización de las secciones';
COMMENT ON COLUMN photos.section_id IS 'Sección a la que pertenece la foto (NULL = sin sección)';
