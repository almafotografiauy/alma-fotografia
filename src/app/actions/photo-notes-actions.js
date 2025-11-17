'use server';

import { createClient } from '@/lib/server';

/**
 * ============================================
 * SERVER ACTIONS - NOTAS EN FOTOS FAVORITAS
 * ============================================
 *
 * Acciones para que el fotógrafo agregue notas
 * en las fotos favoritas de los clientes
 */

/**
 * Agregar o actualizar nota en una foto
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} photoId - ID de la foto
 * @param {string} note - Texto de la nota
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function upsertPhotoNote(galleryId, photoId, note) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('photo_notes')
      .upsert(
        {
          gallery_id: galleryId,
          photo_id: photoId,
          note: note.trim(),
        },
        {
          onConflict: 'gallery_id,photo_id',
        }
      );

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[upsertPhotoNote] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar nota de una foto
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} photoId - ID de la foto
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePhotoNote(galleryId, photoId) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('photo_notes')
      .delete()
      .eq('gallery_id', galleryId)
      .eq('photo_id', photoId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[deletePhotoNote] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todas las notas de una galería
 *
 * @param {string} galleryId - ID de la galería
 * @returns {Promise<{success: boolean, notes?: object, error?: string}>}
 */
export async function getGalleryNotes(galleryId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('photo_notes')
      .select('photo_id, note')
      .eq('gallery_id', galleryId);

    if (error) throw error;

    // Convertir a objeto { photoId: note }
    const notesMap = {};
    data.forEach((item) => {
      notesMap[item.photo_id] = item.note;
    });

    return { success: true, notes: notesMap };
  } catch (error) {
    console.error('[getGalleryNotes] Error:', error);
    return { success: false, error: error.message };
  }
}
