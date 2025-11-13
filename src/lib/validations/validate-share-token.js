import { createClient } from '@/lib/server';

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

    if (shareError || !share) {
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
      // VENCIDO - Desactivar automáticamente
      await supabase
        .from('gallery_shares')
        .update({ is_active: false })
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
      console.error('Error incrementing views:', updateError);
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

    if (galleryError || !gallery) {
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
      await validateShareToken(token, gallery.id);
    }

    // 4. Obtener fotos
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', gallery.id)
      .order('display_order', { ascending: true });

    if (photosError) {
      console.error('Error fetching photos:', photosError);
    }

    return { 
      success: true, 
      gallery, 
      photos: photos || [] 
    };

  } catch (error) {
    console.error('Error getting gallery with token:', error);
    return { 
      success: false, 
      error: 'Error al cargar la galería' 
    };
  }
}

/**
 * Cron job / Tarea programada
 * 
 * Desactivar todos los enlaces vencidos
 * Ejecutar diariamente a medianoche
 */
export async function deactivateExpiredLinks() {
  try {
    const supabase = await createClient();

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('gallery_shares')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('expires_at', now)
      .select();

    if (error) throw error;

    console.log(`Desactivados ${data?.length || 0} enlaces vencidos`);

    return { 
      success: true, 
      deactivated: data?.length || 0 
    };

  } catch (error) {
    console.error('Error deactivating expired links:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
// 
}