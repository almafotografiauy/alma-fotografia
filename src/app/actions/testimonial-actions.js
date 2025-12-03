'use server';

import { createClient, createAdminClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { notifyTestimonialReceived } from '@/lib/notifications/notification-helpers';

/**
 * ============================================
 * SERVER ACTIONS - TESTIMONIOS DE GALERÍA
 * ============================================
 *
 * Acciones para que los clientes dejen testimonios/comentarios
 * sobre las galerías compartidas.
 */

/**
 * Crear un nuevo testimonio
 *
 * @param {Object} params
 * @param {string} params.galleryId - ID de la galería
 * @param {string} params.clientName - Nombre del cliente
 * @param {string} params.clientEmail - Email del cliente (para validar unicidad)
 * @param {string} params.message - Mensaje/testimonio
 * @param {number} [params.rating] - Calificación 1-5 (opcional)
 * @returns {Promise<{success: boolean, testimonial?: object, error?: string}>}
 */
export async function createTestimonial({ galleryId, clientName, clientEmail, message, rating = null }) {
  try {
    // Validaciones
    if (!galleryId || !clientName || !clientEmail || !message) {
      return {
        success: false,
        error: 'Todos los campos son requeridos',
      };
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return {
        success: false,
        error: 'El email no es válido',
      };
    }

    if (clientName.trim().length < 2) {
      return {
        success: false,
        error: 'El nombre debe tener al menos 2 caracteres',
      };
    }

    if (message.trim().length < 10) {
      return {
        success: false,
        error: 'El mensaje debe tener al menos 10 caracteres',
      };
    }

    if (rating !== null && (rating < 1 || rating > 5)) {
      return {
        success: false,
        error: 'La calificación debe ser entre 1 y 5',
      };
    }

    // Usar admin client para permitir testimonios de usuarios públicos sin sesión
    const supabase = createAdminClient();

    // Verificar que la galería existe y permite comentarios
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, allow_comments')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      return {
        success: false,
        error: 'Galería no encontrada',
      };
    }

    if (!gallery.allow_comments) {
      return {
        success: false,
        error: 'Esta galería no permite comentarios',
      };
    }

    // Verificar si el cliente ya envió un testimonio para esta galería
    const normalizedEmail = clientEmail.toLowerCase().trim();
    const { data: existingTestimonial } = await supabase
      .from('testimonials')
      .select('id')
      .eq('gallery_id', galleryId)
      .eq('client_email', normalizedEmail)
      .maybeSingle();

    if (existingTestimonial) {
      return {
        success: false,
        error: 'Ya has enviado un testimonio para esta galería',
      };
    }

    // Crear testimonio
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        gallery_id: galleryId,
        client_name: clientName.trim(),
        client_email: normalizedEmail,
        message: message.trim(),
        rating: rating,
      })
      .select()
      .single();

    if (error) throw error;

    // Enviar notificación (sin bloquear la respuesta)
    notifyTestimonialReceived(data.id).catch((err) => {
      console.error('[createTestimonial] Error enviando notificación:', err);
    });

    return {
      success: true,
      testimonial: data,
    };
  } catch (error) {
    console.error('[createTestimonial] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar si un cliente ya envió testimonio para una galería
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} clientEmail - Email del cliente
 * @returns {Promise<{success: boolean, hasTestimonial: boolean, error?: string}>}
 */
export async function checkClientTestimonial(galleryId, clientEmail) {
  try {
    if (!galleryId || !clientEmail) {
      return { success: false, hasTestimonial: false, error: 'Missing parameters' };
    }

    // Usar admin client para permitir check de usuarios públicos sin sesión
    const supabase = createAdminClient();
    const normalizedEmail = clientEmail.toLowerCase().trim();

    const { data, error } = await supabase
      .from('testimonials')
      .select('id')
      .eq('gallery_id', galleryId)
      .eq('client_email', normalizedEmail)
      .maybeSingle();

    if (error) throw error;

    return {
      success: true,
      hasTestimonial: !!data,
    };
  } catch (error) {
    console.error('[checkClientTestimonial] Error:', error);
    return { success: false, hasTestimonial: false, error: error.message };
  }
}

/**
 * Obtener testimonios de una galería
 *
 * @param {string} galleryId - ID de la galería
 * @returns {Promise<{success: boolean, testimonials?: array, error?: string}>}
 */
export async function getGalleryTestimonials(galleryId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('testimonials')
      .select('id, client_name, message, rating, created_at')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false});

    if (error) throw error;

    return {
      success: true,
      testimonials: data || [],
    };
  } catch (error) {
    console.error('[getGalleryTestimonials] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ============================================
 * DASHBOARD ACTIONS - GESTIÓN DE TESTIMONIOS
 * ============================================
 */

/**
 * Obtener TODOS los testimonios (para el dashboard)
 */
export async function getAllTestimonials() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('testimonials')
      .select(`
        id,
        client_name,
        client_email,
        message,
        rating,
        is_featured,
        created_at,
        gallery:galleries(id, title, slug)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      testimonials: data || [],
    };
  } catch (error) {
    console.error('[getAllTestimonials] Error:', error);
    return { success: false, error: error.message, testimonials: [] };
  }
}

/**
 * Marcar/desmarcar testimonio como destacado
 * Valida que no haya más de 10 destacados
 */
export async function toggleFeaturedTestimonial(testimonialId, isFeatured) {
  try {
    const supabase = await createClient();

    // Si se quiere marcar como destacado, verificar límite de 10
    if (isFeatured) {
      const { data: featured, error: countError } = await supabase
        .from('testimonials')
        .select('id')
        .eq('is_featured', true);

      if (countError) throw countError;

      if (featured && featured.length >= 10) {
        return {
          success: false,
          error: 'Ya hay 10 testimonios destacados. Desmarca uno primero.',
        };
      }
    }

    // Actualizar el testimonio
    const { data, error } = await supabase
      .from('testimonials')
      .update({ is_featured: isFeatured })
      .eq('id', testimonialId)
      .select()
      .single();

    if (error) throw error;

    // Revalidar landing page para que se actualice la lista de destacados
    revalidatePath('/');
    revalidatePath('/dashboard/testimonios');

    return {
      success: true,
      testimonial: data,
    };
  } catch (error) {
    console.error('[toggleFeaturedTestimonial] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar un testimonio
 */
export async function updateTestimonial(testimonialId, updates) {
  try {
    const supabase = await createClient();

    // Validar datos
    if (updates.client_name && updates.client_name.trim().length < 2) {
      return {
        success: false,
        error: 'El nombre debe tener al menos 2 caracteres',
      };
    }

    if (updates.message && updates.message.trim().length < 10) {
      return {
        success: false,
        error: 'El mensaje debe tener al menos 10 caracteres',
      };
    }

    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      return {
        success: false,
        error: 'La calificación debe ser entre 1 y 5',
      };
    }

    const { data, error } = await supabase
      .from('testimonials')
      .update(updates)
      .eq('id', testimonialId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      testimonial: data,
    };
  } catch (error) {
    console.error('[updateTestimonial] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar un testimonio
 */
export async function deleteTestimonial(testimonialId) {
  try {
    const supabase = await createClient();

    // Verificar que el testimonio existe antes de eliminar
    const { data: existing, error: checkError } = await supabase
      .from('testimonials')
      .select('id')
      .eq('id', testimonialId)
      .maybeSingle();

    if (checkError) {
      console.error('[deleteTestimonial] Check error:', checkError);
      throw checkError;
    }

    if (!existing) {
      return { success: false, error: 'Testimonio no encontrado' };
    }

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', testimonialId);

    if (error) {
      console.error('[deleteTestimonial] Delete error:', error);
      throw error;
    }

    // Revalidar caché
    revalidatePath('/dashboard/testimonios');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('[deleteTestimonial] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener testimonios destacados para la landing
 */
export async function getFeaturedTestimonials() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('testimonials')
      .select(`
        id,
        client_name,
        message,
        rating,
        created_at,
        gallery:galleries(title, slug)
      `)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return {
      success: true,
      testimonials: data || [],
    };
  } catch (error) {
    console.error('[getFeaturedTestimonials] Error:', error);
    return { success: false, error: error.message, testimonials: [] };
  }
}
