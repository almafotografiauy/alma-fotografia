import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/server';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import GalleryDetailView from '@/components/dashboard/galeria/GalleryDetailView';
import GalleryDetailSkeleton from '@/components/dashboard/galeria/GalleryDetailSkeleton';

/**
 * Página individual de galería
 * 
 * Arquitectura:
 * - Server Component para fetch de datos
 * - Suspense para streaming
 * - Client Component para interacciones (GalleryDetailView)
 */

/**
 * ISR - Cachea la página por 5 minutos
 *
 * Balance entre performance y frescura de datos
 */
export const revalidate = 300;

/**
 * GalleryContent - Componente que carga los datos
 */
async function GalleryContent({ galleryId }) {
  const supabase = await createClient();

  // Por qué Promise.all: ejecuta queries en paralelo (más rápido)
  const [
    { data: gallery, error: galleryError },
    { data: shares, error: sharesError },
    { data: photos, error: photosError }
  ] = await Promise.all([
    supabase
      .from('galleries')
      .select(`
        id,
        title,
        slug,
        description,
        event_date,
        client_email,
        cover_image,
        is_public,
        views_count,
        service_type,
        allow_downloads,
        allow_comments,
        notify_on_view,
        notify_on_favorites,
        custom_message,
        password,
        expiration_date,
        max_favorites,
        download_pin,
        show_all_sections,
        sort_order,
        sort_direction,
        created_at
      `)
      .eq('id', galleryId)
      .single(),

    // Query de shares en paralelo
    supabase
      .from('gallery_shares')
      .select('views_count, is_active')
      .eq('gallery_id', galleryId),

    // Query de fotos ordenadas por display_order
    supabase
      .from('photos')
      .select(`
        id,
        file_path,
        file_name,
        file_size,
        display_order,
        section_id,
        capture_date,
        created_at
      `)
      .eq('gallery_id', galleryId)
      .order('display_order', { ascending: true })
  ]);

  if (galleryError || !gallery) {
    console.error('Gallery not found:', galleryId);
    notFound();
  }

  // Calcular vistas totales de shares activos
  const totalViews = shares
    ?.filter(s => s.is_active)
    .reduce((sum, s) => sum + (s.views_count || 0), 0) || 0;

  // Verificar si hay algún enlace activo
  const hasActiveLink = shares?.some(s => s.is_active) || false;

  // Las fotos ya vienen ordenadas por display_order desde la query
  return (
    <GalleryDetailView
      gallery={{
        ...gallery,
        photos: photos || [],
        has_active_link: hasActiveLink,
        views_count: totalViews,
      }}
    />
  );
}

/**
 * Página principal con Suspense
 */
export default async function GalleryDetailPage({ params }) {
  const { id } = await params;

  return (
    <>
      <DashboardHeader
        title="Detalles de galería"
        subtitle="Gestiona las fotos y configuración de esta sesión"
      />

      <div className="">
        <Suspense fallback={<GalleryDetailSkeleton />}>
          <GalleryContent galleryId={id} />
        </Suspense>
      </div>
    </>
  );
}

/**
 * Metadata dinámica
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: gallery } = await supabase
    .from('galleries')
    .select('title')
    .eq('id', id)
    .single();

  return {
    title: gallery ? `${gallery.title} | Dashboard` : 'Galería | Dashboard',
  };
}