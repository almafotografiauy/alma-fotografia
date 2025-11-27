'use client';

/**
 * Servicios - Galería por servicio
 * Diseño elegante tipo revista de moda con tarjetas sofisticadas
 */

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import { getOrCreateLandingGalleryLink } from '@/app/actions/landing-actions';
import { Camera, Eye, Image as ImageIcon, Clock, Sparkles } from 'lucide-react';

export default function Servicios({ services }) {
  const openGallery = async (gallery, setIsLoadingGallery) => {
    if (!gallery?.id || !gallery?.slug) return;

    setIsLoadingGallery(true);
    // Para galerías públicas, acceder directamente sin token
    window.open(`/galeria/${gallery.slug}`, '_blank');
    setIsLoadingGallery(false);
  };

  if (!services || services.length === 0) {
    return (
      <section id="servicios" className="relative py-32 bg-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#A67C52] to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#A67C52] shadow-lg shadow-[#A67C52]/50" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-[#A67C52] to-transparent" />
          </div>

          <h2 className="font-voga text-5xl md:text-6xl text-[#2d2d2d] mb-6">
            Nuestro Portafolio
          </h2>

          <p className="font-fira text-[#2d2d2d]/70 text-lg max-w-2xl mx-auto">
            Próximamente publicaremos nuestras galerías más selectas
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="servicios" className="relative py-32 bg-white overflow-hidden">
      {/* Detalles decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#A67C52]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#A67C52]/30 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header elegante */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          {/* Ornamento superior */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#A67C52] to-transparent" />
            <Camera className="w-4 h-4 text-[#A67C52]" strokeWidth={1.5} />
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-[#A67C52] to-transparent" />
          </div>

          <h2 className="font-voga text-5xl sm:text-6xl md:text-7xl text-[#2d2d2d] mb-6 tracking-wide">
            Nuestro Portafolio
          </h2>

          <p className="font-fira text-[#2d2d2d]/70 text-lg max-w-2xl mx-auto leading-relaxed">
            Cada sesión es una historia única, capturada con pasión y dedicación
          </p>

          {/* Ornamento inferior */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-[#A67C52] to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#A67C52] shadow-lg shadow-[#A67C52]/50" />
            <div className="h-[1px] w-20 bg-gradient-to-l from-transparent via-[#A67C52] to-transparent" />
          </div>
        </motion.div>

        {/* Servicios con layout alternado */}
        <div className="space-y-24">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              onOpenGallery={openGallery}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Tarjeta de servicio con diseño elegante y layout alternado
function ServiceCard({ service, index, onOpenGallery }) {
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const gallery = service.gallery;
  const photos = gallery?.photos || [];
  const isEven = index % 2 === 0;

  const handleOpenGallery = async () => {
    await onOpenGallery(gallery, setIsLoadingGallery);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.15 }}
      className="group"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

        {/* Imagen principal + previews - alterna izquierda/derecha */}
        <div className={`${isEven ? 'md:order-1' : 'md:order-2'}`}>
          {gallery?.cover_image ? (
            <div
              className="space-y-4"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Imagen principal con marco decorativo */}
              <div className="relative overflow-hidden">
                {/* Marco decorativo con esquinas doradas */}
                <div className="absolute -inset-3 pointer-events-none z-10">
                  {/* Esquinas doradas brillantes */}
                  <div className="absolute top-0 left-0 w-12 h-12">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#A67C52] to-transparent" />
                    <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#A67C52] to-transparent" />
                  </div>
                  <div className="absolute top-0 right-0 w-12 h-12">
                    <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#A67C52] to-transparent" />
                    <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-[#A67C52] to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-12 h-12">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#A67C52] to-transparent" />
                    <div className="absolute bottom-0 left-0 w-[1px] h-full bg-gradient-to-t from-[#A67C52] to-transparent" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-12 h-12">
                    <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#A67C52] to-transparent" />
                    <div className="absolute bottom-0 right-0 w-[1px] h-full bg-gradient-to-t from-[#A67C52] to-transparent" />
                  </div>
                </div>

                <div className="relative aspect-[3/2] overflow-hidden shadow-2xl cursor-pointer" onClick={handleOpenGallery}>
                  <Image
                    src={gallery.cover_image}
                    alt={gallery.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />

                  {/* Overlay oscuro con gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-500" />

                  {/* Contador de fotos - posición superior derecha */}
                  <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-[#2d2d2d]/90 backdrop-blur-sm border border-[#A67C52]/40 shadow-lg">
                    <Camera className="w-4 h-4 text-[#A67C52]" strokeWidth={1.5} />
                    <span className="font-fira text-sm text-white font-medium">
                      {photos.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid de previews - 8 fotos pequeñas (2 filas x 4 columnas) - más compacto */}
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.slice(0, 8).map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square overflow-hidden cursor-pointer group/preview"
                      onClick={handleOpenGallery}
                    >
                      <Image
                        src={photo.file_path}
                        alt={`${gallery.title} - foto ${idx + 1}`}
                        fill
                        className="object-cover transition-all duration-500 group-hover/preview:scale-110 group-hover/preview:brightness-110"
                        sizes="(max-width: 768px) 25vw, 12vw"
                      />
                      {/* Overlay sutil */}
                      <div className="absolute inset-0 bg-black/20 group-hover/preview:bg-black/10 transition-colors duration-300" />

                      {/* Borde marrón al hover */}
                      <div className="absolute inset-0 border border-transparent group-hover/preview:border-[#A67C52]/50 transition-colors duration-300" />

                      {/* Indicador de "más fotos" en la última preview si hay más de 8 */}
                      {idx === 7 && photos.length > 8 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <div className="text-center">
                            <span className="font-voga text-2xl text-white mb-0.5 block">+{photos.length - 8}</span>
                            <span className="font-fira text-[10px] text-white/80 uppercase tracking-wider">más</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] bg-[#1a1a1a] flex items-center justify-center border border-[#8B5E3C]/20">
              <Camera className="w-16 h-16 text-[#8B5E3C]/30" strokeWidth={1} />
            </div>
          )}
        </div>

        {/* Contenido de texto elaborado - alterna derecha/izquierda */}
        <div className={`${isEven ? 'md:order-2' : 'md:order-1'} text-center md:text-left space-y-6`}>

          {/* Título de la galería con servicio */}
          <div>
            <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
              <span className="font-fira text-xs font-semibold uppercase tracking-widest text-[#A67C52]">
                {service.name}
              </span>
            </div>

            <h3 className="font-voga text-3xl sm:text-4xl md:text-5xl text-[#2d2d2d] mb-3 leading-tight">
              {gallery?.title || service.name}
            </h3>

            {/* Línea decorativa debajo del título */}
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="h-[2px] w-16 bg-gradient-to-r from-[#A67C52] via-[#A67C52] to-transparent shadow-sm shadow-[#A67C52]/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#A67C52] shadow-md shadow-[#A67C52]/50" />
            </div>
          </div>

          {/* Descripción con quote style */}
          {gallery?.description && (
            <div className="relative pl-4 border-l-2 border-[#A67C52]/30">
              <p className="font-fira text-[#2d2d2d]/80 text-base md:text-lg leading-relaxed italic">
                "{gallery.description}"
              </p>
            </div>
          )}

          {/* Separador decorativo marrón más elaborado */}
          <div className="flex items-center gap-3 py-4 justify-center md:justify-start">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#A67C52]" />
            <div className="w-1 h-1 rounded-full bg-[#A67C52] shadow-sm shadow-[#A67C52]/50" />
            <div className="h-[1px] w-12 bg-gradient-to-r from-[#A67C52] via-[#A67C52] to-[#A67C52]" />
            <div className="w-1 h-1 rounded-full bg-[#A67C52] shadow-sm shadow-[#A67C52]/50" />
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#A67C52]" />
          </div>

          {/* Botón de acción - marrón con texto blanco */}
          <div>
            <button
              onClick={handleOpenGallery}
              disabled={isLoadingGallery}
              className="group/link relative inline-flex items-center gap-3 overflow-hidden mx-auto md:mx-0 disabled:opacity-70"
            >
              {/* Borde decorativo marrón */}
              <div className="absolute inset-0 border-2 border-[#8B5E3C] group-hover/link:border-[#6d4a2f] transition-colors duration-300" />

              {/* Fondo marrón */}
              <div className="absolute inset-0 bg-[#8B5E3C] group-hover/link:bg-[#6d4a2f] transition-colors duration-300" />

              {/* Brillo marrón al hover */}
              <div className="absolute inset-0 opacity-0 group-hover/link:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#A67C52]/10 to-transparent -translate-x-full group-hover/link:translate-x-full transition-transform duration-1000" />
              </div>

              {/* Contenido del botón */}
              <span className="relative z-10 px-8 py-4 font-fira text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                {isLoadingGallery ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" strokeWidth={2} />
                    Explorar Galería
                  </>
                )}
              </span>

              {/* Contador de fotos */}
              {!isLoadingGallery && (
                <span className="relative z-10 px-4 py-4 border-l border-white/20 font-fira text-sm text-white/90 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  {photos.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
