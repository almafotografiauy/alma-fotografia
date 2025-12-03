'use server';

import { createClient, createAdminClient } from '@/lib/server';
import { notifyNewPublicBooking, notifyBookingConfirmed } from '@/lib/notifications/notification-helpers';
import { sendEmail } from '@/lib/email/resend-client';
import { getEmailTemplate } from '@/lib/email/email-templates';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar';

/**
 * ============================================
 * SERVER ACTIONS - AGENDA PÚBLICA (POR HORA)
 * ============================================
 * Sistema de reservas por horarios para reuniones/sesiones cortas
 * Cada tipo de reserva tiene slots INDEPENDIENTES
 */

/**
 * Obtener todos los tipos de reserva pública disponibles
 * Usa admin client para acceso público sin sesión
 */
export async function getPublicBookingTypes() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('public_booking_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      bookingTypes: data || [],
    };
  } catch (error) {
    return { success: false, error: error.message, bookingTypes: [] };
  }
}

/**
 * Obtener horarios de trabajo configurados
 * Usa admin client para acceso público sin sesión
 */
export async function getWorkingHours() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('working_hours')
      .select('*')
      .order('day_of_week', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      workingHours: data || [],
    };
  } catch (error) {
    return { success: false, error: error.message, workingHours: [] };
  }
}

/**
 * Obtener fechas bloqueadas y días no laborables
 * Para mostrar en el calendario público de reservas
 * Usa cliente admin para bypasear RLS (usuarios no logueados)
 */
export async function getBlockedDates() {
  try {
    // Usar cliente admin para bypasear RLS y permitir lectura pública
    const supabase = createAdminClient();

    // Obtener fechas bloqueadas explícitamente
    const { data: blockedDates, error: blockedError } = await supabase
      .from('blocked_dates')
      .select('blocked_date')
      .gte('blocked_date', new Date().toISOString().split('T')[0]);

    if (blockedError) throw blockedError;

    // Obtener días de la semana no laborables
    const { data: workingHours, error: whError } = await supabase
      .from('working_hours')
      .select('day_of_week, is_working_day')
      .eq('is_working_day', false);

    if (whError) throw whError;

    return {
      success: true,
      blockedDates: (blockedDates || []).map(d => d.blocked_date),
      nonWorkingDays: (workingHours || []).map(d => d.day_of_week),
    };
  } catch (error) {
    console.error('[getBlockedDates] Error:', error);
    return { success: false, error: error.message, blockedDates: [], nonWorkingDays: [] };
  }
}

/**
 * Obtener slots disponibles para un tipo de reserva en una fecha específica
 * IMPORTANTE: Los slots son INDEPENDIENTES por tipo de reserva
 * Usa admin client para acceso público sin sesión
 */
export async function getAvailableSlots(bookingTypeId, date) {
  try {
    const supabase = createAdminClient();

    // 1. Obtener el tipo de reserva
    const { data: bookingType, error: typeError } = await supabase
      .from('public_booking_types')
      .select('*')
      .eq('id', bookingTypeId)
      .single();

    if (typeError || !bookingType) {
      return { success: false, error: 'Tipo de reserva no encontrado', slots: [] };
    }

    // 2. Verificar si la fecha está bloqueada completamente
    const { data: blockedDate } = await supabase
      .from('blocked_dates')
      .select('id')
      .eq('blocked_date', date)
      .maybeSingle();

    if (blockedDate) {
      return { success: true, slots: [], message: 'Fecha bloqueada' };
    }

    // 3. Obtener día de la semana (0=Domingo, 6=Sábado)
    // Usar parseISO de date-fns para evitar problemas de zona horaria
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // 4. Obtener horario de trabajo para ese día
    const { data: workingHour, error: whError } = await supabase
      .from('working_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (whError || !workingHour || !workingHour.is_working_day || !workingHour.start_time || !workingHour.end_time) {
      return { success: true, slots: [], message: 'Día no laborable' };
    }

    // 5. Generar slots posibles basados en horario de trabajo
    const slots = generateTimeSlots(
      workingHour.start_time,
      workingHour.end_time,
      bookingType.duration_minutes
    );

    // 6. Obtener reservas existentes para este tipo y fecha
    const { data: existingBookings } = await supabase
      .from('public_bookings')
      .select('start_time, end_time')
      .eq('booking_type_id', bookingTypeId)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']);

    // 7. Obtener horarios bloqueados para este tipo o generales
    const { data: blockedSlots } = await supabase
      .from('blocked_time_slots')
      .select('start_time, end_time')
      .eq('blocked_date', date)
      .or(`booking_type_id.eq.${bookingTypeId},booking_type_id.is.null`);

    // 8. Filtrar slots disponibles
    const availableSlots = slots.filter((slot) => {
      // Verificar si el slot se solapa con una reserva existente
      const hasBooking = (existingBookings || []).some((booking) =>
        timeSlotsOverlap(slot.start, slot.end, booking.start_time, booking.end_time)
      );

      // Verificar si el slot está bloqueado
      const isBlocked = (blockedSlots || []).some((blocked) =>
        timeSlotsOverlap(slot.start, slot.end, blocked.start_time, blocked.end_time)
      );

      return !hasBooking && !isBlocked;
    });

    return {
      success: true,
      slots: availableSlots,
      bookingType: bookingType,
    };
  } catch (error) {
    return { success: false, error: error.message, slots: [] };
  }
}

/**
 * Crear una reserva pública
 * IMPORTANTE: Usa admin client para que usuarios sin sesión puedan crear reservas desde la landing
 */
export async function createPublicBooking({
  bookingTypeId,
  clientName,
  clientEmail,
  clientPhone,
  bookingDate,
  startTime,
  notes,
}) {
  try {
    // Validaciones
    if (!bookingTypeId || !clientName || !clientEmail || !clientPhone || !bookingDate || !startTime) {
      return {
        success: false,
        error: 'Todos los campos son requeridos',
      };
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return {
        success: false,
        error: 'El email no es válido',
      };
    }

    const supabase = createAdminClient();

    // Obtener tipo de reserva para calcular end_time
    const { data: bookingType, error: typeError } = await supabase
      .from('public_booking_types')
      .select('duration_minutes')
      .eq('id', bookingTypeId)
      .single();

    if (typeError || !bookingType) {
      return {
        success: false,
        error: 'Tipo de reserva no encontrado',
      };
    }

    // Calcular end_time
    const endTime = addMinutesToTime(startTime, bookingType.duration_minutes);

    // Verificar disponibilidad del slot
    // Obtener todas las reservas del mismo tipo en la misma fecha
    const { data: existingBookings } = await supabase
      .from('public_bookings')
      .select('start_time, end_time')
      .eq('booking_type_id', bookingTypeId)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'confirmed']);

    // Verificar si hay conflicto de horarios
    const hasConflict = (existingBookings || []).some((booking) =>
      timeSlotsOverlap(startTime, endTime, booking.start_time, booking.end_time)
    );

    if (hasConflict) {
      return {
        success: false,
        error: 'Este horario ya no está disponible',
      };
    }

    // Crear la reserva
    const { data, error } = await supabase
      .from('public_bookings')
      .insert({
        booking_type_id: bookingTypeId,
        client_name: clientName.trim(),
        client_email: clientEmail.toLowerCase().trim(),
        client_phone: clientPhone.trim(),
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        notes: notes?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Enviar notificación de nueva reserva pendiente a Fernanda
    console.log('[createPublicBooking] Enviando notificación al admin...');
    const notifyResult = await notifyNewPublicBooking(data.id);
    console.log('[createPublicBooking] Resultado notificación admin:', notifyResult);

    // Enviar email de confirmación de solicitud al cliente
    const { data: bookingTypeData } = await supabase
      .from('public_booking_types')
      .select('name')
      .eq('id', bookingTypeId)
      .single();

    const bookingTypeName = bookingTypeData?.name || 'Reunión';
    const formattedDate = new Date(bookingDate + 'T00:00:00').toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    console.log('[createPublicBooking] Enviando email al cliente:', data.client_email);
    const clientEmailTemplate = getEmailTemplate('client_booking_requested', {
      bookingType: bookingTypeName,
      clientName: data.client_name,
      bookingDate: formattedDate,
      startTime: data.start_time.substring(0, 5),
      endTime: data.end_time.substring(0, 5),
    });

    if (clientEmailTemplate) {
      const emailResult = await sendEmail({
        to: data.client_email,
        subject: clientEmailTemplate.subject,
        html: clientEmailTemplate.html,
      });
      console.log('[createPublicBooking] Resultado email cliente:', emailResult);
    } else {
      console.error('[createPublicBooking] No se pudo generar template de email para cliente');
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
 * Obtener todas las reservas públicas (para dashboard)
 */
export async function getAllPublicBookings() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('public_bookings')
      .select(`
        *,
        booking_type:public_booking_types(id, name, slug, duration_minutes, color)
      `)
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });

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
 * Obtener reservas públicas pendientes
 */
export async function getPendingPublicBookings() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('public_bookings')
      .select(`
        *,
        booking_type:public_booking_types(id, name, slug, duration_minutes, color)
      `)
      .eq('status', 'pending')
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });

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
 * Confirmar una reserva pública
 */
export async function confirmPublicBooking(bookingId, internalNotes = null) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('public_bookings')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        internal_notes: internalNotes,
      })
      .eq('id', bookingId)
      .select(`
        *,
        booking_type:public_booking_types(id, name, slug)
      `)
      .single();

    if (error) throw error;

    // Crear evento en Google Calendar
    console.log('[confirmPublicBooking] Intentando crear evento en Google Calendar...');
    const calendarResult = await createCalendarEvent({
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      booking_date: data.booking_date,
      start_time: data.start_time,
      end_time: data.end_time,
      booking_type_name: data.booking_type?.name,
      notes: data.notes,
    });

    console.log('[confirmPublicBooking] Resultado de Google Calendar:', calendarResult);

    // Guardar el google_event_id si se creó exitosamente
    if (calendarResult.success && calendarResult.eventId) {
      console.log('[confirmPublicBooking] Guardando google_event_id:', calendarResult.eventId);
      await supabase
        .from('public_bookings')
        .update({ google_event_id: calendarResult.eventId })
        .eq('id', bookingId);
    }

    // Enviar notificación de reserva confirmada a Fernanda
    console.log('[confirmPublicBooking] Enviando notificación al admin...');
    const notifyResult = await notifyBookingConfirmed(data.id);
    console.log('[confirmPublicBooking] Resultado notificación admin:', notifyResult);

    // Enviar email de confirmación al cliente
    const bookingTypeName = data.booking_type?.name || 'Reunión';
    const formattedDate = new Date(data.booking_date + 'T00:00:00').toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    console.log('[confirmPublicBooking] Enviando email al cliente:', data.client_email);
    const clientEmailTemplate = getEmailTemplate('client_booking_confirmed', {
      bookingType: bookingTypeName,
      clientName: data.client_name,
      bookingDate: formattedDate,
      startTime: data.start_time.substring(0, 5),
      endTime: data.end_time.substring(0, 5),
    });

    if (clientEmailTemplate) {
      const emailResult = await sendEmail({
        to: data.client_email,
        subject: clientEmailTemplate.subject,
        html: clientEmailTemplate.html,
      });
      console.log('[confirmPublicBooking] Resultado email cliente:', emailResult);
    } else {
      console.error('[confirmPublicBooking] No se pudo generar template de email para cliente');
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
 * Rechazar una reserva pública
 */
export async function rejectPublicBooking(bookingId, reason) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('public_bookings')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_reason: reason || null,
      })
      .eq('id', bookingId)
      .select(`
        *,
        booking_type:public_booking_types(id, name, slug)
      `)
      .single();

    if (error) throw error;

    // Enviar email de rechazo al cliente
    const bookingTypeName = data.booking_type?.name || 'Reunión';
    const formattedDate = new Date(data.booking_date + 'T00:00:00').toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const clientEmailTemplate = getEmailTemplate('client_booking_rejected', {
      bookingType: bookingTypeName,
      clientName: data.client_name,
      bookingDate: formattedDate,
      startTime: data.start_time.substring(0, 5),
      reason: data.rejected_reason,
    });

    if (clientEmailTemplate) {
      await sendEmail({
        to: data.client_email,
        subject: clientEmailTemplate.subject,
        html: clientEmailTemplate.html,
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
 * Actualizar una reserva pública (desde dashboard)
 */
export async function updatePublicBooking(bookingId, updates) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    const { data, error } = await supabase
      .from('public_bookings')
      .update({
        client_name: updates.client_name,
        client_email: updates.client_email || null,
        client_phone: updates.client_phone || null,
        booking_date: updates.booking_date,
        start_time: updates.start_time,
        end_time: updates.end_time,
        notes: updates.notes,
        internal_notes: updates.internal_notes,
      })
      .eq('id', bookingId)
      .select(`
        *,
        booking_type:public_booking_types(id, name, slug)
      `)
      .single();

    if (error) throw error;

    // Actualizar evento en Google Calendar si existe
    if (data.google_event_id) {
      await updateCalendarEvent(data.google_event_id, {
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        booking_date: data.booking_date,
        start_time: data.start_time,
        end_time: data.end_time,
        booking_type_name: data.booking_type?.name,
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
 * Cancelar una reserva pública
 */
export async function cancelPublicBooking(bookingId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('public_bookings')
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
 * Eliminar completamente una reserva pública (confirmada o no)
 */
export async function deletePublicBooking(bookingId) {
  try {
    const supabase = await createClient();

    // Primero obtener los datos de la reserva para enviar email de notificación
    const { data: booking, error: fetchError } = await supabase
      .from('public_bookings')
      .select(`
        *,
        booking_type:public_booking_types(id, name, slug)
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError) throw fetchError;

    // Eliminar evento de Google Calendar si existe
    if (booking.google_event_id) {
      await deleteCalendarEvent(booking.google_event_id);
    }

    // Eliminar la reserva
    const { error: deleteError } = await supabase
      .from('public_bookings')
      .delete()
      .eq('id', bookingId);

    if (deleteError) throw deleteError;

    // Enviar email al cliente notificando la cancelación
    if (booking && booking.status === 'confirmed') {
      const bookingTypeName = booking.booking_type?.name || 'Reunión';
      const formattedDate = new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const clientEmailTemplate = getEmailTemplate('client_booking_cancelled', {
        bookingType: bookingTypeName,
        clientName: booking.client_name,
        bookingDate: formattedDate,
        startTime: booking.start_time.substring(0, 5),
        reason: 'La reserva fue cancelada por el administrador.',
      });

      if (clientEmailTemplate) {
        await sendEmail({
          to: booking.client_email,
          subject: clientEmailTemplate.subject,
          html: clientEmailTemplate.html,
        });
      }
    }

    return {
      success: true,
      message: 'Reserva eliminada exitosamente',
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Generar slots de tiempo en intervalos de 30 minutos
 */
function generateTimeSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const interval = 30; // Intervalos de 30 minutos

  for (let current = start; current + durationMinutes <= end; current += interval) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + durationMinutes);

    slots.push({
      start: slotStart,
      end: slotEnd,
      display: slotStart,
    });
  }

  return slots;
}

/**
 * Convertir tiempo HH:MM a minutos
 */
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convertir minutos a tiempo HH:MM
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Agregar minutos a un tiempo
 */
function addMinutesToTime(time, minutesToAdd) {
  const totalMinutes = timeToMinutes(time) + minutesToAdd;
  return minutesToTime(totalMinutes);
}

/**
 * Verificar si dos slots de tiempo se solapan
 */
function timeSlotsOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && e1 > s2;
}
