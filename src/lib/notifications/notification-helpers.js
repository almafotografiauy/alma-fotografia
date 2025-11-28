import { createClient, createAdminClient } from '@/lib/server';
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
 * Helper: Obtener el primer usuario admin activo
 * Para enviar notificaciones a UN solo admin (evitar duplicados)
 */
async function getFirstAdminUser() {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, email, username')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}

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
      return { success: false, error: 'Share not found' };
    }

    const gallery = share.galleries;

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_link_expired, email_on_link_expired, notification_email')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app si está habilitada
    if (prefs && prefs.inapp_on_link_expired) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: 'link_expired',
        message: `El enlace de "${gallery.title}" ha expirado. Genera uno nuevo para compartir.`,
        galleryId: gallery.id,
        shareId: share.id,
        actionUrl: `/dashboard/galerias/${gallery.id}`,
      });
    }

    // Enviar email si está habilitado y hay email configurado
    if (prefs && prefs.email_on_link_expired && prefs.notification_email) {
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
    return { success: false, error: error.message };
  }
}

/**
 * Notificar enlace desactivado manualmente
 *
 * @param {string} galleryId - ID de la galería
 * @param {string} galleryTitle - Título de la galería
 * @param {string} userId - ID del usuario que desactivó (no se usa, notifica al admin principal)
 */
export async function notifyLinkDeactivated(galleryId, galleryTitle, userId) {
  try {
    const supabase = await createClient();

    // Obtener el admin principal para notificar
    const admin = await getFirstAdminUser();
    if (!admin) {
      console.log('[notifyLinkDeactivated] No admin user found');
      return { success: false, error: 'No admin user found' };
    }

    const gallery = { id: galleryId, title: galleryTitle };

    // Verificar preferencias del admin
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_link_deactivated, email_on_link_deactivated, notification_email')
      .eq('user_id', admin.id)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app (default: habilitado si no hay preferencias o si el campo es null/true)
    const shouldSendInApp = !prefs || prefs.inapp_on_link_deactivated !== false;

    if (shouldSendInApp) {
      notificationResult = await createNotification({
        userId: admin.id,
        type: 'link_deactivated',
        message: `Se desactivó el enlace de "${gallery.title}". Los clientes ya no podrán acceder.`,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}`,
      });
    }

    // Enviar email si: la opción está habilitada (o es null) Y hay email configurado
    const shouldSendEmail = prefs && prefs.notification_email && prefs.email_on_link_deactivated !== false;

    if (shouldSendEmail) {
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

    return notificationResult || { success: true };
  } catch (error) {
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
      return { success: false, error: 'Gallery not found' };
    }

    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_gallery_archived, email_on_gallery_archived, notification_email')
      .eq('user_id', userId)
      .maybeSingle();

    const shouldCreateInApp = prefs && prefs.inapp_on_gallery_archived;

    if (!shouldCreateInApp) {
      // Solo enviar email si está configurado
      const shouldSendEmail = prefs && prefs.email_on_gallery_archived && prefs.notification_email;
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
    const shouldSendEmail = prefs && prefs.email_on_gallery_archived && prefs.notification_email;
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
      return { success: false, error: 'Gallery not found' };
    }

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_gallery_restored, email_on_gallery_restored, notification_email')
      .eq('user_id', userId)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_on_gallery_restored) {
      notificationResult = await createNotification({
        userId,
        type: 'gallery_restored',
        message: `La galería "${gallery.title}" ha sido restaurada. Ahora está activa nuevamente.`,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}`,
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_on_gallery_restored && prefs.notification_email) {
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
      .select('inapp_on_gallery_deleted, email_on_gallery_deleted, notification_email')
      .eq('user_id', userId)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_on_gallery_deleted) {
      notificationResult = await createNotification({
        userId,
        type: 'gallery_deleted',
        message: `La galería "${galleryTitle}" ha sido eliminada permanentemente junto con todas sus fotos.`,
        actionUrl: '/dashboard/galerias',
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_on_gallery_deleted && prefs.notification_email) {
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


    return { success: true, notified: data };
  } catch (error) {
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


    return { success: true, deleted: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Notificar cuando un cliente ve una galería
 * ENVÍA A UN SOLO USUARIO ADMIN (el primero creado)
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
      return { success: false, error: 'Gallery not found' };
    }

    // Obtener UN solo usuario admin
    const admin = await getFirstAdminUser();
    if (!admin) {
      return { success: false, error: 'No admin user found' };
    }

    const clientName = gallery.client_email ? gallery.client_email.split('@')[0] : 'Un cliente';

    // Mensaje diferente según tipo de vista
    const message = isFavoritesView
      ? `${clientName} acaba de ver su galería de favoritos compartidos de "${gallery.title}"`
      : `${clientName} acaba de ver la galería "${gallery.title}"`;

    // Tipo de notificación diferente
    const notificationType = isFavoritesView ? 'favorites_gallery_view' : 'gallery_view';

    // Verificar preferencias del admin
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_gallery_view, email_on_gallery_view, notification_email')
      .eq('user_id', admin.id)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app (default: habilitado)
    const shouldSendInApp = !prefs || prefs.inapp_on_gallery_view !== false;

    if (shouldSendInApp) {
      notificationResult = await createNotification({
        userId: admin.id,
        type: notificationType,
        message,
        galleryId: gallery.id,
        actionUrl: isFavoritesView
          ? `/dashboard/galerias/${gallery.id}/favoritos`
          : `/dashboard/galerias/${gallery.id}`,
      });
    }

    // Enviar email si está configurado
    const shouldSendEmail = prefs && prefs.notification_email && prefs.email_on_gallery_view !== false;

    if (shouldSendEmail) {
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

    return notificationResult || { success: true };
  } catch (error) {
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
      .select('inapp_on_favorites, email_on_favorites, notification_email')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    const clientName = emailToCheck ? emailToCheck.split('@')[0] : 'El cliente';

    // Mensaje diferente según si es primera vez o está agregando más
    const message = isFirstTime
      ? `${clientName} seleccionó ${favoritesCount} foto${favoritesCount > 1 ? 's' : ''} favorita${favoritesCount > 1 ? 's' : ''} en "${gallery.title}"`
      : `${clientName} agregó más fotos favoritas en "${gallery.title}" (Total: ${favoritesCount})`;

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_on_favorites) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: 'favorites_selected',
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}/favoritos`,
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_on_favorites && prefs.notification_email) {
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
    return { success: false, error: error.message };
  }
}

/**
 * Notificar cuando un cliente envía su selección de favoritas
 * Detecta automáticamente si es primera vez o edición
 * ENVÍA A UN SOLO USUARIO ADMIN (el primero creado)
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
      return { success: false, error: 'Gallery not found' };
    }

    // Solo notificar si está habilitado en la galería
    if (!gallery.notify_on_favorites) {
      return { success: true, skipped: 'Gallery notifications disabled' };
    }

    // Obtener UN solo usuario admin
    const admin = await getFirstAdminUser();
    if (!admin) {
      return { success: false, error: 'No admin user found' };
    }

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

    // Verificar preferencias del admin
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_favorites, email_on_favorites, notification_email')
      .eq('user_id', admin.id)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app (default: habilitado)
    const shouldSendInApp = !prefs || prefs.inapp_on_favorites !== false;

    if (shouldSendInApp) {
      notificationResult = await createNotification({
        userId: admin.id,
        type: notifType,
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}/favoritos`,
      });
    }

    // Enviar email si está configurado
    const shouldSendEmail = prefs && prefs.notification_email && prefs.email_on_favorites !== false;

    if (shouldSendEmail) {
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

    return notificationResult || { success: true };
  } catch (error) {
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
      .select('inapp_on_favorites, email_on_favorites, notification_email')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    const clientName = clientEmail ? clientEmail.split('@')[0] : 'Un cliente';

    // Mensaje diferente si es la primera favorita o está agregando más
    const message = isFirstFavorite
      ? `${clientName} seleccionó su primera foto favorita en "${gallery.title}"`
      : `${clientName} agregó una foto favorita en "${gallery.title}" (Total: ${currentCount})`;

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada
    if (prefs && prefs.inapp_on_favorites) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: isFirstFavorite ? 'favorites_selected' : 'favorite_added',
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}/favoritos`,
      });
    }

    // Enviar email si está configurado
    if (prefs && prefs.email_on_favorites && prefs.notification_email) {
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
      return { success: false, error: 'Gallery not found' };
    }

    // Solo notificar si está habilitado en la galería
    if (!gallery.notify_on_favorites) {
      return { success: true, skipped: 'Gallery notifications disabled' };
    }

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_favorites, email_on_favorites, notification_email')
      .eq('user_id', gallery.created_by)
      .maybeSingle();

    const clientName = clientEmail ? clientEmail.split('@')[0] : 'Un cliente';
    const message = `${clientName} quitó una foto favorita en "${gallery.title}" (Quedan: ${remainingCount})`;

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada
    if (prefs && prefs.inapp_on_favorites) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: 'favorite_removed',
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}/favoritos`,
      });
    }

    // Enviar email si está configurado
    if (prefs && prefs.email_on_favorites && prefs.notification_email) {
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
      return { success: false, error: 'Gallery not found' };
    }

    // Verificar si el usuario tiene habilitadas las notificaciones de nuevas galerías
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_new_gallery, email_on_new_gallery, notification_email')
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
      }
    }

    const clientName = gallery.client_email ? `para ${gallery.client_email.split('@')[0]}` : '';
    const message = `Creaste la galería "${gallery.title}" ${clientName}`.trim();

    let notificationResult = null;

    // Crear notificación in-app solo si está habilitada Y la opción específica está marcada
    if (prefs && prefs.inapp_on_new_gallery) {
      notificationResult = await createNotification({
        userId: gallery.created_by,
        type: 'gallery_created',
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/galerias/${gallery.id}`,
      });
    }

    // Enviar email si: email_enabled está activado Y la opción está marcada Y hay email configurado
    if (prefs && prefs.email_on_new_gallery && prefs.notification_email) {
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
    return { success: false, error: error.message };
  }
}

/**
 * Notificar cuando un cliente deja un testimonio
 * ENVÍA A UN SOLO USUARIO ADMIN (el primero creado)
 *
 * @param {string} testimonialId - ID del testimonio creado
 */
export async function notifyTestimonialReceived(testimonialId) {
  try {
    const supabase = await createClient();

    // Obtener el testimonio con la información de la galería
    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .select(`
        id,
        client_name,
        client_email,
        message,
        rating,
        gallery_id,
        galleries (
          id,
          title,
          created_by
        )
      `)
      .eq('id', testimonialId)
      .single();

    if (error || !testimonial) {
      return { success: false, error: 'Testimonial not found' };
    }

    const gallery = testimonial.galleries;

    // Obtener UN solo usuario admin
    const admin = await getFirstAdminUser();
    if (!admin) {
      return { success: false, error: 'No admin user found' };
    }

    const stars = testimonial.rating ? `⭐ ${testimonial.rating}/5` : '';
    const message = `${testimonial.client_name} dejó un testimonio en "${gallery.title}" ${stars}`;

    // Verificar preferencias del admin
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_testimonial, email_on_testimonial, notification_email')
      .eq('user_id', admin.id)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app (default: habilitado)
    const shouldSendInApp = !prefs || prefs.inapp_on_testimonial !== false;

    if (shouldSendInApp) {
      notificationResult = await createNotification({
        userId: admin.id,
        type: 'testimonial_received',
        message,
        galleryId: gallery.id,
        actionUrl: `/dashboard/testimonios`,
      });
    }

    // Enviar email si está configurado
    const shouldSendEmail = prefs && prefs.notification_email && prefs.email_on_testimonial !== false;

    if (shouldSendEmail) {
      const emailTemplate = getEmailTemplate('testimonial_received', {
        galleryTitle: gallery.title,
        clientName: testimonial.client_name,
        rating: testimonial.rating,
        message: testimonial.message,
        testimonialUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/testimonios`,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// NOTIFICACIONES DE AGENDA PÚBLICA
// ============================================

/**
 * Notificar cuando llega una nueva reserva pública pendiente
 * ENVÍA A UN SOLO USUARIO ADMIN (el primero creado)
 *
 * @param {string} bookingId - ID de la reserva creada
 */
export async function notifyNewPublicBooking(bookingId) {
  try {
    const supabase = await createClient();

    // Obtener la reserva con el tipo
    const { data: booking, error } = await supabase
      .from('public_bookings')
      .select(`
        id,
        client_name,
        client_email,
        booking_date,
        start_time,
        end_time,
        booking_type:public_booking_types(id, name, slug)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return { success: false, error: 'Booking not found' };
    }

    // Obtener UN solo usuario admin
    const admin = await getFirstAdminUser();
    if (!admin) {
      return { success: false, error: 'No admin user found' };
    }

    const bookingTypeName = booking.booking_type?.name || 'Reunión';
    const formattedDate = new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const message = `Nueva reserva de ${bookingTypeName}: ${booking.client_name} para el ${formattedDate} a las ${booking.start_time.substring(0, 5)}`;

    // Verificar preferencias del admin
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_booking_pending, email_on_booking_pending, notification_email')
      .eq('user_id', admin.id)
      .maybeSingle();

    let notificationResult = null;

    // Crear notificación in-app (default: habilitado)
    const shouldSendInApp = !prefs || prefs.inapp_on_booking_pending !== false;

    if (shouldSendInApp) {
      notificationResult = await createNotification({
        userId: admin.id,
        type: 'booking_pending',
        message,
        actionUrl: '/dashboard/agenda',
      });
    }

    // Enviar email si está configurado
    const shouldSendEmail = prefs && prefs.notification_email && prefs.email_on_booking_pending !== false;

    if (shouldSendEmail) {
      const emailTemplate = getEmailTemplate('booking_pending', {
        bookingType: bookingTypeName,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        bookingDate: formattedDate,
        startTime: booking.start_time.substring(0, 5),
        endTime: booking.end_time.substring(0, 5),
        agendaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/agenda`,
      });

      if (emailTemplate) {
        await sendEmail({
          to: prefs.notification_email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    }

    return notificationResult || { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Notificar cuando se confirma una reserva pública
 *
 * @param {string} bookingId - ID de la reserva confirmada
 */
export async function notifyBookingConfirmed(bookingId) {
  try {
    const supabase = await createClient();

    const { data: booking, error } = await supabase
      .from('public_bookings')
      .select(`
        id,
        client_name,
        client_email,
        booking_date,
        start_time,
        end_time,
        booking_type:public_booking_types(id, name, slug)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return { success: false, error: 'Booking not found' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_booking_confirmed, email_on_booking_confirmed, notification_email')
      .eq('user_id', user.id)
      .maybeSingle();

    const bookingTypeName = booking.booking_type?.name || 'Reunión';
    const formattedDate = new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const message = `Confirmaste la reserva de ${bookingTypeName} con ${booking.client_name} para el ${formattedDate} a las ${booking.start_time.substring(0, 5)}`;

    let notificationResult = null;

    if (prefs && prefs.inapp_on_booking_confirmed !== false) {
      notificationResult = await createNotification({
        userId: user.id,
        type: 'booking_confirmed',
        message,
        actionUrl: '/dashboard/agenda',
      });
    }

    if (prefs && prefs.email_on_booking_confirmed !== false && prefs.notification_email) {
      const emailTemplate = getEmailTemplate('booking_confirmed', {
        bookingType: bookingTypeName,
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        bookingDate: formattedDate,
        startTime: booking.start_time.substring(0, 5),
        endTime: booking.end_time.substring(0, 5),
        agendaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/agenda`,
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
    return { success: false, error: error.message };
  }
}

/**
 * CRON JOB: Notificar reservas próximas (24 horas antes)
 *
 * Ejecutar diariamente a las 9 AM.
 */
export async function notifyUpcomingBookings() {
  try {
    const supabase = await createClient();

    // Calcular fecha de mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Obtener reservas confirmadas para mañana
    const { data: bookings, error } = await supabase
      .from('public_bookings')
      .select(`
        id,
        client_name,
        client_email,
        booking_date,
        start_time,
        end_time,
        booking_type:public_booking_types(id, name, slug)
      `)
      .eq('booking_date', tomorrowStr)
      .eq('status', 'confirmed');

    if (error) throw error;

    if (!bookings || bookings.length === 0) {
      return { success: true, notified: 0 };
    }

    // Obtener el usuario admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Verificar preferencias
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('inapp_on_booking_reminder, email_on_booking_reminder, notification_email')
      .eq('user_id', user.id)
      .maybeSingle();

    let notifiedCount = 0;

    for (const booking of bookings) {
      const bookingTypeName = booking.booking_type?.name || 'Reunión';
      const message = `Recordatorio: Mañana tienes ${bookingTypeName} con ${booking.client_name} a las ${booking.start_time.substring(0, 5)}`;

      // Crear notificación in-app
      if (prefs && prefs.inapp_on_booking_reminder !== false) {
        await createNotification({
          userId: user.id,
          type: 'booking_reminder',
          message,
          actionUrl: '/dashboard/agenda',
        });
        notifiedCount++;
      }

      // Enviar email
      if (prefs && prefs.email_on_booking_reminder !== false && prefs.notification_email) {
        const emailTemplate = getEmailTemplate('booking_reminder', {
          bookingType: bookingTypeName,
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          bookingDate: new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('es-UY', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          startTime: booking.start_time.substring(0, 5),
          endTime: booking.end_time.substring(0, 5),
          agendaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/agenda`,
        });

        if (emailTemplate) {
          await sendEmail({
            to: prefs.notification_email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          });
        }
      }
    }

    return { success: true, notified: notifiedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}