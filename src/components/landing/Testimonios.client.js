'use client';

/**
 * Testimonios - Client Component
 *
 * Grid de testimonios con animaciones staggered
 * Muestra rating, comentario y nombre del cliente
 */

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export default function TestimoniosClient({ testimonials }) {
  return (
    <section id="testimonios" className="py-20 bg-gradient-to-br from-[#f8f6f3] via-white to-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-voga text-4xl sm:text-5xl text-gray-900 mb-4">
            Testimonios
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-[#8B5E3C] to-[#B89968] mx-auto rounded-full mb-6" />
          <p className="font-fira text-gray-600 max-w-2xl mx-auto">
            Lo que dicen nuestros clientes sobre su experiencia
          </p>
        </motion.div>

        {/* Grid con staggered animation */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Variants para staggered animation
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

// Testimonial Card Component
function TestimonialCard({ testimonial }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
    >
      {/* Quote Icon decorativo */}
      <div className="absolute top-6 right-6 opacity-10">
        <Quote size={48} className="text-[#8B5E3C]" />
      </div>

      {/* Rating con estrellas */}
      <div className="flex items-center gap-1 mb-4 relative z-10">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Star
              size={16}
              className={
                i < testimonial.rating
                  ? 'fill-[#B89968] text-[#B89968]'
                  : 'text-gray-300'
              }
            />
          </motion.div>
        ))}
      </div>

      {/* Comment */}
      <p className="font-fira text-sm text-gray-700 leading-relaxed mb-6 relative z-10">
        "{testimonial.comment}"
      </p>

      {/* Client Info */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5E3C] to-[#B89968] flex items-center justify-center flex-shrink-0">
          <span className="font-voga text-white text-lg">
            {testimonial.client_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-fira text-sm font-semibold text-gray-900">
            {testimonial.client_name}
          </p>
          {testimonial.service_type && (
            <p className="font-fira text-xs text-gray-500">
              {testimonial.service_type.name}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
