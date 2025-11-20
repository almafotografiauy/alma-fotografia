'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Check, AlertTriangle, Info, LinkIcon, Archive, Trash2, Calendar, CheckSquare, Square, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

/**
 * NotificationBell - Campana de notificaciones en tiempo real
 * 
 * Features:
 * - Suscripción en tiempo real (Supabase Realtime)
 * - Panel responsive (mobile bottom sheet / desktop dropdown)
 * - Contador de no leídas
 * - Marcar como leída / Eliminar
 * - Íconos por tipo de notificación
 * 
 * Props:
 * @param {string} className - Clases adicionales
 * @param {boolean} isMobile - Si es versión mobile (cambia posición del panel)
 */
export default function NotificationBell({ className = '', isMobile = false }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Para evitar errores de hydration con Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Supabase error loading notifications:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Si la tabla no existe o no hay permisos, simplemente no mostrar notificaciones
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error?.message || error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Suscripción en tiempo real + polling
  useEffect(() => {
    loadNotifications();

    // Polling cada 3 segundos como backup (más rápido)
    const pollingInterval = setInterval(() => {
      loadNotifications();
    }, 3000);

    // Intentar Realtime subscription (puede fallar si no está habilitado)
    let channel = null;

    const setupRealtime = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        channel = supabase
          .channel(`notifications-user-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              loadNotifications();
            }
          )
          .subscribe();
      } catch (error) {
        // Realtime no disponible, usar solo polling
      }
    };

    setupRealtime();

    return () => {
      clearInterval(pollingInterval);
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [loadNotifications]);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Decrementar contador si era no leída
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Toggle selección de notificación
  const toggleSelection = useCallback((notificationId) => {
    setSelectedIds(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  }, []);

  // Seleccionar todas
  const selectAll = useCallback(() => {
    setSelectedIds(notifications.map(n => n.id));
  }, [notifications]);

  // Deseleccionar todas
  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Marcar seleccionadas como leídas
  const markSelectedAsRead = useCallback(async () => {
    if (selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', selectedIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => selectedIds.includes(n.id) ? { ...n, is_read: true } : n)
      );

      const unreadSelected = notifications.filter(n =>
        selectedIds.includes(n.id) && !n.is_read
      ).length;
      setUnreadCount(prev => Math.max(0, prev - unreadSelected));

      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error marking selected as read:', error);
    }
  }, [selectedIds, notifications]);

  // Eliminar seleccionadas
  const deleteSelected = useCallback(async () => {
    if (selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      const unreadDeleted = notifications.filter(n =>
        selectedIds.includes(n.id) && !n.is_read
      ).length;

      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
      setUnreadCount(prev => Math.max(0, prev - unreadDeleted));
      setSelectedIds([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error deleting selected:', error);
    }
  }, [selectedIds, notifications]);

  // Obtener ícono según tipo
  const getIcon = useCallback((type) => {
    const iconProps = { size: 16 };

    switch (type) {
      case 'gallery_created':
        return <Check {...iconProps} className="text-green-600" />;
      case 'gallery_view':
        return <Info {...iconProps} className="text-blue-600" />;
      case 'favorites_gallery_view':
        return <Heart {...iconProps} className="text-pink-600" />;
      case 'favorites_selected':
        return <Check {...iconProps} className="text-purple-600" />;
      case 'link_expired':
      case 'link_expiring_soon':
        return <Calendar {...iconProps} className="text-amber-600" />;
      case 'gallery_archived':
        return <Archive {...iconProps} className="text-gray-600" />;
      case 'gallery_deleted':
        return <Trash2 {...iconProps} className="text-red-600" />;
      case 'link_deactivated':
        return <LinkIcon {...iconProps} className="text-orange-600" />;
      case 'info':
        return <Info {...iconProps} className="text-blue-600" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="text-amber-600" />;
      default:
        return <Bell {...iconProps} className="text-gray-600" />;
    }
  }, []);

  // Formatear fecha relativa
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 2880) return 'Ayer';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Botón campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={isMobile ? 22 : 20} className={isMobile ? "text-white" : "text-white/80"} />
        
        {/* Badge contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones - Renderizado con Portal */}
      {mounted && isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998] animate-in fade-in duration-200"
          />

          {/* Modal centrado - IGUAL en Desktop y Mobile */}
          <div
            className="fixed z-[99999] flex flex-col bg-white shadow-2xl border border-gray-200 rounded-2xl
              inset-4 sm:inset-6 md:inset-x-auto md:inset-y-6
              md:left-1/2 md:-translate-x-1/2
              md:w-full md:max-w-lg md:h-[90vh]
              animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-fira text-sm sm:text-base font-semibold text-black">
                Notificaciones
                {isSelectionMode && selectedIds.length > 0 && (
                  <span className="ml-2 text-xs text-[#79502A]">
                    ({selectedIds.length})
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2">
                {!isSelectionMode && notifications.length > 0 && (
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="px-2 py-1 text-xs font-fira font-semibold text-[#79502A] hover:bg-[#79502A]/10 rounded-lg transition-colors"
                  >
                    <span className="hidden sm:inline">Seleccionar</span>
                    <span className="sm:hidden">Sel.</span>
                  </button>
                )}
                {!isSelectionMode && unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-2 py-1 text-xs font-fira font-semibold text-[#79502A] hover:bg-[#79502A]/10 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Marcar todas</span>
                    <span className="sm:hidden">Todas</span>
                  </button>
                )}
                {isSelectionMode && (
                  <button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedIds([]);
                    }}
                    className="px-2 py-1 text-xs font-fira font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Cerrar"
                >
                  <X size={18} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Botones de acciones masivas - Solo en modo selección */}
            {isSelectionMode && notifications.length > 0 && (
              <div className="p-2 sm:p-3 border-b border-gray-200 flex flex-wrap items-center gap-1.5 sm:gap-2 flex-shrink-0 bg-gray-50">
                <button
                  onClick={selectAll}
                  className="px-2 sm:px-3 py-1.5 text-xs font-fira font-semibold text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-200"
                >
                  <span className="hidden sm:inline">Seleccionar todas</span>
                  <span className="sm:hidden">Todas</span>
                </button>
                {selectedIds.length > 0 && (
                  <>
                    <button
                      onClick={deselectAll}
                      className="px-2 sm:px-3 py-1.5 text-xs font-fira font-semibold text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-200"
                    >
                      <span className="hidden sm:inline">Deseleccionar</span>
                      <span className="sm:hidden">Ninguna</span>
                    </button>
                    <div className="flex-1 min-w-[8px]"></div>
                    <button
                      onClick={markSelectedAsRead}
                      className="px-2 sm:px-3 py-1.5 text-xs font-fira font-semibold text-[#79502A] hover:bg-[#79502A]/10 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Check size={14} />
                      <span className="hidden sm:inline">Marcar leídas</span>
                      <span className="sm:hidden">Leer</span>
                    </button>
                    <button
                      onClick={deleteSelected}
                      className="px-2 sm:px-3 py-1.5 text-xs font-fira font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">Eliminar</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Lista de notificaciones */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#79502A]" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Bell size={32} className="text-gray-300 mb-3" />
                  <p className="font-fira text-sm text-gray-500 text-center">
                    No tienes notificaciones
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50/50' : ''
                      } ${isSelectionMode && selectedIds.includes(notification.id) ? 'bg-[#79502A]/5' : ''}`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        {/* Checkbox en modo selección */}
                        {isSelectionMode && (
                          <button
                            onClick={() => toggleSelection(notification.id)}
                            className="flex-shrink-0 mt-1 p-1 hover:bg-gray-200 rounded transition-colors"
                            aria-label={selectedIds.includes(notification.id) ? 'Deseleccionar' : 'Seleccionar'}
                          >
                            {selectedIds.includes(notification.id) ? (
                              <CheckSquare size={18} className="text-[#79502A]" />
                            ) : (
                              <Square size={18} className="text-gray-400" />
                            )}
                          </button>
                        )}

                        {/* Ícono */}
                        {!isSelectionMode && (
                          <div className="flex-shrink-0 mt-1">
                            {getIcon(notification.type)}
                          </div>
                        )}

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <p className="font-fira text-sm text-gray-900 leading-snug mb-1">
                            {notification.message}
                          </p>
                          <p className="font-fira text-xs text-gray-500">
                            {formatDate(notification.created_at)}
                          </p>

                          {/* Link de acción - solo en modo normal */}
                          {!isSelectionMode && notification.action_url && (
                            <a
                              href={notification.action_url}
                              onClick={() => {
                                markAsRead(notification.id);
                                setIsOpen(false);
                              }}
                              className="inline-block mt-2 text-xs font-fira font-semibold text-[#79502A] hover:text-[#8B5A2F] transition-colors"
                            >
                              Ver detalles →
                            </a>
                          )}
                        </div>

                        {/* Acciones - solo en modo normal */}
                        {!isSelectionMode && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Marcar como leída"
                                aria-label="Marcar como leída"
                              >
                                <Check size={14} className="text-gray-600" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Eliminar"
                              aria-label="Eliminar notificación"
                            >
                              <X size={14} className="text-gray-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}