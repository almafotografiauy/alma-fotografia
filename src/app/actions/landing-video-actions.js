'use server';

import { createClient, createAdminClient } from '@/lib/server';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generar firma para upload directo desde el cliente
 */
export async function getCloudinarySignature() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    // Verificar cantidad de videos (máximo 2)
    const { data: existingVideos } = await supabase
      .from('landing_videos')
      .select('id')
      .limit(3);

    if (existingVideos && existingVideos.length >= 2) {
      return { success: false, error: 'Ya tienes 2 videos. Elimina uno para subir otro.' };
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'alma-fotografia/landing-videos';

    // Generar firma para upload seguro
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    return {
      success: true,
      signature,
      timestamp,
      folder,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    };
  } catch (error) {
    console.error('[getCloudinarySignature] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Guardar video en BD después de subirlo a Cloudinary desde el cliente
 */
export async function saveLandingVideo({ videoUrl, publicId, title = '', description = '' }) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    // Generar URL de thumbnail
    const thumbnailUrl = cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [{ width: 640, crop: 'scale' }]
    });

    // Obtener el orden para el nuevo video
    const { data: lastVideo } = await supabase
      .from('landing_videos')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const newOrder = (lastVideo?.display_order || 0) + 1;

    // Guardar en base de datos
    const { data, error } = await supabase
      .from('landing_videos')
      .insert({
        title: title.trim() || null,
        description: description.trim() || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        cloudinary_public_id: publicId,
        display_order: newOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, video: data };
  } catch (error) {
    console.error('[saveLandingVideo] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todos los videos de la landing (para admin)
 */
export async function getLandingVideos() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('landing_videos')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { success: true, videos: data || [] };
  } catch (error) {
    console.error('[getLandingVideos] Error:', error);
    return { success: false, error: error.message, videos: [] };
  }
}

/**
 * Obtener videos activos para la landing pública
 */
export async function getActiveLandingVideos() {
  try {
    // Usar admin client para bypasear RLS en contexto público
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('landing_videos')
      .select('id, title, description, video_url, thumbnail_url')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(2);

    if (error) throw error;

    return { success: true, videos: data || [] };
  } catch (error) {
    console.error('[getActiveLandingVideos] Error:', error);
    return { success: false, error: error.message, videos: [] };
  }
}

/**
 * Subir video a Cloudinary
 * @param {FormData} formData - FormData con el archivo de video
 */
export async function uploadLandingVideo(formData) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    // Verificar cantidad de videos (máximo 2)
    const { data: existingVideos } = await supabase
      .from('landing_videos')
      .select('id')
      .limit(3);

    if (existingVideos && existingVideos.length >= 2) {
      return { success: false, error: 'Ya tienes 2 videos. Elimina uno para subir otro.' };
    }

    const file = formData.get('video');
    const title = formData.get('title') || '';
    const description = formData.get('description') || '';

    if (!file) {
      return { success: false, error: 'No se proporcionó archivo' };
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Cloudinary sin transformaciones síncronas (videos grandes)
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'alma-fotografia/landing-videos',
          // Sin transformaciones síncronas para evitar timeout
          // Las optimizaciones se aplican automáticamente en la entrega
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    // Generar URL de thumbnail desde el video subido
    const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [{ width: 640, crop: 'scale' }]
    });

    // Obtener el orden para el nuevo video
    const { data: lastVideo } = await supabase
      .from('landing_videos')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const newOrder = (lastVideo?.display_order || 0) + 1;

    // Guardar en base de datos
    const { data, error } = await supabase
      .from('landing_videos')
      .insert({
        title: title.trim() || null,
        description: description.trim() || null,
        video_url: uploadResult.secure_url,
        thumbnail_url: thumbnailUrl,
        cloudinary_public_id: uploadResult.public_id,
        display_order: newOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, video: data };
  } catch (error) {
    console.error('[uploadLandingVideo] Error:', error);

    // Manejar error de tamaño de Cloudinary
    if (error.http_code === 413 || error.message?.includes('413')) {
      return {
        success: false,
        error: 'El video es demasiado grande. El máximo permitido es 100MB.'
      };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Actualizar datos de un video
 */
export async function updateLandingVideo(videoId, updates) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    const { data, error } = await supabase
      .from('landing_videos')
      .update({
        title: updates.title?.trim() || null,
        description: updates.description?.trim() || null,
        is_active: updates.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, video: data };
  } catch (error) {
    console.error('[updateLandingVideo] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar video
 */
export async function deleteLandingVideo(videoId) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    // Obtener datos del video para eliminar de Cloudinary
    const { data: video, error: fetchError } = await supabase
      .from('landing_videos')
      .select('cloudinary_public_id')
      .eq('id', videoId)
      .single();

    if (fetchError) throw fetchError;

    // Eliminar de Cloudinary
    if (video?.cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(video.cloudinary_public_id, {
          resource_type: 'video'
        });
      } catch (cloudinaryError) {
        console.error('[deleteLandingVideo] Cloudinary error:', cloudinaryError);
        // Continuar con la eliminación de la BD aunque falle Cloudinary
      }
    }

    // Eliminar de base de datos
    const { error } = await supabase
      .from('landing_videos')
      .delete()
      .eq('id', videoId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[deleteLandingVideo] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reordenar videos
 */
export async function reorderLandingVideos(videoIds) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    // Actualizar orden de cada video
    for (let i = 0; i < videoIds.length; i++) {
      const { error } = await supabase
        .from('landing_videos')
        .update({ display_order: i, updated_at: new Date().toISOString() })
        .eq('id', videoIds[i]);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[reorderLandingVideos] Error:', error);
    return { success: false, error: error.message };
  }
}
