import { createClient } from '@/lib/server';

/**
 * create-notification.js
 * 
 * Helper para crear notificaciones desde server actions.
 * Separado de la lógica de UI para mantener arquitectura limpia.
 */

/**
 * Crear notificación genérica
 * 
 * @param {Object} params
 * @param {string} params.userId - UUID del usuario
 * @param {string} params.type - Tipo de notificación
 * @param {string} params.message - Mensaje a mostrar
 * @param {string} [params.galleryId] - ID de galería (opcional)
 * @param {string} [params.shareId] - ID de share (opcional)
 * @param {string} [params.actionUrl] - URL de acción (opcional)
 * 
 * @returns {Promise<{success: boolean, notification?: object, error?: string}>}
 */
export async function createNotification({
  userId,
  type,
  message,
  galleryId = null,
  shareId = null,
  actionUrl = null,
}) {
  try {

    const supabase = await createClient();

    // PROTECCIÓN ANTI-DUPLICADOS: Verificar si existe una notificación idéntica en los últimos 5 segundos
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

    const { data: recentNotifications, error: checkError } = await supabase
      .from('notifications')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', fiveSecondsAgo)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!checkError && recentNotifications) {
      // Filtrar por gallery_id si aplica
      const duplicates = recentNotifications.filter(n => {
        // Si galleryId es null, solo comparar type y userId (ya filtrados)
        if (galleryId === null) return true;
        // Si no, también debe coincidir gallery_id
        // NOTA: Necesitamos hacer otra query para obtener gallery_id
        return false; // Por ahora, solo prevenir duplicados exactos de tipo
      });

      // Si hay notificaciones recientes del mismo tipo, verificar gallery_id
      if (recentNotifications.length > 0 && galleryId !== null) {
        const { data: detailedNotifications } = await supabase
          .from('notifications')
          .select('id, created_at, gallery_id')
          .in('id', recentNotifications.map(n => n.id));

        const exactDuplicate = detailedNotifications?.find(n =>
          n.gallery_id === galleryId
        );

        if (exactDuplicate) {
          console.warn(`[createNotification] Duplicado detectado - Saltando INSERT`);

          return {
            success: true,
            notification: exactDuplicate,
            skipped: true,
            reason: 'Duplicate notification prevented'
          };
        }
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        message,
        gallery_id: galleryId,
        share_id: shareId,
        action_url: actionUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, notification: data };
  } catch (error) {
    console.error('[createNotification] Error:', error);
    return { success: false, error: error.message };
  }
}