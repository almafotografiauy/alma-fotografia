import { createClient } from '@/lib/server';
import { createNotification } from './create-notification';
import { sendEmail } from '@/lib/email/resend-client';
import { getEmailTemplate } from '@/lib/email/email-templates';

/**
 * notification-helpers.js
 * 
 * Funciones helper para crear notificaciones específicas.
 * Cada función encapsula la lógica de obtener datos y crear la notificación.
 */

/**
 * Notificar enlace expirado
 *
 * Llamar cuando un enlace se desactiva por vencimiento.
 *
 * @param {string} shareId - ID del share expirado
 */
export async function notifyLinkExpired(shareId) {
  try {
    const supabase = await createClient();

    const { data: share, error } = await supabase
      .from('gallery_shares')
      .select(`
        id,
        gallery_id,
        galleries (
          id,
          title,
          created_by
        )
      `)
      .eq('id', shareId)
      .single();

    if (error || !share) {
      console.error('[notifyLinkExpired] Share not found:', shareId);
      return { success: false, error: 'Share not found' };
    }

    const gallery = share.galleries;

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, email_enabled, notification_email, email_on_link_expired')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_enabled && prefs.email_on_link_expired) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: 'link_expired',
        message: `El enlace de "${gallery.title}" ha expirado. Genera uno nuevo para compartir.`,
        galleryId: gallery.id,
        shareId: share.id,
        actionUrl: `/dashboard/galerias/${gallery.id}`,
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_enabled && prefs.email_on_link_expired && prefs.notification_email) {
      const emailTemplate = getEmailTemplate('link_expired', {
        galleryTitle: gallery.title,
        galleryUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/galerias/${gallery.id}`,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true, skipped: 'In-app disabled' };
  } catch (error) {
    console.error('[notifyLinkExpired] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificar enlace desactivado manualmente
 *
 * @param {string} shareId - ID del share desactivado
 * @param {string} userId - ID del usuario que desactivó
 */
export async function notifyLinkDeactivated(shareId, userId) {
  try {
    const supabase = await createClient();

    const { data: share, error } = await supabase
      .from('gallery_shares')
      .select(`
        id,
        gallery_id,
        galleries (
          id,
          title
        )
      `)
      .eq('id', shareId)
      .single();

    if (error || !share) {
      console.error('[notifyLinkDeactivated] Share not found:', shareId);
      return { success: false, error: 'Share not found' };
    }

    const gallery = share.galleries;

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, email_enabled, notification_email, email_on_link_deactivated')
      .eq('user_id', userId)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_enabled && prefs.email_on_link_deactivated) {
      notificationResult = await createNotification({
        userId,
        type: 'link_deactivated',
        message: `Desactivaste el enlace de "${gallery.title}". Los clientes ya no podrán acceder.`,
        galleryId: gallery.id,
        shareId: share.id,
        actionUrl: `/dashboard/galerias/${gallery.id}`,
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_enabled && prefs.email_on_link_deactivated && prefs.notification_email) {
      const emailTemplate = getEmailTemplate('link_deactivated', {
        galleryTitle: gallery.title,
        galleryUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/galerias/${gallery.id}`,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true, skipped: 'In-app disabled' };
  } catch (error) {
    console.error('[notifyLinkDeactivated] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificar galería archivada
 *
 * @param {string} galleryId - ID de la galería archivada
 * @param {string} userId - ID del usuario dueño
 */
export async function notifyGalleryArchived(galleryId, userId) {
  try {
    const supabase = await createClient();

    const { data: gallery, error } = await supabase
      .from('galleries')
      .select('id, title')
      .eq('id', galleryId)
      .single();

    if (error || !gallery) {
      console.error('[notifyGalleryArchived] Gallery not found:', galleryId);
      return { success: false, error: 'Gallery not found' };
    }

    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, notification_email, email_on_gallery_archived, email_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    const shouldCreateInApp = prefs && prefs.inapp_enabled && prefs.email_on_gallery_archived;

    if (!shouldCreateInApp) {
      // Solo enviar email si está configurado
      const shouldSendEmail = prefs && prefs.email_enabled && prefs.email_on_gallery_archived && prefs.notification_email;
      if (shouldSendEmail) {
        const emailTemplate = getEmailTemplate('gallery_archived', {
          galleryTitle: gallery.title,
        });
        if (emailTemplate) {
          await sendEmail({
            to: prefs.notification_email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          });
        }
      }
      return { success: true, skipped: 'Notification disabled' };
    }

    const notificationResult = await createNotification({
      userId,
      type: 'gallery_archived',
      message: `La galería "${gallery.title}" ha sido archivada. Los enlaces compartidos se desactivaron automáticamente.`,
      galleryId: gallery.id,
      actionUrl: '/dashboard/galerias?archive=true',
    });

    // Enviar email si está configurado
    const shouldSendEmail = prefs && prefs.email_enabled && prefs.email_on_gallery_archived && prefs.notification_email;
    if (shouldSendEmail) {
      const emailTemplate = getEmailTemplate('gallery_archived', {
        galleryTitle: gallery.title,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult;
  } catch (error) {
    console.error('[notifyGalleryArchived] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificar galería restaurada
 *
 * @param {string} galleryId - ID de la galería restaurada
 * @param {string} userId - ID del usuario dueño
 */
export async function notifyGalleryRestored(galleryId, userId) {
  try {
    const supabase = await createClient();

    const { data: gallery, error } = await supabase
      .from('galleries')
      .select('id, title')
      .eq('id', galleryId)
      .single();

    if (error || !gallery) {
      console.error('[notifyGalleryRestored] Gallery not found:', galleryId);
      return { success: false, error: 'Gallery not found' };
    }

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, email_enabled, notification_email, email_on_gallery_restored')
      .eq('user_id', userId)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_enabled && prefs.email_on_gallery_restored) {
      notificationResult = await createNotification({
        userId,
        type: 'gallery_restored',
        message: `La galería "${gallery.title}" ha sido restaurada. Ahora está activa nuevamente.`,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}`,
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_enabled && prefs.email_on_gallery_restored && prefs.notification_email) {
      const emailTemplate = getEmailTemplate('gallery_restored', {
        galleryTitle: gallery.title,
        galleryUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/galerias/${gallery.id}`,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true, skipped: 'In-app disabled' };
  } catch (error) {
    console.error('[notifyGalleryRestored] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificar galería eliminada
 *
 * @param {string} galleryTitle - Título de la galería eliminada
 * @param {string} userId - ID del usuario dueño
 */
export async function notifyGalleryDeleted(galleryTitle, userId) {
  try {
    const supabase = await createClient();

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, email_enabled, notification_email, email_on_gallery_deleted')
      .eq('user_id', userId)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_enabled && prefs.email_on_gallery_deleted) {
      notificationResult = await createNotification({
        userId,
        type: 'gallery_deleted',
        message: `La galería "${galleryTitle}" ha sido eliminada permanentemente junto con todas sus fotos.`,
        actionUrl: '/dashboard/galerias',
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_enabled && prefs.email_on_gallery_deleted && prefs.notification_email) {
      const emailTemplate = getEmailTemplate('gallery_deleted', {
        galleryTitle,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true, skipped: 'In-app disabled' };
  } catch (error) {
    console.error('[notifyGalleryDeleted] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * CRON JOB: Notificar enlaces que expiran pronto
 * 
 * Ejecutar diariamente a las 8 AM.
 * Llama a la función SQL que hace el trabajo pesado.
 */
export async function notifyExpiringLinks() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('notify_expiring_links');

    if (error) throw error;

    console.log(`[notifyExpiringLinks] Notificados ${data} enlaces que expiran pronto`);

    return { success: true, notified: data };
  } catch (error) {
    console.error('[notifyExpiringLinks] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * CRON JOB: Limpiar notificaciones antiguas
 *
 * Ejecutar semanalmente.
 * Elimina notificaciones leídas mayores a 30 días.
 */
export async function cleanupOldNotifications() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('cleanup_old_notifications');

    if (error) throw error;

    console.log(`[cleanupOldNotifications] Eliminadas ${data} notificaciones antiguas`);

    return { success: true, deleted: data };
  } catch (error) {
    console.error('[cleanupOldNotifications] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificar cuando un cliente ve una galería
 *
 * @param {string} galleryId - ID de la galería vista
 * @param {string} clientInfo - Info del cliente (IP, navegador, etc.) - opcional
 * @param {boolean} isFavoritesView - Si es vista de galería de favoritos compartidos
 */
export async function notifyGalleryView(galleryId, clientInfo = null, isFavoritesView = false) {
  try {
    const supabase = await createClient();

    const { data: gallery, error } = await supabase
      .from('galleries')
      .select('id, title, created_by, client_email')
      .eq('id', galleryId)
      .single();

    if (error || !gallery) {
      console.error('[notifyGalleryView] Gallery not found:', galleryId, error);
      return { success: false, error: 'Gallery not found' };
    }

    // Verificar si el usuario tiene habilitadas las notificaciones de vistas
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, email_enabled, email_on_gallery_view, notification_email')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    // Si no tiene preferencias, crear con defaults
    if (!prefs) {
      const { error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: gallery.created_by,
          inapp_enabled: true,
          email_on_gallery_view: false,
          email_on_favorites: false,
          email_on_link_expiring: true,
          email_on_link_expired: true,
          email_on_new_gallery: false,
        });

      if (insertError) {
        console.error('[notifyGalleryView] Error creando preferencias:', insertError);
      }
    }

    const clientName = gallery.client_email ? gallery.client_email.split('@')[0] : 'Un cliente';

    // Mensaje diferente según tipo de vista
    const message = isFavoritesView
      ? `${clientName} acaba de ver su galería de favoritos compartidos de "${gallery.title}"`
      : `${clientName} acaba de ver la galería "${gallery.title}"`;

    // Tipo de notificación diferente
    const notificationType = isFavoritesView ? 'favorites_gallery_view' : 'gallery_view';

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_enabled && prefs.email_on_gallery_view) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: notificationType,
        message,
        galleryId: gallery.id,
        actionUrl: isFavoritesView
          ? `/dashboard/galerias/${gallery.id}/favoritos`
          : `/dashboard/galerias/${gallery.id}`,
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_enabled && prefs.email_on_gallery_view && prefs.notification_email) {
      const emailTemplate = getEmailTemplate('gallery_view', {
        galleryTitle: gallery.title,
        galleryUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/galerias/${gallery.id}`,
        clientName,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true, skipped: 'In-app disabled' };
  } catch (error) {
    console.error('[notifyGalleryView] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificar cuando un cliente selecciona favoritos
 *
 * @param {string} galleryId - ID de la galería
 * @param {number} favoritesCount - Cantidad de favoritos seleccionados actualmente
 * @param {string} clientEmail - Email del cliente (opcional, para notificaciones específicas)
 */
export async function notifyFavoritesSelected(galleryId, favoritesCount, clientEmail = null) {
  try {
    const supabase = await createClient();

    const { data: gallery, error } = await supabase
      .from('galleries')
      .select('id, title, created_by, client_email')
      .eq('id', galleryId)
      .single();

    if (error || !gallery) {
      console.error('[notifyFavoritesSelected] Gallery not found:', galleryId);
      return { success: false, error: 'Gallery not found' };
    }

    // Obtener notificaciones previas de este tipo para este cliente y galería
    const emailToCheck = clientEmail || gallery.client_email;
    const { data: prevNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, created_at')
      .eq('user_id', gallery.created_by)
      .eq('type', 'favorites_selected')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false })
      .limit(1);

    const isFirstTime = !prevNotifications || prevNotifications.length === 0;

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, email_enabled, email_on_favorites, notification_email')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    const clientName = emailToCheck ? emailToCheck.split('@')[0] : 'El cliente';

    // Mensaje diferente según si es primera vez o está agregando más
    const message = isFirstTime
      ? `${clientName} seleccionó ${favoritesCount} foto${favoritesCount > 1 ? 's' : ''} favorita${favoritesCount > 1 ? 's' : ''} en "${gallery.title}"`
      : `${clientName} agregó más fotos favoritas en "${gallery.title}" (Total: ${favoritesCount})`;

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_enabled && prefs.email_on_favorites) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: 'favorites_selected',
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}/favoritos`,
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_enabled && prefs.email_on_favorites && prefs.notification_email) {
      const emailTemplate = getEmailTemplate(isFirstTime ? 'favorites_selected' : 'favorites_added', {
        galleryTitle: gallery.title,
        galleryUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/galerias/${gallery.id}/favoritos`,
        clientName,
        favoritesCount,
        isFirstTime,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true, skipped: 'In-app disabled' };
  } catch (error) {
    console.error('[notifyFavoritesSelected] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificar cuando un cliente envía su selección de favoritas
 * Detecta automáticamente si es primera vez o edición
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} clientEmail - Email del cliente
 * @param {number} totalCount - Cantidad total de favoritas
 * @param {boolean} isFirstSubmission - Si es la primera vez que envía
 * @param {number} addedCount - Cantidad de fotos agregadas (en edición)
 * @param {number} removedCount - Cantidad de fotos eliminadas (en edición)
 */
export async function notifyFavoritesSubmitted(
  galleryId,
  clientEmail,
  totalCount,
  isFirstSubmission,
  addedCount,
  removedCount,
  clientName = null
) {
  try {
    const supabase = await createClient();

    const { data: gallery, error } = await supabase
      .from('galleries')
      .select('id, title, created_by, notify_on_favorites')
      .eq('id', galleryId)
      .single();

    if (error || !gallery) {
      console.error('[notifyFavoritesSubmitted] Gallery not found:', galleryId);
      return { success: false, error: 'Gallery not found' };
    }

    // Solo notificar si está habilitado en la galería
    if (!gallery.notify_on_favorites) {
      return { success: true, skipped: 'Gallery notifications disabled' };
    }

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, email_enabled, email_on_favorites, notification_email')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    const displayName = clientName || (clientEmail ? clientEmail.split('@')[0] : 'Un cliente');

    // Construir mensaje según el tipo de submission
    let message;
    let notifType;

    if (isFirstSubmission) {
      // Primera vez
      message = `${displayName} agregó fotos favoritas en la galería "${gallery.title}" (Total: ${totalCount})`;
      notifType = 'favorites_selected';
    } else {
      // Es edición - construir mensaje inteligente
      const parts = [];

      if (addedCount > 0 && removedCount > 0) {
        parts.push(`Eliminó ${removedCount} y agregó ${addedCount}`);
      } else if (addedCount > 0) {
        parts.push(`Agregó ${addedCount}`);
      } else if (removedCount > 0) {
        parts.push(`Eliminó ${removedCount}`);
      }

      const changesText = parts.length > 0 ? ` - ${parts.join(', ')}` : '';
      message = `${displayName} editó la selección de favoritas de la galería "${gallery.title}"${changesText} (Total: ${totalCount})`;
      notifType = 'favorites_edited';
    }

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada
    if (prefs && prefs.inapp_enabled && prefs.email_on_favorites) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: notifType,
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}/favoritos`,
      });
    }

    // Enviar email si está configurado
    if (prefs && prefs.email_enabled && prefs.email_on_favorites && prefs.notification_email) {
      const emailTemplate = getEmailTemplate(notifType, {
        galleryTitle: gallery.title,
        galleryUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/galerias/${gallery.id}/favoritos`,
        clientName: displayName,
        totalCount,
        isFirstSubmission,
        addedCount,
        removedCount,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true, skipped: 'In-app disabled' };
  } catch (error) {
    console.error('[notifyFavoritesSubmitted] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * @deprecated - Usar notifyFavoritesSubmitted en su lugar
 * Notificar cuando un cliente agrega una foto favorita
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} clientEmail - Email del cliente
 * @param {number} currentCount - Cantidad actual de favoritos después de agregar
 */
export async function notifyFavoriteAdded(galleryId, clientEmail, currentCount) {
  try {
    const supabase = await createClient();

    const { data: gallery, error } = await supabase
      .from('galleries')
      .select('id, title, created_by, notify_on_favorites')
      .eq('id', galleryId)
      .single();

    if (error || !gallery) {
      console.error('[notifyFavoriteAdded] Gallery not found:', galleryId);
      return { success: false, error: 'Gallery not found' };
    }

    // Solo notificar si está habilitado en la galería
    if (!gallery.notify_on_favorites) {
      return { success: true, skipped: 'Gallery notifications disabled' };
    }

    // Verificar si es la primera foto favorita
    const { data: history } = await supabase
      .from('favorites_history')
      .select('id')
      .eq('gallery_id', galleryId)
      .eq('client_email', clientEmail)
      .eq('action_type', 'added')
      .limit(2);

    const isFirstFavorite = history && history.length === 1;

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, email_enabled, email_on_favorites, notification_email')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    const clientName = clientEmail ? clientEmail.split('@')[0] : 'Un cliente';

    // Mensaje diferente si es la primera favorita o está agregando más
    const message = isFirstFavorite
      ? `${clientName} seleccionó su primera foto favorita en "${gallery.title}"`
      : `${clientName} agregó una foto favorita en "${gallery.title}" (Total: ${currentCount})`;

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada
    if (prefs && prefs.inapp_enabled && prefs.email_on_favorites) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: isFirstFavorite ? 'favorites_selected' : 'favorite_added',
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}/favoritos`,
      });
    }

    // Enviar email si está configurado
    if (prefs && prefs.email_enabled && prefs.email_on_favorites && prefs.notification_email) {
      const emailTemplate = getEmailTemplate(isFirstFavorite ? 'favorites_selected' : 'favorite_added', {
        galleryTitle: gallery.title,
        galleryUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/galerias/${gallery.id}/favoritos`,
        clientName,
        currentCount,
        isFirstFavorite,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true, skipped: 'In-app disabled' };
  } catch (error) {
    console.error('[notifyFavoriteAdded] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificar cuando un cliente elimina una foto favorita
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} clientEmail - Email del cliente
 * @param {number} remainingCount - Cantidad de favoritos restantes después de eliminar
 */
export async function notifyFavoriteRemoved(galleryId, clientEmail, remainingCount) {
  try {
    const supabase = await createClient();

    const { data: gallery, error } = await supabase
      .from('galleries')
      .select('id, title, created_by, notify_on_favorites')
      .eq('id', galleryId)
      .single();

    if (error || !gallery) {
      console.error('[notifyFavoriteRemoved] Gallery not found:', galleryId);
      return { success: false, error: 'Gallery not found' };
    }

    // Solo notificar si está habilitado en la galería
    if (!gallery.notify_on_favorites) {
      return { success: true, skipped: 'Gallery notifications disabled' };
    }

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, email_enabled, email_on_favorites, notification_email')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    const clientName = clientEmail ? clientEmail.split('@')[0] : 'Un cliente';
    const message = `${clientName} quitó una foto favorita en "${gallery.title}" (Quedan: ${remainingCount})`;

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada
    if (prefs && prefs.inapp_enabled && prefs.email_on_favorites) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: 'favorite_removed',
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}/favoritos`,
      });
    }

    // Enviar email si está configurado
    if (prefs && prefs.email_enabled && prefs.email_on_favorites && prefs.notification_email) {
      const emailTemplate = getEmailTemplate('favorite_removed', {
        galleryTitle: gallery.title,
        galleryUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/galerias/${gallery.id}/favoritos`,
        clientName,
        remainingCount,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true, skipped: 'In-app disabled' };
  } catch (error) {
    console.error('[notifyFavoriteRemoved] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notificar cuando se crea una nueva galería
 *
 * @param {string} galleryId - ID de la galería creada
 */
export async function notifyGalleryCreated(galleryId) {
  try {
    const supabase = await createClient();

    const { data: gallery, error } = await supabase
      .from('galleries')
      .select('id, title, created_by, client_email')
      .eq('id', galleryId)
      .single();

    if (error || !gallery) {
      console.error('[notifyGalleryCreated] Gallery not found:', galleryId, error);
      return { success: false, error: 'Gallery not found' };
    }

    // Verificar si el usuario tiene habilitadas las notificaciones de nuevas galerías
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_enabled, email_enabled, email_on_new_gallery, notification_email')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    // Si no tiene preferencias, crear con defaults
    if (!prefs) {
      const { error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: gallery.created_by,
          inapp_enabled: true,
          email_on_gallery_view: false,
          email_on_favorites: false,
          email_on_link_expiring: true,
          email_on_link_expired: true,
          email_on_new_gallery: false,
        });

      if (insertError) {
        console.error('[notifyGalleryCreated] Error creando preferencias:', insertError);
      }
    }

    const clientName = gallery.client_email ? `para ${gallery.client_email.split('@')[0]}` : '';
    const message = `Creaste la galería "${gallery.title}" ${clientName}`.trim();

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_enabled && prefs.email_on_new_gallery) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: 'gallery_created',
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}`,
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_enabled && prefs.email_on_new_gallery && prefs.notification_email) {
      const emailTemplate = getEmailTemplate('gallery_created', {
        galleryTitle: gallery.title,
        galleryUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/galerias/${gallery.id}`,
        clientEmail: gallery.client_email,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true, skipped: 'In-app disabled' };
  } catch (error) {
    console.error('[notifyGalleryCreated] Error:', error);
    return { success: false, error: error.message };
  }
}