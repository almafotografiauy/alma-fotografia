'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Send,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfToday,
} from 'date-fns';
import { es } from 'date-fns/locale';

import {
  getPublicBookingTypes,
  getAvailableSlots,
  createPublicBooking,
  getBlockedDates,
} from '@/app/actions/public-booking-actions';

/**
 * Reservas - Formulario de reserva público elegante
 * Fondo claro con detalles marrones
 */
export default function Reservas() {
  const [step, setStep] = useState(1);
  const [bookingTypes, setBookingTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [nonWorkingDays, setNonWorkingDays] = useState([]);

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);

    // Cargar tipos de reserva y fechas bloqueadas en paralelo
    const [typesResult, blockedResult] = await Promise.all([
      getPublicBookingTypes(),
      getBlockedDates(),
    ]);

    if (typesResult.success) {
      setBookingTypes(typesResult.bookingTypes);
    }

    if (blockedResult.success) {
      setBlockedDates(blockedResult.blockedDates);
      setNonWorkingDays(blockedResult.nonWorkingDays);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedDate && selectedType) {
      loadSlots();
    }
  }, [selectedDate, selectedType]);

  const loadSlots = async () => {
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const result = await getAvailableSlots(selectedType.id, dateStr);

    if (result.success) {
      setAvailableSlots(result.slots);
    } else {
      setError(result.error);
    }

    setLoadingSlots(false);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep(2);
  };

  // Verificar si una fecha está bloqueada
  const isDateBlocked = (date) => {
    // Verificar si es un día no laborable (por día de la semana)
    const dayOfWeek = date.getDay();
    if (nonWorkingDays.includes(dayOfWeek)) return true;

    // Verificar si está en la lista de fechas bloqueadas específicas
    const dateStr = format(date, 'yyyy-MM-dd');
    if (blockedDates.includes(dateStr)) return true;

    return false;
  };

  const handleDateSelect = (date) => {
    if (isBefore(date, startOfToday())) return;
    if (isDateBlocked(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep(3);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep(4);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientName || !formData.clientEmail || !formData.clientPhone) {
      setError('Por favor completá todos los campos requeridos');
      return;
    }

    setError(null);
    setSubmitting(true);

    const result = await createPublicBooking({
      bookingTypeId: selectedType.id,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      bookingDate: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedSlot.start,
      notes: formData.notes,
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }

    setSubmitting(false);
  };

  const resetForm = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setFormData({ clientName: '', clientEmail: '', clientPhone: '', notes: '' });
    setSuccess(false);
    setError(null);
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const calendarDays = [...Array(startDayOfWeek).fill(null), ...daysInMonth];

  // Detalles decorativos reutilizables - Ahora en marrón
  const DecorativeDots = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className="h-px w-6 sm:w-8 bg-gradient-to-r from-transparent to-[#8B5E3C]" />
      <div className="w-1 h-1 rounded-full bg-[#8B5E3C]" />
      <div className="w-1.5 h-1.5 rounded-full bg-[#6d4a2f]" />
      <div className="w-1 h-1 rounded-full bg-[#8B5E3C]" />
      <div className="h-px w-6 sm:w-8 bg-gradient-to-l from-transparent to-[#8B5E3C]" />
    </div>
  );

  // Esquinas decorativas - Ahora en marrón
  const DecorativeCorners = ({ children, className = '' }) => (
    <div className={`relative ${className}`}>
      <div className="absolute -top-1.5 -left-1.5 sm:-top-2 sm:-left-2 w-4 h-4 sm:w-6 sm:h-6">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#8B5E3C] to-transparent" />
        <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#8B5E3C] to-transparent" />
      </div>
      <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6">
        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#8B5E3C] to-transparent" />
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-[#8B5E3C] to-transparent" />
      </div>
      <div className="absolute -bottom-1.5 -left-1.5 sm:-bottom-2 sm:-left-2 w-4 h-4 sm:w-6 sm:h-6">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#8B5E3C] to-transparent" />
        <div className="absolute bottom-0 left-0 w-[1px] h-full bg-gradient-to-t from-[#8B5E3C] to-transparent" />
      </div>
      <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6">
        <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#8B5E3C] to-transparent" />
        <div className="absolute bottom-0 right-0 w-[1px] h-full bg-gradient-to-t from-[#8B5E3C] to-transparent" />
      </div>
      {children}
    </div>
  );

  if (loading) {
    return (
      <section id="reservas" className="py-16 sm:py-24 lg:py-32 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reservas" className="py-16 sm:py-24 lg:py-32 bg-[#faf8f5] relative overflow-hidden">
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-[#8B5E3C] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-[#6d4a2f] rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <DecorativeDots />
          <h2 className="font-voga text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#2d2d2d] mb-4">
            Reserva tu Sesión
          </h2>
          <div className="w-12 sm:w-16 h-px bg-gradient-to-r from-transparent via-[#8B5E3C] to-transparent mx-auto mb-4 sm:mb-6" />
          <p className="font-fira text-sm sm:text-base lg:text-lg text-[#5a5a5a] max-w-xl mx-auto px-4">
            Seleccioná el tipo de reunión, elegí tu fecha y horario favorito
          </p>
        </motion.div>

        {/* Success State */}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8 sm:py-16"
            >
              <DecorativeCorners className="inline-block p-6 sm:p-10 lg:p-12 bg-white shadow-sm">
                <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-[#8B5E3C] flex items-center justify-center">
                  <CheckCircle size={28} className="text-white sm:w-10 sm:h-10" />
                </div>
                <h3 className="font-voga text-2xl sm:text-3xl text-[#2d2d2d] mb-4">¡Solicitud Enviada!</h3>
                <p className="font-fira text-[#5a5a5a] text-sm sm:text-base mb-2">
                  Tu solicitud de <span className="text-[#8B5E3C] font-medium">{selectedType?.name}</span>
                </p>
                <p className="font-fira text-[#5a5a5a] text-sm sm:text-base mb-2">
                  para el {format(selectedDate, "d 'de' MMMM", { locale: es })} a las {selectedSlot?.start}
                </p>
                <p className="font-fira text-[#8a8a8a] text-xs sm:text-sm mb-6 sm:mb-8">
                  Recibirás un correo de confirmación pronto
                </p>
                <button
                  onClick={resetForm}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 border border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#8B5E3C] hover:!text-white font-fira text-xs sm:text-sm uppercase tracking-wider transition-all duration-300"
                >
                  Agendar Otra Reunión
                </button>
              </DecorativeCorners>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 sm:mb-12 px-2">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="flex items-center">
                    <button
                      onClick={() => {
                        if (num === 1) setStep(1);
                        else if (num === 2 && selectedType) setStep(2);
                        else if (num === 3 && selectedDate) setStep(3);
                        else if (num === 4 && selectedSlot) setStep(4);
                      }}
                      disabled={
                        (num === 2 && !selectedType) ||
                        (num === 3 && !selectedDate) ||
                        (num === 4 && !selectedSlot)
                      }
                      className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-full font-fira text-xs sm:text-sm font-medium transition-all duration-300
                        ${step === num
                          ? 'bg-[#8B5E3C] text-white shadow-md'
                          : step > num
                            ? 'bg-[#8B5E3C]/20 text-[#8B5E3C] border border-[#8B5E3C]/40'
                            : 'bg-[#e8e4df] text-[#8a8a8a] border border-[#d5d0c9]'
                        }
                        ${(num === 2 && !selectedType) || (num === 3 && !selectedDate) || (num === 4 && !selectedSlot)
                          ? 'cursor-not-allowed'
                          : 'cursor-pointer hover:scale-105'
                        }
                      `}
                    >
                      {num}
                    </button>
                    {num < 4 && (
                      <div className={`w-6 sm:w-10 md:w-16 h-px mx-1 sm:mx-2 transition-colors duration-300 ${
                        step > num ? 'bg-[#8B5E3C]' : 'bg-[#d5d0c9]'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50 border border-red-200 flex items-center gap-3"
                >
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                  <p className="font-fira text-xs sm:text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* Step 1: Tipo */}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="font-fira text-sm sm:text-base lg:text-lg text-[#4a4a4a] mb-4 sm:mb-6 text-center">
                      ¿Qué tipo de reunión te gustaría agendar?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {bookingTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleTypeSelect(type)}
                          className="group relative p-4 sm:p-6 bg-white border border-[#e8e4df] hover:border-[#8B5E3C]/50 hover:shadow-md transition-all duration-300 text-left"
                        >
                          {/* Esquinas hover */}
                          <div className="absolute top-0 left-0 w-3 sm:w-4 h-[1px] bg-[#8B5E3C] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute top-0 left-0 w-[1px] h-3 sm:h-4 bg-[#8B5E3C] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 right-0 w-3 sm:w-4 h-[1px] bg-[#8B5E3C] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 right-0 w-[1px] h-3 sm:h-4 bg-[#8B5E3C] opacity-0 group-hover:opacity-100 transition-opacity" />

                          <h4 className="font-voga text-lg sm:text-xl text-[#2d2d2d] group-hover:text-[#8B5E3C] transition-colors mb-1 sm:mb-2">
                            {type.name}
                          </h4>
                          <p className="font-fira text-xs sm:text-sm text-[#6a6a6a] mb-2 sm:mb-3 line-clamp-2">{type.description}</p>
                          <div className="flex items-center gap-2 font-fira text-xs text-[#8B5E3C]">
                            <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span>{type.duration_minutes} minutos</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Fecha */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <button
                        onClick={() => setStep(1)}
                        className="flex items-center gap-1 sm:gap-2 font-fira text-xs sm:text-sm text-[#6a6a6a] hover:text-[#8B5E3C] transition-colors"
                      >
                        <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Volver</span>
                      </button>
                      <div className="text-center flex-1 px-2">
                        <span className="font-fira text-[10px] sm:text-xs text-[#8B5E3C] uppercase tracking-wider">Seleccionado</span>
                        <p className="font-voga text-base sm:text-lg text-[#2d2d2d] truncate">{selectedType?.name}</p>
                      </div>
                      <div className="w-12 sm:w-20" />
                    </div>

                    <h3 className="font-fira text-sm sm:text-base lg:text-lg text-[#4a4a4a] mb-4 sm:mb-6 text-center">
                      Seleccioná una fecha
                    </h3>

                    {/* Calendario */}
                    <div className="max-w-sm mx-auto bg-white p-4 sm:p-6 border border-[#e8e4df]">
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <button
                          onClick={prevMonth}
                          className="p-1.5 sm:p-2 text-[#6a6a6a] hover:text-[#8B5E3C] transition-colors"
                        >
                          <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                        </button>
                        <h4 className="font-fira font-medium text-[#2d2d2d] capitalize text-sm sm:text-base">
                          {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h4>
                        <button
                          onClick={nextMonth}
                          className="p-1.5 sm:p-2 text-[#6a6a6a] hover:text-[#8B5E3C] transition-colors"
                        >
                          <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                        </button>
                      </div>

                      {/* Días de la semana */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
                          <div key={i} className="text-center font-fira text-[10px] sm:text-xs font-medium text-[#8a8a8a] py-1 sm:py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Grid de días */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {calendarDays.map((day, index) => {
                          if (!day) return <div key={`empty-${index}`} />;

                          const isPast = isBefore(day, startOfToday());
                          const isBlocked = isDateBlocked(day);
                          const isUnavailable = isPast || isBlocked;
                          const isSelected = selectedDate && isSameDay(day, selectedDate);
                          const isCurrentDay = isToday(day);

                          return (
                            <button
                              key={day.toString()}
                              onClick={() => handleDateSelect(day)}
                              disabled={isUnavailable}
                              className={`
                                aspect-square flex items-center justify-center font-fira text-xs sm:text-sm transition-all duration-200
                                ${isSelected
                                  ? 'bg-[#8B5E3C] text-white shadow-md'
                                  : isUnavailable
                                    ? 'text-[#c5c0b8] line-through cursor-not-allowed'
                                    : 'text-[#4a4a4a] hover:bg-[#f5f2ee] hover:text-[#8B5E3C]'
                                }
                                ${isCurrentDay && !isSelected && !isUnavailable ? 'ring-1 ring-[#8B5E3C]/50' : ''}
                              `}
                            >
                              {format(day, 'd')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Horario */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <button
                        onClick={() => setStep(2)}
                        className="flex items-center gap-1 sm:gap-2 font-fira text-xs sm:text-sm text-[#6a6a6a] hover:text-[#8B5E3C] transition-colors"
                      >
                        <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Volver</span>
                      </button>
                      <div className="text-center flex-1 px-2">
                        <span className="font-fira text-[10px] sm:text-xs text-[#8B5E3C] uppercase tracking-wider">
                          {format(selectedDate, "EEE d MMM", { locale: es })}
                        </span>
                        <p className="font-voga text-base sm:text-lg text-[#2d2d2d] truncate">{selectedType?.name}</p>
                      </div>
                      <div className="w-12 sm:w-20" />
                    </div>

                    <h3 className="font-fira text-sm sm:text-base lg:text-lg text-[#4a4a4a] mb-4 sm:mb-6 text-center">
                      Seleccioná un horario
                    </h3>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-[#8B5E3C] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 bg-white border border-[#e8e4df] p-6">
                        <AlertCircle size={32} className="mx-auto text-[#c0b8ad] mb-4" />
                        <p className="font-fira text-[#6a6a6a] text-sm sm:text-base mb-4">
                          No hay horarios disponibles para esta fecha
                        </p>
                        <button
                          onClick={() => setStep(2)}
                          className="px-5 sm:px-6 py-2 border border-[#d5d0c9] text-[#6a6a6a] hover:border-[#8B5E3C] hover:text-[#8B5E3C] font-fira text-xs sm:text-sm transition-all"
                        >
                          Elegir Otra Fecha
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.start}
                            onClick={() => handleSlotSelect(slot)}
                            className={`
                              py-2.5 sm:py-3 px-2 font-fira text-xs sm:text-sm transition-all duration-200
                              ${selectedSlot?.start === slot.start
                                ? 'bg-[#8B5E3C] text-white shadow-md'
                                : 'bg-white border border-[#e8e4df] text-[#4a4a4a] hover:border-[#8B5E3C]/50 hover:text-[#8B5E3C]'
                              }
                            `}
                          >
                            {slot.display}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 4: Datos */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <button
                        onClick={() => setStep(3)}
                        className="flex items-center gap-1 sm:gap-2 font-fira text-xs sm:text-sm text-[#6a6a6a] hover:text-[#8B5E3C] transition-colors"
                      >
                        <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Volver</span>
                      </button>
                      <div className="text-center flex-1 px-2">
                        <span className="font-fira text-[10px] sm:text-xs text-[#8B5E3C] uppercase tracking-wider">
                          {format(selectedDate, "d MMM", { locale: es })} • {selectedSlot?.start}
                        </span>
                        <p className="font-voga text-base sm:text-lg text-[#2d2d2d] truncate">{selectedType?.name}</p>
                      </div>
                      <div className="w-12 sm:w-20" />
                    </div>

                    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4 sm:space-y-5">
                      {/* Nombre */}
                      <div>
                        <label className="block font-fira text-xs sm:text-sm text-[#5a5a5a] mb-1.5 sm:mb-2">
                          Nombre completo *
                        </label>
                        <div className="relative">
                          <User size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#b0a99e]" />
                          <input
                            type="text"
                            required
                            value={formData.clientName}
                            onChange={(e) => handleInputChange('clientName', e.target.value)}
                            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-[#e8e4df] font-fira text-sm sm:text-base text-[#2d2d2d] placeholder-[#b0a99e] focus:border-[#8B5E3C] focus:outline-none transition-colors"
                            placeholder="Tu nombre"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block font-fira text-xs sm:text-sm text-[#5a5a5a] mb-1.5 sm:mb-2">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#b0a99e]" />
                          <input
                            type="email"
                            required
                            value={formData.clientEmail}
                            onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-[#e8e4df] font-fira text-sm sm:text-base text-[#2d2d2d] placeholder-[#b0a99e] focus:border-[#8B5E3C] focus:outline-none transition-colors"
                            placeholder="tu@email.com"
                          />
                        </div>
                      </div>

                      {/* Teléfono */}
                      <div>
                        <label className="block font-fira text-xs sm:text-sm text-[#5a5a5a] mb-1.5 sm:mb-2">
                          Teléfono *
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#b0a99e]" />
                          <input
                            type="tel"
                            required
                            value={formData.clientPhone}
                            onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-[#e8e4df] font-fira text-sm sm:text-base text-[#2d2d2d] placeholder-[#b0a99e] focus:border-[#8B5E3C] focus:outline-none transition-colors"
                            placeholder="099 123 456"
                          />
                        </div>
                      </div>

                      {/* Notas */}
                      <div>
                        <label className="block font-fira text-xs sm:text-sm text-[#5a5a5a] mb-1.5 sm:mb-2">
                          Notas (opcional)
                        </label>
                        <div className="relative">
                          <MessageSquare size={16} className="absolute left-3 sm:left-4 top-2.5 sm:top-3 text-[#b0a99e]" />
                          <textarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            rows={3}
                            className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-[#e8e4df] font-fira text-sm sm:text-base text-[#2d2d2d] placeholder-[#b0a99e] focus:border-[#8B5E3C] focus:outline-none transition-colors resize-none"
                            placeholder="Cuéntanos sobre tu sesión..."
                          />
                        </div>
                      </div>

                      {/* Resumen */}
                      <DecorativeCorners className="p-4 sm:p-5 bg-[#f5f2ee] mt-6 sm:mt-8">
                        <h4 className="font-fira text-[10px] sm:text-xs text-[#8B5E3C] uppercase tracking-wider mb-2 sm:mb-3">
                          Resumen de tu reserva
                        </h4>
                        <div className="space-y-1.5 sm:space-y-2 font-fira text-xs sm:text-sm text-[#4a4a4a]">
                          <p><span className="text-[#8a8a8a]">Servicio:</span> {selectedType?.name}</p>
                          <p><span className="text-[#8a8a8a]">Fecha:</span> {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</p>
                          <p><span className="text-[#8a8a8a]">Horario:</span> {selectedSlot?.start} - {selectedSlot?.end}</p>
                        </div>
                      </DecorativeCorners>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-4 sm:mt-6 px-6 sm:px-8 py-3 sm:py-4 bg-[#8B5E3C] hover:bg-[#6d4a2f] !text-white hover:!text-white font-fira text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                            Confirmar Reserva
                          </>
                        )}
                      </button>

                      <p className="text-center font-fira text-[10px] sm:text-xs text-[#8a8a8a] mt-3 sm:mt-4">
                        Recibirás un email de confirmación con los detalles de tu reserva
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/**
 * Contacto - Formulario de contacto por WhatsApp
 * Diseño compacto con identidad visual marrón
 */
export function Contacto() {
  const [contactData, setContactData] = useState({
    name: '',
    message: '',
  });

  const whatsappNumber = '59892021392';

  const handleContactChange = (field, value) => {
    setContactData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();

    const text = `Hola! Soy ${contactData.name}.\n\n${contactData.message}`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <section id="contacto" className="py-12 sm:py-16 bg-white border-t border-[#e8e4df]">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        {/* Header compacto */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-gradient-to-r from-transparent to-[#8B5E3C]" />
            <div className="w-1 h-1 rounded-full bg-[#8B5E3C]" />
            <div className="h-px w-6 bg-gradient-to-l from-transparent to-[#8B5E3C]" />
          </div>
          <h2 className="font-voga text-2xl sm:text-3xl text-[#2d2d2d] mb-2">
            ¿Tenés alguna consulta?
          </h2>
          <p className="font-fira text-xs sm:text-sm text-[#6a6a6a]">
            Escribinos por WhatsApp
          </p>
        </motion.div>

        {/* Formulario compacto */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleWhatsAppSubmit}
          className="space-y-3"
        >
          {/* Nombre */}
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0a99e]" />
            <input
              type="text"
              required
              value={contactData.name}
              onChange={(e) => handleContactChange('name', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#faf8f5] border border-[#e8e4df] font-fira text-sm text-[#2d2d2d] placeholder-[#b0a99e] focus:border-[#8B5E3C] focus:outline-none transition-colors"
              placeholder="Tu nombre"
            />
          </div>

          {/* Mensaje */}
          <div className="relative">
            <MessageSquare size={14} className="absolute left-3 top-3 text-[#b0a99e]" />
            <textarea
              required
              value={contactData.message}
              onChange={(e) => handleContactChange('message', e.target.value)}
              rows={3}
              className="w-full pl-9 pr-3 py-2.5 bg-[#faf8f5] border border-[#e8e4df] font-fira text-sm text-[#2d2d2d] placeholder-[#b0a99e] focus:border-[#8B5E3C] focus:outline-none transition-colors resize-none"
              placeholder="Tu mensaje..."
            />
          </div>

          {/* Submit - Botón marrón */}
          <button
            type="submit"
            className="w-full px-6 py-2.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] !text-white hover:!text-white font-fira text-xs font-semibold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Send size={14} />
            Enviar por WhatsApp
          </button>
          <p className="text-center font-fira text-[10px] sm:text-xs text-[#8a8a8a] mt-2">
            Se abrirá WhatsApp con tu mensaje listo para enviar
          </p>
        </motion.form>
      </div>
    </section>
  );
}
