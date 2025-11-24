'use client';

/**
 * Hero - Sección principal
 * Diseño minimalista, premium y elegante
 * Color predominante: #2d2d2d con acentos marrones
 */

import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#2d2d2d] overflow-hidden">
      {/* Patrón sutil de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #B89968 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Contenido */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Título principal */}
          <h1 className="font-voga text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight">
            Alma Fotografía
          </h1>

          {/* Línea decorativa */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#B89968]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#B89968]" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#B89968]" />
          </div>

          {/* Subtítulo */}
          <p className="font-fira text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Capturamos pedacitos de vida para que puedas recordarlos siempre que sientas esa nostalgia en el corazón
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#contacto"
              className="group px-8 py-4 bg-[#B89968] text-[#2d2d2d] rounded-sm font-fira text-sm font-semibold uppercase tracking-wider hover:bg-[#8B5E3C] transition-all duration-300"
            >
              Solicitar Reserva
            </a>
            <a
              href="#servicios"
              className="px-8 py-4 border border-[#B89968]/30 text-[#B89968] rounded-sm font-fira text-sm font-semibold uppercase tracking-wider hover:bg-[#B89968]/10 transition-all duration-300"
            >
              Ver Portafolio
            </a>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <a href="#servicios" className="flex flex-col items-center gap-2 text-gray-400 hover:text-[#B89968] transition-colors">
            <span className="font-fira text-xs uppercase tracking-wider">Explorar</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ArrowDown size={20} />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
