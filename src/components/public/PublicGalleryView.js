'use client';

import { useState, useCallback, useEffect, memo } from 'react';
import Image from 'next/image';
import { Download, X, ChevronLeft, ChevronRight, Grid3x3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicDownloadAllButton from '@/components/public/PublicDownloadAllButton';

/**
 * PhotoGrid - Grid memoizado de fotos
 */
const PhotoGrid = memo(({ photos, galleryTitle, onPhotoClick, onDownload }) => {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="group relative break-inside-avoid mb-4"
        >
          <div
            className="relative w-full bg-beige/20 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => onPhotoClick(photo, index)}
          >
            <Image
              src={photo.file_path}
              alt={`${galleryTitle} - ${photo.file_name || `Foto ${index + 1}`}`}
              width={800}
              height={800}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading="lazy"
              quality={85}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

            {/* Botón descargar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(photo);
              }}
              className="absolute bottom-4 right-4 p-2.5 bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Descargar foto"
            >
              <Download size={18} className="text-black" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

PhotoGrid.displayName = 'PhotoGrid';

/**
 * Componente principal
 */
export default function PublicGalleryView({ gallery, token }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const { title, eventDate, photos, coverImage } = gallery;

  // Formatear fecha
  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : null;

  // ✅ Callbacks para lightbox
  const openLightbox = useCallback((photo, index) => {
    setSelectedPhoto({ ...photo, index });
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  const goToPrevious = useCallback(() => {
    setSelectedPhoto(current => {
      if (!current || current.index === 0) return current;
      const prevPhoto = photos[current.index - 1];
      return { ...prevPhoto, index: current.index - 1 };
    });
  }, [photos]);

  const goToNext = useCallback(() => {
    setSelectedPhoto(current => {
      if (!current || current.index === photos.length - 1) return current;
      const nextPhoto = photos[current.index + 1];
      return { ...nextPhoto, index: current.index + 1 };
    });
  }, [photos]);

  // Función de descarga
  const handleDownload = useCallback(async (photo) => {
    try {
      let downloadUrl = photo.file_path;

      // ✅ Si es Cloudinary, forzar formato original (NO webp) + calidad máxima
      if (downloadUrl.includes('res.cloudinary.com')) {
        const urlParts = downloadUrl.split('/upload/');
        if (urlParts.length === 2) {
          // Detectar si la imagen original es PNG (tiene transparencia) o JPG
          const isPNG = urlParts[1].toLowerCase().includes('.png') ||
            photo.file_name?.toLowerCase().endsWith('.png');

          // Forzar formato original: PNG si es PNG, JPG si no
          const format = isPNG ? 'png' : 'jpg';

          // fl_attachment: fuerza descarga
          // q_100: calidad máxima
          // f_png o f_jpg: fuerza formato específico (evita webp)
          downloadUrl = `${urlParts[0]}/upload/fl_attachment,q_100,f_${format}/${urlParts[1]}`;
        }
      }

      // ✅ Determinar nombre con extensión correcta
      let fileName = photo.file_name;

      if (!fileName) {
        const urlPath = photo.file_path.split('/').pop().split('?')[0];
        fileName = urlPath || `foto-${Date.now()}.jpg`;
      }

      // ✅ Forzar extensión JPG o PNG (nunca webp)
      const isPNG = fileName.toLowerCase().includes('.png') ||
        photo.file_path.toLowerCase().includes('.png');

      // Remover cualquier extensión existente
      fileName = fileName.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');

      // Agregar extensión correcta
      fileName += isPNG ? '.png' : '.jpg';

      console.log('📥 Descargando:', fileName, 'desde:', downloadUrl);

      // ✅ Fetch y descarga sin abrir pestaña
      const response = await fetch(downloadUrl, {
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error('Error al obtener la imagen');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 150);

    } catch (error) {
      console.error('❌ Error downloading photo:', error);
      alert('Error al descargar la foto. Por favor intenta de nuevo.');
    }
  }, []);

  // Navegación por teclado
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, goToPrevious, goToNext, closeLightbox]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero adaptativo */}
      {coverImage ? (
        <section className="relative w-full bg-black">
          <div className="relative w-full" style={{ maxHeight: '90vh' }}>
            <Image
              src={coverImage}
              alt={title}
              width={1920}
              height={1080}
              className="w-full h-auto object-contain"
              style={{ maxHeight: '90vh' }}
              priority
              quality={95}
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                  <div className="flex items-center gap-2 text-white/90 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Grid3x3 size={16} />
                    <span className="font-fira text-sm">
                      {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  </div>

                  <PublicDownloadAllButton
                    photos={photos}
                    galleryTitle={title}
                  />
                </div>
              </div>

              <div className="p-8 md:p-12">
                <div className="max-w-7xl mx-auto">
                  <h1 className="font-voga text-4xl md:text-6xl text-white mb-3 drop-shadow-2xl">
                    {title}
                  </h1>
                  {formattedDate && (
                    <p className="font-fira text-lg md:text-xl text-white/90 drop-shadow-lg">
                      {formattedDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <header className="border-b border-black/10 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
            <h1 className="font-voga text-3xl md:text-4xl text-black mb-2">
              {title}
            </h1>
            {formattedDate && (
              <p className="font-fira text-sm text-black/60">{formattedDate}</p>
            )}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-black/60">
                <Grid3x3 size={16} />
                <span className="font-fira text-sm">
                  {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                </span>
              </div>
              <PublicDownloadAllButton
                photos={photos}
                galleryTitle={title}
              />
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-fira text-black/60">
              Esta galería aún no tiene fotos.
            </p>
          </div>
        ) : (
          <PhotoGrid
            photos={photos}
            galleryTitle={title}
            onPhotoClick={openLightbox}
            onDownload={handleDownload}
          />
        )}
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            >
              <X size={24} className="text-white" />
            </button>

            <div className="absolute top-6 left-6 px-4 py-2 bg-white/10 rounded-lg z-50">
              <span className="font-fira text-sm text-white">
                {selectedPhoto.index + 1} / {photos.length}
              </span>
            </div>

            {selectedPhoto.index > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-6 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
              >
                <ChevronLeft size={32} className="text-white" />
              </button>
            )}

            {selectedPhoto.index < photos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
              >
                <ChevronRight size={32} className="text-white" />
              </button>
            )}

            <motion.div
              key={selectedPhoto.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full mx-auto px-20"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedPhoto.file_path}
                alt={`${title} - ${selectedPhoto.file_name || `Foto ${selectedPhoto.index + 1}`}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
                quality={95}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}