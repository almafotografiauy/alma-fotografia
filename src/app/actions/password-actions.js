'use server';

import { createClient } from '@/lib/server';

/**
 * Validar contraseña de galería compartida
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} password - Contraseña ingresada
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function validateGalleryPassword(galleryId, password) {
  try {
    if (!password || !password.trim()) {
      return {
        success: false,
        error: 'La contraseña es requerida',
      };
    }

    const supabase = await createClient();

    // Obtener la contraseña de la galería
    const { data: gallery, error } = await supabase
      .from('galleries')
      .select('password')
      .eq('id', galleryId)
      .single();

    if (error || !gallery) {
      console.error('Error fetching gallery:', error);
      return {
        success: false,
        error: 'Error al verificar la contraseña',
      };
    }

    // Si no tiene contraseña configurada, permitir acceso
    if (!gallery.password) {
      return { success: true };
    }

    // Comparar contraseñas (simple string comparison)
    // En producción podrías usar bcrypt, pero para este caso es suficiente
    if (password.trim() === gallery.password.trim()) {
      return { success: true };
    }

    return {
      success: false,
      error: 'Contraseña incorrecta',
    };

  } catch (error) {
    console.error('Error validating password:', error);
    return {
      success: false,
      error: 'Error al verificar la contraseña',
    };
  }
}
