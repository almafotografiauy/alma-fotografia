import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/server';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FavoritesView from '@/components/dashboard/galeria/FavoritesView';

/**
 * Página de favoritas de una galería
 *
 * Muestra todas las fotos marcadas como favoritas por clientes
 * con la posibilidad de descargarlas individualmente o todas juntas
 */

export const revalidate = 10; // Revalidar cada 10 segundos para mostrar favoritas nuevas rápidamente

/**
 * FavoritesContent - Componente que carga los datos
 */
async function FavoritesContent({ galleryId }) {
  const supabase = await createClient();

  // Obtener galería con favoritos
  const { data: gallery, error: galleryError } = await supabase
    .from('galleries')
    .select(`
      id,
      title,
      slug,
      client_email,
      max_favorites,
      allow_share_favorites
    `)
    .eq('id', galleryId)
    .single();

  if (galleryError || !gallery) {
    notFound();
  }

  // Primero obtener los favoritos
  const { data: favoritesData, error: favoritesError } = await supabase
    .from('favorites')
    .select('id, client_email, client_name, created_at, photo_id')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: false });

  if (favoritesError) {
    return (
      <div className="p-6 text-center">
        <p className="text-white/60">Error al cargar favoritas</p>
        <p className="text-white/40 text-sm mt-2">{favoritesError.message || JSON.stringify(favoritesError)}</p>
      </div>
    );
  }

  // Obtener IDs únicos de fotos
  const photoIds = [...new Set((favoritesData || []).map(f => f.photo_id).filter(Boolean))];

  // Obtener datos de las fotos - SOLO de esta galería
  let photosData = [];
  if (photoIds.length > 0) {
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', galleryId)
      .in('id', photoIds);

    photosData = photos || [];
  }

  // Mapear fotos a un objeto para fácil acceso
  const photosMap = {};
  photosData.forEach(photo => {
    photosMap[photo.id] = photo;
  });

  // Combinar datos de favoritos con fotos
  const favorites = (favoritesData || []).map(fav => ({
    ...fav,
    photo: photosMap[fav.photo_id] || null
  }));

  // Obtener historial de actividad
  const { data: historyData } = await supabase
    .from('favorites_history')
    .select('id, client_email, client_name, action_type, photo_count, added_count, removed_count, created_at')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: false });

  // Obtener notas de las fotos
  const { data: notesData } = await supabase
    .from('photo_notes')
    .select('photo_id, note')
    .eq('gallery_id', galleryId);

  // Mapear notas por photo_id
  const notesMap = {};
  (notesData || []).forEach(note => {
    notesMap[note.photo_id] = note.note;
  });

  // Agrupar historial por cliente
  const historyByClient = {};
  (historyData || []).forEach(entry => {
    if (!historyByClient[entry.client_email]) {
      historyByClient[entry.client_email] = [];
    }
    historyByClient[entry.client_email].push(entry);
  });

  // Agrupar favoritos por cliente y si fueron enviados
  const favoritesByClient = {};

  (favorites || []).forEach(fav => {
    const email = fav.client_email;
    if (!favoritesByClient[email]) {
      favoritesByClient[email] = {
        email,
        name: fav.client_name || null,
        submitted: false, // Por ahora no tenemos esta información
        submittedAt: null,
        photos: [],
        history: historyByClient[email] || []
      };
    }

    // Si tiene datos de la foto, agregarla con su nota
    if (fav.photo) {
      favoritesByClient[email].photos.push({
        ...fav.photo,
        created_at: fav.created_at,
        note: notesMap[fav.photo.id] || null
      });
    }
  });

  // Filtrar solo clientes que tienen al menos una foto válida de esta galería
  const finalData = Object.values(favoritesByClient).filter(client => client.photos.length > 0);

  return (
    <FavoritesView
      gallery={gallery}
      favoritesByClient={finalData}
    />
  );
}

/**
 * Página principal con Suspense
 */
export default async function FavoritesPage({ params }) {
  const { id } = await params;

  return (
    <>
      <DashboardHeader
        title="Fotos Favoritas"
        subtitle="Revisa las selecciones de tus clientes"
      />

      <div className="px-0">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C6A97D]"></div>
          </div>
        }>
          <FavoritesContent galleryId={id} />
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
    title: gallery ? `Favoritas - ${gallery.title} | Dashboard` : 'Favoritas | Dashboard',
  };
}
