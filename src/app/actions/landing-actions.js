'use server';

import { createAdminClient } from '@/lib/server';

/**
 * Obtener testimonios destacados para landing
 * Usa admin client para acceso público sin sesión
 */
export async function getFeaturedTestimonials() {
  try {
    const supabase = createAdminClient();

    // Obtener testimonios destacados (is_featured = true)
    // Nota: Solo con is_featured es suficiente, ya que el admin los marca manualmente
    const { data: testimonials, error: testimonialsError } = await supabase
      .from('testimonials')
      .select('id, client_name, rating, message, created_at, gallery_id')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (testimonialsError) {
      throw testimonialsError;
    }

    // Si no hay testimonios, retornar array vacío
    if (!testimonials || testimonials.length === 0) {
      return { success: true, testimonials: [] };
    }

    // Obtener las galerías para los testimonios
    const galleryIds = [...new Set(testimonials.map(t => t.gallery_id).filter(Boolean))];

    let galleriesMap = {};
    if (galleryIds.length > 0) {
      const { data: galleries } = await supabase
        .from('galleries')
        .select('id, service_type')
        .in('id', galleryIds);

      if (galleries) {
        // Obtener los slugs de service_type para buscar los nombres
        const serviceTypeSlugs = [...new Set(galleries.map(g => g.service_type).filter(Boolean))];

        let serviceTypesMap = {};
        if (serviceTypeSlugs.length > 0) {
          const { data: serviceTypes } = await supabase
            .from('service_types')
            .select('slug, name')
            .in('slug', serviceTypeSlugs);

          if (serviceTypes) {
            serviceTypesMap = serviceTypes.reduce((acc, st) => {
              acc[st.slug] = st;
              return acc;
            }, {});
          }
        }

        galleriesMap = galleries.reduce((acc, g) => {
          acc[g.id] = {
            service_type: g.service_type ? serviceTypesMap[g.service_type] : null
          };
          return acc;
        }, {});
      }
    }

    // Transformar datos para que coincidan con lo que espera el componente
    const formattedTestimonials = testimonials.map(t => ({
      id: t.id,
      client_name: t.client_name,
      rating: t.rating,
      comment: t.message, // Renombrar 'message' a 'comment' para el componente
      created_at: t.created_at,
      service_type: t.gallery_id && galleriesMap[t.gallery_id]
        ? galleriesMap[t.gallery_id].service_type
        : null
    }));

    return { success: true, testimonials: formattedTestimonials };
  } catch (error) {
    return { success: false, testimonials: [], error: error.message };
  }
}

/**
 * Obtener servicios con galerías públicas para mostrar en landing
 */
export async function getPublicGalleriesPreview() {
  try {
    const supabase = createAdminClient();

    // Obtener todos los servicios
    const { data: services, error: servicesError } = await supabase
      .from('service_types')
      .select('*')
      .order('name', { ascending: true });

    if (servicesError) {
      throw servicesError;
    }

    // Para cada servicio, obtener una galería pública con fotos
    const servicesWithGalleries = await Promise.all(
      (services || []).map(async (service) => {
        const { data: gallery, error: galleryError } = await supabase
          .from('galleries')
          .select(`
            id,
            title,
            slug,
            description,
            cover_image,
            photos(
              id,
              file_path,
              file_name,
              display_order,
              is_cover
            )
          `)
          .eq('service_type', service.slug)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (galleryError) {
          // Error obteniendo galería, continuar con siguiente servicio
        }

        // Si no hay cover_image pero hay fotos, usar la foto marcada como cover o la primera
        if (gallery && !gallery.cover_image && gallery.photos && gallery.photos.length > 0) {
          const coverPhoto = gallery.photos.find(p => p.is_cover) || gallery.photos[0];
          gallery.cover_image = coverPhoto.file_path;
        }

        // Por ahora solo retornamos la galería, el enlace se maneja al hacer click
        // en "Ver Galería"

        return {
          ...service,
          gallery: gallery || null
        };
      })
    );

    // Filtrar solo servicios que tienen al menos una galería pública
    const servicesWithPublicGalleries = servicesWithGalleries.filter(
      s => s.gallery !== null && s.gallery.photos && s.gallery.photos.length > 0
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
    const supabase = createAdminClient();

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
 * Obtener o crear un enlace compartido permanente para una galería de landing
 * Si ya existe un enlace activo y permanente, lo devuelve
 * Si no existe, crea uno nuevo con duración de 1 año
 */
export async function getOrCreateLandingGalleryLink(galleryId, gallerySlug) {
  try {
    const supabase = createAdminClient();

    // Buscar enlace existente activo para esta galería
    // Buscamos enlaces con expiración mayor a 300 días (considerados "permanentes" para landing)
    const { data: existingShare } = await supabase
      .from('gallery_shares')
      .select('share_token, expires_at')
      .eq('gallery_id', galleryId)
      .eq('is_active', true)
      .gte('expires_at', new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString()) // Más de 300 días
      .maybeSingle();

    if (existingShare) {
      // Ya existe un enlace válido, devolverlo con parámetro preview
      const url = `/galeria/${gallerySlug}?token=${existingShare.share_token}&preview=true`;
      return { success: true, url, token: existingShare.share_token, isNew: false };
    }

    // No existe, crear uno nuevo con duración de 1 año (360 días)
    const token = `${crypto.randomUUID()}-${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 360); // 1 año

    // Obtener la galería para acceder al created_by del owner
    const { data: galleryData } = await supabase
      .from('galleries')
      .select('created_by')
      .eq('id', galleryId)
      .single();

    if (!galleryData?.created_by) {
      throw new Error('No se pudo obtener el creador de la galería');
    }

    const { error: insertError } = await supabase
      .from('gallery_shares')
      .insert({
        gallery_id: galleryId,
        share_token: token,
        created_by: galleryData.created_by,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        views_count: 0
      });

    if (insertError) throw insertError;

    const url = `/galeria/${gallerySlug}?token=${token}&preview=true`;
    return { success: true, url, token, isNew: true };

  } catch (error) {
    return { success: false, error: error.message };
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
    const supabase = createAdminClient();

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

    return { success: true, booking: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
