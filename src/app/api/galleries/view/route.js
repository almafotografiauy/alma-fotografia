import { NextResponse } from 'next/server';
import { notifyGalleryView } from '@/lib/notifications/notification-helpers';

/**
 * POST /api/galleries/view
 *
 * Registra que un cliente vio una galería y envía notificación a la fotógrafa
 *
 * Body:
 * {
 *   galleryId: string,
 *   isFavoritesView?: boolean  // true si está viendo la galería de favoritos compartidos
 * }
 */
export async function POST(request) {
  try {
    const { galleryId, isFavoritesView = false } = await request.json();

    console.log('📊 [API View] Recibiendo solicitud para galería:', galleryId);

    if (!galleryId) {
      console.error('❌ [API View] Gallery ID no proporcionado');
      return NextResponse.json(
        { error: 'Gallery ID is required' },
        { status: 400 }
      );
    }

    // Crear notificación (solo si está habilitado en preferencias)
    console.log('🔔 [API View] Intentando crear notificación...', { isFavoritesView });
    const result = await notifyGalleryView(galleryId, null, isFavoritesView);

    console.log('✅ [API View] Resultado:', result);

    if (!result.success && !result.skipped) {
      console.error('❌ [API View] Error al notificar:', result.error);
      // No fallar la request, solo loguear
    }

    if (result.skipped) {
      console.log('⏭️ [API View] Notificación saltada:', result.skipped);
    }

    return NextResponse.json({
      success: true,
      notified: result.success && !result.skipped,
      debug: result
    });

  } catch (error) {
    console.error('💥 [API View] Error crítico:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
