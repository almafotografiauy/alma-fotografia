'use client';

import { useState } from 'react';
import { MessageSquare, Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createTestimonial } from '@/app/actions/testimonial-actions';

/**
 * TestimonialForm - Formulario para dejar testimonios
 *
 * Permite a los clientes dejar un comentario y calificación
 * sobre su experiencia con la galería/fotógrafo
 */
export default function TestimonialForm({ galleryId, galleryTitle, clientEmail: initialEmail = '' }) {
  // Pre-cargar nombre y email desde localStorage si están disponibles
  const getInitialName = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(`gallery_${galleryId}_name`) || '';
  };

  const [formData, setFormData] = useState({
    clientName: getInitialName(),
    clientEmail: initialEmail,
    message: '',
    rating: 0,
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.clientName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    if (!formData.clientEmail.trim()) {
      setError('Por favor ingresa tu email');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.clientEmail)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    if (!formData.message.trim()) {
      setError('Por favor escribe un mensaje');
      return;
    }

    if (formData.message.trim().length < 10) {
      setError('El mensaje debe tener al menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createTestimonial({
        galleryId,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        message: formData.message,
        rating: formData.rating > 0 ? formData.rating : null,
      });

      if (result.success) {
        setSubmitSuccess(true);
        setFormData({ clientName: '', clientEmail: initialEmail, message: '', rating: 0 });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setError(result.error || 'Error al enviar el testimonio');
      }
    } catch (err) {
      console.error('Error submitting testimonial:', err);
      setError('Error al enviar el testimonio. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-[#79502A] to-[#8B5A2F] rounded-xl">
            <Star size={24} className="text-yellow-300 fill-yellow-300" />
          </div>
          <div>
            <h2 className="font-voga text-2xl md:text-3xl text-black">
              Comparte tu Experiencia
            </h2>
            <p className="font-fira text-sm text-gray-600 mt-1">
              Tu opinión es muy importante para nosotros
            </p>
          </div>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-xl flex items-start gap-3"
            >
              <CheckCircle2 size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-fira text-sm font-semibold text-green-800">
                  ¡Gracias por tu testimonio!
                </p>
                <p className="font-fira text-xs text-green-700 mt-1">
                  Tu mensaje ha sido enviado exitosamente.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
            <p className="font-fira text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="block font-fira text-sm font-semibold text-black mb-2">
              Tu Nombre *
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="Ej: María García"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-fira text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent transition-all"
              disabled={isSubmitting}
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block font-fira text-sm font-semibold text-black mb-2">
              Tu Email *
            </label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              placeholder="Ej: maria@ejemplo.com"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-fira text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent transition-all"
              disabled={isSubmitting}
            />
            <p className="font-fira text-xs text-gray-500 mt-2">
              Solo puedes enviar un testimonio por galería
            </p>
          </div>

          {/* Rating */}
          <div>
            <label className="block font-fira text-sm font-semibold text-black mb-3">
              Calificación (opcional)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={isSubmitting}
                  className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= (hoveredRating || formData.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              {formData.rating > 0 && (
                <span className="ml-2 font-fira text-sm text-gray-600">
                  {formData.rating} {formData.rating === 1 ? 'estrella' : 'estrellas'}
                </span>
              )}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block font-fira text-sm font-semibold text-black mb-2">
              Tu Mensaje *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Cuéntanos sobre tu experiencia con las fotos..."
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-fira text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent transition-all resize-none"
              disabled={isSubmitting}
            />
            <p className="font-fira text-xs text-gray-500 mt-2">
              Mínimo 10 caracteres
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.clientName.trim() || !formData.clientEmail.trim() || !formData.message.trim()}
            className="w-full py-3 bg-gradient-to-r from-[#79502A] to-[#8B5A2F] hover:from-[#8B5A2F] hover:to-[#9A6B3C] disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-fira font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Enviar Testimonio</span>
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
