'use client';

import { motion } from 'framer-motion';
import { Bell, Heart, Download, Calendar, User, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export default function RecentNotificationsWidget({ notifications = [] }) {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'favorite_added':
        return <Heart size={16} className="text-pink-500" />;
      case 'photo_downloaded':
        return <Download size={16} className="text-blue-500" />;
      case 'new_booking':
        return <Calendar size={16} className="text-amber-600" />;
      case 'booking_confirmed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'new_testimonial':
        return <User size={16} className="text-amber-700" />;
      case 'gallery_shared':
        return <ImageIcon size={16} className="text-indigo-600" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type) {
      case 'favorite_added':
        return 'bg-pink-50';
      case 'photo_downloaded':
        return 'bg-blue-50';
      case 'new_booking':
        return 'bg-amber-50';
      case 'booking_confirmed':
        return 'bg-green-50';
      case 'new_testimonial':
        return 'bg-amber-50';
      case 'gallery_shared':
        return 'bg-indigo-50';
      default:
        return 'bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: es
      });
    } catch {
      return 'Hace un momento';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Bell className="text-gray-400" size={24} />
          </div>
          <div>
            <h3 className="font-voga text-lg text-gray-900">Notificaciones Recientes</h3>
            <p className="font-fira text-sm text-gray-500">Sin notificaciones nuevas</p>
          </div>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="font-fira text-sm text-gray-500">
            No hay notificaciones recientes
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
            <Bell className="text-[#8B5E3C]" size={24} />
          </div>
          <div>
            <h3 className="font-voga text-lg text-gray-900">Notificaciones Recientes</h3>
            <p className="font-fira text-sm text-gray-500">
              Últimas actualizaciones
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="flex items-center justify-center w-8 h-8 bg-[#8B5E3C] text-white rounded-full font-fira text-sm font-bold">
            {unreadCount}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {notifications.slice(0, 8).map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`p-3 rounded-xl border ${
              notification.read
                ? 'bg-white border-gray-100'
                : 'bg-amber-50/50 border-amber-100'
            } hover:border-amber-200 transition-all duration-200`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 ${getNotificationBgColor(notification.type)} rounded-lg flex-shrink-0`}>
                {getNotificationIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-fira text-sm text-gray-900 leading-relaxed">
                  {notification.message}
                </p>
                <p className="font-fira text-xs text-gray-500 mt-1">
                  {formatTimeAgo(notification.created_at)}
                </p>
              </div>

              {!notification.read && (
                <div className="w-2 h-2 bg-[#8B5E3C] rounded-full flex-shrink-0 mt-2" />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {notifications.length > 8 && (
        <div className="mt-4 text-center">
          <Link
            href="/dashboard/notificaciones"
            className="font-fira text-sm text-[#8B5E3C] hover:text-[#6d4a2f] font-semibold transition-colors duration-200"
          >
            Ver todas las notificaciones →
          </Link>
        </div>
      )}
    </motion.div>
  );
}
