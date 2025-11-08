'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Lightbox - Visor de fotos en pantalla completa
 * 
 * Props:
 * - photos: Array de objetos con { file_path, file_name }
 * - currentIndex: Índice de la foto actual
 * - onClose: Función para cerrar
 * - onNext: Función para siguiente foto
 * - onPrev: Función para foto anterior
 */
export default function Lightbox({ photos, currentIndex, onClose, onNext, onPrev }) {
  const currentPhoto = photos[currentIndex];

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  // Prevenir scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
        aria-label="Cerrar"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Botón anterior */}
      {photos.length > 1 && (
        <button
          onClick={onPrev}
          className="absolute left-2 sm:left-4 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          aria-label="Foto anterior"
        >
          <ChevronLeft size={32} className="text-white" />
        </button>
      )}

      {/* Botón siguiente */}
      {photos.length > 1 && (
        <button
          onClick={onNext}
          className="absolute right-2 sm:right-4 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          aria-label="Foto siguiente"
        >
          <ChevronRight size={32} className="text-white" />
        </button>
      )}

      {/* Imagen principal */}
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] p-4 sm:p-8">
        <Image
          src={currentPhoto.file_path}
          alt={currentPhoto.file_name || `Foto ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="100vw"
          priority
          quality={95}
        />
      </div>

      {/* Contador */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full">
        <p className="font-fira text-sm text-white">
          {currentIndex + 1} / {photos.length}
        </p>
      </div>

      {/* Nombre de archivo (opcional) */}
      {currentPhoto.file_name && (
        <div className="absolute top-4 left-4 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg max-w-xs">
          <p className="font-fira text-xs text-white truncate">
            {currentPhoto.file_name}
          </p>
        </div>
      )}
    </div>
  );
}