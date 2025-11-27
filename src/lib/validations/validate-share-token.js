import { createClient } from '@/lib/server';
import { notifyLinkExpired } from '@/lib/notifications/notification-helpers';

/**
 * Validar token de galería compartida
 * 
 * Verifica que:
 * 1. El token existe
 * 2. Está activo (is_active = true)
 * 3. No ha vencido (expires_at > now)
 * 4. Incrementa el contador de vistas
 * 5. Desactiva automáticamente si venció
 * 
 * @param {string} token - Token de compartir
 * @param {string} galleryId - ID de la galería
 * @returns {Promise<{valid: boolean, share?: object, error?: string}>}
 */
export async function validateShareToken(token, galleryId) {
  try {
    const supabase = await createClient();

    // 1. Buscar el share
    const { data: share, error: shareError } = await supabase
      .from('gallery_shares')
      .select('*')
      .eq('share_token', token)
      .eq('gallery_id', galleryId)
      .single();

    // Si la tabla no existe o hay error de relación
    if (shareError) {
      // Error 42P01 = tabla no existe
      if (shareError.code === '42P01' || shareError.message?.includes('does not exist')) {
        return {
          valid: false,
          error: 'Sistema de compartir no configurado. Contacta al administrador.'
        };
      }

      return {
        valid: false,
        error: 'Token inválido o no encontrado'
      };
    }

    if (!share) {
      return {
        valid: false,
        error: 'Token inválido o no encontrado'
      };
    }

    // 2. Verificar si está activo
    if (!share.is_active) {
      return {
        valid: false,
        error: 'Este enlace ha sido desactivado'
      };
    }

    // 3. Verificar si expiró
    const now = new Date();
    const expiresAt = new Date(share.expires_at);

    if (expiresAt <= now) {
      // VENCIDO - Eliminar automáticamente
      await supabase
        .from('gallery_shares')
        .delete()
        .eq('id', share.id);

      return {
        valid: false,
        error: 'Este enlace ha expirado'
      };
    }

    // 4. Incrementar vistas en gallery_shares
    const { error: updateError } = await supabase
      .from('gallery_shares')
      .update({
        views_count: (share.views_count || 0) + 1,
      })
      .eq('id', share.id);

    if (updateError) {
      // No crítico si falla
    }

    return {
      valid: true,
      share: {
        ...share,
        views_count: (share.views_count || 0) + 1,
      }
    };

  } catch (error) {
    console.error('Error validating share token:', error);
    return {
      valid: false,
      error: 'Error al validar el enlace'
    };
  }
}

/**
 * Obtener galería con validación de token
 * 
 * Úsalo en la página de galería pública
 */
export async function getGalleryWithToken(slug, token) {
  try {
    const supabase = await createClient();

    // 1. Obtener galería
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select(`
        *,
        service_types (
          name,
          slug,
          icon_name
        )
      `)
      .eq('slug', slug)
      .single();

    if (galleryError) {
      return {
        success: false,
        error: 'Galería no encontrada'
      };
    }

    if (!gallery) {
      return {
        success: false,
        error: 'Galería no encontrada'
      };
    }

    // 2. Verificar si está archivada
    if (gallery.archived_at) {
      return {
        success: false,
        error: 'Esta galería ha sido archivada'
      };
    }

    // 3. Si no es pública, validar token
    if (!gallery.is_public) {
      if (!token) {
        return {
          success: false,
          error: 'Esta galería requiere un enlace válido'
        };
      }

      const validation = await validateShareToken(token, gallery.id);

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }
    } else if (token) {
      // Si es pública PERO tiene token, también incrementar vistas
      try {
        await validateShareToken(token, gallery.id);
      } catch (err) {
        // Si falla validar el token pero la galería es pública, continuar de todas formas
      }
    }

    // 4. Obtener fotos con sus secciones
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select(`
        *,
        section:photo_sections(*)
      `)
      .eq('gallery_id', gallery.id)
      .order('display_order', { ascending: true });

    if (photosError) {
      // No fallar si no hay fotos, devolver array vacío
    }

    // 5. Obtener todas las secciones de la galería
    const { data: sections, error: sectionsError } = await supabase
      .from('photo_sections')
      .select('*')
      .eq('gallery_id', gallery.id)
      .order('display_order', { ascending: true });

    if (sectionsError) {
      // No fallar si no hay secciones
    }

    return {
      success: true,
      gallery,
      photos: photos || [],
      sections: sections || []
    };

  } catch (error) {
    console.error('Error getting gallery with token:', error);
    return {
      success: false,
      error: error.message || 'Error al cargar la galería'
    };
  }
}

/**
 * Cron job / Tarea programada
 *
 * Eliminar todos los enlaces vencidos
 * Ejecutar diariamente a medianoche
 */
export async function deactivateExpiredLinks() {
  try {
    const supabase = await createClient();

    const now = new Date().toISOString();

    // 1. Primero obtener los enlaces vencidos (para enviar notificaciones)
    const { data: expiredLinks, error: fetchError } = await supabase
      .from('gallery_shares')
      .select('*')
      .eq('is_active', true)
      .lt('expires_at', now);

    if (fetchError) throw fetchError;

    // 2. Enviar notificaciones para cada enlace expirado ANTES de eliminar
    if (expiredLinks && expiredLinks.length > 0) {
      for (const share of expiredLinks) {
        try {
          await notifyLinkExpired(share.id);
        } catch (notifyError) {
          console.error(`Error enviando notificación para share ${share.id}:`, notifyError);
          // Continuar con los demás
        }
      }
    }

    // 3. Eliminar los enlaces vencidos
    const { error: deleteError } = await supabase
      .from('gallery_shares')
      .delete()
      .eq('is_active', true)
      .lt('expires_at', now);

    if (deleteError) throw deleteError;

    return {
      success: true,
      deleted: expiredLinks?.length || 0
    };

  } catch (error) {
    console.error('Error deleting expired links:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtener galería pública por slug (sin token)
 * Solo funciona para galerías con is_public = true
 *
 * @param {string} slug - Slug de la galería
 * @returns {Promise<{success: boolean, gallery?: object, photos?: array, sections?: array, error?: string}>}
 */
export async function getPublicGallery(slug) {
  try {
    const supabase = await createClient();

    // 1. Obtener galería pública
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('*')
      .eq('slug', slug)
      .eq('is_public', true)
      .maybeSingle();

    if (galleryError) {
      console.error('[getPublicGallery] Gallery error:', galleryError);
      return { success: false, error: 'Error al cargar la galería' };
    }

    if (!gallery) {
      return { success: false, error: 'Galería no encontrada o no es pública' };
    }

    // 2. Obtener fotos
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select(`
        *,
        section:photo_sections(*)
      `)
      .eq('gallery_id', gallery.id)
      .order('display_order', { ascending: true });

    if (photosError) {
      console.error('[getPublicGallery] Photos error:', photosError);
    }

    // 3. Obtener secciones
    const { data: sections, error: sectionsError } = await supabase
      .from('photo_sections')
      .select('*')
      .eq('gallery_id', gallery.id)
      .order('display_order', { ascending: true });

    if (sectionsError) {
      console.error('[getPublicGallery] Sections error:', sectionsError);
    }

    return {
      success: true,
      gallery,
      photos: photos || [],
      sections: sections || []
    };

  } catch (error) {
    console.error('[getPublicGallery] Error:', error);
    return {
      success: false,
      error: error.message || 'Error al cargar la galería'
    };
  }
}