'use client';

/**
 * Testimonios - Carrusel elegante de testimonios destacados
 * Diseño minimalista con auto-play y navegación
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Testimonios({ testimonials }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  // Auto-play: cambiar cada 5 segundos
  useEffect(() => {
    if (testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section
      id="testimonios"
      className="py-32 bg-[#2d2d2d] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Ornamento superior */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#A67C52] to-transparent" />
            <Quote className="w-4 h-4 text-[#A67C52]" strokeWidth={1.5} />
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-[#A67C52] to-transparent" />
          </div>

          <h2 className="font-voga text-5xl sm:text-6xl md:text-7xl text-white mb-6 tracking-wide">
            Testimonios
          </h2>

          <p className="font-fira text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            Palabras de quienes confiaron en nosotros para capturar sus momentos especiales
          </p>

          {/* Ornamento inferior */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-[#A67C52] to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#A67C52] shadow-lg shadow-[#A67C52]/50" />
            <div className="h-[1px] w-20 bg-gradient-to-l from-transparent via-[#A67C52] to-transparent" />
          </div>
        </motion.div>

        {/* Carrusel */}
        <div className="relative">
          {/* Tarjeta del testimonio */}
          <div className="relative h-[480px] md:h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 md:p-12 shadow-2xl">
                  {/* Icono de comilla decorativo */}
                  <div className="absolute top-8 left-8 opacity-10">
                    <Quote size={80} className="text-[#A67C52]" strokeWidth={1} />
                  </div>

                  {/* Contenido */}
                  <div className="relative z-10">
                    {/* Rating */}
                    <div className="flex justify-center gap-1 mb-8">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={
                            i < currentTestimonial.rating
                              ? 'fill-[#A67C52] text-[#A67C52]'
                              : 'text-white/20'
                          }
                        />
                      ))}
                    </div>

                    {/* Comentario */}
                    <p className="font-fira text-lg md:text-xl text-white/90 leading-relaxed text-center mb-10 italic max-w-3xl mx-auto">
                      "{currentTestimonial.comment}"
                    </p>

                    {/* Separador decorativo */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#A67C52]" />
                      <div className="w-1 h-1 rounded-full bg-[#A67C52]" />
                      <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#A67C52]" />
                    </div>

                    {/* Cliente */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#A67C52]/30 to-[#8B5E3C]/30 flex items-center justify-center border-2 border-[#A67C52]/40">
                        <span className="font-voga text-[#A67C52] text-2xl">
                          {currentTestimonial.client_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="font-fira text-base font-semibold text-white mb-1">
                          {currentTestimonial.client_name}
                        </p>
                        {currentTestimonial.service_type && (
                          <p className="font-fira text-sm text-[#A67C52] mb-1">
                            {currentTestimonial.service_type.name}
                          </p>
                        )}
                        {/* Fecha del testimonio */}
                        {currentTestimonial.created_at && (
                          <p className="font-fira text-xs text-white/40 mt-2">
                            {new Date(currentTestimonial.created_at).toLocaleDateString('es-UY', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Botones de navegación - Desktop */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-20 p-3 bg-[#A67C52]/20 hover:bg-[#A67C52]/40 border border-[#A67C52]/40 hover:border-[#A67C52] backdrop-blur-sm transition-all duration-300 group"
                aria-label="Anterior testimonio"
              >
                <ChevronLeft className="w-6 h-6 text-white group-hover:text-white transition-colors" strokeWidth={2} />
              </button>

              <button
                onClick={handleNext}
                className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-20 p-3 bg-[#A67C52]/20 hover:bg-[#A67C52]/40 border border-[#A67C52]/40 hover:border-[#A67C52] backdrop-blur-sm transition-all duration-300 group"
                aria-label="Siguiente testimonio"
              >
                <ChevronRight className="w-6 h-6 text-white group-hover:text-white transition-colors" strokeWidth={2} />
              </button>
            </>
          )}

          {/* Indicadores y Controles - Mobile & Desktop */}
          <div className="mt-16 space-y-6">
            {/* Indicadores */}
            {testimonials.length > 1 && (
              <div className="flex justify-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-1.5 transition-all duration-300 ${
                      index === currentIndex
                        ? 'w-12 bg-[#A67C52]'
                        : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Ir al testimonio ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Botones de navegación - Mobile */}
            {testimonials.length > 1 && (
              <div className="flex md:hidden justify-center gap-4">
                <button
                  onClick={handlePrev}
                  className="p-3 bg-[#A67C52]/20 hover:bg-[#A67C52]/40 border border-[#A67C52]/40 hover:border-[#A67C52] backdrop-blur-sm transition-all duration-300 group"
                  aria-label="Anterior testimonio"
                >
                  <ChevronLeft className="w-6 h-6 text-white group-hover:text-white transition-colors" strokeWidth={2} />
                </button>

                <button
                  onClick={handleNext}
                  className="p-3 bg-[#A67C52]/20 hover:bg-[#A67C52]/40 border border-[#A67C52]/40 hover:border-[#A67C52] backdrop-blur-sm transition-all duration-300 group"
                  aria-label="Siguiente testimonio"
                >
                  <ChevronRight className="w-6 h-6 text-white group-hover:text-white transition-colors" strokeWidth={2} />
                </button>
              </div>
            )}

            {/* Contador */}
            <div className="text-center">
              <span className="font-fira text-sm text-white/50">
                {currentIndex + 1} / {testimonials.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
