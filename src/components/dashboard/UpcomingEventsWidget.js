'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, User, MapPin, Briefcase, AlertCircle } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export default function UpcomingEventsWidget({ events = [] }) {
  const getDateLabel = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');

    if (isToday(date)) {
      return { text: 'Hoy', color: 'bg-red-500' };
    } else if (isTomorrow(date)) {
      return { text: 'Mañana', color: 'bg-orange-500' };
    } else {
      const daysAway = differenceInDays(date, new Date());
      if (daysAway <= 7) {
        return { text: `En ${daysAway}d`, color: 'bg-blue-500' };
      }
      return {
        text: format(date, 'd MMM', { locale: es }),
        color: 'bg-gray-500'
      };
    }
  };

  const getEventIcon = (event) => {
    if (event.type === 'private') {
      return <Briefcase size={16} className="text-[#8B5E3C]" />;
    }
    return <Calendar size={16} className="text-amber-600" />;
  };

  const getEventTypeLabel = (event) => {
    if (event.type === 'private') {
      return event.service_type?.name || 'Evento privado';
    }
    return event.booking_type?.name || 'Reunión';
  };

  if (events.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Calendar className="text-[#8B5E3C]" size={24} />
          </div>
          <div>
            <h3 className="font-voga text-lg text-gray-900">Próximos Eventos</h3>
            <p className="font-fira text-sm text-gray-500">Sin eventos próximos</p>
          </div>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="font-fira text-sm text-gray-500">
            No hay eventos confirmados próximamente
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Calendar className="text-[#8B5E3C]" size={24} />
          </div>
          <div>
            <h3 className="font-voga text-lg text-gray-900">Próximos Eventos</h3>
            <p className="font-fira text-sm text-gray-500">
              {events.length} {events.length === 1 ? 'evento' : 'eventos'} confirmados
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {events.slice(0, 5).map((event, index) => {
          const dateLabel = getDateLabel(event.booking_date);

          return (
            <motion.div
              key={`${event.type}-${event.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-amber-200 transition-all duration-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className={`${dateLabel.color} text-white px-2.5 py-1 rounded-lg flex-shrink-0`}>
                  <p className="font-fira text-xs font-bold text-center leading-tight">
                    {dateLabel.text}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {getEventIcon(event)}
                    <p className="font-fira text-sm font-semibold text-gray-900 truncate">
                      {event.client_name}
                    </p>
                  </div>

                  <p className="font-fira text-xs text-gray-600 mb-2">
                    {getEventTypeLabel(event)}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} className="text-gray-400" />
                      <span className="font-fira">
                        {event.start_time ? event.start_time.substring(0, 5) : 'Todo el día'}
                      </span>
                    </div>
                    {event.client_phone && (
                      <div className="flex items-center gap-1.5">
                        <User size={11} className="text-gray-400" />
                        <span className="font-fira truncate">{event.client_phone}</span>
                      </div>
                    )}
                  </div>

                  {event.notes && (
                    <p className="font-fira text-xs text-gray-500 mt-2 line-clamp-1">
                      {event.notes}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {events.length > 5 && (
        <div className="mt-4 text-center">
          <Link
            href="/dashboard/agenda"
            className="font-fira text-sm text-[#8B5E3C] hover:text-[#6d4a2f] font-semibold transition-colors duration-200"
          >
            Ver todos los eventos →
          </Link>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link
          href="/dashboard/agenda"
          className="w-full block text-center px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-[#8B5E3C] rounded-lg font-fira text-sm font-semibold transition-all duration-200"
        >
          Ver agenda completa
        </Link>
      </div>
    </motion.div>
  );
}
