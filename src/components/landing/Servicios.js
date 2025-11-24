'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function Servicios({ services }) {
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <section id="servicios" className="py-20 bg-white">
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
            Nuestros Servicios
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-[#8B5E3C] to-[#B89968] mx-auto rounded-full mb-6" />
          <p className="font-fira text-gray-600 max-w-2xl mx-auto">
            Cada sesión es única y personalizada para capturar la esencia de tus momentos especiales
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              onViewGallery={() => setSelectedGallery(service.gallery)}
            />
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedGallery && (
          <GalleryLightbox
            gallery={selectedGallery}
            onClose={() => {
              setSelectedGallery(null);
              setSelectedPhoto(null);
            }}
            selectedPhoto={selectedPhoto}
            onSelectPhoto={setSelectedPhoto}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// Service Card Component
function ServiceCard({ service, index, onViewGallery }) {
  const gallery = service.gallery;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
    >
      {/* Cover Image */}
      <div className="relative h-64 overflow-hidden">
        {gallery?.cover_photo ? (
          <Image
            src={gallery.cover_photo.cloudinary_url}
            alt={gallery.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#8B5E3C]/20 to-[#B89968]/20 flex items-center justify-center">
            <span className="font-voga text-4xl text-[#8B5E3C]/30">
              {service.name}
            </span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          {service.icon_name && (
            <div className="w-10 h-10 rounded-full bg-[#8B5E3C]/10 flex items-center justify-center">
              <span className="text-xl">{getServiceIcon(service.icon_name)}</span>
            </div>
          )}
          <h3 className="font-voga text-2xl text-gray-900">
            {service.name}
          </h3>
        </div>

        {gallery?.description && (
          <p className="font-fira text-sm text-gray-600 mb-4 line-clamp-2">
            {gallery.description}
          </p>
        )}

        {/* Photo Count */}
        {gallery?.photos && (
          <div className="flex items-center justify-between mb-4">
            <span className="font-fira text-xs text-gray-500">
              {gallery.photos.length} fotos
            </span>
          </div>
        )}

        {/* View Gallery Button */}
        {gallery && (
          <button
            onClick={onViewGallery}
            className="w-full px-4 py-2.5 bg-[#8B5E3C] text-white rounded-lg font-fira text-sm font-semibold hover:bg-[#6d4a2f] transition-colors duration-300 flex items-center justify-center gap-2 group"
          >
            Ver galería
            <ExternalLink
              size={16}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Gallery Lightbox Component
function GalleryLightbox({ gallery, onClose, selectedPhoto, onSelectPhoto }) {
  const photos = gallery.photos || [];
  const currentIndex = selectedPhoto
    ? photos.findIndex((p) => p.id === selectedPhoto.id)
    : -1;

  const showPhoto = (photo) => {
    onSelectPhoto(photo);
  };

  const nextPhoto = () => {
    if (currentIndex < photos.length - 1) {
      showPhoto(photos[currentIndex + 1]);
    }
  };

  const prevPhoto = () => {
    if (currentIndex > 0) {
      showPhoto(photos[currentIndex - 1]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
        aria-label="Cerrar galería"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Gallery Title */}
      <div className="absolute top-4 left-4 z-50">
        <h3 className="font-voga text-2xl text-white">{gallery.title}</h3>
      </div>

      {/* Content */}
      <div
        className="w-full max-w-7xl"
        onClick={(e) => e.stopPropagation()}
      >
        {selectedPhoto ? (
          // Single Photo View
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full h-[80vh] flex items-center justify-center"
            >
              <Image
                src={selectedPhoto.cloudinary_url}
                alt={selectedPhoto.file_name}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </motion.div>

            {/* Navigation Arrows */}
            {currentIndex > 0 && (
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Foto anterior"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {currentIndex < photos.length - 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Siguiente foto"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Photo Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
              <span className="font-fira text-sm text-white">
                {currentIndex + 1} / {photos.length}
              </span>
            </div>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[80vh] overflow-y-auto p-4">
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square cursor-pointer group"
                onClick={() => showPhoto(photo)}
              >
                <Image
                  src={photo.cloudinary_url}
                  alt={photo.file_name}
                  fill
                  className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Helper function to get icon emoji
function getServiceIcon(iconName) {
  const icons = {
    'Wedding': '💒',
    'Portrait': '👤',
    'Event': '🎉',
    'Family': '👨‍👩‍👧‍👦',
    'Maternity': '🤰',
    'Newborn': '👶',
    'Birthday': '🎂',
    'Corporate': '💼',
  };
  return icons[iconName] || '📸';
}
