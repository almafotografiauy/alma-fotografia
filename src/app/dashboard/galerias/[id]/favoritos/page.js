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
    console.error('Gallery not found:', galleryId);
    notFound();
  }

  // Log para debugging
  console.log('[FavoritesContent] Fetching favorites for gallery:', galleryId);

  // Primero obtener los favoritos
  const { data: favoritesData, error: favoritesError } = await supabase
    .from('favorites')
    .select('id, client_email, client_name, created_at, photo_id')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: false });

  if (favoritesError) {
    console.error('[FavoritesContent] Error fetching favorites:', favoritesError);
    return (
      <div className="p-6 text-center">
        <p className="text-white/60">Error al cargar favoritas</p>
        <p className="text-white/40 text-sm mt-2">{favoritesError.message || JSON.stringify(favoritesError)}</p>
      </div>
    );
  }

  // Obtener IDs únicos de fotos
  const photoIds = [...new Set((favoritesData || []).map(f => f.photo_id).filter(Boolean))];

  console.log('[FavoritesContent] Photo IDs to fetch:', {
    count: photoIds.length,
    ids: photoIds
  });

  // Obtener datos de las fotos
  let photosData = [];
  if (photoIds.length > 0) {
    // Intentar query más simple primero
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .in('id', photoIds);

    console.log('[FavoritesContent] Photos query result:', {
      errorType: typeof photosError,
      errorKeys: photosError ? Object.keys(photosError) : null,
      hasError: !!photosError && Object.keys(photosError).length > 0,
      photosCount: photos?.length,
      photosReceived: !!photos,
      samplePhoto: photos?.[0]
    });

    photosData = photos || [];

    console.log('[FavoritesContent] PhotosData final:', {
      count: photosData.length,
      sample: photosData[0]
    });
  }

  // Mapear fotos a un objeto para fácil acceso
  const photosMap = {};
  photosData.forEach(photo => {
    photosMap[photo.id] = photo;
  });

  console.log('[FavoritesContent] PhotosMap created:', {
    mapSize: Object.keys(photosMap).length,
    photoIds: Object.keys(photosMap),
    sampleMapping: Object.entries(photosMap)[0]
  });

  // Combinar datos de favoritos con fotos
  const favorites = (favoritesData || []).map(fav => ({
    ...fav,
    photo: photosMap[fav.photo_id] || null
  }));

  console.log('[FavoritesContent] Favorites result:', {
    count: favorites?.length,
    withPhotos: favorites.filter(f => f.photo).length,
    withoutPhotos: favorites.filter(f => !f.photo).length,
    sampleFavorite: favorites?.[0],
    samplePhotoId: favorites?.[0]?.photo_id,
    samplePhotoFound: favorites?.[0] ? !!photosMap[favorites[0].photo_id] : null
  });

  // Obtener historial de actividad
  const { data: historyData } = await supabase
    .from('favorites_history')
    .select('id, client_email, client_name, action_type, photo_count, added_count, removed_count, created_at')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: false });

  console.log('[FavoritesContent] History data:', {
    count: historyData?.length || 0,
    sample: historyData?.[0]
  });

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

  console.log('[FavoritesContent] Notes loaded:', {
    count: Object.keys(notesMap).length,
    sampleNote: notesData?.[0]
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

  const finalData = Object.values(favoritesByClient);

  console.log('[FavoritesContent] Grouped by client:', {
    clientCount: Object.keys(favoritesByClient).length,
    clients: Object.keys(favoritesByClient),
    fullData: favoritesByClient,
    finalDataToComponent: finalData,
    firstClientPhotos: finalData[0]?.photos
  });

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

      <div className="p-6">
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
