'use client';

/**
 * Contacto - Formulario de reserva
 * Diseño minimalista premium
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function Contacto({ services }) {
  const [formData, setFormData] = useState({
    service_type_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    event_date: '',
    event_time: '',
    message: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('/api/public-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceTypeId: formData.service_type_id,
          clientName: formData.client_name,
          clientEmail: formData.client_email,
          clientPhone: formData.client_phone,
          eventDate: formData.event_date,
          eventTime: formData.event_time,
          message: formData.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: '¡Reserva enviada! Te contactaremos pronto.'
        });
        setFormData({
          service_type_id: '',
          client_name: '',
          client_email: '',
          client_phone: '',
          event_date: '',
          event_time: '',
          message: ''
        });
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Error al enviar la reserva'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Error de conexión. Intenta nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="py-32 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-voga text-5xl md:text-6xl text-[#2d2d2d] mb-4">
            Contacto
          </h2>
          <div className="w-16 h-px bg-[#B89968] mx-auto mb-6" />
          <p className="font-fira text-lg text-gray-600">
            Reserva tu sesión y capturemos juntos momentos inolvidables
          </p>
        </motion.div>

        {/* Formulario */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Servicio */}
          <div>
            <label className="block font-fira text-sm font-medium text-[#2d2d2d] mb-2">
              Tipo de sesión *
            </label>
            <select
              required
              value={formData.service_type_id}
              onChange={(e) => setFormData({ ...formData, service_type_id: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 font-fira text-base focus:border-[#B89968] focus:outline-none transition-colors"
            >
              <option value="">Selecciona un servicio</option>
              {services?.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre */}
          <div>
            <label className="block font-fira text-sm font-medium text-[#2d2d2d] mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 font-fira text-base focus:border-[#B89968] focus:outline-none transition-colors"
              placeholder="Tu nombre"
            />
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-fira text-sm font-medium text-[#2d2d2d] mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 font-fira text-base focus:border-[#B89968] focus:outline-none transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block font-fira text-sm font-medium text-[#2d2d2d] mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                required
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 font-fira text-base focus:border-[#B89968] focus:outline-none transition-colors"
                placeholder="099 123 456"
              />
            </div>
          </div>

          {/* Fecha y Hora (opcional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-fira text-sm font-medium text-[#2d2d2d] mb-2">
                Fecha preferida
              </label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 font-fira text-base focus:border-[#B89968] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-fira text-sm font-medium text-[#2d2d2d] mb-2">
                Hora preferida
              </label>
              <input
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 font-fira text-base focus:border-[#B89968] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block font-fira text-sm font-medium text-[#2d2d2d] mb-2">
              Mensaje (opcional)
            </label>
            <textarea
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 font-fira text-base focus:border-[#B89968] focus:outline-none transition-colors resize-none"
              placeholder="Cuéntanos sobre tu sesión..."
            />
          </div>

          {/* Status Message */}
          {status.message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 p-4 ${
                status.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span className="font-fira text-sm">{status.message}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 bg-[#2d2d2d] text-white font-fira text-sm font-semibold uppercase tracking-wider hover:bg-[#B89968] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Enviando...' : 'Enviar Reserva'}
            <Send size={18} />
          </button>
        </motion.form>
      </div>
    </section>
  );
}
