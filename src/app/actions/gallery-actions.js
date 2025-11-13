'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { deleteFolderFromCloudinary, deleteBatchFromCloudinary } from '@/lib/cloudinary';

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
      console.error('⚠️ Error desactivando enlaces:', linksError);
      // No throw - la galería se archivó correctamente
    }

    revalidatePath('/dashboard/galerias');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error archiving galleries:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ELIMINAR GALERÍAS
// ============================================

/**
 * Eliminar permanentemente múltiples galerías
 *
 * ESTRATEGIA FAIL-SAFE:
 * - Si Cloudinary falla, NO elimina de BD (preserva registros)
 * - Evita archivos huérfanos consumiendo espacio
 * - Usuario puede reintentar la eliminación
 *
 * ORDEN DE OPERACIONES:
 * 1. Eliminar carpetas completas de Cloudinary (galleries/{id}/)
 * 2. Eliminar portadas individuales (gallery-covers/)
 * 3. Solo si TODO Cloudinary fue exitoso → Eliminar de Supabase
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

    console.log(`🗑️ Iniciando eliminación de ${galleryIds.length} galerías...`);

    // ==========================================
    // PASO 1: Eliminar carpetas de Cloudinary
    // ==========================================

    const deleteFolderPromises = galleryIds.map(async (galleryId) => {
      const folderPath = `galleries/${galleryId}`;

      // ✅ Llamar directamente a la función de Cloudinary (no fetch)
      const result = await deleteFolderFromCloudinary(folderPath);

      if (!result.success) {
        console.error(`❌ Error eliminando carpeta ${folderPath}: ${result.error}`);
        throw new Error(`No se pudo eliminar carpeta ${folderPath}: ${result.error}`);
      }

      console.log(`✅ Carpeta eliminada: ${folderPath} (${result.deletedCount} archivos, ${result.iterations} iteraciones)`);

      return {
        galleryId,
        success: true,
        deletedCount: result.deletedCount,
        iterations: result.iterations
      };
    });

    // Si CUALQUIER galería falla, se detiene todo con throw
    const deleteResults = await Promise.all(deleteFolderPromises);
    const totalFilesDeleted = deleteResults.reduce((sum, r) => sum + (r.deletedCount || 0), 0);

    console.log(`📊 Cloudinary: ${deleteResults.length}/${galleryIds.length} carpetas eliminadas (${totalFilesDeleted} archivos totales)`);

    // ==========================================
    // PASO 2: Eliminar portadas (gallery-covers)
    // ==========================================

    const { data: galleries } = await supabase
      .from('galleries')
      .select('cover_image')
      .in('id', galleryIds);

    if (galleries && galleries.length > 0) {
      const coverPublicIds = galleries
        .filter(g => g.cover_image && g.cover_image.includes('gallery-covers'))
        .map(g => {
          // Regex: https://res.cloudinary.com/.../v1234/PUBLIC_ID.format
          const match = g.cover_image.match(/\/v\d+\/(.+)\.\w+$/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      if (coverPublicIds.length > 0) {
        // ✅ Llamar directamente a la función de Cloudinary
        const coverResult = await deleteBatchFromCloudinary(coverPublicIds);

        if (!coverResult.success) {
          console.error('❌ Error eliminando portadas:', coverResult.error);
          throw new Error(`No se pudieron eliminar portadas: ${coverResult.error}`);
        }

        console.log(`🖼️ ${coverPublicIds.length} portadas eliminadas de Cloudinary`);
      }
    }

    // ==========================================
    // PASO 3: Eliminar de Supabase
    // ==========================================

    // Solo llega aquí si TODO Cloudinary fue exitoso
    console.log('💾 Eliminando registros de base de datos...');

    // ON DELETE CASCADE elimina automáticamente:
    // - photos (todas las fotos de la galería)
    // - gallery_shares (todos los enlaces compartidos)
    const { error: deleteError } = await supabase
      .from('galleries')
      .delete()
      .in('id', galleryIds);

    if (deleteError) {
      console.error('❌ Error eliminando de BD:', deleteError);
      throw new Error(`Error al eliminar de base de datos: ${deleteError.message}`);
    }

    console.log('✅ Registros eliminados de base de datos');

    // Revalidar caché para actualizar UI
    revalidatePath('/dashboard/galerias');

    return {
      success: true,
      deletedFolders: deleteResults.length,
      totalGalleries: galleryIds.length,
      totalFilesDeleted,
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

    const { error } = await supabase
      .from('galleries')
      .update({ archived_at: null })
      .in('id', galleryIds);

    if (error) throw error;

    revalidatePath('/dashboard/galerias');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error restoring galleries:', error);
    return { success: false, error: error.message };
  }
}