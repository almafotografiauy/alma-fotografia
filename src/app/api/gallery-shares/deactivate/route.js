import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

    // Crear cliente admin para bypasear RLS
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle error
            }
          },
        },
      }
    );

    // 1. Obtener datos del enlace antes de eliminarlo (usando admin para bypasear RLS)
    const { data: shareData, error: fetchError } = await supabaseAdmin
      .from('gallery_shares')
      .select('*, galleries(id, title)')
      .eq('id', shareId)
      .single();

    if (fetchError || !shareData) {
      console.error('[deactivate] Error fetching share:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Enlace no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: el usuario debe ser el dueño del share
    // O tener permiso de manage_users (admin)
    const isShareOwner = shareData.created_by === user.id;

    if (!isShareOwner) {
      // Verificar si es admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('permissions')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.permissions?.manage_users === true;

      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: 'No tenés permiso para eliminar este enlace' },
          { status: 403 }
        );
      }
    }

    // 2. Enviar notificación con los datos que ya tenemos
    const galleryId = shareData.gallery_id;
    const galleryTitle = shareData.galleries?.title || 'Galería';

    const notificationResult = await notifyLinkDeactivated(galleryId, galleryTitle, user.id);

    if (!notificationResult.success) {
      console.error('[deactivate] Error sending notification:', notificationResult.error);
      // No fallar la request si la notificación falla
    }

    // 3. ELIMINAR el enlace de la base de datos (usando admin para bypasear RLS)
    const { error: deleteError } = await supabaseAdmin
      .from('gallery_shares')
      .delete()
      .eq('id', shareId);

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
