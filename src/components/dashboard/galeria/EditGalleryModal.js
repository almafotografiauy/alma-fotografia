'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Save, Globe, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export default function EditGalleryModal({ gallery, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    client_email: '',
    service_type: '',
    is_public: false,
  });
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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

      const supabase = await createClient();

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_date: formData.event_date || null,
        client_email: formData.client_email.trim() || null,
        service_type: formData.service_type || null,
        is_public: formData.is_public,
      };

      console.log('Updating gallery:', gallery.id, updateData);

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

      console.log('Gallery updated:', data);

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

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="font-voga text-xl sm:text-2xl text-black">
              Editar galería
            </h2>
            <p className="font-fira text-xs sm:text-sm text-gray-500 mt-1">
              Actualiza la información de la galería
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-fira text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block font-fira text-sm font-semibold text-black mb-2">
              Título <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Ej: Boda María & Pedro"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-fira text-sm focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block font-fira text-sm font-semibold text-black mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe brevemente esta sesión fotográfica..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-fira text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
            />
          </div>

          {/* Fila: Tipo de servicio + Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo de servicio */}
            <div>
              <label className="block font-fira text-sm font-semibold text-black mb-2">
                Tipo de servicio
              </label>
              {loadingServices ? (
                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                  <span className="font-fira text-sm text-gray-500">Cargando servicios...</span>
                </div>
              ) : (
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-fira text-sm focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
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
              <label className="block font-fira text-sm font-semibold text-black mb-2">
                Fecha del evento
              </label>
              <input
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-fira text-sm focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
              />
            </div>
          </div>

          {/* Email del cliente */}
          <div>
            <label className="block font-fira text-sm font-semibold text-black mb-2">
              Email del cliente
            </label>
            <input
              type="email"
              name="client_email"
              value={formData.client_email}
              onChange={handleChange}
              placeholder="cliente@ejemplo.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-fira text-sm focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
            />
            <p className="font-fira text-xs text-gray-500 mt-1">
              Útil para enviar notificaciones sobre la galería
            </p>
          </div>

          {/* Visibilidad */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-[#79502A] border-gray-300 rounded focus:ring-[#79502A]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {formData.is_public ? (
                    <>
                      <Globe size={16} className="text-green-600" />
                      <span className="font-fira text-sm font-semibold text-black">
                        Galería pública
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="text-gray-600" />
                      <span className="font-fira text-sm font-semibold text-black">
                        Galería privada
                      </span>
                    </>
                  )}
                </div>
                <p className="font-fira text-xs text-gray-600 mt-1">
                  {formData.is_public
                    ? 'Cualquiera con el enlace puede ver esta galería'
                    : 'Solo las personas con enlace compartido pueden verla'}
                </p>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-fira text-sm font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 bg-[#79502A] hover:bg-[#8B5A2F] disabled:bg-gray-300 text-white rounded-lg transition-colors font-fira text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
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