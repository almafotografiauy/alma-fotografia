'use client';

/**
 * Hero Section - Client Component
 *
 * Fullscreen hero con parallax sutil, animaciones fluidas
 * y CTAs principales de la landing.
 */

import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, Image as ImageIcon, Download } from 'lucide-react';

export default function HeroClient() {
  // Parallax effect en scroll
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#f8f6f3] via-white to-[#faf8f5]">
      {/* Elementos decorativos con blur */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 2 }}
          className="absolute top-20 left-10 w-96 h-96 bg-[#8B5E3C] rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#B89968] rounded-full blur-3xl"
        />
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10"
      >
        <div className="text-center">
          {/* Logo/Título */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <h1 className="font-voga text-6xl sm:text-7xl lg:text-8xl text-gray-900 mb-4">
              Alma Fotografía
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#8B5E3C] to-[#B89968] mx-auto rounded-full" />
          </motion.div>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-fira text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Capturamos pedacitos de vida para que puedas recordarlos siempre que sientas esa nostalgia en el corazón.
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-12"
          >
            <Feature icon={Calendar} text="Sesiones personalizadas" />
            <Feature icon={ImageIcon} text="Galería online privada" />
            <Feature icon={Download} text="Descarga digital HD" />
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.a
              href="#contacto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 bg-[#8B5E3C] text-white rounded-full font-fira font-semibold text-base hover:bg-[#6d4a2f] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Solicitar Reserva
              <motion.span
                className="inline-block"
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                →
              </motion.span>
            </motion.a>

            <motion.a
              href="#servicios"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-[#8B5E3C] border-2 border-[#8B5E3C] rounded-full font-fira font-semibold text-base hover:bg-[#8B5E3C]/5 transition-all duration-300 w-full sm:w-auto text-center"
            >
              Ver Portafolio
            </motion.a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 border-2 border-[#8B5E3C] rounded-full flex items-start justify-center p-2"
            >
              <motion.div className="w-1.5 h-1.5 bg-[#8B5E3C] rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

// Feature component con microanimación
function Feature({ icon: Icon, text }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="flex items-center gap-2 text-gray-700"
    >
      <div className="w-10 h-10 rounded-full bg-[#8B5E3C]/10 flex items-center justify-center">
        <Icon size={18} className="text-[#8B5E3C]" />
      </div>
      <span className="font-fira text-sm font-medium">{text}</span>
    </motion.div>
  );
}
