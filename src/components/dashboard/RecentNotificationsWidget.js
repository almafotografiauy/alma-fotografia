'use client';

import { motion } from 'framer-motion';
import { Bell, Heart, Download, Calendar, User, Image as ImageIcon, AlertCircle, CheckCircle, ExternalLink, Trash2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useSimpleAutoRefresh } from '@/hooks/useAutoRefresh';
import { supabase } from '@/lib/supabaseClient';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecentNotificationsWidget({ notifications: initialNotifications = [] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const router = useRouter();

  // Sincronizar con props cuando cambien (ej: después de eliminar desde el modal)
  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Auto-refresh cada 10 minutos
  useSimpleAutoRefresh(10);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      router.refresh();
    } catch (error) {
      // Error deleting notification
    }
  }, [router]);

  // Marcar como leída y navegar
  const handleNotificationClick = useCallback(async (notification) => {
    if (!notification.read) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('id', notification.id);
      } catch (error) {
        // Error marking as read
      }
    }

    if (notification.action_url) {
      router.push(notification.action_url);
    }
  }, [router]);

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
                ? 'bg-gray-50/30 border-gray-100/50'
                : 'bg-amber-50/20 border-amber-100/50'
            } hover:border-amber-200/60 transition-all duration-200 group`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 ${getNotificationBgColor(notification.type)} rounded-lg flex-shrink-0`}>
                {getNotificationIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-fira text-sm text-gray-900 leading-relaxed">
                  {notification.message}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <p className="font-fira text-xs text-gray-500">
                    {formatTimeAgo(notification.created_at)}
                  </p>

                  {/* Botones de acción - solo visibles al hacer hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {notification.action_url && (
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className="p-1.5 rounded-md text-[#8B5E3C] hover:bg-[#8B5E3C]/10 transition-colors"
                        title="Ver detalles"
                      >
                        <ExternalLink size={14} strokeWidth={2} />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1.5 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
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
