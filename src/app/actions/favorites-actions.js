'use server';

import { createClient } from '@/lib/server';
import { notifyFavoritesSubmitted } from '@/lib/notifications/notification-helpers';
import { revalidatePath } from 'next/cache';

/**
 * ============================================
 * SERVER ACTIONS - FAVORITOS DE GALERÍA
 * ============================================
 *
 * Acciones para que los clientes seleccionen fotos favoritas
 * desde la vista pública de galerías compartidas.
 */

/**
 * Obtener favoritos de un cliente para una galería
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} clientEmail - Email del cliente
 * @returns {Promise<{success: boolean, favorites?: array, count?: number, error?: string}>}
 */
export async function getClientFavorites(galleryId, clientEmail) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('favorites')
      .select('id, photo_id, created_at')
      .eq('gallery_id', galleryId)
      .eq('client_email', clientEmail.toLowerCase().trim());

    if (error) throw error;

    return {
      success: true,
      favorites: data || [],
      count: data?.length || 0,
    };
  } catch (error) {
    console.error('[getClientFavorites] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle favorito (agregar o quitar)
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} photoId - ID de la foto
 * @param {string} clientEmail - Email del cliente
 * @param {number} maxFavorites - Límite de favoritos para esta galería
 * @param {string} clientName - Nombre del cliente (opcional)
 * @returns {Promise<{success: boolean, action?: string, error?: string}>}
 */
export async function toggleFavorite(galleryId, photoId, clientEmail, maxFavorites = 150, clientName = null) {
  try {
    const supabase = await createClient();
    const normalizedEmail = clientEmail.toLowerCase().trim();

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('gallery_id', galleryId)
      .eq('photo_id', photoId)
      .eq('client_email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      // Quitar de favoritos
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;

      // Revalidar todas las rutas relevantes
      revalidatePath('/dashboard/galerias');
      revalidatePath(`/dashboard/galerias/${galleryId}`);
      revalidatePath(`/dashboard/galerias/${galleryId}/favoritos`);

      return { success: true, action: 'removed' };
    } else {
      // Verificar límite antes de agregar
      const { data: currentFavorites, error: countError } = await supabase
        .from('favorites')
        .select('id', { count: 'exact' })
        .eq('gallery_id', galleryId)
        .eq('client_email', normalizedEmail);

      if (countError) throw countError;

      if (currentFavorites.length >= maxFavorites) {
        return {
          success: false,
          error: `Has alcanzado el límite de ${maxFavorites} fotos favoritas`,
        };
      }

      // Agregar a favoritos
      const insertData = {
        gallery_id: galleryId,
        photo_id: photoId,
        client_email: normalizedEmail,
      };

      // Agregar nombre si está disponible
      if (clientName) {
        insertData.client_name = clientName.trim();
      }

      const { error } = await supabase
        .from('favorites')
        .insert(insertData);

      if (error) throw error;

      // Revalidar todas las rutas relevantes
      revalidatePath('/dashboard/galerias');
      revalidatePath(`/dashboard/galerias/${galleryId}`);
      revalidatePath(`/dashboard/galerias/${galleryId}/favoritos`);

      return { success: true, action: 'added' };
    }
  } catch (error) {
    console.error('[toggleFavorite] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enviar selección completa de favoritos
 * (notifica al fotógrafo con información de cambios)
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} clientEmail - Email del cliente
 * @param {string} clientName - Nombre del cliente (opcional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitFavoritesSelection(galleryId, clientEmail, clientName = null) {
  try {
    const supabase = await createClient();
    const normalizedEmail = clientEmail.toLowerCase().trim();

    // Obtener favoritos actuales (incluyendo client_name si existe)
    const { data: currentFavorites, error: favError } = await supabase
      .from('favorites')
      .select('photo_id, client_name')
      .eq('gallery_id', galleryId)
      .eq('client_email', normalizedEmail);

    if (favError) throw favError;

    const currentPhotoIds = currentFavorites.map(f => f.photo_id);
    const currentCount = currentPhotoIds.length;

    // Obtener el nombre del cliente (de los favoritos existentes o del parámetro)
    const resolvedClientName = clientName || currentFavorites[0]?.client_name || null;

    if (currentCount === 0) {
      return {
        success: false,
        error: 'No has seleccionado ninguna foto favorita',
      };
    }

    // Obtener la última submission del cliente para detectar cambios
    const { data: lastSubmission } = await supabase
      .from('favorites_submissions')
      .select('photo_ids, is_first_submission')
      .eq('gallery_id', galleryId)
      .eq('client_email', normalizedEmail)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Detectar si es primera vez
    const isFirstSubmission = !lastSubmission;
    const previousPhotoIds = lastSubmission?.photo_ids || [];

    // Calcular cambios
    const addedPhotos = currentPhotoIds.filter(id => !previousPhotoIds.includes(id));
    const removedPhotos = previousPhotoIds.filter(id => !currentPhotoIds.includes(id));
    const addedCount = addedPhotos.length;
    const removedCount = removedPhotos.length;

    // Guardar esta submission
    const submissionData = {
      gallery_id: galleryId,
      client_email: normalizedEmail,
      photo_ids: currentPhotoIds,
      total_count: currentCount,
      is_first_submission: isFirstSubmission,
      added_count: addedCount,
      removed_count: removedCount,
    };

    if (resolvedClientName) {
      submissionData.client_name = resolvedClientName;
    }

    const { error: submissionError } = await supabase
      .from('favorites_submissions')
      .insert(submissionData);

    if (submissionError) {
      // No crítico si falla
    }

    // Registrar en el historial de forma agrupada
    let actionType = 'submitted';
    if (isFirstSubmission) {
      actionType = 'added';
    } else if (addedCount > 0 && removedCount > 0) {
      actionType = 'edited';
    } else if (addedCount > 0) {
      actionType = 'added';
    } else if (removedCount > 0) {
      actionType = 'removed';
    }

    const historyData = {
      gallery_id: galleryId,
      client_email: normalizedEmail,
      action_type: actionType,
      photo_count: currentCount,
      added_count: addedCount,
      removed_count: removedCount,
    };

    if (resolvedClientName) {
      historyData.client_name = resolvedClientName;
    }

    const { error: historyError } = await supabase
      .from('favorites_history')
      .insert(historyData);

    if (historyError) {
      // No crítico si falla
    }

    // Obtener datos de la galería
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, title, created_by, client_email, notify_on_favorites')
      .eq('id', galleryId)
      .single();

    if (galleryError) throw galleryError;

    // Enviar notificación solo si está habilitada
    if (gallery.notify_on_favorites) {
      await notifyFavoritesSubmitted(
        galleryId,
        normalizedEmail,
        currentCount,
        isFirstSubmission,
        addedCount,
        removedCount,
        resolvedClientName
      );
    }

    // Revalidar todas las rutas relevantes
    revalidatePath('/dashboard/galerias');
    revalidatePath(`/dashboard/galerias/${galleryId}`);
    revalidatePath(`/dashboard/galerias/${galleryId}/favoritos`);

    return {
      success: true,
      count: currentCount,
      isFirstSubmission,
      addedCount,
      removedCount,
    };
  } catch (error) {
    console.error('[submitFavoritesSelection] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar si ya existe un cliente con favoritos en esta galería
 * Útil para evitar que se creen múltiples clientes por galería
 *
 * @param {string} galleryId - ID de la galería
 * @returns {Promise<{success: boolean, existingClient?: {email: string, name: string, count: number}, error?: string}>}
 */
export async function checkExistingFavoritesClient(galleryId) {
  try {
    const supabase = await createClient();

    // Buscar si hay favoritos en esta galería (de cualquier cliente)
    const { data, error } = await supabase
      .from('favorites')
      .select('client_email, client_name')
      .eq('gallery_id', galleryId)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      // Contar cuántos favoritos tiene ese cliente
      const { count } = await supabase
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .eq('gallery_id', galleryId)
        .eq('client_email', data[0].client_email);

      return {
        success: true,
        existingClient: {
          email: data[0].client_email,
          name: data[0].client_name || '',
          count: count || 0,
        },
      };
    }

    return { success: true, existingClient: null };
  } catch (error) {
    console.error('[checkExistingFavoritesClient] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Limpiar favoritos de un cliente (reiniciar selección)
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} clientEmail - Email del cliente
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function clearClientFavorites(galleryId, clientEmail) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('gallery_id', galleryId)
      .eq('client_email', clientEmail.toLowerCase().trim());

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[clearClientFavorites] Error:', error);
    return { success: false, error: error.message };
  }
}
