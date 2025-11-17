import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { notifyLinkDeactivated } from '@/lib/notifications/notification-helpers';

/**
 * API Route: Desactivar (eliminar) enlace compartido
 *
 * POST /api/gallery-shares/deactivate
 * Body: { shareId: string }
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shareId } = body;

    if (!shareId) {
      return NextResponse.json(
        { success: false, error: 'shareId requerido' },
        { status: 400 }
      );
    }

    // 1. Obtener datos del enlace antes de eliminarlo (para la notificación)
    const { data: shareData, error: fetchError } = await supabase
      .from('gallery_shares')
      .select('*')
      .eq('id', shareId)
      .eq('created_by', user.id) // Seguridad: solo el dueño puede eliminar
      .single();

    if (fetchError || !shareData) {
      console.error('[deactivate] Error fetching share:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Enlace no encontrado' },
        { status: 404 }
      );
    }

    // 2. Enviar notificación ANTES de eliminar (mientras todavía existe el registro)
    const notificationResult = await notifyLinkDeactivated(shareId, user.id);

    if (!notificationResult.success) {
      console.error('[deactivate] Error sending notification:', notificationResult.error);
      // No fallar la request si la notificación falla
    }

    // 3. ELIMINAR el enlace de la base de datos
    const { error: deleteError } = await supabase
      .from('gallery_shares')
      .delete()
      .eq('id', shareId)
      .eq('created_by', user.id); // Seguridad: solo el dueño puede eliminar

    if (deleteError) {
      console.error('[deactivate] Error deleting share:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el enlace' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enlace eliminado correctamente',
    });

  } catch (error) {
    console.error('[deactivate] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
