/**
 * Utilidades de optimización de imágenes para cliente
 * Transforma URLs de Cloudinary para carga rápida
 */

/**
 * Transforma una URL de Cloudinary para optimización
 * Agrega transformaciones para reducir tamaño y mejorar carga
 *
 * @param {string} url - URL original de Cloudinary
 * @param {object} options - Opciones de transformación
 * @param {number} options.width - Ancho máximo (default: 400 para thumbnails)
 * @param {string} options.quality - Calidad (default: 'auto:good')
 * @param {string} options.format - Formato (default: 'auto' para webp/avif)
 * @returns {string} URL transformada
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const {
    width = 400,
    quality = 'auto:good',
    format = 'auto'
  } = options;

  // Si ya tiene transformaciones, no duplicar
  if (url.includes('/upload/w_') || url.includes('/upload/q_')) {
    return url;
  }

  // Construir transformación
  const transformation = `w_${width},q_${quality},f_${format},c_limit`;

  // Insertar transformación después de /upload/
  const transformedUrl = url.replace(
    '/upload/',
    `/upload/${transformation}/`
  );

  return transformedUrl;
}

/**
 * Obtiene URL optimizada para thumbnail de galería
 * Buena calidad visual, tamaño reducido para carga rápida
 */
export function getThumbnailUrl(url) {
  return getOptimizedImageUrl(url, {
    width: 600,
    quality: 'auto:good',
    format: 'auto'
  });
}

/**
 * Obtiene URL optimizada para preview mediano
 */
export function getPreviewUrl(url) {
  return getOptimizedImageUrl(url, {
    width: 800,
    quality: 'auto:good',
    format: 'auto'
  });
}

/**
 * Obtiene URL optimizada para vista completa (alta calidad)
 */
export function getFullUrl(url) {
  return getOptimizedImageUrl(url, {
    width: 1920,
    quality: 'auto:best',
    format: 'auto'
  });
}
