/**
 * sitemap.xml dinámico
 *
 * Genera sitemap automáticamente con todas las URLs públicas
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
import { createClient } from '@/lib/server';

export default async function sitemap() {
  const baseUrl = 'https://alma-fotografia.vercel.app';

  // URLs estáticas
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  try {
    const supabase = await createClient();

    // Obtener galerías públicas (is_public = true)
    const { data: publicGalleries, error } = await supabase
      .from('galleries')
      .select('slug, created_at, event_date')
      .eq('is_public', true)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (!error && publicGalleries) {
      // Agregar galerías públicas al sitemap
      const galleryRoutes = publicGalleries.map((gallery) => ({
        url: `${baseUrl}/galeria/${gallery.slug}`,
        lastModified: new Date(gallery.event_date || gallery.created_at),
        changeFrequency: 'monthly',
        priority: 0.8,
      }));

      routes.push(...galleryRoutes);
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return routes;
}
