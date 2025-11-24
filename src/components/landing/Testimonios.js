'use client';

/**
 * Testimonios - Testimonios destacados
 * Diseño minimalista con fondo oscuro
 */

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export default function Testimonios({ testimonials }) {
  if (!testimonials || testimonials.length === 0) {
    return null; // No mostrar sección si no hay testimonios
  }

  return (
    <section id="testimonios" className="py-32 bg-[#2d2d2d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="font-voga text-5xl md:text-6xl text-white mb-4">
            Testimonios
          </h2>
          <div className="w-16 h-px bg-[#B89968] mx-auto" />
        </motion.div>

        {/* Grid de testimonios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Tarjeta de testimonio
function TestimonialCard({ testimonial, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="bg-white/5 backdrop-blur-sm p-8 border border-white/10 hover:border-[#B89968]/30 transition-colors duration-300"
    >
      {/* Rating */}
      <div className="flex gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={
              i < testimonial.rating
                ? 'fill-[#B89968] text-[#B89968]'
                : 'text-white/20'
            }
          />
        ))}
      </div>

      {/* Comentario */}
      <p className="font-fira text-base text-gray-300 leading-relaxed mb-8">
        "{testimonial.comment}"
      </p>

      {/* Cliente */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#B89968]/20 flex items-center justify-center flex-shrink-0">
          <span className="font-voga text-[#B89968] text-lg">
            {testimonial.client_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-fira text-sm font-semibold text-white">
            {testimonial.client_name}
          </p>
          {testimonial.service_type && (
            <p className="font-fira text-xs text-gray-400">
              {testimonial.service_type.name}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
