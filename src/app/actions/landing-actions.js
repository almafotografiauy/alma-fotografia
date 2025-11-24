'use server';

import { createClient } from '@/lib/server';

/**
 * Obtener testimonios destacados para landing
 */
export async function getFeaturedTestimonials() {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('testimonials')
      .select(`
        id,
        client_name,
        rating,
        comment,
        created_at,
        service_type:service_types(name, icon)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    return { success: true, testimonials: data || [] };
  } catch (error) {
    return { success: false, testimonials: [], error: error.message };
  }
}

/**
 * Obtener servicios con galerías públicas para mostrar en landing
 */
export async function getPublicGalleriesPreview() {
  try {
    const supabase = createClient();

    // Obtener todos los servicios activos
    const { data: services, error: servicesError } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (servicesError) throw servicesError;

    // Para cada servicio, obtener una galería pública con fotos
    const servicesWithGalleries = await Promise.all(
      (services || []).map(async (service) => {
        const { data: gallery } = await supabase
          .from('galleries')
          .select(`
            id,
            title,
            slug,
            description,
            cover_photo:gallery_photos!cover_photo_id(cloudinary_url, file_name),
            photos:gallery_photos(
              id,
              cloudinary_url,
              file_name,
              display_order
            )
          `)
          .eq('service_type_id', service.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...service,
          gallery: gallery || null
        };
      })
    );

    // Filtrar solo servicios que tienen al menos una galería pública
    const servicesWithPublicGalleries = servicesWithGalleries.filter(
      s => s.gallery !== null
    );

    return {
      success: true,
      services: servicesWithPublicGalleries
    };
  } catch (error) {
    return { success: false, services: [], error: error.message };
  }
}

/**
 * Obtener información del perfil para "Sobre Alma"
 */
export async function getProfileInfo() {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('full_name, instagram, facebook, tiktok')
      .eq('username', 'admin') // Perfil principal
      .single();

    if (error) throw error;

    return { success: true, profile: data };
  } catch (error) {
    return {
      success: false,
      profile: {
        full_name: 'Fernanda',
        instagram: '@almafotografiauy',
        facebook: 'Alma Fotografía',
        tiktok: '@almafotografiauy'
      }
    };
  }
}

/**
 * Crear una nueva reserva desde landing (público)
 */
export async function createPublicBooking({
  serviceTypeId,
  clientName,
  clientEmail,
  clientPhone,
  eventDate,
  eventTime,
  message
}) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        service_type_id: serviceTypeId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        event_date: eventDate,
        event_time: eventTime,
        notes: message,
        status: 'pending',
        is_private: false
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Enviar notificación al fotógrafo
    // TODO: Enviar email de confirmación al cliente

    return { success: true, booking: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
