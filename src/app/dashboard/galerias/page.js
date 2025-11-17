import { Suspense } from 'react';
import { createClient } from '@/lib/server';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import GalleriesView from '@/components/dashboard/galeria/GalleriesView';
import GalleryGridSkeleton from '@/components/dashboard/galeria/GalleryGridSkeleton';
import CreateGalleryButton from '@/components/dashboard/galeria/CreateGalleryButton';

/**
 * Página principal de galerías - v3 FINAL
 * 
 * QUERY MEJORADA:
 * - Trae info de gallery_shares para saber si hay enlace activo
 * - Calcula vistas reales según enlaces activos
 * - Prepara datos de favoritos (para futuro)
 */

export const revalidate = 60;

async function GalleriesContent() {
  const supabase = await createClient();

  // Fetch galerías con stats + shares + favorites
  const { data: galleries, error } = await supabase
    .from('galleries')
    .select(`
      *,
      photos(count),
      gallery_shares(
        id,
        is_active,
        views_count,
        expires_at
      ),
      favorites(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching galleries:', error);
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="font-fira text-black/60">Error al cargar las galerías</p>
      </div>
    );
  }

  // Fetch tipos de servicio para filtros
  const { data: serviceTypes } = await supabase
    .from('service_types')
    .select('slug, name, icon_name')
    .order('name');

  // Transformar datos con lógica de enlaces
  const galleriesWithCount = (galleries || []).map((gallery) => {
    // Filtrar solo enlaces activos (no expirados)
    const activeShares = gallery.gallery_shares?.filter(share => {
      if (!share.is_active) return false;
      if (!share.expires_at) return true;
      return new Date(share.expires_at) > new Date();
    }) || [];

    // Calcular vistas SOLO de enlaces activos
    const totalViews = activeShares.reduce((sum, share) => sum + (share.views_count || 0), 0);

    // Enlaces expirados
    const expiredShares = gallery.gallery_shares?.filter(share => {
      if (!share.is_active) return false;
      if (!share.expires_at) return false;
      return new Date(share.expires_at) <= new Date();
    }) || [];

    return {
      id: gallery.id,
      title: gallery.title,
      slug: gallery.slug,
      description: gallery.description,
      event_date: gallery.event_date,
      client_email: gallery.client_email,
      cover_image: gallery.cover_image,
      created_at: gallery.created_at,
      is_public: gallery.is_public,
      service_type: gallery.service_type,
      allow_downloads: gallery.allow_downloads,
      password: gallery.password,
      photoCount: gallery.photos?.[0]?.count || 0,
      archived_at: gallery.archived_at,

      // CAMPOS CALCULADOS
      views_count: totalViews,
      has_active_link: activeShares.length > 0,
      has_expired_link: expiredShares.length > 0,

      // Contador de favoritas real
      favorites_count: gallery.favorites?.[0]?.count || 0,
    };
  });

  return (
    <GalleriesView 
      galleries={galleriesWithCount} 
      serviceTypes={serviceTypes || []}
    />
  );
}

export default function GaleriasPage() {
  return (
    <>
      <DashboardHeader
        title="Galerías"
        subtitle="Gestiona y comparte tus sesiones fotográficas"
        action={<CreateGalleryButton variant="header" />}
      />

      <div className="lg:p-8">
        <Suspense fallback={<GalleryGridSkeleton />}>
          <GalleriesContent />
        </Suspense>
      </div>
    </>
  );
}