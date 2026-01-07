import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ProtectedGalleryWrapper from '@/components/public/ProtectedGalleryWrapper';
import PublicGallerySkeleton from '@/components/public/PublicGallerySkeleton';
import { getGalleryWithToken, getPublicGallery } from '@/lib/validations/validate-share-token';
import { createClient, createAdminClient } from '@/lib/server';
import { formatDateWithoutTimezone } from '@/lib/date-utils';

/**
 * Página pública de galería compartida
 * 
 * Arquitectura:
 * - Server Component para fetch de datos
 * - Validación de token en servidor (seguridad)
 * - ISR para cachear páginas (performance)
 * - Suspense para streaming (UX)
 * 
 * Flujo:
 * 1. Validar token con getGalleryWithToken()
 * 2. Obtener galería + fotos
 * 3. Trackear vista automáticamente
 * 4. Renderizar vista pública
 */

/**
 * ISR - Cachea la página por 5 minutos
 */
export const revalidate = 300;

/**
 * GalleryContent - Componente que carga los datos
 */
async function GalleryContent({ slug, token, isPreview, isPublicAccess }) {
  let result;

  if (isPublicAccess) {
    // Acceso a galería pública sin token
    result = await getPublicGallery(slug);
  } else {
    // Acceso con token (normal)
    result = await getGalleryWithToken(slug, token);
  }

  if (!result.success) {
    notFound();
  }

  const { gallery, photos, sections } = result;

  // ✅ Filtrar fotos válidas (cloudinary_url o file_path)
  const validPhotos = (photos || [])
    .filter(photo => {
      const url = photo.cloudinary_url || photo.file_path;
      if (!url) return false;
      return url.startsWith('http');
    })
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <ProtectedGalleryWrapper
      gallery={{
        id: gallery.id,
        title: gallery.title,
        slug: gallery.slug,
        description: gallery.description,
        eventDate: gallery.event_date,
        clientEmail: gallery.client_email,
        coverImage: gallery.cover_image,
        allowDownloads: gallery.allow_downloads,
        allowComments: gallery.allow_comments,
        maxFavorites: gallery.max_favorites || 150,
        customMessage: gallery.custom_message,
        watermarkEnabled: gallery.watermark_enabled,
        password: gallery.password,
        allowShareFavorites: gallery.allow_share_favorites || false,
        downloadPin: gallery.download_pin,
        showAllSections: gallery.show_all_sections ?? true,
        photos: validPhotos,
        sections: sections || [],
      }}
      token={token}
      isPreview={isPreview}
    />
  );
}

/**
 * Página principal con Suspense
 */
export default async function PublicGalleryPage({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token;
  const isPreview = resolvedSearchParams.preview === 'true';
  const isPublicAccess = resolvedSearchParams.public === 'true';

  // Si no hay token y no es acceso público, verificar si la galería es pública
  if (!token && !isPublicAccess) {
    // Intentar cargar como galería pública
    const supabase = await createClient();
    const { data: gallery } = await supabase
      .from('galleries')
      .select('is_public')
      .eq('slug', slug)
      .maybeSingle();

    if (gallery?.is_public) {
      // Redirigir a versión pública
      return (
        <Suspense fallback={<PublicGallerySkeleton />}>
          <GalleryContent slug={slug} token={null} isPreview={true} isPublicAccess={true} />
        </Suspense>
      );
    }

    return <ErrorPage message="Esta galería requiere un enlace válido para acceder." />;
  }

  return (
    <Suspense fallback={<PublicGallerySkeleton />}>
      <GalleryContent slug={slug} token={token} isPreview={isPreview} isPublicAccess={isPublicAccess} />
    </Suspense>
  );
}

/**
 * Metadata dinámica para SEO
 */
export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token;
  const isPublicAccess = resolvedSearchParams.public === 'true';

  // URLs base consistentes (sin www, igual que layout.js)
  const SITE_URL = 'https://almafotografiauy.com';

  // Imagen OG por defecto (siempre disponible, HTTPS, Cloudinary)
  const defaultOgImage = 'https://res.cloudinary.com/dav2dvukf/image/upload/v1764363487/alma-fotografia/og-image-final.png';

  try {
    // Usar admin client para bypassear RLS en metadata (necesario para que los scrapers accedan)
    const supabase = createAdminClient();
    let gallery = null;

    // Intentar obtener galería por token O por slug (si es pública)
    if (token) {
      // Con token: obtener via gallery_shares
      const { data: shareData } = await supabase
        .from('gallery_shares')
        .select('gallery_id, is_active')
        .eq('share_token', token)
        .maybeSingle();

      if (shareData && shareData.is_active) {
        const { data } = await supabase
          .from('galleries')
          .select('title, description, event_date, cover_image')
          .eq('id', shareData.gallery_id)
          .maybeSingle();
        gallery = data;
      }
    } else {
      // Sin token: intentar obtener galería pública
      const { data } = await supabase
        .from('galleries')
        .select('title, description, event_date, cover_image, is_public')
        .eq('slug', slug)
        .maybeSingle();

      // Solo usar si es pública
      if (data && data.is_public) {
        gallery = data;
      }
    }

    // Si no se encontró galería, usar metadata genérica con OG image
    if (!gallery) {
      return {
        title: 'Galería | Alma Fotografía',
        description: 'Galería de fotos profesionales',
        icons: {
          icon: '/favicon.ico',
          apple: '/apple-touch-icon.png',
        },
        openGraph: {
          title: 'Galería | Alma Fotografía',
          description: 'Galería de fotos profesionales',
          url: `${SITE_URL}/galeria/${slug}`,
          siteName: 'Alma Fotografía',
          images: [
            {
              url: defaultOgImage,
              secureUrl: defaultOgImage,
              width: 1200,
              height: 630,
              alt: 'Alma Fotografía',
              type: 'image/png',
            }
          ],
          type: 'website',
          locale: 'es_UY',
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Galería | Alma Fotografía',
          description: 'Galería de fotos profesionales',
          images: [defaultOgImage],
        },
        robots: 'noindex, nofollow',
      };
    }

    const formattedDate = gallery.event_date
      ? formatDateWithoutTimezone(gallery.event_date, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

    // Usar cover_image si existe y es válida (HTTPS y Cloudinary), sino usar imagen por defecto
    let ogImage = defaultOgImage;
    let imageType = 'image/png';

    if (gallery.cover_image && gallery.cover_image.startsWith('https://')) {
      // Verificar que sea de Cloudinary (pública, sin autenticación)
      if (gallery.cover_image.includes('cloudinary.com')) {
        ogImage = gallery.cover_image;
        // Detectar tipo de imagen
        if (gallery.cover_image.includes('.jpg') || gallery.cover_image.includes('.jpeg')) {
          imageType = 'image/jpeg';
        } else if (gallery.cover_image.includes('.webp')) {
          imageType = 'image/webp';
        }
      }
    }

    const pageUrl = `${SITE_URL}/galeria/${slug}${token ? `?token=${token}` : ''}`;
    const descriptionText = gallery.description || `Galería de fotos${formattedDate ? ` - ${formattedDate}` : ''}. Ve y descarga tus fotos profesionales.`;

    return {
      title: `${gallery.title} | Alma Fotografía`,
      description: descriptionText,
      icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
      },
      openGraph: {
        title: gallery.title,
        description: descriptionText,
        url: pageUrl,
        siteName: 'Alma Fotografía',
        images: [
          {
            url: ogImage,
            secureUrl: ogImage, // Importante para WhatsApp/Facebook
            width: 1200,
            height: 630,
            alt: `${gallery.title} - Portada`,
            type: imageType,
          }
        ],
        type: 'website',
        locale: 'es_UY',
      },
      twitter: {
        card: 'summary_large_image',
        title: gallery.title,
        description: descriptionText,
        images: [ogImage],
      },
      robots: 'noindex, nofollow', // Galerías privadas no deben indexarse
    };
  } catch (error) {
    console.error('[generateMetadata] Error:', error);
    return {
      title: 'Galería | Alma Fotografía',
      description: 'Galería de fotos profesionales',
      icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
      },
      openGraph: {
        title: 'Galería | Alma Fotografía',
        description: 'Galería de fotos profesionales',
        url: 'https://almafotografiauy.com',
        siteName: 'Alma Fotografía',
        images: [
          {
            url: 'https://res.cloudinary.com/dav2dvukf/image/upload/v1764363487/alma-fotografia/og-image-final.png',
            secureUrl: 'https://res.cloudinary.com/dav2dvukf/image/upload/v1764363487/alma-fotografia/og-image-final.png',
            width: 1200,
            height: 630,
            alt: 'Alma Fotografía',
            type: 'image/png',
          }
        ],
        type: 'website',
        locale: 'es_UY',
      },
      twitter: {
        card: 'summary_large_image',
        images: ['https://res.cloudinary.com/dav2dvukf/image/upload/v1764363487/alma-fotografia/og-image-final.png'],
      },
      robots: 'noindex, nofollow',
    };
  }
}

/**
 * ErrorPage - Página de error para galerías
 */
function ErrorPage({ message }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="font-voga text-2xl text-black mb-2">
          Galería no disponible
        </h1>
        
        <p className="font-fira text-sm text-gray-600 leading-relaxed mb-6">
          {message || 'Esta galería no está disponible o el enlace no es válido.'}
        </p>
        
        <div className="space-y-3">
          <p className="font-fira text-xs text-gray-500">
            Posibles razones:
          </p>
          <ul className="font-fira text-xs text-gray-600 text-left space-y-1">
            <li>• El enlace ha expirado</li>
            <li>• El enlace fue desactivado</li>
            <li>• La galería fue archivada</li>
            <li>• El enlace es incorrecto</li>
          </ul>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="font-fira text-xs text-gray-500">
            Si crees que es un error, contacta a la fotógrafa
          </p>
        </div>
      </div>
    </div>
  );
}