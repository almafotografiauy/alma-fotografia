import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PublicGalleryView from '@/components/public/PublicGalleryView';
import PublicGallerySkeleton from '@/components/public/PublicGallerySkeleton';
import { createClient } from '@/lib/server';

/**
 * Página pública de favoritos compartidos
 *
 * Muestra una galería con SOLO las fotos marcadas como favoritas
 * por un cliente específico.
 *
 * URL: /galeria/boda-maria/favoritos/abc123hash
 *
 * Hash format: base64(clientEmail)
 */

export const revalidate = 300;

/**
 * Decodifica el hash para obtener el email del cliente
 * Soporta tanto atob (browser) como Buffer (Node)
 */
function decodeHash(hash) {
  try {
    // Primero intentar con Buffer (Node.js)
    const decoded = Buffer.from(hash, 'base64').toString('utf-8');
    // Validar que es un email válido
    if (decoded && decoded.includes('@')) {
      return decoded.toLowerCase().trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Codifica el email a hash para generar URLs
 */
export function encodeEmailToHash(email) {
  return Buffer.from(email.toLowerCase().trim(), 'utf-8').toString('base64');
}

/**
 * FavoritesGalleryContent - Carga galería y filtra por favoritos
 */
async function FavoritesGalleryContent({ slug, hash, token }) {
  const supabase = await createClient();

  // Decodificar hash para obtener email
  const clientEmail = decodeHash(hash);

  if (!clientEmail) {
    console.error('[FavoritesPage] Could not decode hash:', hash);
    return <ErrorPage message="El enlace de favoritos no es válido." />;
  }

  // Obtener share activo
  const { data: shareData, error: shareError } = await supabase
    .from('gallery_shares')
    .select('gallery_id, is_active, expires_at')
    .eq('share_token', token)
    .single();

  // Verificar error real de share
  if (shareError && (shareError.message || shareError.code)) {
    console.error('[FavoritesPage] Share error:', shareError);
    notFound();
  }

  if (!shareData || !shareData.is_active) {
    console.error('[FavoritesPage] Share not active or not found');
    notFound();
  }

  // Verificar expiración
  if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
    console.error('[FavoritesPage] Share expired');
    notFound();
  }

  // Obtener galería primero - usar solo gallery_id del share (slug ya fue validado en el share)
  const { data: gallery, error: galleryError } = await supabase
    .from('galleries')
    .select('*')
    .eq('id', shareData.gallery_id)
    .single();

  if (galleryError || !gallery) {
    console.error('[FavoritesPage] Gallery error:', galleryError);
    notFound();
  }

  // Verificar que el slug coincide (case-insensitive)
  if (gallery.slug && gallery.slug.toLowerCase() !== slug.toLowerCase()) {
    console.error('[FavoritesPage] Slug mismatch:', { expected: gallery.slug, received: slug });
    notFound();
  }

  // Buscar favoritos - usar ILIKE para case-insensitive
  const normalizedEmail = clientEmail.toLowerCase().trim();

  const { data: favorites, error: favError } = await supabase
    .from('favorites')
    .select('photo_id')
    .eq('gallery_id', gallery.id)
    .ilike('client_email', normalizedEmail);

  if (favError && favError.code !== 'PGRST116') {
    console.error('[FavoritesPage] Favorites error:', favError);
  }

  // Si no hay favoritos, mostrar error con info adicional
  if (!favorites || favorites.length === 0) {
    console.log('[FavoritesPage] No favorites found for:', normalizedEmail, 'in gallery:', gallery.id);
    return <ErrorPage message="Este cliente aún no ha seleccionado fotos favoritas." />;
  }

  const favoritePhotoIds = favorites.map(f => f.photo_id);

  // Obtener SOLO las fotos favoritas
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', gallery.id)
    .in('id', favoritePhotoIds)
    .order('display_order', { ascending: true });

  // Verificar errores significativos (no objetos vacíos)
  if (photosError && (photosError.message || photosError.code || Object.keys(photosError).length > 0)) {
    return <ErrorPage message="Error al cargar las fotos. Por favor intenta más tarde." />;
  }

  // Si no hay fotos (puede pasar si fueron eliminadas o la query no trajo resultados)
  if (!photos || photos.length === 0) {
    return <ErrorPage message="Las fotos favoritas ya no están disponibles." />;
  }

  // Filtrar fotos válidas
  const validPhotos = (photos || [])
    .filter(photo => {
      const url = photo.cloudinary_url || photo.file_path;
      if (!url) return false;
      return url.startsWith('http');
    })
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <PublicGalleryView
      gallery={{
        id: gallery.id,
        title: `${gallery.title} - Favoritas`,
        slug: gallery.slug,
        description: gallery.description,
        eventDate: gallery.event_date,
        clientEmail: gallery.client_email,
        coverImage: gallery.cover_image,
        allowDownloads: gallery.allow_downloads,
        allowComments: false, // Deshabilitar comentarios en vista de favoritos
        maxFavorites: 0, // Deshabilitar selección de favoritos en esta vista
        customMessage: `Fotos favoritas seleccionadas por ${clientEmail.split('@')[0]}`,
        watermarkEnabled: gallery.watermark_enabled,
        password: null, // No requiere contraseña en vista de favoritos
        downloadPin: gallery.download_pin,
        photos: validPhotos,
      }}
      token={token}
      isFavoritesView={true}
    />
  );
}

/**
 * Página principal con Suspense
 */
export default async function FavoritesGalleryPage({ params, searchParams }) {
  const { slug, hash } = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token;

  if (!token) {
    return <ErrorPage message="Esta galería requiere un enlace válido para acceder." />;
  }

  return (
    <Suspense fallback={<PublicGallerySkeleton />}>
      <FavoritesGalleryContent slug={slug} hash={hash} token={token} />
    </Suspense>
  );
}

/**
 * Metadata dinámica para SEO
 */
export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;

  return {
    title: `Fotos Favoritas - ${slug} | Alma Fotografía`,
    description: 'Selección de fotos favoritas compartidas',
    robots: 'noindex, nofollow',
  };
}

/**
 * ErrorPage - Página de error
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
          No disponible
        </h1>

        <p className="font-fira text-sm text-gray-600 leading-relaxed mb-6">
          {message || 'No se pueden mostrar las fotos favoritas.'}
        </p>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="font-fira text-xs text-gray-500">
            Si crees que es un error, contacta a la fotógrafa
          </p>
        </div>
      </div>
    </div>
  );
}
