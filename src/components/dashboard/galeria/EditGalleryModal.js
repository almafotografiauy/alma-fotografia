'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save, Globe, Lock, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';

export default function EditGalleryModal({ gallery, hasActiveLink, onClose, onSuccess }) {
  const router = useRouter();
  const { modalState, showModal, closeModal } = useModal();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    client_email: '',
    service_type: '',
    is_public: false,
    allow_downloads: true,
    allow_comments: false,
    custom_message: '',
    password: '',
    max_favorites: 150,
    download_pin: '',
    show_all_sections: true,
  });
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (gallery) {
      setFormData({
        title: gallery.title || '',
        description: gallery.description || '',
        event_date: gallery.event_date || '',
        client_email: gallery.client_email || '',
        service_type: gallery.service_type || '',
        is_public: gallery.is_public || false,
        allow_downloads: gallery.allow_downloads ?? true,
        allow_comments: gallery.allow_comments ?? false,
        download_pin: gallery.download_pin || '',
        custom_message: gallery.custom_message || '',
        password: gallery.password || '',
        max_favorites: gallery.max_favorites || 150,
        show_all_sections: gallery.show_all_sections ?? true,
      });
    }
  }, [gallery]);

  const loadServices = async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;

      setServices(data || []);
    } catch (err) {
      console.error('Error loading services:', err);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const supabase = await createClient();

      // Validaciones
      if (!formData.title?.trim()) {
        throw new Error('El título es obligatorio');
      }

      if (formData.max_favorites < 0 || formData.max_favorites > 500) {
        throw new Error('El límite de favoritos debe estar entre 0 y 500');
      }

      // Validación: Verificar que max_favorites no sea menor a favoritos ya seleccionados
      const { data: favoritesCount, error: favoritesError } = await supabase
        .from('favorites')
        .select('id', { count: 'exact' })
        .eq('gallery_id', gallery.id);

      if (favoritesError) {
        console.error('Error checking favorites:', favoritesError);
      } else if (favoritesCount && favoritesCount.length > formData.max_favorites) {
        setIsSaving(false);
        showModal({
          title: 'Límite de favoritas muy bajo',
          message: `Actualmente hay ${favoritesCount.length} fotos seleccionadas como favoritas por tus clientes. Debes establecer un límite igual o mayor a ${favoritesCount.length}.`,
          type: 'warning',
          confirmText: 'Entendido',
          onConfirm: () => {
            closeModal();
          }
        });
        return;
      }

      // Validación: Solo una galería pública por servicio
      if (formData.is_public && formData.service_type) {
        const { data: existingPublic, error: checkError } = await supabase
          .from('galleries')
          .select('id, title')
          .eq('service_type', formData.service_type)
          .eq('is_public', true)
          .neq('id', gallery.id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking public gallery:', checkError);
        }

        if (existingPublic) {
          console.log('⚠️ Ya existe galería pública con este servicio:', existingPublic.title);
          setIsSaving(false);
          showModal({
            title: 'Ya existe una galería pública para este servicio',
            message: `La galería "${existingPublic.title}" ya está configurada como pública para este tipo de servicio. Solo puede haber una galería pública por servicio.\n\n¿Qué deseas hacer?`,
            type: 'warning',
            confirmText: 'Mantener como privada',
            cancelText: 'Ver galería existente',
            onConfirm: () => {
              // Cambiar a privada y continuar guardando
              setFormData(prev => ({ ...prev, is_public: false }));
              console.log('✅ Cambiando a galería privada');
              closeModal();
              // Trigger submit again with updated data
              setTimeout(() => {
                const form = document.querySelector('form');
                if (form) {
                  const event = new Event('submit', { bubbles: true, cancelable: true });
                  form.dispatchEvent(event);
                }
              }, 100);
            },
            onCancel: () => {
              // Cerrar el modal de edición y navegar a la galería existente
              closeModal();
              onClose(); // Cerrar el modal de edición
              router.push(`/dashboard/galerias/${existingPublic.id}`);
            }
          });
          return;
        }
      }

      const updateData = {
        title: formData.title?.trim() || '',
        description: formData.description?.trim() || null,
        event_date: formData.event_date || null,
        client_email: formData.client_email?.trim() || null,
        service_type: formData.service_type || null,
        is_public: formData.is_public,
        allow_downloads: formData.allow_downloads,
        allow_comments: formData.allow_comments,
        custom_message: formData.custom_message?.trim() || null,
        password: formData.password?.trim() || null,
        max_favorites: formData.max_favorites,
        download_pin: formData.download_pin?.trim() || null,
        show_all_sections: formData.show_all_sections ?? true,
      };

      const { data, error: updateError } = await supabase
        .from('galleries')
        .update(updateData)
        .eq('id', gallery.id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase error:', updateError);
        throw new Error(updateError.message);
      }

      if (onSuccess) {
        onSuccess();
      }

      onClose();

    } catch (err) {
      console.error('Error updating gallery:', err);
      setError(err.message || 'Error al actualizar la galería');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <>
      <AnimatePresence>
        {/* Backdrop */}
        <motion.div
          key="edit-backdrop"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        />

        {/* Modal - 100% Responsive */}
        <motion.div
        key="edit-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-x-2 top-2 bottom-20 sm:inset-4 sm:bottom-4 md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl w-auto bg-white rounded-lg sm:rounded-xl shadow-2xl z-50 flex flex-col md:max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="font-voga text-base sm:text-lg md:text-xl lg:text-2xl text-black truncate">
              Editar galería
            </h2>
            <p className="font-fira text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">
              Actualiza la configuración de la galería
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <X size={18} className="sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        {/* Form - Con scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
            
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3 md:p-4">
                <p className="font-fira text-[11px] sm:text-xs md:text-sm text-red-800 leading-snug">{error}</p>
              </div>
            )}

            {/* Información básica */}
            <div className="space-y-3 sm:space-y-4">
              {/* Título */}
              <div>
                <label className="block font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black mb-1.5 sm:mb-2">
                  Título <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Boda María & Pedro"
                  className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black mb-1.5 sm:mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe brevemente esta sesión fotográfica..."
                  className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-gray-700 placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                />
              </div>

              {/* Fila: Tipo de servicio + Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Tipo de servicio */}
                <div>
                  <label className="block font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black mb-1.5 sm:mb-2">
                    Tipo de servicio
                  </label>
                  {loadingServices ? (
                    <div className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                      <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin text-gray-400" />
                      <span className="font-fira text-[11px] sm:text-xs md:text-sm text-gray-500">Cargando...</span>
                    </div>
                  ) : (
                    <select
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleChange}
                      className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                    >
                      <option value="">Seleccionar...</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.slug}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Fecha del evento */}
                <div>
                  <label className="block font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black mb-1.5 sm:mb-2">
                    Fecha del evento
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleChange}
                    className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Mensaje personalizado */}
              <div>
                <label className="block font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black mb-1.5 sm:mb-2 flex items-center gap-1.5">
                  <MessageSquare size={14} className="sm:w-4 sm:h-4 text-[#79502A]" />
                  Mensaje para el cliente
                </label>
                <textarea
                  name="custom_message"
                  value={formData.custom_message}
                  onChange={handleChange}
                  placeholder="Ej: ¡Hola María! Acá están tus fotos 💕"
                  rows={3}
                  maxLength={300}
                  className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-gray-700 placeholder:text-gray-500 resize-y focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="font-fira text-[10px] sm:text-xs text-gray-500">
                    Aparecerá al inicio de la galería
                  </p>
                  <p className="font-fira text-[10px] sm:text-xs text-gray-400">
                    {formData.custom_message?.length || 0}/300
                  </p>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="space-y-2 sm:space-y-3">
              {/* Galería pública */}
              <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 md:p-4 border border-gray-200">
                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleChange}
                    className="mt-0.5 sm:mt-1 w-5 h-5 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {formData.is_public ? (
                        <>
                          <Globe size={14} className="sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                          <span className="font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black">
                            Galería pública
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} className="sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                          <span className="font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black">
                            Galería privada
                          </span>
                        </>
                      )}
                    </div>
                    <p className="font-fira text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 leading-snug">
                      {formData.is_public
                        ? 'Esta galería se mostrará en la página pública y podrá ser vista por cualquiera.'
                        : 'Solo las personas con el enlace podrán acceder a esta galería.'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Permitir descargas */}
              <div className="bg-white rounded-lg p-2.5 sm:p-3 md:p-4 border border-gray-200">
                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allow_downloads"
                    checked={formData.allow_downloads}
                    onChange={handleChange}
                    className="mt-0.5 sm:mt-1 w-5 h-5 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] flex-shrink-0"
                  />
                  <div className="flex-1">
                    <span className="font-fira text-[11px] sm:text-xs md:text-sm font-medium text-black">
                      Permitir descargas
                    </span>
                    <p className="font-fira text-[10px] sm:text-xs text-gray-600 mt-0.5">
                      Los clientes podrán descargar las fotos
                    </p>
                  </div>
                </label>

                {/* PIN de descarga (solo si descargas están habilitadas) */}
                {formData.allow_downloads && (
                  <div className="mt-3 sm:mt-4 pl-7 sm:pl-8">
                    <label className="block font-fira text-[11px] sm:text-xs font-medium text-black mb-1.5 sm:mb-2">
                      PIN de descarga (opcional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="download_pin"
                        value={formData.download_pin}
                        onChange={handleChange}
                        placeholder="Ej: 1234"
                        maxLength={6}
                        className="flex-1 px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg font-fira text-[11px] sm:text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const pin = Math.floor(1000 + Math.random() * 9000).toString();
                          setFormData(prev => ({ ...prev, download_pin: pin }));
                        }}
                        className="px-3 py-1.5 sm:py-2 bg-[#79502A] hover:bg-[#8B5A2F] text-white rounded-lg font-fira text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        Generar
                      </button>
                    </div>
                    <p className="font-fira text-[9px] sm:text-[10px] text-gray-500 mt-1">
                      {formData.download_pin
                        ? 'Los clientes necesitarán este PIN para descargar fotos.'
                        : 'Deja vacío para no requerir PIN.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Permitir testimonios */}
              <div className="bg-white rounded-lg p-2.5 sm:p-3 md:p-4 border border-gray-200">
                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allow_comments"
                    checked={formData.allow_comments}
                    onChange={handleChange}
                    className="mt-0.5 sm:mt-1 w-5 h-5 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] flex-shrink-0"
                  />
                  <div className="flex-1">
                    <span className="font-fira text-[11px] sm:text-xs md:text-sm font-medium text-black">
                      Permitir testimonios
                    </span>
                    <p className="font-fira text-[10px] sm:text-xs text-gray-600 mt-0.5">
                      Los clientes podrán dejar testimonios sobre tu trabajo
                    </p>
                  </div>
                </label>
              </div>

            </div>

            {/* Opciones avanzadas (colapsables) */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 sm:gap-2 text-[#79502A] hover:text-[#8B5A2F] transition-colors font-fira text-[11px] sm:text-xs md:text-sm font-medium"
              >
                <span className={`transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                Opciones avanzadas
              </button>

              {showAdvanced && (
                <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 p-2.5 sm:p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  
                  {/* Contraseña */}
                  <div>
                    <label className="block font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black mb-1.5 sm:mb-2 flex items-center gap-1.5">
                      <Lock size={14} className="sm:w-4 sm:h-4 text-[#79502A]" />
                      Proteger con contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={hasActiveLink ? "No se puede cambiar con enlace activo" : "Dejar vacío para sin contraseña"}
                        disabled={hasActiveLink}
                        className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 pr-10 sm:pr-12 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={hasActiveLink}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {hasActiveLink && (
                      <p className="font-fira text-[10px] sm:text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Lock size={12} />
                        Desactiva el enlace compartido para modificar la contraseña
                      </p>
                    )}
                  </div>

                  {/* Límite de favoritos */}
                  <div>
                    <label className="block font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black mb-1.5 sm:mb-2">
                      Límite de favoritos
                    </label>
                    <input
                      type="number"
                      name="max_favorites"
                      value={formData.max_favorites}
                      onChange={handleChange}
                      min="0"
                      max="500"
                      className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                    />
                    <p className="font-fira text-[10px] sm:text-xs text-gray-500 mt-1">
                      Máximo de fotos que el cliente puede marcar como favoritas
                    </p>
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* Footer - Botones fijos */}
          <div className="flex flex-col sm:flex-row gap-2 p-3 sm:p-4 md:p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
            <motion.button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              whileHover={{ scale: isSaving ? 1 : 1.02 }}
              whileTap={{ scale: isSaving ? 1 : 0.98 }}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold disabled:opacity-50"
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSaving}
              whileHover={{ scale: isSaving ? 1 : 1.02 }}
              whileTap={{ scale: isSaving ? 1 : 0.98 }}
              className="!text-white flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#79502A] hover:bg-[#8B5A2F] disabled:bg-gray-300 text-white rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Guardar cambios</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>

    {/* Modal de confirmación para galería pública duplicada */}
    <Modal
      isOpen={modalState.isOpen}
      onClose={closeModal}
      title={modalState.title}
      message={modalState.message}
      type={modalState.type}
      confirmText={modalState.confirmText}
      cancelText={modalState.cancelText}
      onConfirm={modalState.onConfirm}
      onCancel={modalState.onCancel}
    />
  </>
  );
}