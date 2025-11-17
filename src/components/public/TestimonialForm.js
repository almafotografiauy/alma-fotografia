'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createTestimonial, checkClientTestimonial } from '@/app/actions/testimonial-actions';

/**
 * TestimonialForm - Formulario para dejar testimonios
 *
 * Permite a los clientes dejar un comentario y calificación
 * sobre su experiencia con la galería/fotógrafo
 */
export default function TestimonialForm({ galleryId, galleryTitle, clientEmail: initialEmail = '', compact = false }) {
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
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);

  // Verificar al cargar si el cliente ya envió un testimonio
  useEffect(() => {
    const checkExistingTestimonial = async () => {
      if (!initialEmail || !galleryId) {
        setIsCheckingExisting(false);
        return;
      }

      try {
        const result = await checkClientTestimonial(galleryId, initialEmail);
        if (result.success && result.hasTestimonial) {
          setSubmitSuccess(true);
        }
      } catch (error) {
        console.error('Error checking testimonial:', error);
      } finally {
        setIsCheckingExisting(false);
      }
    };

    checkExistingTestimonial();
  }, [galleryId, initialEmail]);

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
        // No limpiar el formulario ni resetear el éxito - permanente
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
    <section className={compact ? "" : "bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8"}>
      <div className="max-w-2xl mx-auto">
        {/* Loading mientras verifica si ya envió testimonio */}
        {isCheckingExisting ? (
          <div className="text-center py-8">
            <Loader2 size={32} className="animate-spin text-[#79502A] mx-auto" />
            <p className="font-fira text-sm text-gray-500 mt-3">Verificando...</p>
          </div>
        ) : submitSuccess ? (
          /* Mensaje de agradecimiento permanente después de enviar */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 sm:py-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#79502A] to-[#8B5A2F] rounded-full mb-4 sm:mb-6">
              <CheckCircle2 size={32} className="text-white sm:w-10 sm:h-10" />
            </div>
            <h3 className="font-voga text-2xl sm:text-3xl md:text-4xl text-black mb-3 sm:mb-4">
              ¡Gracias por Elegirnos!
            </h3>
            <p className="font-fira text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed mb-2">
              Tu testimonio ha sido enviado exitosamente.
            </p>
            <p className="font-fira text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
              Tu opinión es muy valiosa y nos ayuda a seguir mejorando cada día.
            </p>
            <div className="mt-6 sm:mt-8 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className="fill-yellow-400 text-yellow-400 sm:w-6 sm:h-6"
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {/* Header - oculto en modo compacto */}
            {!compact && (
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-[#79502A] to-[#8B5A2F] rounded-lg sm:rounded-xl flex-shrink-0">
                  <Star size={20} className="text-yellow-300 fill-yellow-300 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-voga text-xl sm:text-2xl md:text-3xl text-black">
                    Comparte tu Experiencia
                  </h2>
                  <p className="font-fira text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                    Tu opinión es muy importante para nosotros
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-2 border-red-300 rounded-lg sm:rounded-xl">
                <p className="font-fira text-xs sm:text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-6"}>
          {/* Name Input */}
          <div>
            <label className={`block font-fira text-sm font-semibold text-black ${compact ? 'mb-1' : 'mb-2'}`}>
              Tu Nombre *
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="Ej: María García"
              className={`w-full px-3 ${compact ? 'py-2' : 'py-3'} border-2 border-gray-300 rounded-lg font-fira text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent transition-all`}
              disabled={isSubmitting}
            />
          </div>

          {/* Email Input */}
          <div>
            <label className={`block font-fira text-sm font-semibold text-black ${compact ? 'mb-1' : 'mb-2'}`}>
              Tu Email *
            </label>
            <input
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              placeholder="Ej: maria@ejemplo.com"
              className={`w-full px-3 ${compact ? 'py-2' : 'py-3'} border-2 border-gray-300 rounded-lg font-fira text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent transition-all`}
              disabled={isSubmitting}
            />
            {!compact && (
              <p className="font-fira text-xs text-gray-500 mt-2">
                Solo puedes enviar un testimonio por galería
              </p>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className={`block font-fira text-sm font-semibold text-black ${compact ? 'mb-1.5' : 'mb-3'}`}>
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
                    size={compact ? 28 : 32}
                    className={`${
                      star <= (hoveredRating || formData.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              {formData.rating > 0 && (
                <span className="ml-2 font-fira text-xs sm:text-sm text-gray-600">
                  {formData.rating} {formData.rating === 1 ? 'estrella' : 'estrellas'}
                </span>
              )}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className={`block font-fira text-sm font-semibold text-black ${compact ? 'mb-1' : 'mb-2'}`}>
              Tu Mensaje *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Cuéntanos sobre tu experiencia con las fotos..."
              rows={compact ? 3 : 5}
              className={`w-full px-3 ${compact ? 'py-2' : 'py-3'} border-2 border-gray-300 rounded-lg font-fira text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent transition-all resize-none`}
              disabled={isSubmitting}
            />
            {!compact && (
              <p className="font-fira text-xs text-gray-500 mt-2">
                Mínimo 10 caracteres
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.clientName.trim() || !formData.clientEmail.trim() || !formData.message.trim()}
            className={`w-full ${compact ? 'py-2.5' : 'py-3'} bg-gradient-to-r from-[#79502A] to-[#8B5A2F] hover:from-[#8B5A2F] hover:to-[#9A6B3C] disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg font-fira font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
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
          </>
        )}
      </div>
    </section>
  );
}
