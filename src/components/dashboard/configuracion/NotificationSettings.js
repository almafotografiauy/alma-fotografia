'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Bell,
  Eye,
  Heart,
  Calendar,
  LinkIcon,
  ImagePlus,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Archive,
  Trash2,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function NotificationSettings() {
  const router = useRouter();
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    email_on_gallery_view: false,
    email_on_favorites: false,
    email_on_link_expiring: true,
    email_on_link_expired: true,
    email_on_new_gallery: false,
    email_on_link_deactivated: false,
    email_on_gallery_archived: false,
    email_on_gallery_restored: false,
    email_on_gallery_deleted: true,
    inapp_enabled: true,
    notification_email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar preferencias
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          email_enabled: data.email_enabled ?? true,
          email_on_gallery_view: data.email_on_gallery_view || false,
          email_on_favorites: data.email_on_favorites || false,
          email_on_link_expiring: data.email_on_link_expiring ?? true,
          email_on_link_expired: data.email_on_link_expired ?? true,
          email_on_new_gallery: data.email_on_new_gallery || false,
          email_on_link_deactivated: data.email_on_link_deactivated || false,
          email_on_gallery_archived: data.email_on_gallery_archived || false,
          email_on_gallery_restored: data.email_on_gallery_restored || false,
          email_on_gallery_deleted: data.email_on_gallery_deleted ?? true,
          inapp_enabled: data.inapp_enabled ?? true,
          notification_email: data.notification_email || '',
        });
      } else {
        // Crear preferencias por defecto
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            ...preferences,
          });

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setMessage({
        type: 'error',
        text: 'Error al cargar las preferencias',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage({ type: '', text: '' });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Preparar datos para actualizar (solo los campos que existen en la tabla)
      const updateData = {
        email_enabled: preferences.email_enabled,
        email_on_gallery_view: preferences.email_on_gallery_view,
        email_on_favorites: preferences.email_on_favorites,
        email_on_link_expiring: preferences.email_on_link_expiring,
        email_on_link_expired: preferences.email_on_link_expired,
        email_on_new_gallery: preferences.email_on_new_gallery,
        email_on_link_deactivated: preferences.email_on_link_deactivated,
        email_on_gallery_archived: preferences.email_on_gallery_archived,
        email_on_gallery_restored: preferences.email_on_gallery_restored,
        email_on_gallery_deleted: preferences.email_on_gallery_deleted,
        inapp_enabled: preferences.inapp_enabled,
        notification_email: preferences.notification_email,
      };

      const { error } = await supabase
        .from('notification_preferences')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) {
        console.error('[NotificationSettings] Error de Supabase:', error);
        throw error;
      }

      setMessage({
        type: 'success',
        text: 'Preferencias guardadas correctamente',
      });

      // Volver atrás después de 1 segundo
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      console.error('❌ Error saving preferences:', err);
      console.error('❌ Error completo:', JSON.stringify(err, null, 2));
      setMessage({
        type: 'error',
        text: `Error al guardar: ${err.message || JSON.stringify(err)}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value !== undefined ? value : !prev[field],
    }));
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#79502A]" />
      </div>
    );
  }

  const emailNotifications = [
    {
      key: 'email_on_new_gallery',
      icon: ImagePlus,
      title: 'Cuando crees una nueva galería',
      description: 'Confirmación cada vez que subas una nueva galería',
    },
    {
      key: 'email_on_gallery_view',
      icon: Eye,
      title: 'Cuando un cliente vea una galería',
      description: 'Recibirás un email cada vez que alguien abra un enlace compartido',
    },
    {
      key: 'email_on_favorites',
      icon: Heart,
      title: 'Cuando un cliente seleccione o edite favoritos',
      description: 'Te avisaremos cuando un cliente envíe o modifique su selección de fotos favoritas',
    },
    {
      key: 'email_on_link_expiring',
      icon: Calendar,
      title: 'Cuando un enlace esté por vencer',
      description: 'Te recordaremos 7 días antes de que expire un enlace compartido',
    },
    {
      key: 'email_on_link_expired',
      icon: LinkIcon,
      title: 'Cuando un enlace expire',
      description: 'Te avisaremos cuando un enlace compartido haya vencido y se desactive automáticamente',
    },
    {
      key: 'email_on_link_deactivated',
      icon: XCircle,
      title: 'Cuando desactives un enlace manualmente',
      description: 'Te confirmaremos cuando desactives un enlace compartido',
    },
    {
      key: 'email_on_gallery_archived',
      icon: Archive,
      title: 'Cuando archives una galería',
      description: 'Te avisaremos cuando una galería sea archivada',
    },
    {
      key: 'email_on_gallery_restored',
      icon: Archive,
      title: 'Cuando restaures una galería archivada',
      description: 'Te confirmaremos cuando vuelvas a activar una galería archivada',
    },
    {
      key: 'email_on_gallery_deleted',
      icon: Trash2,
      title: 'Cuando elimines una galería',
      description: 'Te confirmaremos cuando elimines permanentemente una galería',
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Mensaje de éxito/error */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-300 text-green-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} className="flex-shrink-0" />
          ) : (
            <AlertCircle size={20} className="flex-shrink-0" />
          )}
          <p className="font-fira text-sm font-medium">{message.text}</p>
        </motion.div>
      )}

      {/* Notificaciones por Email */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-gray-200 rounded-xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[#79502A]/10 rounded-lg">
            <Mail size={20} className="text-[#79502A]" />
          </div>
          <div className="flex-1">
            <h3 className="font-voga text-lg sm:text-xl text-black mb-1">
              Notificaciones por Email
            </h3>
            <p className="font-fira text-sm text-gray-600">
              Recibe actualizaciones importantes directamente en tu correo electrónico
            </p>
          </div>
        </div>

        {/* Campo de email para notificaciones */}
        <div className="space-y-2 pt-1">
          <label className="block font-fira text-xs sm:text-sm font-medium text-black">
            Email para recibir notificaciones
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="email"
              value={preferences.notification_email}
              onChange={(e) => handleChange('notification_email', e.target.value)}
              placeholder="tu-email@ejemplo.com"
              className="flex-1 px-3 sm:px-4 py-2.5 border-2 border-gray-200 rounded-lg font-fira text-sm text-black
                focus:outline-none focus:ring-2 focus:ring-[#C6A97D]/40 focus:border-[#79502A] transition-all
                hover:border-gray-300 w-full"
            />
            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={() => handleChange('email_enabled')}
                className="w-5 h-5 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] cursor-pointer flex-shrink-0"
              />
              <span className="font-fira text-xs sm:text-sm font-medium text-black">
                Habilitar emails
              </span>
            </label>
          </div>
          <p className="font-fira text-xs text-gray-500 leading-relaxed">
            {preferences.email_enabled
              ? 'Los emails están habilitados. Las notificaciones seleccionadas abajo se enviarán a este correo.'
              : 'Los emails están deshabilitados. No se enviará ningún email aunque estén marcadas las opciones.'}
          </p>
        </div>

        <div className="border-t border-gray-200 my-4"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {emailNotifications.map((item) => {
            const IconComponent = item.icon;
            return (
              <label
                key={item.key}
                className="flex items-start gap-2 sm:gap-3 cursor-pointer group p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <input
                  type="checkbox"
                  checked={preferences[item.key]}
                  onChange={() => handleChange(item.key)}
                  className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <IconComponent
                      size={14}
                      className="text-[#79502A] flex-shrink-0 sm:w-4 sm:h-4"
                    />
                    <span className="font-fira text-xs sm:text-sm font-medium text-black leading-tight">
                      {item.title}
                    </span>
                  </div>
                  <p className="font-fira text-xs text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </motion.div>

      {/* Notificaciones en la Plataforma */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-2 border-gray-200 rounded-xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-lg">
            <Bell size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-voga text-lg sm:text-xl text-black mb-1">
              Notificaciones en la Plataforma
            </h3>
            <p className="font-fira text-sm text-gray-600">
              Recibe notificaciones directamente en el dashboard cuando estés conectado
            </p>
          </div>
        </div>

        <label className="flex items-start gap-2 sm:gap-3 md:gap-4 cursor-pointer group p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={preferences.inapp_enabled}
            onChange={() => handleChange('inapp_enabled')}
            className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] cursor-pointer flex-shrink-0"
          />
          <div>
            <span className="font-fira text-xs sm:text-sm font-medium text-black block mb-0.5 sm:mb-1 leading-tight">
              Habilitar notificaciones en la plataforma
            </span>
            <p className="font-fira text-xs text-gray-600 leading-relaxed">
              Verás todas las actualizaciones en tiempo real en el ícono de campana
            </p>
          </div>
        </label>
      </motion.div>

      {/* Botón Guardar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-end pt-4"
      >
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileHover={{ scale: isSaving ? 1 : 1.02 }}
          whileTap={{ scale: isSaving ? 1 : 0.98 }}
          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-[#79502A] hover:bg-[#8B5A2F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white hover:text-white rounded-lg font-fira text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" />
              <span className="hidden sm:inline">Guardando...</span>
              <span className="sm:hidden">Guardando...</span>
            </>
          ) : (
            <>
              <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Guardar cambios</span>
              <span className="sm:hidden">Guardar</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
