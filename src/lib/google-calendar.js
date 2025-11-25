/**
 * Google Calendar Integration
 *
 * Helper para sincronizar reservas con Google Calendar.
 * Solo se crean eventos cuando las reservas son CONFIRMADAS.
 */

import { google } from 'googleapis';

// Configurar cliente OAuth2
function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  return google.calendar({ version: 'v3', auth });
}

/**
 * Crear evento en Google Calendar (para reservas públicas con horario)
 *
 * @param {Object} booking - Datos de la reserva
 * @param {string} booking.client_name - Nombre del cliente
 * @param {string} booking.client_email - Email del cliente
 * @param {string} booking.client_phone - Teléfono del cliente
 * @param {string} booking.booking_date - Fecha (YYYY-MM-DD)
 * @param {string} booking.start_time - Hora inicio (HH:MM:SS)
 * @param {string} booking.end_time - Hora fin (HH:MM:SS)
 * @param {string} booking.booking_type_name - Nombre del tipo de reserva
 * @param {string} booking.notes - Notas del cliente
 * @returns {Promise<{success: boolean, eventId?: string, error?: string}>}
 */
export async function createCalendarEvent(booking) {
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      console.log('[GoogleCalendar] No configurado, saltando...');
      return { success: true, skipped: true };
    }

    const calendar = getCalendarClient();

    // Formatear horarios (quitar segundos si vienen)
    const startTime = booking.start_time.substring(0, 5);
    const endTime = booking.end_time.substring(0, 5);

    const event = {
      summary: `${booking.booking_type_name || 'Reunión'} - ${booking.client_name}`,
      description: [
        `Cliente: ${booking.client_name}`,
        `Email: ${booking.client_email || 'No proporcionado'}`,
        `Teléfono: ${booking.client_phone || 'No proporcionado'}`,
        booking.notes ? `\nNotas: ${booking.notes}` : '',
      ].filter(Boolean).join('\n'),
      start: {
        dateTime: `${booking.booking_date}T${startTime}:00`,
        timeZone: 'America/Montevideo',
      },
      end: {
        dateTime: `${booking.booking_date}T${endTime}:00`,
        timeZone: 'America/Montevideo',
      },
      // Color naranja para reservas públicas
      colorId: '6',
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      resource: event,
    });

    console.log('[GoogleCalendar] Evento creado:', response.data.id);
    return { success: true, eventId: response.data.id };
  } catch (error) {
    console.error('[GoogleCalendar] Error creando evento:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Crear evento de día completo (para reservas privadas/eventos)
 *
 * @param {Object} booking - Datos del evento
 * @param {string} booking.client_name - Nombre del cliente
 * @param {string} booking.client_email - Email del cliente
 * @param {string} booking.client_phone - Teléfono del cliente
 * @param {string} booking.booking_date - Fecha (YYYY-MM-DD)
 * @param {string} booking.service_type_name - Nombre del tipo de servicio
 * @param {string} booking.notes - Notas
 * @returns {Promise<{success: boolean, eventId?: string, error?: string}>}
 */
export async function createAllDayEvent(booking) {
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      console.log('[GoogleCalendar] No configurado, saltando...');
      return { success: true, skipped: true };
    }

    const calendar = getCalendarClient();

    const event = {
      summary: `${booking.service_type_name || 'Evento'} - ${booking.client_name}`,
      description: [
        `Cliente: ${booking.client_name}`,
        `Email: ${booking.client_email || 'No proporcionado'}`,
        `Teléfono: ${booking.client_phone || 'No proporcionado'}`,
        booking.notes ? `\nNotas: ${booking.notes}` : '',
      ].filter(Boolean).join('\n'),
      start: {
        date: booking.booking_date,
        timeZone: 'America/Montevideo',
      },
      end: {
        date: booking.booking_date,
        timeZone: 'America/Montevideo',
      },
      // Color púrpura para eventos privados
      colorId: '3',
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      resource: event,
    });

    console.log('[GoogleCalendar] Evento all-day creado:', response.data.id);
    return { success: true, eventId: response.data.id };
  } catch (error) {
    console.error('[GoogleCalendar] Error creando evento all-day:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar evento existente (para reservas públicas con horario)
 *
 * @param {string} eventId - ID del evento en Google Calendar
 * @param {Object} booking - Datos actualizados de la reserva
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateCalendarEvent(eventId, booking) {
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN || !eventId) {
      console.log('[GoogleCalendar] No configurado o sin eventId, saltando...');
      return { success: true, skipped: true };
    }

    const calendar = getCalendarClient();

    const startTime = booking.start_time.substring(0, 5);
    const endTime = booking.end_time.substring(0, 5);

    const event = {
      summary: `${booking.booking_type_name || 'Reunión'} - ${booking.client_name}`,
      description: [
        `Cliente: ${booking.client_name}`,
        `Email: ${booking.client_email || 'No proporcionado'}`,
        `Teléfono: ${booking.client_phone || 'No proporcionado'}`,
        booking.notes ? `\nNotas: ${booking.notes}` : '',
      ].filter(Boolean).join('\n'),
      start: {
        dateTime: `${booking.booking_date}T${startTime}:00`,
        timeZone: 'America/Montevideo',
      },
      end: {
        dateTime: `${booking.booking_date}T${endTime}:00`,
        timeZone: 'America/Montevideo',
      },
    };

    await calendar.events.update({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
      resource: event,
    });

    console.log('[GoogleCalendar] Evento actualizado:', eventId);
    return { success: true };
  } catch (error) {
    console.error('[GoogleCalendar] Error actualizando evento:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar evento de día completo
 *
 * @param {string} eventId - ID del evento en Google Calendar
 * @param {Object} booking - Datos actualizados
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateAllDayEvent(eventId, booking) {
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN || !eventId) {
      console.log('[GoogleCalendar] No configurado o sin eventId, saltando...');
      return { success: true, skipped: true };
    }

    const calendar = getCalendarClient();

    const event = {
      summary: `${booking.service_type_name || 'Evento'} - ${booking.client_name}`,
      description: [
        `Cliente: ${booking.client_name}`,
        `Email: ${booking.client_email || 'No proporcionado'}`,
        `Teléfono: ${booking.client_phone || 'No proporcionado'}`,
        booking.notes ? `\nNotas: ${booking.notes}` : '',
      ].filter(Boolean).join('\n'),
      start: {
        date: booking.booking_date,
        timeZone: 'America/Montevideo',
      },
      end: {
        date: booking.booking_date,
        timeZone: 'America/Montevideo',
      },
    };

    await calendar.events.update({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
      resource: event,
    });

    console.log('[GoogleCalendar] Evento all-day actualizado:', eventId);
    return { success: true };
  } catch (error) {
    console.error('[GoogleCalendar] Error actualizando evento all-day:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar evento de Google Calendar
 *
 * @param {string} eventId - ID del evento a eliminar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteCalendarEvent(eventId) {
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN || !eventId) {
      console.log('[GoogleCalendar] No configurado o sin eventId, saltando...');
      return { success: true, skipped: true };
    }

    const calendar = getCalendarClient();

    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
    });

    console.log('[GoogleCalendar] Evento eliminado:', eventId);
    return { success: true };
  } catch (error) {
    // Si el evento ya no existe, no es un error crítico
    if (error.code === 404 || error.code === 410) {
      console.log('[GoogleCalendar] Evento ya no existe:', eventId);
      return { success: true };
    }
    console.error('[GoogleCalendar] Error eliminando evento:', error.message);
    return { success: false, error: error.message };
  }
}
