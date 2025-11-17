'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { deleteFolderFromCloudinary, deleteBatchFromCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { notifyGalleryArchived, notifyGalleryDeleted, notifyGalleryRestored } from '@/lib/notifications/notification-helpers';

/**
 * ============================================
 * SERVER ACTIONS - GESTIÓN DE GALERÍAS EN BATCH
 * ============================================
 * 
 * Acciones del servidor para manipular múltiples galerías a la vez.
 * Incluye: archivar, eliminar (con Cloudinary) y restaurar.
 * 
 * IMPORTANTE:
 * - Todas las acciones revalidan /dashboard/galerias
 * - deleteGalleries elimina carpetas completas de Cloudinary (más eficiente)
 * - archiveGalleries desactiva automáticamente enlaces compartidos
 */

// ============================================
// ARCHIVAR GALERÍAS
// ============================================

/**
 * Archivar múltiples galerías
 * 
 * - Marca archived_at con timestamp actual
 * - Desactiva todos los enlaces compartidos asociados
 * - No elimina datos de Supabase ni Cloudinary
 * 
 * @param {string[]} galleryIds - IDs de galerías a archivar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function archiveGalleries(galleryIds) {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Archivar galerías
    const { error: archiveError } = await supabase
      .from('galleries')
      .update({ archived_at: new Date().toISOString() })
      .in('id', galleryIds);

    if (archiveError) throw archiveError;

    // Desactivar enlaces compartidos (no crítico si falla)
    const { error: linksError } = await supabase
      .from('gallery_shares')
      .update({ is_active: false })
      .in('gallery_id', galleryIds);

    if (linksError) {
      console.error('[archiveGalleries] Error desactivando enlaces:', linksError);
    }

    // Enviar notificaciones para cada galería archivada
    for (const galleryId of galleryIds) {
      try {
        await notifyGalleryArchived(galleryId, user.id);
      } catch (notifyError) {
        console.error(`[archiveGalleries] Error en notificación para ${galleryId}:`, notifyError);
      }
    }

    revalidatePath('/dashboard/galerias');

    return { success: true };
  } catch (error) {
    console.error('[archiveGalleries] Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ELIMINAR GALERÍAS
// ============================================

/**
 * Eliminar permanentemente múltiples galerías
 *
 * ESTRATEGIA FAIL-SAFE MEJORADA:
 * - Eliminación explícita de fotos (NO depende de CASCADE)
 * - Si Cloudinary falla, NO elimina de BD (preserva registros)
 * - Evita archivos huérfanos consumiendo espacio
 * - Usuario puede reintentar la eliminación
 *
 * ORDEN DE OPERACIONES:
 * 1. Obtener todas las fotos de las galerías
 * 2. Eliminar fotos individuales de Cloudinary
 * 3. Eliminar registros de fotos en Supabase
 * 4. Eliminar carpetas completas de Cloudinary (galleries/{id}/)
 * 5. Eliminar portadas individuales (gallery-covers/)
 * 6. Eliminar enlaces compartidos (gallery_shares)
 * 7. Solo si TODO fue exitoso → Eliminar galerías de Supabase
 *
 * ATOMICIDAD:
 * - O se elimina todo (Cloudinary + BD) o nada
 * - Si falla en el medio, registros en BD quedan intactos
 * - Permite reintentar sin perder referencias
 *
 * @param {string[]} galleryIds - IDs de galerías a eliminar
 * @returns {Promise<{success: boolean, deletedFolders?: number, totalGalleries?: number, error?: string}>}
 */
export async function deleteGalleries(galleryIds) {
  try {
    const supabase = await createClient();

    // ==========================================
    // PASO 0: Obtener info de galerías para notificaciones
    // ==========================================
    const { data: galleries, error: galleriesError } = await supabase
      .from('galleries')
      .select('id, title, created_by')
      .in('id', galleryIds);

    if (galleriesError) {
      console.error('❌ Error obteniendo galerías:', galleriesError);
      throw new Error(`Error al obtener galerías: ${galleriesError.message}`);
    }

    // Guardar info para notificaciones (antes de eliminar)
    const galleryInfoForNotifications = galleries.map(g => ({
      title: g.title,
      userId: g.created_by
    }));

    // ==========================================
    // PASO 1: Obtener todas las fotos
    // ==========================================

    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, file_path, gallery_id')
      .in('gallery_id', galleryIds);

    if (photosError) {
      throw new Error(`Error al obtener fotos: ${photosError.message}`);
    }

    // ==========================================
    // PASO 2: Eliminar fotos de Cloudinary
    // ==========================================

    if (photos && photos.length > 0) {

      const photoPublicIds = photos
        .map(photo => {
          // Extraer public_id de la URL de Cloudinary
          // Ej: https://res.cloudinary.com/.../v1234/galleries/abc-123/foto-001.webp
          const match = photo.file_path.match(/\/v\d+\/(.+)\.\w+$/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      if (photoPublicIds.length > 0) {
        // Eliminar en lotes de 100 (límite de Cloudinary API)
        const BATCH_SIZE = 100;
        for (let i = 0; i < photoPublicIds.length; i += BATCH_SIZE) {
          const batch = photoPublicIds.slice(i, i + BATCH_SIZE);

          const photoResult = await deleteBatchFromCloudinary(batch);

          if (!photoResult.success) {
            throw new Error(`No se pudieron eliminar fotos: ${photoResult.error}`);
          }
        }
      }
    }

    // ==========================================
    // PASO 3: Eliminar registros de fotos en BD
    // ==========================================

    if (photos && photos.length > 0) {
      const { error: deletePhotosError } = await supabase
        .from('photos')
        .delete()
        .in('gallery_id', galleryIds);

      if (deletePhotosError) {
        throw new Error(`Error al eliminar fotos de BD: ${deletePhotosError.message}`);
      }
    }

    // ==========================================
    // PASO 4: Eliminar carpetas de Cloudinary
    // ==========================================

    const deleteFolderPromises = galleryIds.map(async (galleryId) => {
      const folderPath = `galleries/${galleryId}`;

      // Llamar directamente a la función de Cloudinary (no fetch)
      const result = await deleteFolderFromCloudinary(folderPath);

      if (!result.success) {
        throw new Error(`No se pudo eliminar carpeta ${folderPath}: ${result.error}`);
      }

      return {
        galleryId,
        success: true,
        deletedCount: result.deletedCount,
        iterations: result.iterations
      };
    });

    // Si CUALQUIER galería falla, se detiene todo con throw
    const deleteResults = await Promise.all(deleteFolderPromises);
    const totalFolderFilesDeleted = deleteResults.reduce((sum, r) => sum + (r.deletedCount || 0), 0);

    // ==========================================
    // PASO 5: Eliminar portadas (gallery-covers)
    // ==========================================

    const { data: galleriesWithCovers } = await supabase
      .from('galleries')
      .select('cover_image')
      .in('id', galleryIds);

    if (galleriesWithCovers && galleriesWithCovers.length > 0) {
      const coverPublicIds = galleriesWithCovers
        .filter(g => g.cover_image && g.cover_image.includes('gallery-covers'))
        .map(g => {
          // Regex: https://res.cloudinary.com/.../v1234/PUBLIC_ID.format
          const match = g.cover_image.match(/\/v\d+\/(.+)\.\w+$/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      if (coverPublicIds.length > 0) {
        // Llamar directamente a la función de Cloudinary
        const coverResult = await deleteBatchFromCloudinary(coverPublicIds);

        if (!coverResult.success) {
          throw new Error(`No se pudieron eliminar portadas: ${coverResult.error}`);
        }
      }
    }

    // ==========================================
    // PASO 6: Eliminar enlaces compartidos
    // ==========================================
    const { error: deleteSharesError } = await supabase
      .from('gallery_shares')
      .delete()
      .in('gallery_id', galleryIds);

    if (deleteSharesError) {
      throw new Error(`Error al eliminar enlaces: ${deleteSharesError.message}`);
    }

    // ==========================================
    // PASO 7: Eliminar galerías de Supabase
    // ==========================================

    // Solo llega aquí si TODO fue exitoso

    const { error: deleteError } = await supabase
      .from('galleries')
      .delete()
      .in('id', galleryIds);

    if (deleteError) {
      throw new Error(`Error al eliminar galerías de base de datos: ${deleteError.message}`);
    }

    // ==========================================
    // PASO 8: Enviar notificaciones
    // ==========================================
    for (const galleryInfo of galleryInfoForNotifications) {
      try {
        await notifyGalleryDeleted(galleryInfo.title, galleryInfo.userId);
      } catch (notifyError) {
        console.error(`Error enviando notificación para galería "${galleryInfo.title}":`, notifyError);
        // Continuar con las demás
      }
    }

    // Revalidar caché para actualizar UI
    revalidatePath('/dashboard/galerias');

    return {
      success: true,
      deletedFolders: deleteResults.length,
      totalGalleries: galleryIds.length,
      totalPhotos: photos?.length || 0,
      totalFilesDeleted: (photos?.length || 0) + totalFolderFilesDeleted,
    };

  } catch (error) {
    console.error('❌ Error en deleteGalleries:', error.message);

    return {
      success: false,
      error: `No se pudieron eliminar las galerías: ${error.message}. Los registros en la base de datos se preservaron para reintentar.`
    };
  }
}

// ============================================
// RESTAURAR GALERÍAS
// ============================================

/**
 * Restaurar múltiples galerías archivadas
 * 
 * - Marca archived_at como null
 * - Las galerías vuelven a aparecer en la lista principal
 * - NO reactiva enlaces compartidos (deben reactivarse manualmente)
 * 
 * @param {string[]} galleryIds - IDs de galerías a restaurar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function restoreGalleries(galleryIds) {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('galleries')
      .update({ archived_at: null })
      .in('id', galleryIds);

    if (error) throw error;

    // Enviar notificaciones para cada galería restaurada
    for (const galleryId of galleryIds) {
      try {
        await notifyGalleryRestored(galleryId, user.id);
      } catch (notifyError) {
        console.error(`Error enviando notificación para galería ${galleryId}:`, notifyError);
        // Continuar con las demás
      }
    }

    revalidatePath('/dashboard/galerias');

    return { success: true };
  } catch (error) {
    console.error('❌ Error restoring galleries:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ELIMINAR IMAGEN DE CLOUDINARY
// ============================================

/**
 * Server Action para eliminar imagen individual de Cloudinary
 *
 * Wrapper de deleteFromCloudinary para uso en Client Components
 *
 * @param {string} publicId - Public ID de Cloudinary
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteCloudinaryImage(publicId) {
  try {
    if (!publicId) {
      return { success: false, error: 'Public ID requerido' };
    }

    const result = await deleteFromCloudinary(publicId);
    return result;
  } catch (error) {
    console.error('❌ Error eliminando imagen de Cloudinary:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// LIMPIEZA DE FOTOS HUÉRFANAS
// ============================================

/**
 * Limpiar fotos huérfanas (fotos sin galería asociada)
 *
 * ESTRATEGIA:
 * 1. Buscar fotos cuyo gallery_id no existe en galleries
 * 2. Eliminar fotos de Cloudinary
 * 3. Eliminar registros de BD
 *
 * USO: Ejecutar manualmente desde dashboard o script de mantenimiento
 *
 * @returns {Promise<{success: boolean, cleanedPhotos?: number, error?: string}>}
 */
export async function cleanOrphanedPhotos() {
  try {
    const supabase = await createClient();

    // ==========================================
    // PASO 1: Encontrar fotos huérfanas
    // ==========================================

    // Obtener todas las fotos
    const { data: allPhotos, error: photosError } = await supabase
      .from('photos')
      .select('id, gallery_id, file_path');

    if (photosError) {
      throw new Error(`Error al obtener fotos: ${photosError.message}`);
    }

    // Obtener IDs de galerías existentes
    const { data: galleries, error: galleriesError } = await supabase
      .from('galleries')
      .select('id');

    if (galleriesError) {
      throw new Error(`Error al obtener galerías: ${galleriesError.message}`);
    }

    const galleryIds = new Set(galleries.map(g => g.id));

    // Filtrar fotos huérfanas
    const orphanedPhotos = allPhotos.filter(photo => !galleryIds.has(photo.gallery_id));

    if (orphanedPhotos.length === 0) {
      return {
        success: true,
        cleanedPhotos: 0,
        message: 'No se encontraron fotos huérfanas'
      };
    }

    // ==========================================
    // PASO 2: Eliminar de Cloudinary
    // ==========================================

    const photoPublicIds = orphanedPhotos
      .map(photo => {
        // Extraer public_id de la URL de Cloudinary
        const match = photo.file_path.match(/\/v\d+\/(.+)\.\w+$/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (photoPublicIds.length > 0) {
      // Eliminar en lotes de 100 (límite de Cloudinary API)
      const BATCH_SIZE = 100;
      for (let i = 0; i < photoPublicIds.length; i += BATCH_SIZE) {
        const batch = photoPublicIds.slice(i, i + BATCH_SIZE);

        const photoResult = await deleteBatchFromCloudinary(batch);

        if (!photoResult.success) {
          // Continuar con el siguiente batch
        }
      }
    }

    // ==========================================
    // PASO 3: Eliminar de BD
    // ==========================================

    const orphanedPhotoIds = orphanedPhotos.map(p => p.id);

    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .in('id', orphanedPhotoIds);

    if (deleteError) {
      throw new Error(`Error al eliminar fotos de BD: ${deleteError.message}`);
    }

    // Revalidar caché
    revalidatePath('/dashboard/galerias');

    return {
      success: true,
      cleanedPhotos: orphanedPhotos.length,
      message: `Se limpiaron ${orphanedPhotos.length} fotos huérfanas exitosamente`
    };

  } catch (error) {
    console.error('❌ Error en cleanOrphanedPhotos:', error.message);

    return {
      success: false,
      error: `No se pudieron limpiar las fotos huérfanas: ${error.message}`
    };
  }
}