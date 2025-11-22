'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Calendar,
  XCircle,
  Plus,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PageTransition from '@/components/dashboard/PageTransition';
import AnimatedSection from '@/components/dashboard/AnimatedSection';
import { useToast } from '@/components/ui/Toast';

import {
  getWorkingHours,
  updateWorkingHours,
  getBlockedDates,
  blockDate,
  unblockDate,
  getBlockedTimeSlots,
  blockTimeSlot,
  unblockTimeSlot,
  getPublicBookingTypes,
  updatePublicBookingType,
} from '@/app/actions/working-hours-actions';

import { getAllPublicBookings } from '@/app/actions/public-booking-actions';
import { getAllPrivateBookings } from '@/app/actions/private-booking-actions';

export default function AgendaConfigPage() {
  const [activeTab, setActiveTab] = useState('horarios'); // 'horarios', 'bloqueos', 'tipos'
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // La carga específica se hace en cada tab
    setLoading(false);
  };

  if (loading) {
    return (
      <PageTransition>
        <DashboardHeader
          title="Configuración de Agenda"
          subtitle="Gestiona horarios, bloqueos y tipos de reunión"
        />
        <AnimatedSection>
          <div className="flex items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-[#79502A]" />
          </div>
        </AnimatedSection>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <DashboardHeader
        title="Configuración de Agenda"
        subtitle="Gestiona horarios, bloqueos y tipos de reunión"
        backButton={true}
        backHref="/dashboard/configuracion"
      />

      {/* Tabs */}
      <AnimatedSection delay={0.1}>
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('horarios')}
            className={`px-4 py-3 font-fira text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'horarios'
                ? 'border-[#79502A] text-[#79502A]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} />
              Horarios de Trabajo
            </div>
          </button>

          <button
            onClick={() => setActiveTab('bloqueos')}
            className={`px-4 py-3 font-fira text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'bloqueos'
                ? 'border-[#79502A] text-[#79502A]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <XCircle size={16} />
              Bloqueos
            </div>
          </button>

          <button
            onClick={() => setActiveTab('tipos')}
            className={`px-4 py-3 font-fira text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'tipos'
                ? 'border-[#79502A] text-[#79502A]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={16} />
              Tipos de Reunión
            </div>
          </button>
        </div>
      </AnimatedSection>

      {/* Contenido de tabs */}
      {activeTab === 'horarios' && <WorkingHoursTab />}
      {activeTab === 'bloqueos' && <BlockedDatesTab />}
      {activeTab === 'tipos' && <BookingTypesTab />}
    </PageTransition>
  );
}

// ============================================
// TAB: HORARIOS DE TRABAJO
// ============================================
function WorkingHoursTab() {
  const [workingHours, setWorkingHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
  ];

  useEffect(() => {
    loadWorkingHours();
  }, []);

  const loadWorkingHours = async () => {
    setLoading(true);
    const result = await getWorkingHours();
    if (result.success) {
      setWorkingHours(result.workingHours);
    }
    setLoading(false);
  };

  const handleDayChange = (dayOfWeek, field, value) => {
    setWorkingHours((prev) =>
      prev.map((wh) => {
        if (wh.day_of_week === dayOfWeek) {
          // Si se está activando el día laborable y los horarios son null, setear valores por defecto
          if (field === 'is_working_day' && value === true) {
            return {
              ...wh,
              [field]: value,
              start_time: wh.start_time || '09:00:00',
              end_time: wh.end_time || '18:00:00',
            };
          }
          return { ...wh, [field]: value };
        }
        return wh;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateWorkingHours(workingHours);

    if (result.success) {
      showToast({ message: 'Horarios actualizados correctamente', type: 'success' });
    } else {
      showToast({ message: result.error, type: 'error' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AnimatedSection delay={0.2}>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#79502A]" />
        </div>
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection delay={0.2}>
      <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm">
        <div className="mb-6">
          <h3 className="font-voga text-xl text-gray-900 mb-2">Horarios de Atención</h3>
          <p className="font-fira text-sm text-gray-600">
            Configurá los días y horarios en los que aceptás reuniones públicas
          </p>
        </div>

        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const dayData = workingHours.find((wh) => wh.day_of_week === day.value);

            return (
              <div
                key={day.value}
                className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border border-gray-200 rounded-lg"
              >
                {/* Día de la semana */}
                <div className="md:w-32">
                  <p className="font-fira font-medium text-gray-900">{day.label}</p>
                </div>

                {/* Checkbox activo */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayData?.is_working_day || false}
                    onChange={(e) =>
                      handleDayChange(day.value, 'is_working_day', e.target.checked)
                    }
                    className="w-5 h-5 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] cursor-pointer"
                  />
                  <span className="font-fira text-sm text-gray-700">Día laborable</span>
                </label>

                {/* Horarios */}
                {dayData?.is_working_day && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                    <div className="flex-1 min-w-0">
                      <label className="block font-fira text-xs text-gray-600 mb-1">Desde</label>
                      <input
                        type="time"
                        value={dayData?.start_time?.substring(0, 5) || '09:00'}
                        onChange={(e) => handleDayChange(day.value, 'start_time', e.target.value + ':00')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#79502A]/20 focus:border-[#79502A]"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <label className="block font-fira text-xs text-gray-600 mb-1">Hasta</label>
                      <input
                        type="time"
                        value={dayData?.end_time?.substring(0, 5) || '18:00'}
                        onChange={(e) => handleDayChange(day.value, 'end_time', e.target.value + ':00')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#79502A]/20 focus:border-[#79502A]"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botón guardar */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#79502A] hover:bg-[#8B5A2F] disabled:bg-gray-400 text-white rounded-lg font-fira text-sm font-medium transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ============================================
// TAB: DÍAS BLOQUEADOS
// ============================================
function BlockedDatesTab() {
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadBlockedDates();
  }, []);

  const loadBlockedDates = async () => {
    setLoading(true);
    const result = await getBlockedDates();
    if (result.success) {
      setBlockedDates(result.blockedDates);
    }
    setLoading(false);
  };

  const handleUnblock = async (dateId) => {
    const result = await unblockDate(dateId);
    if (result.success) {
      showToast({ message: 'Día desbloqueado', type: 'success' });
      loadBlockedDates();
    } else {
      showToast({ message: result.error, type: 'error' });
    }
  };

  if (loading) {
    return (
      <AnimatedSection delay={0.2}>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#79502A]" />
        </div>
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection delay={0.2}>
      <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-voga text-xl text-gray-900 mb-2">Días Bloqueados</h3>
            <p className="font-fira text-sm text-gray-600">
              Gestioná los días en los que no aceptás reservas
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#79502A] hover:bg-[#8B5A2F] text-white rounded-lg font-fira text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Bloquear Días
          </button>
        </div>

        {blockedDates.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="font-fira text-gray-600">No hay días bloqueados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedDates.map((bd) => (
              <div
                key={bd.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div>
                  <p className="font-fira font-medium text-gray-900">
                    {format(parseISO(bd.blocked_date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  {bd.reason && (
                    <p className="font-fira text-sm text-gray-600 mt-1">{bd.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleUnblock(bd.id)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-fira text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddBlockedDateModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadBlockedDates();
          }}
        />
      )}
    </AnimatedSection>
  );
}

// Modal para agregar días bloqueados (múltiples)
function AddBlockedDateModal({ onClose, onSuccess }) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [datesWithEvents, setDatesWithEvents] = useState(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { showToast } = useToast();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const calendarDays = [
    ...Array(startDayOfWeek).fill(null),
    ...daysInMonth,
  ];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Verificar fechas con eventos al abrir el modal
  useEffect(() => {
    checkAllDatesForEvents();
  }, [currentMonth]);

  const checkAllDatesForEvents = async () => {
    setChecking(true);

    const [publicResult, privateResult] = await Promise.all([
      getAllPublicBookings(),
      getAllPrivateBookings(),
    ]);

    if (publicResult.success && privateResult.success) {
      const datesSet = new Set();

      // Verificar todas las fechas del mes
      daysInMonth.forEach((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');

        const publicCount = publicResult.bookings.filter(
          (b) => b.booking_date === dateStr && b.status === 'confirmed'
        ).length;

        const privateCount = privateResult.bookings.filter(
          (b) => b.booking_date === dateStr && b.status === 'confirmed'
        ).length;

        if (publicCount + privateCount > 0) {
          datesSet.add(dateStr);
        }
      });

      setDatesWithEvents(datesSet);
    }

    setChecking(false);
  };

  const toggleDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');

    // No permitir seleccionar fechas con eventos
    if (datesWithEvents.has(dateStr)) {
      showToast({
        message: 'Esta fecha tiene eventos confirmados y no se puede bloquear',
        type: 'error',
      });
      return;
    }

    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedDates.length === 0) {
      showToast({
        message: 'Seleccioná al menos una fecha para bloquear',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);

    // Bloquear todas las fechas seleccionadas
    const results = await Promise.all(
      selectedDates.map((date) => blockDate(date, reason))
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      showToast({
        message: `${successCount} día${successCount > 1 ? 's' : ''} bloqueado${successCount > 1 ? 's' : ''} correctamente`,
        type: 'success',
      });
    }

    if (failCount > 0) {
      showToast({
        message: `Error al bloquear ${failCount} fecha${failCount > 1 ? 's' : ''}`,
        type: 'error',
      });
    }

    setSubmitting(false);

    if (successCount > 0) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="font-voga text-xl text-gray-900 mb-2">Bloquear Días</h3>
        <p className="font-fira text-sm text-gray-600 mb-6">
          Seleccioná uno o más días para bloquearlos. Los días con eventos confirmados no se pueden bloquear.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Calendario para seleccionar múltiples fechas */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-700 mb-3">
              Seleccionar fechas *
            </label>

            {/* Navegación del calendario */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-fira font-medium text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
                <div
                  key={i}
                  className="text-center font-fira text-xs font-semibold text-gray-600 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} />;
                }

                const dateStr = format(day, 'yyyy-MM-dd');
                const isPast = isBefore(day, startOfToday());
                const isSelected = selectedDates.includes(dateStr);
                const hasEvents = datesWithEvents.has(dateStr);

                return (
                  <button
                    key={day.toString()}
                    type="button"
                    onClick={() => !isPast && toggleDate(day)}
                    disabled={isPast}
                    className={`
                      relative p-2 rounded-lg border-2 transition-all font-fira text-sm
                      ${isSelected
                        ? 'border-[#79502A] bg-[#79502A] text-white'
                        : hasEvents
                        ? 'border-red-300 bg-red-50 text-red-400 cursor-not-allowed'
                        : 'border-gray-200 hover:border-[#79502A] hover:bg-[#79502A]/5 text-gray-900'
                      }
                      ${isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {format(day, 'd')}
                    {hasEvents && !isPast && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs font-fira">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#79502A] bg-[#79502A] rounded"></div>
                <span className="text-gray-600">Seleccionado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-300 bg-red-50 rounded relative">
                  <span className="absolute top-0 right-0 w-1 h-1 bg-red-500 rounded-full"></span>
                </div>
                <span className="text-gray-600">Con eventos (no se puede bloquear)</span>
              </div>
            </div>

            {/* Contador de días seleccionados */}
            {selectedDates.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-fira text-sm text-green-900">
                  <CheckCircle size={14} className="inline mr-1" />
                  {selectedDates.length} día{selectedDates.length > 1 ? 's' : ''} seleccionado{selectedDates.length > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Mensaje de verificación */}
            {checking && (
              <div className="mt-3 flex items-center gap-2 text-gray-600">
                <Loader2 size={14} className="animate-spin" />
                <span className="font-fira text-xs">Verificando eventos...</span>
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block font-fira text-sm font-medium text-gray-700 mb-2">
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ej: Vacaciones, feriado, evento personal..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-fira text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#79502A]/20 focus:border-[#79502A]"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-fira text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || selectedDates.length === 0}
              className="flex-1 px-4 py-2 bg-[#79502A] hover:bg-[#8B5A2F] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-fira text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Bloqueando...
                </>
              ) : (
                `Bloquear ${selectedDates.length > 0 ? selectedDates.length : ''} día${selectedDates.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================
// TAB: TIPOS DE REUNIÓN
// ============================================
function BookingTypesTab() {
  const [bookingTypes, setBookingTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadBookingTypes();
  }, []);

  const loadBookingTypes = async () => {
    setLoading(true);
    const result = await getPublicBookingTypes();
    if (result.success) {
      setBookingTypes(result.bookingTypes);
    }
    setLoading(false);
  };

  const handleToggleActive = async (id, currentState) => {
    const result = await updatePublicBookingType(id, { is_active: !currentState });

    if (result.success) {
      showToast({
        message: currentState ? 'Tipo desactivado' : 'Tipo activado',
        type: 'success',
      });
      loadBookingTypes();
    } else {
      showToast({ message: result.error, type: 'error' });
    }
  };

  if (loading) {
    return (
      <AnimatedSection delay={0.2}>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#79502A]" />
        </div>
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection delay={0.2}>
      <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm">
        <div className="mb-6">
          <h3 className="font-voga text-xl text-gray-900 mb-2">Tipos de Reunión Pública</h3>
          <p className="font-fira text-sm text-gray-600">
            Gestioná los tipos de reuniones que los clientes pueden agendar
          </p>
        </div>

        <div className="space-y-3">
          {bookingTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-fira font-semibold text-gray-900">{type.name}</h4>
                <p className="font-fira text-sm text-gray-600 mt-1">{type.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="font-fira text-xs text-gray-500">
                    <Clock size={12} className="inline mr-1" />
                    {type.duration_minutes} minutos
                  </span>
                  <span className="font-fira text-xs text-gray-500">Slug: {type.slug}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={() => setEditingType(type)}
                  className="px-3 py-1.5 bg-[#79502A] hover:bg-[#8B5A2F] text-white rounded-lg font-fira text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Settings size={14} />
                  Editar
                </button>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={type.is_active}
                    onChange={() => handleToggleActive(type.id, type.is_active)}
                    className="w-5 h-5 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] cursor-pointer"
                  />
                  <span className="font-fira text-sm text-gray-700">Activo</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="font-fira text-sm text-[#79502A]">
            💡 <strong>Tip:</strong> Podés editar la duración de cada tipo de reunión y activar/desactivar según tus necesidades. Los tipos desactivados no aparecerán en el formulario público de reservas.
          </p>
        </div>
      </div>

      {editingType && (
        <EditBookingTypeModal
          bookingType={editingType}
          onClose={() => setEditingType(null)}
          onSuccess={() => {
            setEditingType(null);
            loadBookingTypes();
          }}
        />
      )}
    </AnimatedSection>
  );
}

// Modal para editar tipo de reunión
function EditBookingTypeModal({ bookingType, onClose, onSuccess }) {
  const [durationMinutes, setDurationMinutes] = useState(bookingType.duration_minutes);
  const [description, setDescription] = useState(bookingType.description || '');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (durationMinutes < 15 || durationMinutes > 480) {
      showToast({
        message: 'La duración debe estar entre 15 y 480 minutos (8 horas)',
        type: 'error',
      });
      return;
    }

    setSubmitting(true);

    const result = await updatePublicBookingType(bookingType.id, {
      duration_minutes: parseInt(durationMinutes),
      description: description.trim() || null,
    });

    if (result.success) {
      showToast({ message: 'Tipo de reunión actualizado', type: 'success' });
      onSuccess();
    } else {
      showToast({ message: result.error, type: 'error' });
    }

    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Users size={20} className="text-[#79502A]" />
          </div>
          <div>
            <h3 className="font-voga text-xl text-gray-900">Editar Tipo de Reunión</h3>
            <p className="font-fira text-sm text-gray-600">{bookingType.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-fira text-sm font-medium text-gray-700 mb-2">
              Duración (minutos) *
            </label>
            <input
              type="number"
              required
              min="15"
              max="480"
              step="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-fira text-sm focus:outline-none focus:ring-2 focus:ring-[#79502A]/20 focus:border-[#79502A]"
            />
            <p className="mt-1 font-fira text-xs text-gray-500">
              Mínimo: 15 min • Máximo: 480 min (8 horas) • Incrementos de 15 min
            </p>
          </div>

          <div>
            <label className="block font-fira text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del tipo de reunión..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-fira text-sm focus:outline-none focus:ring-2 focus:ring-[#79502A]/20 focus:border-[#79502A] resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-fira text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-[#79502A] hover:bg-[#8B5A2F] disabled:bg-gray-400 text-white rounded-lg font-fira text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
