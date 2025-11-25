'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Hero - Carrusel fullscreen de fotos
 * Diseño elegante y profesional con transiciones suaves
 */

const heroImages = [
  '/assets/fotos/fondo1.jpg',
  '/assets/fotos/fondo2.jpg',
  '/assets/fotos/fondo3.jpg',
  '/assets/fotos/fondo4.jpg',
  '/assets/fotos/fondo5.jpg',
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-play del carrusel
  useEffect(() => {
    const timer = setInterval(() => {
      nextImage();
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(timer);
  }, [currentIndex]);

  const nextImage = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  };

  const prevImage = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const goToImage = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Variantes de animación para las imágenes
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Carrusel de imágenes */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 },
          }}
          className="absolute inset-0"
        >
          <Image
            src={heroImages[currentIndex]}
            alt={`Alma Fotografía - Imagen ${currentIndex + 1}`}
            fill
            priority={currentIndex === 0}
            className="object-cover"
            quality={90}
          />
          {/* Overlay oscuro para mejorar legibilidad y resaltar detalles */}
          <div className="absolute inset-0 bg-black/60" />
          {/* Gradiente adicional desde arriba y abajo */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />
        </motion.div>
      </AnimatePresence>

      {/* Contenido sobre las imágenes */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center max-w-5xl"
        >
          {/* Detalles decorativos superiores */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#B89968]" />
            <div className="w-1 h-1 rounded-full bg-[#B89968] shadow-sm shadow-[#B89968]" />
            <div className="w-1 h-1 rounded-full bg-[#D4AF37] shadow-md shadow-[#D4AF37]" />
            <div className="w-1 h-1 rounded-full bg-[#B89968] shadow-sm shadow-[#B89968]" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#B89968]" />
          </motion.div>

          {/* Título principal con efectos */}
          <div className="relative inline-block mb-6 sm:mb-8">
            {/* Brillo sutil detrás del título */}
            <div className="absolute inset-0 blur-3xl bg-[#B89968]/20 scale-150" />

            <h1 className="relative font-voga text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white leading-tight">
              <span className="inline-block drop-shadow-2xl">Alma Fotografía</span>
            </h1>

            {/* Líneas decorativas a los lados del título */}
            <div className="absolute left-0 right-0 -bottom-3 flex items-center justify-center gap-3">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-sm shadow-[#D4AF37]/50" />
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/80" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-xl shadow-[#D4AF37]" />
                <div className="w-1 h-1 rounded-full bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/80" />
              </div>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent via-[#D4AF37] to-transparent shadow-sm shadow-[#D4AF37]/50" />
            </div>
          </div>

          {/* Subtítulo con marco elegante */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="relative max-w-3xl mx-auto mb-8 sm:mb-12 mt-8 sm:mt-12"
          >
            {/* Esquinas decorativas */}
            <div className="absolute -top-2 -left-2 w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#D4AF37] to-transparent shadow-sm shadow-[#D4AF37]/50" />
              <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#D4AF37] to-transparent shadow-sm shadow-[#D4AF37]/50" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8">
              <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#D4AF37] to-transparent shadow-sm shadow-[#D4AF37]/50" />
              <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-[#D4AF37] to-transparent shadow-sm shadow-[#D4AF37]/50" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8">
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#D4AF37] to-transparent shadow-sm shadow-[#D4AF37]/50" />
              <div className="absolute bottom-0 left-0 w-[1px] h-full bg-gradient-to-t from-[#D4AF37] to-transparent shadow-sm shadow-[#D4AF37]/50" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8">
              <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#D4AF37] to-transparent shadow-sm shadow-[#D4AF37]/50" />
              <div className="absolute bottom-0 right-0 w-[1px] h-full bg-gradient-to-t from-[#D4AF37] to-transparent shadow-sm shadow-[#D4AF37]/50" />
            </div>

            <p className="font-fira text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed px-4 py-2">
              Capturamos pedacitos de vida para que puedas recordarlos siempre que sientas esa nostalgia en el corazón
            </p>
          </motion.div>

          {/* CTA Buttons con efectos mejorados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Botón principal - marrón sólido */}
            <a
              href="#reservas"
              className="group relative w-full sm:w-auto overflow-hidden"
            >
              {/* Borde marrón */}
              <div className="absolute inset-0 border border-[#8B5E3C] group-hover:border-[#6d4a2f] transition-colors duration-300" />

              {/* Fondo marrón más sólido */}
              <div className="absolute inset-0 bg-[#8B5E3C] group-hover:bg-[#6d4a2f] transition-colors duration-300" />

              {/* Brillo animado */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>

              <span className="relative z-10 block px-10 py-4 font-fira text-sm font-semibold uppercase tracking-wider text-white drop-shadow-lg text-center">
                Solicitar Reserva
              </span>
            </a>

            {/* Botón secundario - más nítido */}
            <a
              href="#servicios"
              className="group relative w-full sm:w-auto overflow-hidden"
            >
              {/* Borde definido */}
              <div className="absolute inset-0 border-2 border-white/80 group-hover:border-[#B89968] transition-colors duration-300" />

              {/* Fondo más transparente sin tanto blur */}
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />

              {/* Líneas decorativas en las esquinas */}
              <div className="absolute top-0 left-0 w-3 h-[1px] bg-[#B89968] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 left-0 w-[1px] h-3 bg-[#B89968] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-3 h-[1px] bg-[#B89968] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 right-0 w-[1px] h-3 bg-[#B89968] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 w-3 h-[1px] bg-[#B89968] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 w-[1px] h-3 bg-[#B89968] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 right-0 w-3 h-[1px] bg-[#B89968] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 right-0 w-[1px] h-3 bg-[#B89968] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <span className="relative z-10 block px-10 py-4 font-fira text-sm font-semibold uppercase tracking-wider text-white drop-shadow-lg text-center">
                Ver Portafolio
              </span>
            </a>
          </motion.div>

          {/* Controles móviles y tablet - Flechas centradas abajo de los botones */}
          <div className="flex lg:hidden items-center justify-center gap-4 mt-6">
            <button
              onClick={prevImage}
              className="p-2.5 rounded-full bg-black/30 hover:bg-black/50 !text-white backdrop-blur-sm transition-all duration-300"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={20} className="!text-white" />
            </button>
            <button
              onClick={nextImage}
              className="p-2.5 rounded-full bg-black/30 hover:bg-black/50 !text-white backdrop-blur-sm transition-all duration-300"
              aria-label="Siguiente imagen"
            >
              <ChevronRight size={20} className="!text-white" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Controles de navegación - Flechas laterales (solo desktop grande) */}
      <button
        onClick={prevImage}
        className="hidden lg:block absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 !text-white backdrop-blur-sm transition-all duration-300 hover:scale-110"
        aria-label="Imagen anterior"
      >
        <ChevronLeft size={24} className="!text-white" />
      </button>

      <button
        onClick={nextImage}
        className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/30 hover:bg-black/50 !text-white backdrop-blur-sm transition-all duration-300 hover:scale-110"
        aria-label="Siguiente imagen"
      >
        <ChevronRight size={24} className="!text-white" />
      </button>

      {/* Indicadores de puntos */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 sm:w-12 h-1.5 sm:h-2 bg-[#B89968]'
                : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Ir a imagen ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
