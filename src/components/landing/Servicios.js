'use client';

/**
 * Servicios - Galería por servicio
 * Muestra cada servicio con título, descripción y galería pública
 * Diseño minimalista oscuro con acentos marrones
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Servicios({ services }) {
  const [lightboxData, setLightboxData] = useState(null);

  const openLightbox = (gallery, photoIndex = 0) => {
    setLightboxData({ gallery, photoIndex });
  };

  const closeLightbox = () => {
    setLightboxData(null);
  };

  if (!services || services.length === 0) {
    return (
      <section id="servicios" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-voga text-4xl text-[#2d2d2d] mb-4">
            Servicios
          </h2>
          <div className="w-16 h-px bg-[#B89968] mx-auto mb-6" />
          <p className="font-fira text-gray-600">
            Próximamente publicaremos nuestras galerías
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="servicios" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="font-voga text-5xl md:text-6xl text-[#2d2d2d] mb-4">
              Servicios
            </h2>
            <div className="w-16 h-px bg-[#B89968] mx-auto" />
          </motion.div>

          {/* Servicios */}
          <div className="space-y-32">
            {services.map((service, index) => (
              <ServiceSection
                key={service.id}
                service={service}
                index={index}
                onOpenLightbox={openLightbox}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxData && (
          <Lightbox
            gallery={lightboxData.gallery}
            initialIndex={lightboxData.photoIndex}
            onClose={closeLightbox}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Sección de cada servicio
function ServiceSection({ service, index, onOpenLightbox }) {
  const gallery = service.gallery;
  const photos = gallery?.photos || [];
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
    >
      {/* Texto */}
      <div className={`${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
        <div className="max-w-lg">
          <h3 className="font-voga text-4xl md:text-5xl text-[#2d2d2d] mb-6">
            {service.name}
          </h3>

          {gallery?.description && (
            <p className="font-fira text-lg text-gray-600 leading-relaxed mb-8">
              {gallery.description}
            </p>
          )}

          {photos.length > 0 && (
            <button
              onClick={() => onOpenLightbox(gallery, 0)}
              className="inline-block px-6 py-3 border-2 border-[#2d2d2d] text-[#2d2d2d] font-fira text-sm font-semibold uppercase tracking-wider hover:bg-[#2d2d2d] hover:text-white transition-all duration-300"
            >
              Ver Galería ({photos.length} {photos.length === 1 ? 'foto' : 'fotos'})
            </button>
          )}
        </div>
      </div>

      {/* Galería Preview */}
      <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
        {gallery?.cover_image ? (
          <div
            className="group relative aspect-[4/3] overflow-hidden cursor-pointer"
            onClick={() => photos.length > 0 && onOpenLightbox(gallery, 0)}
          >
            <Image
              src={gallery.cover_image}
              alt={gallery.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-[#2d2d2d]/0 group-hover:bg-[#2d2d2d]/20 transition-colors duration-300" />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
            <span className="font-voga text-2xl text-gray-400">
              {service.name}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Lightbox Component
function Lightbox({ gallery, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const photos = gallery.photos || [];

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') prevPhoto();
    if (e.key === 'ArrowRight') nextPhoto();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#2d2d2d]/98 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-white/60 hover:text-white transition-colors z-50"
        aria-label="Cerrar galería"
      >
        <X size={32} />
      </button>

      {/* Gallery Title */}
      <div className="absolute top-6 left-6 z-50">
        <h3 className="font-voga text-2xl text-white">{gallery.title}</h3>
      </div>

      {/* Photo */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-6xl aspect-[4/3]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photos[currentIndex]?.cloudinary_url}
          alt={photos[currentIndex]?.file_name || 'Foto'}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </motion.div>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-white/60 hover:text-white transition-colors"
            aria-label="Foto anterior"
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-white/60 hover:text-white transition-colors"
            aria-label="Siguiente foto"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm">
        <span className="font-fira text-sm text-white">
          {currentIndex + 1} / {photos.length}
        </span>
      </div>
    </motion.div>
  );
}
