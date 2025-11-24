'use server';

/**
 * Validación de disponibilidad para reservas públicas
 * Implementa la misma lógica que agendaProvisoria
 */

import { createClient } from '@/lib/server';

/**
 * Duración por defecto de servicios en minutos
 */
const SERVICE_DURATIONS = {
  // Mapeo de service_type_id a minutos
  // Estos IDs deberían venir de la tabla service_types
  default: 120, // 2 horas por defecto
};

/**
 * Verifica si un horario está disponible para una nueva reserva
 *
 * @param {Object} params
 * @param {string} params.serviceTypeId - ID del tipo de servicio
 * @param {string} params.eventDate - Fecha del evento (YYYY-MM-DD)
 * @param {string} params.eventTime - Hora del evento (HH:MM)
 * @returns {Promise<{available: boolean, reason?: string}>}
 */
export async function checkAvailability({ serviceTypeId, eventDate, eventTime }) {
  try {
    const supabase = await createClient();

    // 1. Obtener duración del servicio
    const { data: service } = await supabase
      .from('service_types')
      .select('name')
      .eq('id', serviceTypeId)
      .single();

    if (!service) {
      return { available: false, reason: 'Servicio no encontrado' };
    }

    // Duración en minutos (2 horas por defecto)
    const duration = SERVICE_DURATIONS[serviceTypeId] || SERVICE_DURATIONS.default;

    // 2. Calcular rango de tiempo
    const startDateTime = new Date(`${eventDate}T${eventTime}`);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    // 3. Validar que sea horario laboral (8:00 - 20:00)
    const startHour = startDateTime.getHours();
    const endHour = endDateTime.getHours();

    if (startHour < 8 || endHour > 20) {
      return {
        available: false,
        reason: 'El horario debe estar entre las 8:00 y 20:00'
      };
    }

    // 4. Buscar reservas que se solapen en ese rango
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('id, event_date, event_time, service_type_id')
      .eq('event_date', eventDate)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .not('status', 'eq', 'cancelled');

    if (error) throw error;

    // 5. Verificar solapamientos
    for (const booking of existingBookings || []) {
      // Calcular rango de la reserva existente
      const existingDuration = SERVICE_DURATIONS[booking.service_type_id] || SERVICE_DURATIONS.default;
      const existingStart = new Date(`${booking.event_date}T${booking.event_time}`);
      const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);

      // Comprobar solapamiento
      const hasOverlap = (
        (startDateTime >= existingStart && startDateTime < existingEnd) || // Nueva empieza durante existente
        (endDateTime > existingStart && endDateTime <= existingEnd) ||     // Nueva termina durante existente
        (startDateTime <= existingStart && endDateTime >= existingEnd)      // Nueva envuelve a existente
      );

      if (hasOverlap) {
        return {
          available: false,
          reason: `Ya existe una reserva en ese horario (${booking.event_time})`
        };
      }
    }

    // 6. TODO: Verificar bloqueos de calendario (si existe tabla calendar_blocks)
    // const { data: blocks } = await supabase
    //   .from('calendar_blocks')
    //   .select('*')
    //   .eq('date', eventDate)
    //   .eq('is_active', true);
    // ... lógica de bloqueos

    return { available: true };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { available: false, reason: 'Error al verificar disponibilidad' };
  }
}

/**
 * Crear una nueva reserva pública
 * Valida disponibilidad antes de crear
 *
 * @param {Object} payload - Datos de la reserva
 * @returns {Promise<{success: boolean, booking?: object, error?: string}>}
 */
export async function createPublicBooking(payload) {
  try {
    const {
      serviceTypeId,
      clientName,
      clientEmail,
      clientPhone,
      eventDate,
      eventTime,
      message
    } = payload;

    // 1. Validar campos requeridos
    if (!serviceTypeId || !clientName || !clientEmail || !clientPhone) {
      return {
        success: false,
        error: 'Faltan campos requeridos (servicio, nombre, email, teléfono)'
      };
    }

    // 2. Si hay fecha/hora, validar disponibilidad
    if (eventDate && eventTime) {
      const availability = await checkAvailability({
        serviceTypeId,
        eventDate,
        eventTime
      });

      if (!availability.available) {
        return {
          success: false,
          error: availability.reason || 'El horario no está disponible'
        };
      }
    }

    // 3. Crear la reserva
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        service_type_id: serviceTypeId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        event_date: eventDate || null,
        event_time: eventTime || null,
        notes: message || null,
        status: 'pending',
        is_private: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Enviar notificación a Fernanda (email/webhook)
    // TODO: Enviar confirmación al cliente

    return { success: true, booking: data };
  } catch (error) {
    console.error('Error creating public booking:', error);
    return {
      success: false,
      error: 'Error al crear la reserva. Por favor intentá de nuevo.'
    };
  }
}
