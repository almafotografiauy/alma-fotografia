'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Save, Globe, Lock, Bell, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export default function EditGalleryModal({ gallery, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    client_email: '',
    service_type: '',
    is_public: false,
    allow_downloads: true,
    allow_comments: false,
    notify_on_view: false,
    notify_on_favorites: false,
    custom_message: '',
    password: '',
    max_favorites: 150,
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
        notify_on_view: gallery.notify_on_view ?? false,
        notify_on_favorites: gallery.notify_on_favorites ?? false,
        custom_message: gallery.custom_message || '',
        password: gallery.password || '',
        max_favorites: gallery.max_favorites || 150,
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
      // Validaciones
      if (!formData.title.trim()) {
        throw new Error('El título es obligatorio');
      }

      if (formData.client_email && !formData.client_email.includes('@')) {
        throw new Error('Email inválido');
      }

      if (formData.max_favorites < 0 || formData.max_favorites > 500) {
        throw new Error('El límite de favoritos debe estar entre 0 y 500');
      }

      const supabase = await createClient();

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
          throw new Error(`Ya existe una galería pública para este servicio: "${existingPublic.title}". Solo puede haber una galería pública por tipo de servicio.`);
        }
      }

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_date: formData.event_date || null,
        client_email: formData.client_email.trim() || null,
        service_type: formData.service_type || null,
        is_public: formData.is_public,
        allow_downloads: formData.allow_downloads,
        allow_comments: formData.allow_comments,
        notify_on_view: formData.notify_on_view,
        notify_on_favorites: formData.notify_on_favorites,
        custom_message: formData.custom_message.trim() || null,
        password: formData.password.trim() || null,
        max_favorites: formData.max_favorites,
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
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
      />

      {/* Modal - 100% Responsive */}
      <div className="min-h-[90vh] fixed inset-2 sm:inset-4 md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl w-auto bg-white rounded-lg sm:rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] md:max-h-[85vh]">
        
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
                  className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
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
                  className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-black placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
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

              {/* Email del cliente */}
              <div>
                <label className="block font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black mb-1.5 sm:mb-2">
                  Email del cliente
                </label>
                <input
                  type="email"
                  name="client_email"
                  value={formData.client_email}
                  onChange={handleChange}
                  placeholder="cliente@ejemplo.com"
                  className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                />
                <p className="font-fira text-[10px] sm:text-xs text-gray-500 mt-1">
                  Para enviar notificaciones
                </p>
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
                  className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-black placeholder:text-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
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
                    className="mt-0.5 sm:mt-1 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] flex-shrink-0"
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
                    className="mt-0.5 sm:mt-1 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] flex-shrink-0"
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
              </div>

              {/* Permitir comentarios */}
              <div className="bg-white rounded-lg p-2.5 sm:p-3 md:p-4 border border-gray-200">
                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allow_comments"
                    checked={formData.allow_comments}
                    onChange={handleChange}
                    className="mt-0.5 sm:mt-1 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] flex-shrink-0"
                  />
                  <div className="flex-1">
                    <span className="font-fira text-[11px] sm:text-xs md:text-sm font-medium text-black">
                      Permitir comentarios
                    </span>
                    <p className="font-fira text-[10px] sm:text-xs text-gray-600 mt-0.5">
                      Los clientes podrán comentar cada foto
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notificaciones */}
            <div className="space-y-2 sm:space-y-3 p-2.5 sm:p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <Bell size={14} className="sm:w-4 sm:h-4 text-[#79502A]" />
                <h4 className="font-fira text-[11px] sm:text-xs md:text-sm font-semibold text-black">
                  Notificaciones por email
                </h4>
              </div>

              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notify_on_view"
                  checked={formData.notify_on_view}
                  onChange={handleChange}
                  className="mt-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] flex-shrink-0"
                />
                <div className="flex-1">
                  <span className="font-fira text-[10px] sm:text-xs text-black">
                    Cuando un cliente vea la galería
                  </span>
                  <p className="font-fira text-[9px] sm:text-[10px] text-gray-600 mt-0.5">
                    Recibirás un email cada vez que alguien abra el link
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notify_on_favorites"
                  checked={formData.notify_on_favorites}
                  onChange={handleChange}
                  className="mt-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A] flex-shrink-0"
                />
                <div className="flex-1">
                  <span className="font-fira text-[10px] sm:text-xs text-black">
                    Cuando seleccione favoritos
                  </span>
                  <p className="font-fira text-[9px] sm:text-[10px] text-gray-600 mt-0.5">
                    Recibirás un email cuando finalice su selección
                  </p>
                </div>
              </label>
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
                        placeholder="Dejar vacío para sin contraseña"
                        className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 pr-10 sm:pr-12 border border-gray-300 rounded-lg font-fira text-xs sm:text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
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
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
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
            </button>
          </div>
        </form>
      </div>
    </>
  );
}