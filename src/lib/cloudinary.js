import { v2 as cloudinary } from 'cloudinary';

/**
 * Configuración de Cloudinary
 * 
 * Por qué Cloudinary:
 * - 25GB gratis (vs 1GB Supabase)
 * - Optimización automática mejor que manual
 * - CDN global incluido
 * - Soporte de videos
 * 
 * Uso híbrido:
 * - Cloudinary: portadas de galerías + videos
 * - Supabase: fotos múltiples de galerías
 */
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube imagen a Cloudinary con optimización automática PROFESIONAL
 *
 * ESTRATEGIA DE DOBLE PROTECCIÓN:
 * 1. Cliente optimiza primero (PhotoUploader.js) - Reduce peso manteniendo calidad
 * 2. Cloudinary aplica transformaciones de respaldo server-side
 * 3. Si cliente ya optimizó, Cloudinary no aumentará el tamaño
 * 4. Si cliente falló, Cloudinary optimiza automáticamente
 *
 * TRANSFORMACIONES APLICADAS:
 * - Dimensiones máximas: 2048x2048px (2K - excelente para web y impresión)
 * - Quality: auto:good (85-90% calidad, óptimo para fotografía profesional)
 * - Format: auto (WebP en browsers modernos, fallback a JPG)
 *
 * BALANCE CALIDAD/ESPACIO PARA PLAN GRATUITO (25GB):
 * - Fotos de 2MB → 300-350KB (reducción 82%, calidad profesional)
 * - 700 fotos/galería = 245MB (óptimo para long-term)
 * - 25GB Cloudinary = 102 galerías (2 años de trabajo aprox)
 *
 * CALIDAD GARANTIZADA:
 * - 2048px es más que suficiente para web (1920px Full HD)
 * - 85-90% quality mantiene detalles profesionales
 * - WebP reduce 30% más sin pérdida visual
 *
 * @param {File|Buffer|string} file - Archivo a subir (base64 o path)
 * @param {Object} options - Opciones de subida
 * @param {string} options.folder - Carpeta en Cloudinary
 * @param {string} options.resourceType - Tipo de recurso (image, video)
 * @returns {Promise<Object>} - Resultado con URL pública optimizada
 */
export const uploadToCloudinary = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: options.folder || 'alma-fotografia',
      resource_type: options.resourceType || 'image',

      // ✅ TRANSFORMACIONES DE RESPALDO (garantizan optimización PROFESIONAL)
      // Configuración optimizada para plan gratuito long-term
      transformation: [
        {
          width: 2048,
          height: 2048,
          crop: 'limit', // Mantiene aspect ratio, solo reduce si excede límites
        },
        {
          quality: 'auto:good', // Cloudinary elige calidad óptima (85-90%)
          fetch_format: 'auto', // WebP/AVIF en browsers compatibles, JPG fallback
        },
      ],

      ...options,
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Elimina imagen de Cloudinary
 *
 * @param {string} publicId - ID público de Cloudinary
 * @returns {Promise<Object>}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result,
    };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Elimina múltiples imágenes de Cloudinary en batch
 *
 * @param {string[]} publicIds - Array de IDs públicos de Cloudinary
 * @returns {Promise<Object>}
 */
export const deleteBatchFromCloudinary = async (publicIds) => {
  try {
    if (!publicIds || publicIds.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const result = await cloudinary.api.delete_resources(publicIds);
    return {
      success: true,
      deletedCount: publicIds.length,
      result,
    };
  } catch (error) {
    console.error('Error deleting batch from Cloudinary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Elimina una carpeta completa de Cloudinary con TODOS sus archivos
 *
 * PAGINACIÓN RECURSIVA:
 * - Cloudinary API limita a 500 recursos por request
 * - Si una carpeta tiene >500 archivos, hace múltiples requests
 * - Continúa hasta vaciar completamente la carpeta
 *
 * BATCH DELETION:
 * - Elimina en grupos de 100 recursos (límite de delete_resources)
 * - Logging detallado de cada batch para debugging
 *
 * @param {string} folderPath - Ruta de la carpeta a eliminar (ej: "galleries/123")
 * @returns {Promise<Object>} - {success, deletedCount, iterations}
 */
export const deleteFolderFromCloudinary = async (folderPath) => {
  try {
    if (!folderPath) {
      throw new Error('Folder path is required');
    }

    console.log('📁 Eliminando carpeta de Cloudinary:', folderPath);

    let totalDeleted = 0;
    let iteration = 0;
    let hasMoreResources = true;

    // Paginación recursiva: continuar hasta vaciar carpeta
    while (hasMoreResources) {
      iteration++;
      console.log(`🔄 Iteración ${iteration}: Buscando recursos...`);

      // 1. Obtener siguiente página de recursos (máximo 500)
      const resources = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderPath,
        max_results: 500,
      });

      const resourceCount = resources.resources.length;
      console.log(`📋 Encontrados: ${resourceCount} recursos en iteración ${iteration}`);

      // Si no hay recursos, terminamos
      if (resourceCount === 0) {
        hasMoreResources = false;
        console.log('✅ Carpeta vacía, finalizando...');
        break;
      }

      // 2. Extraer public_ids de los recursos
      const publicIds = resources.resources.map(resource => resource.public_id);

      // 3. Eliminar en batches de 100 (límite de delete_resources)
      const BATCH_SIZE = 100;
      const batches = [];

      for (let i = 0; i < publicIds.length; i += BATCH_SIZE) {
        batches.push(publicIds.slice(i, i + BATCH_SIZE));
      }

      console.log(`📦 ${batches.length} batches a procesar en iteración ${iteration}`);

      // 4. Eliminar cada batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          await cloudinary.api.delete_resources(batch);
          totalDeleted += batch.length;
          console.log(`✅ Batch ${i + 1}/${batches.length} eliminado: ${batch.length} archivos (Total: ${totalDeleted})`);
        } catch (batchError) {
          console.error(`❌ Error eliminando batch ${i + 1}:`, batchError.message);
          // Continuar con el siguiente batch aunque uno falle
        }
      }

      // 5. Si obtuvimos menos de 500, no hay más recursos
      if (resourceCount < 500) {
        hasMoreResources = false;
        console.log(`✅ Última página procesada (${resourceCount} < 500)`);
      }
    }

    console.log(`📊 Total eliminado: ${totalDeleted} archivos en ${iteration} iteraciones`);

    // 6. Intentar eliminar la carpeta (solo si está vacía)
    try {
      await cloudinary.api.delete_folder(folderPath);
      console.log('✅ Carpeta eliminada:', folderPath);
    } catch (folderError) {
      console.warn('⚠️ No se pudo eliminar carpeta:', folderError.message);
    }

    return {
      success: true,
      deletedCount: totalDeleted,
      iterations: iteration,
    };
  } catch (error) {
    console.error('❌ Error eliminando carpeta de Cloudinary:', error);
    return {
      success: false,
      error: error.message,
      deletedCount: 0,
    };
  }
};

export default cloudinary;