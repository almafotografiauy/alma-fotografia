'use server';

/**
 * Server Actions para Landing Page
 *
 * Estas funciones se ejecutan en el servidor y son llamadas desde
 * componentes Server o Client según sea necesario.
 */

import { createClient } from '@/lib/server';

/**
 * Obtener testimonios destacados para mostrar en landing
 * Filtra por is_featured = true AND is_active = true
 */
export async function getFeaturedTestimonials() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('testimonials')
      .select(`
        id,
        client_name,
        rating,
        comment,
        created_at,
        service_type:service_types(name, icon_name)
      `)
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    return { success: true, testimonials: data || [] };
  } catch (error) {
    console.error('Error fetching featured testimonials:', error);
    return { success: false, testimonials: [], error: error.message };
  }
}

/**
 * Obtener servicios con galerías públicas para preview
 * Filtra por is_public = true
 */
export async function getPublicGalleriesPreview() {
  try {
    const supabase = await createClient();

    // 1. Obtener todos los servicios activos
    const { data: services, error: servicesError } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (servicesError) throw servicesError;

    // 2. Para cada servicio, obtener UNA galería pública (la más reciente)
    const servicesWithGalleries = await Promise.all(
      (services || []).map(async (service) => {
        const { data: gallery } = await supabase
          .from('galleries')
          .select(`
            id,
            title,
            slug,
            description,
            cover_image,
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

    // 3. Filtrar solo servicios que tengan al menos una galería pública
    const servicesWithPublicGalleries = servicesWithGalleries.filter(
      s => s.gallery !== null
    );

    return {
      success: true,
      services: servicesWithPublicGalleries
    };
  } catch (error) {
    console.error('Error fetching public galleries:', error);
    return { success: false, services: [], error: error.message };
  }
}

/**
 * Obtener información del perfil para "Sobre Alma" y Footer
 */
export async function getProfileInfo() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('username', 'admin') // Perfil principal de Fernanda
      .single();

    if (error) throw error;

    return {
      success: true,
      profile: {
        full_name: data?.full_name || 'Fernanda'
      }
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    // Fallback con datos por defecto si falla
    return {
      success: false,
      profile: {
        full_name: 'Fernanda'
      }
    };
  }
}

/**
 * Obtener lista de servicios activos para el formulario
 */
export async function getActiveServices() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('service_types')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return { success: true, services: data || [] };
  } catch (error) {
    console.error('Error fetching services:', error);
    return { success: false, services: [], error: error.message };
  }
}
