'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Users,
  Briefcase,
  X,
  MapPin,
  Video,
  Ban,
  Star,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isToday,
  startOfWeek,
  endOfWeek,
  isBefore,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PageTransition from '@/components/dashboard/PageTransition';
import AnimatedSection from '@/components/dashboard/AnimatedSection';
import { useSimpleAutoRefresh } from '@/hooks/useAutoRefresh';
import { useToast } from '@/components/ui/Toast';

// Actions públicas
import {
  getAllPublicBookings,
  getPendingPublicBookings,
  confirmPublicBooking,
  rejectPublicBooking,
  deletePublicBooking,
  updatePublicBooking,
} from '@/app/actions/public-booking-actions';

// Actions privadas
import {
  getAllPrivateBookings,
  checkDateAvailability,
} from '@/app/actions/private-booking-actions';

// Actions de configuración
import { getBlockedDates } from '@/app/actions/working-hours-actions';

// Actions para crear eventos privados
import {
  createPrivateBooking,
  updatePrivateBooking,
  deletePrivateBooking
} from '@/app/actions/private-booking-actions';

// Para obtener tipos de servicio
import { createClient } from '@/lib/supabaseClient';

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); // Fecha seleccionada para ver detalles
  const [publicBookings, setPublicBookings] = useState([]);
  const [pendingPublicBookings, setPendingPublicBookings] = useState([]);
  const [privateBookings, setPrivateBookings] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [deletingBooking, setDeletingBooking] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const { showToast } = useToast();

  // Auto-refresh de la agenda cada 10 minutos
  useSimpleAutoRefresh(10);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [publicResult, pendingResult, privateResult, blockedResult] = await Promise.all([
      getAllPublicBookings(),
      getPendingPublicBookings(),
      getAllPrivateBookings(),
      getBlockedDates(),
    ]);

    if (publicResult.success) setPublicBookings(publicResult.bookings);
    if (pendingResult.success) setPendingPublicBookings(pendingResult.bookings);
    if (privateResult.success) setPrivateBookings(privateResult.bookings);
    if (blockedResult.success) setBlockedDates(blockedResult.blockedDates);

    // Cargar service types desde el cliente
    const supabase = createClient();
    const { data: serviceTypesData } = await supabase
      .from('service_types')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (serviceTypesData) setServiceTypes(serviceTypesData);

    setLoading(false);
  };

  // Confirmar reserva pública
  const handleConfirmPublic = async (bookingId) => {
    setProcessingId(bookingId);
    const result = await confirmPublicBooking(bookingId);

    if (result.success) {
      showToast({ message: 'Reunión confirmada', type: 'success' });
      loadData();
      setSelectedBooking(null);
    } else {
      showToast({ message: result.error, type: 'error' });
    }
    setProcessingId(null);
  };

  // Rechazar reserva pública
  const handleRejectPublic = async (bookingId, reason) => {
    setProcessingId(bookingId);
    const result = await rejectPublicBooking(bookingId, reason);

    if (result.success) {
      showToast({ message: 'Reunión rechazada', type: 'success' });
      loadData();
      setSelectedBooking(null);
    } else {
      showToast({ message: result.error, type: 'error' });
    }
    setProcessingId(null);
  };

  // Eliminar reserva pública - abre modal de confirmación
  const handleDeletePublic = (booking) => {
    setDeletingBooking(booking);
    setShowDeleteModal(true);
    setSelectedDate(null); // Cerrar el drawer
  };

  // Eliminar evento privado - abre modal de confirmación
  const handleDeletePrivate = (booking) => {
    setDeletingBooking(booking);
    setShowDeleteModal(true);
    setSelectedDate(null); // Cerrar el drawer
  };

  // Confirmar eliminación (privado o público)
  const confirmDelete = async () => {
    if (!deletingBooking) return;

    setProcessingId(deletingBooking.id);

    // Determinar si es reserva pública o privada
    const isPublicBooking = deletingBooking.booking_type !== undefined;
    const result = isPublicBooking
      ? await deletePublicBooking(deletingBooking.id)
      : await deletePrivateBooking(deletingBooking.id);

    if (result.success) {
      showToast({
        message: isPublicBooking ? 'Reserva eliminada correctamente' : 'Evento eliminado correctamente',
        type: 'success'
      });
      loadData();
      setShowDeleteModal(false);
      setDeletingBooking(null);
    } else {
      showToast({ message: result.error, type: 'error' });
    }
    setProcessingId(null);
  };

  // Editar evento privado
  const handleEditPrivate = (booking) => {
    setEditingBooking(booking);
    setShowEditModal(true);
    setSelectedDate(null); // Cerrar el drawer
  };

  // Editar reserva pública
  const handleEditPublic = (booking) => {
    setEditingBooking(booking);
    setShowEditModal(true);
    setSelectedDate(null); // Cerrar el drawer
  };

  // Navegación del calendario
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Generar días del mes con semana completa
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const daysInCalendar = eachDayOfInterval({ start: startDate, end: endDate });

  // Obtener reservas por día
  const getBookingsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');

    const publicConfirmed = publicBookings.filter(
      (b) => b.status === 'confirmed' && b.booking_date === dateStr
    );

    const privateConfirmed = privateBookings.filter(
      (b) => b.status === 'confirmed' && b.booking_date === dateStr
    );

    const pending = pendingPublicBookings.filter((b) => b.booking_date === dateStr);

    return {
      public: publicConfirmed,
      private: privateConfirmed,
      pending: pending,
      total: publicConfirmed.length + privateConfirmed.length + pending.length,
    };
  };

  // Verificar si un día está bloqueado
  const isDateBlocked = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blockedDates.some((bd) => bd.blocked_date === dateStr);
  };

  if (loading) {
    return (
      <PageTransition>
        <DashboardHeader title="Agenda" subtitle="Gestión de reservas y calendario" />
        <AnimatedSection>
          <div className="flex items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-[#8B5E3C]" />
          </div>
        </AnimatedSection>
      </PageTransition>
    );
  }

  const publicConfirmedCount = publicBookings.filter((b) => b.status === 'confirmed').length;
  const publicPendingCount = pendingPublicBookings.length;
  const privateConfirmedCount = privateBookings.filter((b) => b.status === 'confirmed').length;

  return (
    <PageTransition>
      <DashboardHeader title="Agenda" subtitle="Reuniones y eventos programados" />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header con stats y acciones */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Stats compactas */}
          <div className="flex flex-wrap gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Users size={18} className="text-[#8B5E3C]" />
              <div>
                <p className="font-fira text-xs text-gray-600/70">Reuniones</p>
                <p className="font-fira text-sm font-bold text-gray-900">{publicConfirmedCount}</p>
              </div>
            </motion.div>

            {publicPendingCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Clock size={18} className="text-[#8B5E3C]" />
                <div>
                  <p className="font-fira text-xs text-gray-600/70">Pendientes</p>
                  <p className="font-fira text-sm font-bold text-gray-900">{publicPendingCount}</p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Briefcase size={18} className="text-[#8B5E3C]" />
              <div>
                <p className="font-fira text-xs text-gray-600/70">Eventos</p>
                <p className="font-fira text-sm font-bold text-gray-900">{privateConfirmedCount}</p>
              </div>
            </motion.div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <Link
              href="/dashboard/configuracion/agenda"
              className="px-4 py-2 bg-white border border-gray-200 hover:border-[#8B5E3C] text-gray-900 rounded-xl font-fira text-sm font-semibold transition-all duration-200 flex items-center gap-2 hover:shadow-md"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Configurar</span>
            </Link>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] !text-white rounded-xl font-fira text-sm font-semibold transition-all duration-200 flex items-center gap-2 hover:shadow-xl hover:scale-105"
            >
              <Plus size={16} />
              Nuevo Evento
            </button>
          </div>
        </div>

        {/* Calendario principal */}
        <AnimatedSection>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header del calendario */}
            <div className="bg-[#2D2D2D] p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>

                <h2 className="font-voga text-2xl text-white uppercase">
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h2>

                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="p-3 text-center">
                  <span className="font-fira text-xs font-bold text-[#8B5E3C] uppercase">
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7">
              {daysInCalendar.map((day, index) => {
                const dayBookings = getBookingsForDate(day);
                const isBlocked = isDateBlocked(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const isPast = isBefore(day, startOfDay(new Date()));

                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: isCurrentMonth ? 1.02 : 1 }}
                    whileTap={{ scale: isCurrentMonth ? 0.98 : 1 }}
                    onClick={() => isCurrentMonth && setSelectedDate(day)}
                    className={`
                      relative p-3 min-h-[100px] border-b border-r border-gray-100
                      transition-all duration-200
                      ${!isCurrentMonth ? 'bg-gray-50/30 cursor-default' : 'bg-white hover:bg-gray-50 cursor-pointer'}
                      ${isSelectedDay ? 'ring-2 ring-[#8B5E3C] ring-inset bg-[#8B5E3C]/5' : ''}
                      ${isTodayDate && !isSelectedDay ? 'bg-[#8B5E3C]/5' : ''}
                    `}
                  >
                    {/* Número del día */}
                    <div className="flex items-center justify-center mb-2">
                      <span
                        className={`
                          font-fira text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200
                          ${!isCurrentMonth ? 'text-transparent select-none' : ''}
                          ${isTodayDate && isCurrentMonth ? 'bg-[#8B5E3C] text-white shadow-md' : ''}
                          ${isSelectedDay && !isTodayDate && isCurrentMonth ? 'bg-[#8B5E3C] text-white shadow-md' : ''}
                          ${isPast && !isTodayDate && !isSelectedDay && isCurrentMonth ? 'text-gray-400' : ''}
                          ${isCurrentMonth && !isTodayDate && !isSelectedDay && !isPast ? 'text-gray-900' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Indicadores */}
                    {isCurrentMonth && (
                      <div className="flex flex-col items-center gap-1 mt-1">
                        {/* Bloqueado - Responsive: Solo punto en mobile, texto en desktop */}
                        {isBlocked && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-full px-1"
                          >
                            {/* Mobile: Solo punto rojo grande */}
                            <div className="flex items-center justify-center md:hidden">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" title="Día bloqueado" />
                            </div>
                            {/* Desktop: Chip con icono y texto */}
                            <div className="hidden md:flex items-center justify-center gap-1 py-0.5 px-2 bg-red-600 hover:bg-red-700 rounded-full shadow-sm transition-colors duration-200">
                              <Ban size={10} className="text-white flex-shrink-0" />
                              <span className="font-fira text-[10px] text-white font-semibold whitespace-nowrap">
                                Bloqueado
                              </span>
                            </div>
                          </motion.div>
                        )}

                        {/* Eventos privados - mostrar nombre */}
                        {dayBookings.private.length > 0 && (
                          <div className="w-full px-1 space-y-0.5">
                            {dayBookings.private.slice(0, 2).map((booking, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center justify-center gap-1 px-1.5 py-0.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] rounded-md shadow-sm transition-all duration-200"
                              >
                                <Briefcase size={10} className="text-white flex-shrink-0" />
                                <span className="font-fira text-[10px] md:text-[9px] text-white font-medium truncate">
                                  {booking.client_name}
                                </span>
                              </motion.div>
                            ))}
                            {dayBookings.private.length > 2 && (
                              <div className="text-center font-fira text-[10px] md:text-[9px] text-[#8B5E3C] font-medium">
                                +{dayBookings.private.length - 2} más
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reuniones públicas y pendientes - puntos más grandes y visibles */}
                        <div className="flex items-center justify-center gap-2 mt-0.5">
                          {dayBookings.pending.length > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1"
                            >
                              <div className="w-2 h-2 md:w-1.5 md:h-1.5 rounded-full bg-amber-600 shadow-sm" title="Reuniones pendientes" />
                              <span className="font-fira text-[10px] md:text-[9px] text-amber-700 font-semibold">
                                {dayBookings.pending.length}
                              </span>
                            </motion.div>
                          )}
                          {dayBookings.public.length > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1"
                            >
                              <div className="w-2 h-2 md:w-1.5 md:h-1.5 rounded-full bg-green-600 shadow-sm" title="Reuniones confirmadas" />
                              <span className="font-fira text-[10px] md:text-[9px] text-green-700 font-semibold">
                                {dayBookings.public.length}
                              </span>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* Pendientes de confirmación */}
        {publicPendingCount > 0 && (
          <AnimatedSection delay={0.1}>
            <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock size={24} className="text-amber-700" />
                </div>
                <div>
                  <h3 className="font-voga text-xl text-gray-900">Pendientes de Confirmación</h3>
                  <p className="font-fira text-sm text-amber-700">
                    {publicPendingCount} {publicPendingCount === 1 ? 'reunión' : 'reuniones'} esperando respuesta
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {pendingPublicBookings.slice(0, 5).map((booking) => (
                  <PendingBookingCard
                    key={booking.id}
                    booking={booking}
                    onConfirm={handleConfirmPublic}
                    onReject={handleRejectPublic}
                    processing={processingId === booking.id}
                  />
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}
      </div>

      {/* Modal de creación de evento privado */}
      {showCreateModal && (
        <CreatePrivateBookingModal
          serviceTypes={serviceTypes}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {/* Modal de edición de evento privado */}
      {showEditModal && editingBooking && (
        <EditPrivateBookingModal
          booking={editingBooking}
          serviceTypes={serviceTypes}
          blockedDates={blockedDates}
          onClose={() => {
            setShowEditModal(false);
            setEditingBooking(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingBooking(null);
            loadData();
          }}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && deletingBooking && (
        <DeleteConfirmationModal
          booking={deletingBooking}
          onConfirm={confirmDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingBooking(null);
          }}
          processing={processingId === deletingBooking.id}
        />
      )}

      {/* Panel lateral con detalles del día seleccionado */}
      <DayDetailDrawer
        date={selectedDate}
        bookings={selectedDate ? getBookingsForDate(selectedDate) : null}
        isBlocked={selectedDate ? isDateBlocked(selectedDate) : false}
        onClose={() => setSelectedDate(null)}
        onConfirm={handleConfirmPublic}
        onReject={handleRejectPublic}
        onEditPrivate={handleEditPrivate}
        onEditPublic={handleEditPublic}
        onDeletePrivate={handleDeletePrivate}
        onDeletePublic={handleDeletePublic}
        processing={processingId}
      />
    </PageTransition>
  );
}

// Componente: Card de reserva pendiente
function PendingBookingCard({ booking, onConfirm, onReject, processing }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    onReject(booking.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(121, 80, 42, 0.3)" }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl p-4 border border-gray-200 shadow-md"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {booking.booking_type?.slug === 'videollamada' ? (
                <Video size={16} className="text-[#8B5E3C]" />
              ) : (
                <MapPin size={16} className="text-[#8B5E3C]" />
              )}
              <h4 className="font-fira text-sm font-bold text-gray-900">
                {booking.booking_type?.name || 'Reunión'}
              </h4>
            </div>

            <div className="space-y-1 text-xs text-gray-600/70 font-fira">
              <div className="flex items-center gap-2">
                <User size={12} className="text-[#8B5E3C]" />
                {booking.client_name}
              </div>
              {booking.client_email && (
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-[#8B5E3C]" />
                  {booking.client_email}
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarIcon size={12} className="text-[#8B5E3C]" />
                {format(parseISO(booking.booking_date), "d 'de' MMMM, yyyy", { locale: es })}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-[#8B5E3C]" />
                {booking.start_time} - {booking.end_time}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => onConfirm(booking.id)}
              disabled={processing}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-fira text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-1 hover:shadow-md"
            >
              {processing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              Confirmar
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={processing}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 !text-white rounded-lg font-fira text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-1 hover:shadow-md"
            >
              <XCircle size={12} />
              Rechazar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modal de rechazo */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="font-voga text-xl text-gray-900 mb-2">¿Confirmar rechazo?</h3>
              <p className="font-fira text-sm text-gray-600/70 mb-4">
                Motivo del rechazo (opcional):
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej: No tengo disponibilidad en ese horario"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:border-[#8B5E3C] text-gray-900 rounded-lg font-fira text-sm font-semibold transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 !text-white rounded-lg font-fira text-sm font-semibold transition-all duration-200"
                >
                  Rechazar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Componente: Drawer lateral con detalles del día
function DayDetailDrawer({ date, bookings, isBlocked, onClose, onConfirm, onReject, onEditPrivate, onEditPublic, onDeletePrivate, onDeletePublic, processing }) {
  if (!date || !bookings) return null;

  const allBookings = [
    ...bookings.pending.map((b) => ({ ...b, type: 'pending' })),
    ...bookings.public.map((b) => ({ ...b, type: 'public' })),
    ...bookings.private.map((b) => ({ ...b, type: 'private' })),
  ].sort((a, b) => {
    if (a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }
    return 0;
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#2D2D2D] p-6 z-10 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-voga text-2xl text-white">
                {format(date, 'd', { locale: es })}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
            <p className="font-fira text-white/70">
              {format(date, "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-4">
            {isBlocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
              >
                <Ban size={24} className="text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-fira text-sm font-bold text-red-900">Día bloqueado</p>
                  <p className="font-fira text-xs text-red-700">
                    No se pueden agendar reuniones
                  </p>
                </div>
              </motion.div>
            )}

            {allBookings.length === 0 && !isBlocked && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <CalendarIcon size={48} className="mx-auto text-gray-400/30 mb-3" />
                <p className="font-fira text-gray-500/50">No hay eventos para este día</p>
              </motion.div>
            )}

            {allBookings.map((booking) => (
              <DayBookingCard
                key={`${booking.type}-${booking.id}`}
                booking={booking}
                onConfirm={onConfirm}
                onReject={onReject}
                onEditPrivate={onEditPrivate}
                onEditPublic={onEditPublic}
                onDeletePrivate={onDeletePrivate}
                onDeletePublic={onDeletePublic}
                processing={processing}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Componente: Card de booking en el drawer
function DayBookingCard({ booking, onConfirm, onReject, onEditPrivate, onEditPublic, onDeletePrivate, onDeletePublic, processing }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    onReject(booking.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
  };

  // Estilos según tipo
  const getTypeStyles = () => {
    if (booking.type === 'pending') {
      return {
        bg: 'bg-white',
        border: 'border-gray-200',
        icon: <Clock size={20} className="text-amber-700" />,
        badge: 'bg-amber-100 text-amber-700',
        badgeText: 'Pendiente',
      };
    }
    if (booking.type === 'private') {
      return {
        bg: 'bg-white',
        border: 'border-gray-200',
        icon: <Briefcase size={20} className="text-[#8B5E3C]" />,
        badge: 'bg-amber-100 text-[#8B5E3C]',
        badgeText: 'Evento',
      };
    }
    return {
      bg: 'bg-white',
      border: 'border-gray-200',
      icon: <Users size={20} className="text-green-600" />,
      badge: 'bg-green-600/20 text-green-600',
      badgeText: 'Reunión',
    };
  };

  const styles = getTypeStyles();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(121, 80, 42, 0.3)" }}
        transition={{ duration: 0.2 }}
        className={`${styles.bg} border ${styles.border} rounded-xl p-4 shadow-md`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          {styles.icon}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 ${styles.badge} rounded-full font-fira text-xs font-bold`}>
                {styles.badgeText}
              </span>
            </div>
            <h4 className="font-fira text-sm font-bold text-gray-900">
              {booking.booking_type?.name || booking.service_type?.name || 'Sin título'}
            </h4>
          </div>
        </div>

        <div className="space-y-2 text-xs text-gray-600 font-fira mb-3">
          <div className="flex items-center gap-2">
            <User size={12} className="text-gray-500" />
            <span className="font-medium">{booking.client_name}</span>
          </div>
          {booking.client_email && (
            <div className="flex items-center gap-2">
              <Mail size={12} className="text-gray-500" />
              {booking.client_email}
            </div>
          )}
          {booking.client_phone && (
            <div className="flex items-center gap-2">
              <Phone size={12} className="text-gray-500" />
              {booking.client_phone}
            </div>
          )}
          {booking.start_time && booking.end_time && (
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-gray-500" />
              <span className="font-medium">
                {booking.start_time} - {booking.end_time}
              </span>
            </div>
          )}
          {booking.notes && (
            <div className="flex items-start gap-2 mt-3 p-2 bg-gray-100 rounded-lg">
              <MessageSquare size={12} className="mt-0.5 flex-shrink-0 text-gray-500" />
              <span className="text-gray-600/80 italic">{booking.notes}</span>
            </div>
          )}
        </div>

        {booking.type === 'pending' && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => onConfirm(booking.id)}
              disabled={processing === booking.id}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-fira text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 hover:shadow-md"
            >
              {processing === booking.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Confirmar
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={processing === booking.id}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 !text-white rounded-lg font-fira text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 hover:shadow-md"
            >
              <XCircle size={14} />
              Rechazar
            </button>
          </div>
        )}

        {booking.type === 'public' && booking.status === 'confirmed' && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => onEditPublic(booking)}
              disabled={processing === booking.id}
              className="px-3 py-2 bg-[#8B5E3C] hover:bg-[#6d4a2f] !text-white rounded-lg font-fira text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 hover:shadow-md"
            >
              <Edit2 size={14} />
              Editar
            </button>
            <button
              onClick={() => onDeletePublic(booking)}
              disabled={processing === booking.id}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 !text-white rounded-lg font-fira text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 hover:shadow-md"
            >
              {processing === booking.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Eliminar
            </button>
          </div>
        )}

        {booking.type === 'private' && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => onEditPrivate(booking)}
              disabled={processing === booking.id}
              className="px-3 py-2 bg-[#8B5E3C] hover:bg-[#6d4a2f] !text-white rounded-lg font-fira text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 hover:shadow-md"
            >
              <Edit2 size={14} />
              Editar
            </button>
            <button
              onClick={() => onDeletePrivate(booking)}
              disabled={processing === booking.id}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 !text-white rounded-lg font-fira text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5 hover:shadow-md"
            >
              {processing === booking.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Eliminar
            </button>
          </div>
        )}
      </motion.div>

      {/* Modal de rechazo */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="font-voga text-xl text-gray-900 mb-2">¿Confirmar rechazo?</h3>
              <p className="font-fira text-sm text-gray-600/70 mb-4">
                Motivo del rechazo (opcional):
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej: No tengo disponibilidad en ese horario"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:border-[#8B5E3C] text-gray-900 rounded-lg font-fira text-sm font-semibold transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 !text-white rounded-lg font-fira text-sm font-semibold transition-all duration-200"
                >
                  Rechazar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Modal para crear evento privado
function CreatePrivateBookingModal({ serviceTypes, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    serviceTypeId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    bookingDate: '',
    notes: '',
    internalNotes: '',
  });

  // Verificar disponibilidad cuando cambia la fecha
  useEffect(() => {
    if (formData.bookingDate) {
      checkAvailability();
    }
  }, [formData.bookingDate]);

  const checkAvailability = async () => {
    const result = await checkDateAvailability(formData.bookingDate);
    if (result.success) {
      if (result.available) {
        setAvailabilityMessage(`✅ ${result.message}`);
      } else {
        setAvailabilityMessage(`⚠️ ${result.message || result.reason}`);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const result = await createPrivateBooking({
      serviceTypeId: formData.serviceTypeId,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail || null,
      clientPhone: formData.clientPhone || null,
      bookingDate: formData.bookingDate,
      notes: formData.notes,
      internalNotes: formData.internalNotes,
    });

    if (result.success) {
      showToast({ message: 'Evento creado correctamente', type: 'success' });
      onSuccess();
    } else {
      showToast({ message: result.error, type: 'error' });
    }

    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl p-6 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Briefcase size={24} className="text-[#8B5E3C]" />
          </div>
          <div>
            <h3 className="font-voga text-xl text-gray-900">Nuevo Evento</h3>
            <p className="font-fira text-sm text-gray-600/70">Bodas, quinceañeras, eventos empresariales</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de servicio */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Tipo de Evento *
            </label>
            <select
              required
              value={formData.serviceTypeId}
              onChange={(e) => handleInputChange('serviceTypeId', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
            >
              <option value="">Seleccioná un tipo</option>
              {serviceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Fecha del Evento *
            </label>
            <input
              type="date"
              required
              value={formData.bookingDate}
              onChange={(e) => handleInputChange('bookingDate', e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
            />
            {availabilityMessage && (
              <p
                className={`mt-2 font-fira text-xs ${
                  availabilityMessage.startsWith('✅') ? 'text-green-600' : 'text-amber-700'
                }`}
              >
                {availabilityMessage}
              </p>
            )}
          </div>

          {/* Nombre del cliente */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              placeholder="Ej: María González"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) => handleInputChange('clientEmail', e.target.value)}
              placeholder="cliente@ejemplo.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => handleInputChange('clientPhone', e.target.value)}
              placeholder="+598 99 123 456"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
            />
          </div>

          {/* Notas del cliente */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Notas del Cliente
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Información adicional visible para el cliente..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] resize-none"
            />
          </div>

          {/* Notas internas */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Notas Internas
            </label>
            <textarea
              value={formData.internalNotes}
              onChange={(e) => handleInputChange('internalNotes', e.target.value)}
              placeholder="Notas privadas (solo visibles para vos)..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] resize-none"
            />
          </div>

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="font-fira text-xs text-[#8B5E3C]">
              <strong>Nota:</strong> Máximo 2 eventos por día (2 salones disponibles)
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-200 text-gray-900 rounded-lg font-fira text-sm font-semibold transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] !text-white rounded-lg font-fira text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Crear Evento
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Modal para editar evento (privado o público)
function EditPrivateBookingModal({ booking, serviceTypes, blockedDates = [], onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [isDateBlocked, setIsDateBlocked] = useState(false);
  const { showToast } = useToast();

  // Detectar si es una reserva pública (tiene booking_type) o privada (tiene service_type)
  const isPublicBooking = !!booking.booking_type_id || !!booking.booking_type;

  const [formData, setFormData] = useState({
    serviceTypeId: booking.service_type_id || '',
    clientName: booking.client_name,
    clientEmail: booking.client_email || '',
    clientPhone: booking.client_phone || '',
    bookingDate: booking.booking_date,
    startTime: booking.start_time || '',
    endTime: booking.end_time || '',
    notes: booking.notes || '',
    internalNotes: booking.internal_notes || '',
  });

  // Verificar disponibilidad cuando cambia la fecha
  useEffect(() => {
    if (formData.bookingDate) {
      // Verificar si el día está bloqueado
      const blocked = blockedDates.some((bd) => bd.blocked_date === formData.bookingDate);
      setIsDateBlocked(blocked);

      if (blocked) {
        setAvailabilityMessage('❌ Este día está bloqueado - no se pueden agendar eventos');
      } else if (!isPublicBooking) {
        if (formData.bookingDate !== booking.booking_date) {
          checkAvailability();
        } else {
          setAvailabilityMessage('✅ Misma fecha actual');
        }
      } else {
        // Para reservas públicas, solo verificar si está bloqueado
        if (formData.bookingDate === booking.booking_date) {
          setAvailabilityMessage('✅ Misma fecha actual');
        } else {
          setAvailabilityMessage('✅ Fecha disponible');
        }
      }
    }
  }, [formData.bookingDate, isPublicBooking, blockedDates]);

  const checkAvailability = async () => {
    const result = await checkDateAvailability(formData.bookingDate);
    if (result.success) {
      if (result.available) {
        setAvailabilityMessage(`✅ ${result.message}`);
      } else {
        setAvailabilityMessage(`⚠️ ${result.message || result.reason}`);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    let result;

    if (isPublicBooking) {
      // Actualizar reserva pública
      result = await updatePublicBooking(booking.id, {
        client_name: formData.clientName,
        client_email: formData.clientEmail || null,
        client_phone: formData.clientPhone || null,
        booking_date: formData.bookingDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        notes: formData.notes,
        internal_notes: formData.internalNotes,
      });
    } else {
      // Actualizar reserva privada
      result = await updatePrivateBooking(booking.id, {
        service_type_id: formData.serviceTypeId,
        client_name: formData.clientName,
        client_email: formData.clientEmail || null,
        client_phone: formData.clientPhone || null,
        booking_date: formData.bookingDate,
        notes: formData.notes,
        internal_notes: formData.internalNotes,
      });
    }

    if (result.success) {
      showToast({ message: isPublicBooking ? 'Reserva actualizada correctamente' : 'Evento actualizado correctamente', type: 'success' });
      onSuccess();
    } else {
      showToast({ message: result.error, type: 'error' });
    }

    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl p-6 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Edit2 size={24} className="text-[#8B5E3C]" />
          </div>
          <div>
            <h3 className="font-voga text-xl text-gray-900">
              {isPublicBooking ? 'Editar Reserva' : 'Editar Evento'}
            </h3>
            <p className="font-fira text-sm text-gray-900/70">
              {isPublicBooking ? 'Modificar detalles de la reserva' : 'Modificar detalles del evento'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de evento/reserva - Solo mostrar selector para eventos privados */}
          {isPublicBooking ? (
            // Para reservas públicas, mostrar el tipo como info (no editable)
            <div>
              <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
                Tipo de Reserva
              </label>
              <div className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-fira text-sm text-gray-700">
                {booking.booking_type?.name || 'Reserva'}
              </div>
            </div>
          ) : (
            // Para eventos privados, mostrar selector de tipo de servicio
            <div>
              <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
                Tipo de Evento *
              </label>
              <select
                required
                value={formData.serviceTypeId}
                onChange={(e) => handleInputChange('serviceTypeId', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
              >
                <option value="">Seleccioná un tipo</option>
                {serviceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              {isPublicBooking ? 'Fecha de la Reserva *' : 'Fecha del Evento *'}
            </label>
            <input
              type="date"
              required
              value={formData.bookingDate}
              onChange={(e) => handleInputChange('bookingDate', e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className={`w-full px-3 py-2.5 border rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] ${isDateBlocked ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
            />
            {availabilityMessage && (
              <p
                className={`mt-2 font-fira text-xs ${
                  availabilityMessage.startsWith('✅') ? 'text-green-600' : availabilityMessage.startsWith('❌') ? 'text-red-600 font-semibold' : 'text-amber-700'
                }`}
              >
                {availabilityMessage}
              </p>
            )}
          </div>

          {/* Horarios - Solo para reservas públicas */}
          {isPublicBooking && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
                  Hora Inicio *
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime?.substring(0, 5) || ''}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
                />
              </div>
              <div>
                <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
                  Hora Fin *
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime?.substring(0, 5) || ''}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
                />
              </div>
            </div>
          )}

          {/* Nombre del cliente */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              placeholder="Ej: María González"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) => handleInputChange('clientEmail', e.target.value)}
              placeholder="cliente@ejemplo.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => handleInputChange('clientPhone', e.target.value)}
              placeholder="+598 99 123 456"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C]"
            />
          </div>

          {/* Notas del cliente */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Notas del Cliente
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Información adicional visible para el cliente..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] resize-none"
            />
          </div>

          {/* Notas internas */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-900 mb-2">
              Notas Internas
            </label>
            <textarea
              value={formData.internalNotes}
              onChange={(e) => handleInputChange('internalNotes', e.target.value)}
              placeholder="Notas privadas (solo visibles para vos)..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-200 text-gray-900 rounded-lg font-fira text-sm font-semibold transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || isDateBlocked}
              className="flex-1 px-4 py-2.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] !text-white rounded-lg font-fira text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Actualizando...
                </>
              ) : isDateBlocked ? (
                <>
                  <Ban size={16} />
                  Día Bloqueado
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {isPublicBooking ? 'Actualizar Reserva' : 'Actualizar Evento'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Modal de confirmación de eliminación
function DeleteConfirmationModal({ booking, onConfirm, onClose, processing }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl"
        >
          {/* Header con icono de advertencia */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-voga text-xl text-gray-900">¿Eliminar evento?</h3>
              <p className="font-fira text-sm text-gray-900/70">Esta acción no se puede deshacer</p>
            </div>
          </div>

          {/* Información del evento */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-fira text-sm text-gray-900/70 mb-2">
              Estás por eliminar este evento:
            </p>
            <div className="space-y-1 font-fira text-sm">
              <p className="text-gray-900">
                <strong>Servicio:</strong> {booking.service_type?.name || 'Sin especificar'}
              </p>
              <p className="text-gray-900">
                <strong>Cliente:</strong> {booking.client_name}
              </p>
              <p className="text-gray-900">
                <strong>Fecha:</strong>{' '}
                {format(parseISO(booking.booking_date), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:border-[#8B5E3C] text-gray-900 rounded-lg font-fira text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={processing}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 !text-white rounded-lg font-fira text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Eliminar
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
