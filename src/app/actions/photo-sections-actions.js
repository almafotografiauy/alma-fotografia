'use server';

import { createClient } from '@/lib/server';

/**
 * =============================================
 * SERVER ACTIONS - SECCIONES DE FOTOS
 * =============================================
 */

/**
 * Obtener todas las secciones de una galería
 */
export async function getGallerySections(galleryId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('photo_sections')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { success: true, sections: data || [] };
  } catch (error) {
    console.error('[getGallerySections] Error:', error);
    return { success: false, error: error.message, sections: [] };
  }
}

/**
 * Crear una nueva sección
 */
export async function createSection(galleryId, sectionData) {
  try {
    const supabase = await createClient();

    // Obtener el siguiente display_order
    const { data: existingSections } = await supabase
      .from('photo_sections')
      .select('display_order')
      .eq('gallery_id', galleryId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existingSections?.[0]?.display_order + 1 || 0;

    const { data, error } = await supabase
      .from('photo_sections')
      .insert({
        gallery_id: galleryId,
        name: sectionData.name,
        description: sectionData.description || null,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      // Manejo específico para nombre duplicado
      if (error.code === '23505' && error.message.includes('unique_section_name_per_gallery')) {
        return { success: false, error: 'Ya existe una sección con ese nombre en esta galería. Por favor, elige otro nombre.' };
      }
      throw error;
    }

    return { success: true, section: data };
  } catch (error) {
    console.error('[createSection] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar una sección
 */
export async function updateSection(sectionId, updates) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('photo_sections')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      // Manejo específico para nombre duplicado
      if (error.code === '23505' && error.message.includes('unique_section_name_per_gallery')) {
        return { success: false, error: 'Ya existe una sección con ese nombre en esta galería. Por favor, elige otro nombre.' };
      }
      throw error;
    }

    return { success: true, section: data };
  } catch (error) {
    console.error('[updateSection] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar una sección
 */
export async function deleteSection(sectionId) {
  try {
    const supabase = await createClient();

    // Las fotos asociadas tendrán section_id = NULL automáticamente (ON DELETE SET NULL)
    const { error } = await supabase
      .from('photo_sections')
      .delete()
      .eq('id', sectionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[deleteSection] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reordenar secciones
 */
export async function reorderSections(galleryId, sectionOrders) {
  try {
    const supabase = await createClient();

    // sectionOrders es un array de { id, display_order }
    const updates = sectionOrders.map(({ id, display_order }) =>
      supabase
        .from('photo_sections')
        .update({ display_order })
        .eq('id', id)
        .eq('gallery_id', galleryId)
    );

    await Promise.all(updates);

    return { success: true };
  } catch (error) {
    console.error('[reorderSections] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Asignar fotos a una sección
 */
export async function assignPhotosToSection(photoIds, sectionId) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('photos')
      .update({ section_id: sectionId })
      .in('id', photoIds);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[assignPhotosToSection] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener fotos agrupadas por sección
 */
export async function getPhotosGroupedBySections(galleryId) {
  try {
    const supabase = await createClient();

    // Obtener todas las fotos con su sección
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*, section:photo_sections(*)')
      .eq('gallery_id', galleryId)
      .order('display_order', { ascending: true });

    if (photosError) throw photosError;

    // Obtener todas las secciones
    const { data: sections, error: sectionsError } = await supabase
      .from('photo_sections')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('display_order', { ascending: true });

    if (sectionsError) throw sectionsError;

    // Agrupar fotos por sección
    const grouped = {
      unsectioned: photos.filter(p => !p.section_id),
      sections: sections.map(section => ({
        ...section,
        photos: photos.filter(p => p.section_id === section.id)
      }))
    };

    return { success: true, data: grouped };
  } catch (error) {
    console.error('[getPhotosGroupedBySections] Error:', error);
    return { success: false, error: error.message };
  }
}
