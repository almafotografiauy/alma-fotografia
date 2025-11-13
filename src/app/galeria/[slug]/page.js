import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ProtectedGalleryWrapper from '@/components/public/ProtectedGalleryWrapper';
import PublicGallerySkeleton from '@/components/public/PublicGallerySkeleton';
import { getGalleryWithToken } from '@/lib/validations/validate-share-token';
import { createClient } from '@/lib/server';

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
async function GalleryContent({ slug, token }) {
  // ✅ Validar token y obtener galería (TODO en getGalleryWithToken)
  const result = await getGalleryWithToken(slug, token);

  if (!result.success) {
    console.error('❌ Gallery access denied:', result.error);
    notFound();
  }

  const { gallery, photos } = result;

  // ✅ Filtrar fotos válidas
  const validPhotos = (photos || [])
    .filter(photo => {
      if (!photo.cloudinary_url) return false;
      return photo.cloudinary_url.startsWith('http');
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
        watermarkEnabled: gallery.watermark_enabled,
        password: gallery.password,
        photos: validPhotos,
      }}
      token={token}
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

  // Validación básica
  if (!token) {
    console.log('🔒 No token provided for gallery:', slug);
    return <ErrorPage message="Esta galería requiere un enlace válido para acceder." />;
  }

  return (
    <Suspense fallback={<PublicGallerySkeleton />}>
      <GalleryContent slug={slug} token={token} />
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

  if (!token) {
    return {
      title: 'Galería no encontrada | Alma Fotografía',
      description: 'Esta galería no está disponible o el enlace no es válido.',
      robots: 'noindex, nofollow',
    };
  }

  try {
    const supabase = await createClient();

    // Obtener share
    const { data: shareData } = await supabase
      .from('gallery_shares')
      .select('gallery_id, is_active')
      .eq('share_token', token)
      .single();

    if (!shareData || !shareData.is_active) {
      return {
        title: 'Galería no encontrada | Alma Fotografía',
        description: 'Esta galería no está disponible.',
        robots: 'noindex, nofollow',
      };
    }

    // Obtener galería
    const { data: gallery } = await supabase
      .from('galleries')
      .select('title, description, event_date, cover_image')
      .eq('id', shareData.gallery_id)
      .single();

    if (!gallery) {
      return {
        title: 'Galería | Alma Fotografía',
        robots: 'noindex, nofollow',
      };
    }

    const formattedDate = gallery.event_date
      ? new Date(gallery.event_date).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

    return {
      title: `${gallery.title} | Alma Fotografía`,
      description: gallery.description || `Galería de fotos${formattedDate ? ` - ${formattedDate}` : ''}. Ve y descarga tus fotos profesionales.`,
      openGraph: {
        title: gallery.title,
        description: gallery.description || 'Galería de fotos profesionales',
        images: gallery.cover_image ? [gallery.cover_image] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: gallery.title,
        description: gallery.description || 'Galería de fotos profesionales',
        images: gallery.cover_image ? [gallery.cover_image] : [],
      },
      robots: 'noindex, nofollow', // Galerías privadas no deben indexarse
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Galería | Alma Fotografía',
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
            Si crees que es un error, contacta al fotógrafo
          </p>
        </div>
      </div>
    </div>
  );
}