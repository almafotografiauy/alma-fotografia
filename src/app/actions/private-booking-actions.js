'use server';

import { createClient } from '@/lib/server';
import { hasPermission } from '@/lib/permissions';
import { createAllDayEvent, updateAllDayEvent, deleteCalendarEvent } from '@/lib/google-calendar';

/**
 * ============================================
 * SERVER ACTIONS - AGENDA PRIVADA (POR DÍA)
 * ============================================
 * Sistema de eventos por día completo desde el dashboard
 * Máximo 2 eventos por día (2 salones disponibles)
 */

/**
 * Obtener todas las reservas privadas
 */
export async function getAllPrivateBookings() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('private_bookings')
      .select(`
        *,
        service_type:service_types(id, name, slug, icon_name)
      `)
      .order('booking_date', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      bookings: data || [],
    };
  } catch (error) {
    return { success: false, error: error.message, bookings: [] };
  }
}

/**
 * Obtener reservas privadas por rango de fechas
 */
export async function getPrivateBookingsByDateRange(startDate, endDate) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('private_bookings')
      .select(`
        *,
        service_type:service_types(id, name, slug, icon_name)
      `)
      .eq('status', 'confirmed')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .order('booking_date', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      bookings: data || [],
    };
  } catch (error) {
    return { success: false, error: error.message, bookings: [] };
  }
}

/**
 * Crear una reserva privada (evento de día completo)
 */
export async function createPrivateBooking({
  serviceTypeId,
  clientName,
  clientEmail,
  clientPhone,
  bookingDate,
  notes,
  internalNotes,
}) {
  try {
    // Validaciones
    if (!serviceTypeId || !clientName || !bookingDate) {
      return {
        success: false,
        error: 'El tipo de servicio, nombre del cliente y fecha son requeridos',
      };
    }

    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    // Verificar que el servicio existe
    const { data: service, error: serviceError } = await supabase
      .from('service_types')
      .select('id, name')
      .eq('id', serviceTypeId)
      .single();

    if (serviceError || !service) {
      return {
        success: false,
        error: 'Servicio no encontrado',
      };
    }

    // NOTA: Las fechas bloqueadas solo afectan reservas públicas desde landing,
    // NO impiden que el admin cree eventos privados desde el dashboard

    // Verificar que no haya más de 2 eventos ese día (MÁXIMO 2 SALONES)
    const { data: existingBookings, error: countError } = await supabase
      .from('private_bookings')
      .select('id')
      .eq('booking_date', bookingDate)
      .eq('status', 'confirmed');

    if (countError) throw countError;

    if (existingBookings && existingBookings.length >= 2) {
      return {
        success: false,
        error: 'Ya hay 2 eventos confirmados para esta fecha (límite alcanzado)',
      };
    }

    // Crear la reserva
    const { data, error } = await supabase
      .from('private_bookings')
      .insert({
        service_type_id: serviceTypeId,
        client_name: clientName.trim(),
        client_email: clientEmail?.toLowerCase().trim() || null,
        client_phone: clientPhone?.trim() || null,
        booking_date: bookingDate,
        notes: notes?.trim() || null,
        internal_notes: internalNotes?.trim() || null,
        status: 'confirmed',
        created_by: user.id,
      })
      .select(`
        *,
        service_type:service_types(id, name, slug, icon_name)
      `)
      .single();

    if (error) throw error;

    // Crear evento de día completo en Google Calendar
    console.log('[createPrivateBooking] Intentando crear evento en Google Calendar...');
    const calendarResult = await createAllDayEvent({
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      booking_date: data.booking_date,
      service_type_name: data.service_type?.name,
      notes: data.notes,
    });

    console.log('[createPrivateBooking] Resultado de Google Calendar:', calendarResult);

    // Guardar el google_event_id si se creó exitosamente
    if (calendarResult.success && calendarResult.eventId) {
      console.log('[createPrivateBooking] Guardando google_event_id:', calendarResult.eventId);
      await supabase
        .from('private_bookings')
        .update({ google_event_id: calendarResult.eventId })
        .eq('id', data.id);
    }

    return {
      success: true,
      booking: data,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar una reserva privada
 */
export async function updatePrivateBooking(bookingId, updates) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    // Si se está cambiando la fecha, verificar límite de 2 por día
    if (updates.booking_date) {
      const { data: existingBookings } = await supabase
        .from('private_bookings')
        .select('id')
        .eq('booking_date', updates.booking_date)
        .eq('status', 'confirmed')
        .neq('id', bookingId);

      if (existingBookings && existingBookings.length >= 2) {
        return {
          success: false,
          error: 'Ya hay 2 eventos confirmados para esta fecha',
        };
      }
    }

    const { data, error } = await supabase
      .from('private_bookings')
      .update(updates)
      .eq('id', bookingId)
      .select(`
        *,
        service_type:service_types(id, name, slug, icon_name)
      `)
      .single();

    if (error) throw error;

    // Actualizar evento en Google Calendar si existe
    if (data.google_event_id) {
      await updateAllDayEvent(data.google_event_id, {
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        booking_date: data.booking_date,
        service_type_name: data.service_type?.name,
        notes: data.notes,
      });
    }

    return {
      success: true,
      booking: data,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancelar una reserva privada
 */
export async function cancelPrivateBooking(bookingId) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data, error } = await supabase
      .from('private_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      booking: data,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar una reserva privada
 */
export async function deletePrivateBooking(bookingId) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    // Obtener la reserva para conseguir el google_event_id
    const { data: booking, error: fetchError } = await supabase
      .from('private_bookings')
      .select('google_event_id')
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    // Eliminar evento de Google Calendar si existe
    if (booking?.google_event_id) {
      await deleteCalendarEvent(booking.google_event_id);
    }

    const { error } = await supabase
      .from('private_bookings')
      .delete()
      .eq('id', bookingId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Verificar disponibilidad para una fecha (cuántos slots quedan)
 */
export async function checkDateAvailability(date) {
  try {
    const supabase = await createClient();

    // Verificar si está bloqueada
    const { data: blockedDate } = await supabase
      .from('blocked_dates')
      .select('id, reason')
      .eq('blocked_date', date)
      .maybeSingle();

    if (blockedDate) {
      return {
        success: true,
        available: false,
        reason: blockedDate.reason || 'Fecha bloqueada',
        slotsRemaining: 0,
      };
    }

    // Contar eventos confirmados
    const { data: bookings, error } = await supabase
      .from('private_bookings')
      .select('id')
      .eq('booking_date', date)
      .eq('status', 'confirmed');

    if (error) throw error;

    const count = bookings?.length || 0;
    const slotsRemaining = 2 - count;

    return {
      success: true,
      available: slotsRemaining > 0,
      slotsRemaining: slotsRemaining,
      message:
        slotsRemaining === 0
          ? 'Sin cupos disponibles'
          : `${slotsRemaining} ${slotsRemaining === 1 ? 'cupo disponible' : 'cupos disponibles'}`,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
