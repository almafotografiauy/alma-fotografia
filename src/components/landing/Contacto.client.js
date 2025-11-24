'use client';

/**
 * Contacto - Client Component
 *
 * Formulario de reserva pública con validación
 * Integra con API /api/public-booking que valida disponibilidad
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { getActiveServices } from '@/lib/server-actions';

export default function ContactoClient() {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    serviceTypeId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventDate: '',
    eventTime: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Cargar servicios al montar
  useEffect(() => {
    getActiveServices().then(({ services }) => {
      setServices(services || []);
    });
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/public-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Error al enviar la reserva');
        setLoading(false);
        return;
      }

      // Éxito
      setSuccess(true);
      setFormData({
        serviceTypeId: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        eventDate: '',
        eventTime: '',
        message: '',
      });

      // Auto-ocultar mensaje de éxito después de 5s
      setTimeout(() => setSuccess(false), 5000);

    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Error al enviar la reserva. Por favor intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="py-20 bg-gradient-to-br from-[#f8f6f3] via-white to-[#faf8f5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-voga text-4xl sm:text-5xl text-gray-900 mb-4">
            Solicitar Reserva
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-[#8B5E3C] to-[#B89968] mx-auto rounded-full mb-6" />
          <p className="font-fira text-gray-600 max-w-2xl mx-auto">
            Completá el formulario y me pondré en contacto con vos a la brevedad
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Type */}
            <div>
              <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                Tipo de servicio *
              </label>
              <select
                value={formData.serviceTypeId}
                onChange={(e) => handleChange('serviceTypeId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                required
              >
                <option value="">Seleccionar servicio...</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                Nombre completo *
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleChange('clientName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleChange('clientEmail', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                  Teléfono *
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => handleChange('clientPhone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                    placeholder="099 123 456"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Event Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                  Fecha del evento (opcional)
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleChange('eventDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                  Hora estimada (opcional)
                </label>
                <div className="relative">
                  <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => handleChange('eventTime', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                Mensaje adicional (opcional)
              </label>
              <div className="relative">
                <MessageSquare size={18} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all resize-none"
                  placeholder="Contanos sobre tu evento, ideas, o cualquier detalle especial..."
                  rows={4}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="font-fira text-sm text-red-800">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
              >
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-fira text-sm text-green-800 font-semibold mb-1">
                    ¡Reserva enviada con éxito!
                  </p>
                  <p className="font-fira text-xs text-green-700">
                    Me pondré en contacto con vos a la brevedad para confirmar los detalles.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full px-6 py-3.5 bg-[#8B5E3C] text-white rounded-lg font-fira text-sm font-semibold hover:bg-[#6d4a2f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Enviar solicitud</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
