'use client';

import { useState, useCallback, useEffect, memo, useRef } from 'react';
import Image from 'next/image';
import {
  Download, X, ChevronLeft, ChevronRight, Heart,
  Share2, Check, Mail, Lock, Loader2, AlertCircle,
  ChevronDown, Play, Pause, MessageSquare, Info, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TestimonialForm from '@/components/public/TestimonialForm';
import { toggleFavorite, getClientFavorites, submitFavoritesSelection } from '@/app/actions/favorites-actions';
import { useToast } from '@/components/ui/Toast';

/**
 * PhotoGrid - Grid masonry responsivo tipo Pixieset
 */
const PhotoGrid = memo(({
  photos,
  galleryTitle,
  gallerySlug,
  onPhotoClick,
  onToggleFavorite,
  favoritePhotoIds,
  maxFavorites,
  downloadEnabled,
  onDownloadPhoto,
}) => {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2 space-y-2">
      {photos.map((photo, index) => {
        const isFavorite = favoritePhotoIds.includes(photo.id);

        return (
          <div
            key={photo.id}
            className="group relative break-inside-avoid"
          >
            <div
              className="relative w-full bg-gray-100 overflow-hidden cursor-pointer"
              onClick={() => onPhotoClick(photo, index)}
            >
              <Image
                src={photo.file_path}
                alt={`${galleryTitle} - ${photo.file_name || `Foto ${index + 1}`}`}
                width={1200}
                height={1200}
                className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                loading="lazy"
                quality={90}
                unoptimized
              />

              {/* Overlay en hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

              {/* Botón de favorito - solo si maxFavorites > 0 */}
              {maxFavorites > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(photo.id);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${
                    isFavorite
                      ? 'bg-white shadow-md opacity-100'
                      : 'bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100'
                  }`}
                  title={isFavorite ? 'Quitar de favoritas' : 'Agregar a favoritas'}
                >
                  <Heart
                    size={18}
                    className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-700'}
                    strokeWidth={1.5}
                  />
                </button>
              )}

              {/* Botón de descarga - solo si downloadEnabled */}
              {downloadEnabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadPhoto(photo, index, gallerySlug);
                  }}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-300"
                  title="Descargar foto"
                >
                  <Download
                    size={18}
                    className="text-gray-700"
                    strokeWidth={1.5}
                  />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

PhotoGrid.displayName = 'PhotoGrid';

/**
 * Componente principal - Vista pública tipo Pixieset
 */
export default function PublicGalleryView({ gallery, token }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [favoritePhotoIds, setFavoritePhotoIds] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isEditingAfterSubmit, setIsEditingAfterSubmit] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadEmail, setDownloadEmail] = useState(clientEmail || '');
  const [downloadPin, setDownloadPin] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadEnabled, setDownloadEnabled] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [headerSticky, setHeaderSticky] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const slideshowIntervalRef = useRef(null);
  const hasRegisteredView = useRef(false);
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [hasSeenMessage, setHasSeenMessage] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const favoritesDebounceRef = useRef(null);
  const lastNotificationSentRef = useRef(false);
  const { showToast } = useToast();

  const {
    id: galleryId,
    slug: gallerySlug,
    title,
    eventDate,
    photos,
    coverImage,
    allowDownloads,
    maxFavorites,
    customMessage,
    allowComments,
    downloadPin: galleryDownloadPin,
    allowShareFavorites,
  } = gallery;

  // Formatear fecha elegante
  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : null;

  // Detectar scroll para comportamiento del header
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const heroHeight = window.innerHeight;
          const stickyPoint = heroHeight + 100; // Punto donde el header se vuelve sticky

          // Determinar si el header debe ser sticky
          if (currentScrollY >= stickyPoint) {
            setHeaderSticky(true);

            // Controlar visibilidad basado en dirección de scroll
            const scrollDifference = currentScrollY - lastScrollY;

            if (scrollDifference > 5) {
              // Scrolleando hacia ABAJO más de 5px → OCULTAR
              setHeaderVisible(false);
            } else if (scrollDifference < -5) {
              // Scrolleando hacia ARRIBA más de 5px → MOSTRAR
              setHeaderVisible(true);
            }
          } else {
            // Antes del sticky point → header estático y visible
            setHeaderSticky(false);
            setHeaderVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Cargar favoritos del cliente
  const loadFavorites = useCallback(async (email) => {
    if (!email) return;

    setIsLoadingFavorites(true);
    try {
      const result = await getClientFavorites(galleryId, email);
      if (result.success) {
        setFavoritePhotoIds(result.favorites.map(f => f.photo_id));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [galleryId]);

  // Cargar email y nombre del cliente desde localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem(`gallery_${galleryId}_email`);
    const savedName = localStorage.getItem(`gallery_${galleryId}_name`);
    if (savedEmail) {
      setClientEmail(savedEmail);
      if (savedName) {
        setClientName(savedName);
      }
      loadFavorites(savedEmail);
    } else {
      setIsLoadingFavorites(false);
    }

    // Verificar si ya vio el mensaje personalizado
    const messageSeenKey = `gallery_${galleryId}_message_seen`;
    const messageSeen = localStorage.getItem(messageSeenKey);
    setHasSeenMessage(messageSeen === 'true');
  }, [galleryId, loadFavorites]);

  // Marcar mensaje como visto
  const handleOpenMessage = () => {
    setShowMessageModal(true);
    if (!hasSeenMessage) {
      const messageSeenKey = `gallery_${galleryId}_message_seen`;
      localStorage.setItem(messageSeenKey, 'true');
      setHasSeenMessage(true);
    }
  };

  // Guardar email, nombre y cargar favoritos
  const handleEmailSubmit = (email, name) => {
    const trimmedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();
    setClientEmail(trimmedEmail);
    setClientName(trimmedName);
    localStorage.setItem(`gallery_${galleryId}_email`, trimmedEmail);
    localStorage.setItem(`gallery_${galleryId}_name`, trimmedName);
    setShowEmailPrompt(false);
    setShowEmailTooltip(false);
    loadFavorites(trimmedEmail);
  };

  // Auto-submit de favoritos después de 5 minutos de inactividad
  const scheduleAutoSubmit = useCallback(() => {
    // Limpiar timer anterior si existe
    if (favoritesDebounceRef.current) {
      clearTimeout(favoritesDebounceRef.current);
      console.log('[Debounce] Timer reseteado - nueva actividad detectada');
    }

    // Programar nuevo auto-submit para 5 minutos (300000 ms)
    favoritesDebounceRef.current = setTimeout(async () => {
      console.log('[Debounce] 5 minutos de inactividad - enviando notificación...');

      if (!clientEmail) {
        console.log('[Debounce] No hay email del cliente, cancelando');
        return;
      }

      if (favoritePhotoIds.length === 0) {
        console.log('[Debounce] No hay favoritos seleccionados, cancelando');
        return;
      }

      // Evitar enviar notificación duplicada
      if (lastNotificationSentRef.current) {
        console.log('[Debounce] Notificación ya enviada, cancelando');
        return;
      }

      try {
        console.log(`[Debounce] Enviando notificación para ${favoritePhotoIds.length} favoritos`);
        const result = await submitFavoritesSelection(galleryId, clientEmail, clientName);

        if (result.success) {
          lastNotificationSentRef.current = true;
          console.log('[Debounce] Notificación enviada exitosamente');
          showToast({
            message: 'Tu selección ha sido guardada',
            type: 'success'
          });
        } else {
          console.error('[Debounce] Error al enviar notificación:', result.error);
        }
      } catch (error) {
        console.error('[Debounce] Error inesperado:', error);
      }
    }, 300000); // 5 minutos

    console.log('[Debounce] Nuevo timer de 5 minutos iniciado');
  }, [clientEmail, clientName, galleryId, showToast]);

  // Limpiar timer al desmontar componente
  useEffect(() => {
    return () => {
      if (favoritesDebounceRef.current) {
        clearTimeout(favoritesDebounceRef.current);
      }
    };
  }, []);

  // Toggle favorito
  const handleToggleFavorite = async (photoId) => {
    // Si maxFavorites es 0, desactivar completamente esta funcionalidad
    if (maxFavorites === 0) {
      return;
    }

    if (hasSubmitted && !isEditingAfterSubmit) {
      return;
    }

    if (!clientEmail) {
      setShowEmailPrompt(true);
      return;
    }

    const wasFavorite = favoritePhotoIds.includes(photoId);
    if (wasFavorite) {
      setFavoritePhotoIds(prev => prev.filter(id => id !== photoId));
    } else {
      if (favoritePhotoIds.length >= maxFavorites) {
        showToast({ message: `Has alcanzado el límite de ${maxFavorites} fotos favoritas`, type: 'error' });
        return;
      }
      setFavoritePhotoIds(prev => [...prev, photoId]);
    }

    try {
      const result = await toggleFavorite(galleryId, photoId, clientEmail, maxFavorites, clientName);
      if (!result.success) {
        // Revertir cambio si falló
        if (wasFavorite) {
          setFavoritePhotoIds(prev => [...prev, photoId]);
        } else {
          setFavoritePhotoIds(prev => prev.filter(id => id !== photoId));
        }
        showToast({ message: result.error || 'Error al actualizar favorita', type: 'error' });
      } else {
        // Resetear flag de notificación enviada si se hace un nuevo cambio
        lastNotificationSentRef.current = false;

        // Resetear el timer de auto-submit después de cada cambio exitoso
        scheduleAutoSubmit();

        console.log(`[Toggle] Favorito ${wasFavorite ? 'removido' : 'agregado'}, timer reseteado`);
      }
    } catch (error) {
      // Revertir cambio si hubo error
      if (wasFavorite) {
        setFavoritePhotoIds(prev => [...prev, photoId]);
      } else {
        setFavoritePhotoIds(prev => prev.filter(id => id !== photoId));
      }
      console.error('[Toggle] Error:', error);
    }
  };

  // Registrar vista de galería
  useEffect(() => {
    const registerView = async () => {
      const storageKey = `gallery_view_${gallery.id}`;

      if (hasRegisteredView.current) return;

      const alreadyRegistered = sessionStorage.getItem(storageKey);
      if (alreadyRegistered) {
        hasRegisteredView.current = true;
        return;
      }

      hasRegisteredView.current = true;
      sessionStorage.setItem(storageKey, 'true');

      try {
        await fetch('/api/galleries/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ galleryId: gallery.id }),
        });
      } catch (error) {
        console.error('Error registering gallery view:', error);
        sessionStorage.removeItem(storageKey);
        hasRegisteredView.current = false;
      }
    };

    registerView();
  }, [gallery.id]);

  // Lightbox
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

  // Iniciar slideshow
  const startSlideshow = useCallback(() => {
    if (photos.length === 0) return;

    // Abrir lightbox con la primera foto si no hay ninguna abierta
    if (!selectedPhoto) {
      openLightbox(photos[0], 0);
    }

    setIsSlideshow(true);
  }, [photos, selectedPhoto, openLightbox]);

  // Detener slideshow
  const stopSlideshow = useCallback(() => {
    setIsSlideshow(false);
    if (slideshowIntervalRef.current) {
      clearInterval(slideshowIntervalRef.current);
      slideshowIntervalRef.current = null;
    }
  }, []);

  // Toggle slideshow
  const toggleSlideshow = useCallback(() => {
    if (isSlideshow) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  }, [isSlideshow, startSlideshow, stopSlideshow]);

  // Slideshow automático
  useEffect(() => {
    if (isSlideshow && selectedPhoto) {
      slideshowIntervalRef.current = setInterval(() => {
        setSelectedPhoto(current => {
          if (!current) return null;

          // Si llegamos al final, volver al principio
          if (current.index === photos.length - 1) {
            return { ...photos[0], index: 0 };
          }

          const nextPhoto = photos[current.index + 1];
          return { ...nextPhoto, index: current.index + 1 };
        });
      }, 3000); // Cambiar cada 3 segundos

      return () => {
        if (slideshowIntervalRef.current) {
          clearInterval(slideshowIntervalRef.current);
        }
      };
    }
  }, [isSlideshow, selectedPhoto, photos]);

  // Detener slideshow al cerrar lightbox
  useEffect(() => {
    if (!selectedPhoto && isSlideshow) {
      stopSlideshow();
    }
  }, [selectedPhoto, isSlideshow, stopSlideshow]);

  // Navegación por teclado en lightbox
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') {
        closeLightbox();
        stopSlideshow();
      }
      if (e.key === ' ') {
        e.preventDefault();
        toggleSlideshow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, goToPrevious, goToNext, closeLightbox, stopSlideshow, toggleSlideshow]);

  // Scroll suave a galería
  const scrollToGallery = () => {
    document.getElementById('gallery-start')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Compartir - copiar enlace (galería completa)
  const handleCopyLink = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      showToast({ message: 'Enlace copiado al portapapeles', type: 'success' });
    } catch (error) {
      showToast({ message: 'Error al copiar el enlace', type: 'error' });
    }
  };

  // Compartir por WhatsApp (galería completa)
  const handleShareWhatsApp = () => {
    const shareUrl = window.location.href;
    const text = `Mira esta galería: ${title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
  };

  // Compartir por Email (galería completa)
  const handleShareEmail = () => {
    const shareUrl = window.location.href;
    const subject = `Galería: ${title}`;
    const body = `Te comparto esta galería: ${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Generar URL de favoritos compartidos
  const generateFavoritesUrl = () => {
    if (!clientEmail || !gallerySlug || !token) return '';
    const hash = btoa(clientEmail.toLowerCase().trim());
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/galeria/${gallerySlug}/favoritos/${hash}?token=${token}`;
  };

  // Compartir favoritos - copiar enlace
  const handleCopyFavoritesLink = async () => {
    const favUrl = generateFavoritesUrl();
    if (!favUrl) {
      showToast({ message: 'Error al generar el enlace', type: 'error' });
      return;
    }

    try {
      await navigator.clipboard.writeText(favUrl);
      showToast({ message: 'Enlace de favoritos copiado', type: 'success' });
    } catch (error) {
      showToast({ message: 'Error al copiar el enlace', type: 'error' });
    }
  };

  // Compartir favoritos por WhatsApp
  const handleShareFavoritesWhatsApp = () => {
    const favUrl = generateFavoritesUrl();
    if (!favUrl) return;
    const text = `Mira mis fotos favoritas de la galería`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + favUrl)}`, '_blank');
  };

  // Compartir favoritos por Email
  const handleShareFavoritesEmail = () => {
    const favUrl = generateFavoritesUrl();
    if (!favUrl) return;
    const subject = `Mis Fotos Favoritas`;
    const body = `Te comparto mi selección de fotos favoritas:\n\n${favUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Actualizar downloadEmail cuando cambie clientEmail
  useEffect(() => {
    if (clientEmail && !downloadEmail) {
      setDownloadEmail(clientEmail);
    }
  }, [clientEmail]);

  // Sistema de descarga con PIN
  const handleDownloadSubmit = async (e) => {
    e.preventDefault();
    setDownloadError('');

    if (!downloadEmail || !downloadPin) {
      setDownloadError('Por favor completa todos los campos');
      return;
    }

    // Verificar PIN
    if (galleryDownloadPin && downloadPin !== galleryDownloadPin) {
      setDownloadError('PIN incorrecto. Contacta al fotógrafo si no lo tienes.');
      return;
    }

    // PIN correcto - habilitar descargas
    setDownloadEnabled(true);
    setShowDownloadModal(false);
    showToast({
      message: '¡Descargas habilitadas exitosamente!',
      type: 'success'
    });
  };

  // Descargar foto individual
  const handleDownloadPhoto = async (photo, photoIndex, slug) => {
    try {
      const url = photo.file_path;

      // Si es URL de Cloudinary, obtener la versión de máxima calidad
      let downloadUrl = url;
      if (url.includes('cloudinary.com')) {
        // Reemplazar transformaciones para obtener imagen original
        downloadUrl = url.replace(/\/upload\/.*?\//g, '/upload/fl_attachment/');
      }

      // Generar nombre coherente: slug-galeria-001.jpg
      const paddedNumber = String(photoIndex + 1).padStart(3, '0');
      const extension = photo.file_name ? photo.file_name.split('.').pop() : 'jpg';
      const fileName = `${slug || 'galeria'}-${paddedNumber}.${extension}`;

      // Crear elemento 'a' temporal para forzar descarga
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast({
        message: 'Descargando foto...',
        type: 'success'
      });
    } catch (error) {
      console.error('Error downloading photo:', error);
      showToast({
        message: 'Error al descargar la foto',
        type: 'error'
      });
    }
  };

  // Descargar todas las fotos como ZIP
  const handleDownloadAll = async () => {
    if (!downloadEnabled || isDownloading) return;

    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      showToast({
        message: `Preparando descarga de ${photos.length} fotos...`,
        type: 'info'
      });

      // Simular progreso mientras se genera el ZIP
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);

      // Construir URL de la API con parámetros
      const params = new URLSearchParams({
        galleryId: galleryId,
      });

      // Agregar PIN solo si existe
      if (galleryDownloadPin) {
        params.append('pin', downloadPin);
      }

      const apiUrl = `/api/download-gallery?${params.toString()}`;

      // Descargar el ZIP
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el ZIP');
      }

      // Obtener el blob del ZIP
      const blob = await response.blob();

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${gallerySlug || 'galeria'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Liberar memoria
      window.URL.revokeObjectURL(url);

      showToast({
        message: '¡ZIP descargado exitosamente!',
        type: 'success'
      });

      // Reset después de un momento
      setTimeout(() => {
        setDownloadProgress(0);
        setIsDownloading(false);
      }, 1000);
    } catch (error) {
      console.error('Error downloading gallery:', error);
      showToast({
        message: error.message || 'Error al descargar la galería',
        type: 'error'
      });
      setDownloadProgress(0);
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HEADER PRINCIPAL FULLSCREEN ===== */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        {/* Foto de fondo */}
        {coverImage && (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover"
            priority
            quality={95}
            unoptimized
          />
        )}

        {/* Overlay oscuro sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />

        {/* Contenido centrado */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-voga text-5xl md:text-7xl lg:text-8xl text-white mb-4"
            style={{
              textShadow: '0 2px 20px rgba(0,0,0,0.4)'
            }}
          >
            {title}
          </motion.h1>

          {/* Fecha */}
          {formattedDate && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-white/90 text-sm md:text-base mb-10 font-light tracking-wide uppercase"
              style={{
                fontFamily: 'system-ui, sans-serif',
                textShadow: '0 1px 10px rgba(0,0,0,0.3)'
              }}
            >
              {formattedDate}
            </motion.p>
          )}

          {/* Botón Ver galería */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            onClick={scrollToGallery}
            className="group relative px-8 py-3 border border-white/40 !text-white hover:bg-white/10 hover:backdrop-blur-sm hover:border-white/60 hover:scale-105 transition-all duration-300 rounded-sm"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            <span className="text-sm font-light tracking-widest uppercase">Ver galería</span>
          </motion.button>

        </div>

        {/* Logo de Alma - más abajo, cerca del indicador */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <a
            href="/"
            className="group transition-all duration-300 hover:-translate-y-1 rounded-md overflow-hidden"
          >
            <Image
              src="/img/logos/Logo_Blanco.png"
              alt="Alma Fotografía"
              width={150}
              height={50}
              className="h-10 md:h-12 w-auto opacity-80 group-hover:opacity-100 transition-all duration-300 rounded-md"
              priority
              style={{
                filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.3))'
              }}
            />
          </a>
          <p
            className="text-white/70 text-xs font-light uppercase"
            style={{
              fontFamily: 'system-ui, sans-serif',
              textShadow: '0 1px 10px rgba(0,0,0,0.3)',
              letterSpacing: '0.2em'
            }}
          >
            Alma Fotografía
          </p>
        </motion.div>

        {/* Indicador de scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown
            size={32}
            className="text-white/60 animate-bounce"
            strokeWidth={1}
          />
        </motion.div>
      </section>

      {/* ===== HEADER NAVEGACIÓN ===== */}
      <div className="relative">
        {/* Placeholder para evitar salto cuando se vuelve sticky */}
        {headerSticky && <div className="h-[80px]" />}

        <motion.header
          initial={false}
          animate={{
            y: headerSticky && !headerVisible ? -100 : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`${
            headerSticky ? 'fixed top-0' : 'relative'
          } left-0 right-0 z-40 bg-white`}
        >
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            {/* Título + Alma */}
            <div className="flex-shrink min-w-0">
              <h2 className="font-voga text-base sm:text-xl md:text-2xl text-black truncate">
                {title}
              </h2>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-black/40 tracking-widest uppercase font-light">
                Alma Fotografía
              </p>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowShareModal(true)}
                className="p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
                title="Compartir"
              >
                <Share2 size={16} className="text-black/70 sm:w-[18px] sm:h-[18px]" strokeWidth={1.5} />
              </button>

              <button
                onClick={toggleSlideshow}
                className="p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors hidden sm:flex"
                title={isSlideshow ? "Pausar presentación" : "Iniciar presentación"}
              >
                {isSlideshow ? (
                  <Pause size={18} strokeWidth={1.5} className="text-black/70" />
                ) : (
                  <Play size={18} strokeWidth={1.5} className="text-black/70" />
                )}
              </button>

              {customMessage && (
                <button
                  onClick={handleOpenMessage}
                  className="relative p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
                  title="Mensaje del fotógrafo"
                >
                  <MessageSquare size={16} strokeWidth={1.5} className="text-black/70 sm:w-[18px] sm:h-[18px]" />
                  {!hasSeenMessage && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-[#79502A] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" />
                  )}
                </button>
              )}

              {maxFavorites > 0 && (
                <button
                  onClick={() => {
                    if (!clientEmail) {
                      setShowEmailPrompt(true);
                    }
                  }}
                  className="relative p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
                  title="Mis favoritas"
                >
                  <Heart
                    size={16}
                    strokeWidth={1.5}
                    className={`${favoritePhotoIds.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-black/70'} sm:w-[18px] sm:h-[18px]`}
                  />
                  {favoritePhotoIds.length > 0 && (
                    <span className="absolute -top-2 -right-2 sm:-right-1 bg-rose-500 text-white text-[8px] sm:text-[9px] font-semibold rounded-full px-1 sm:px-1.5 py-0.5 flex items-center justify-center whitespace-nowrap leading-none">
                      {favoritePhotoIds.length}/{maxFavorites}
                    </span>
                  )}
                </button>
              )}

              {allowDownloads && (
                <button
                  onClick={() => {
                    if (downloadEnabled) {
                      // Si las descargas ya están habilitadas, descargar todas
                      handleDownloadAll();
                    } else if (!galleryDownloadPin) {
                      // Si no hay PIN configurado, habilitar descargas inmediatamente
                      setDownloadEnabled(true);
                      showToast({
                        message: '¡Descargas habilitadas exitosamente!',
                        type: 'success'
                      });
                    } else {
                      // Si hay PIN, mostrar modal
                      setShowDownloadModal(true);
                    }
                  }}
                  disabled={isDownloading}
                  className={`${
                    downloadEnabled
                      ? 'flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/5 rounded-full'
                      : 'p-1.5 sm:p-2 rounded-full relative'
                  } hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={downloadEnabled ? (isDownloading ? "Descargando..." : "Descargar todas las fotos") : "Descargar"}
                >
                  {/* Círculo de progreso verde */}
                  {isDownloading && downloadEnabled && (
                    <svg className="absolute -inset-1 sm:-inset-1.5 w-[calc(100%+8px)] h-[calc(100%+8px)] sm:w-[calc(100%+12px)] sm:h-[calc(100%+12px)] -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * 45 * downloadProgress / 100}, ${2 * Math.PI * 45}`}
                        className="transition-all duration-300"
                      />
                    </svg>
                  )}
                  <Download size={16} strokeWidth={1.5} className={`${isDownloading ? 'text-green-600' : 'text-black/70'} sm:w-[18px] sm:h-[18px]`} />
                  {downloadEnabled && (
                    <span className={`font-fira text-[10px] sm:text-xs font-semibold ${isDownloading ? 'text-green-600' : 'text-black/70'}`}>
                      {isDownloading ? 'Descargando...' : 'Descargar Todas'}
                    </span>
                  )}
                </button>
              )}

              {allowComments && (
                <motion.button
                  onClick={() => setShowTestimonialModal(true)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-transparent border border-[#79502A] hover:bg-[#79502A]/5 text-[#79502A] rounded-full transition-all"
                  title="Dejar testimonio"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Star size={14} strokeWidth={0.5} className="fill-yellow-400 text-black sm:w-4 sm:h-4" />
                  <span className="font-fira text-[10px] sm:text-xs font-semibold">Testimonio</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.header>
      </div>

      {/* ===== INICIO DE GALERÍA (anchor) ===== */}
      <div id="gallery-start" className="h-px" />

      {/* ===== GRID DE FOTOS ===== */}
      <main className="px-4 pb-8">
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-black/40 font-light">
              Esta galería aún no tiene fotos.
            </p>
          </div>
        ) : (
          <PhotoGrid
            photos={photos}
            galleryTitle={title}
            gallerySlug={gallerySlug}
            onPhotoClick={openLightbox}
            onToggleFavorite={handleToggleFavorite}
            favoritePhotoIds={favoritePhotoIds}
            maxFavorites={maxFavorites}
            downloadEnabled={downloadEnabled}
            onDownloadPhoto={handleDownloadPhoto}
          />
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-200 py-8 sm:py-12">
        <div className="px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center">
            <h3 className="font-voga text-2xl sm:text-3xl text-black mb-2">
              Alma Fotografía
            </h3>
            <p className="font-fira text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Capturando momentos únicos e irrepetibles con dedicación y pasión
            </p>
            <p className="font-fira text-xs text-gray-400 mt-4">
              © {new Date().getFullYear()} Alma Fotografía. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* ===== MODAL MENSAJE PERSONALIZADO ===== */}
      <AnimatePresence>
        {showMessageModal && customMessage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowMessageModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white rounded-sm shadow-2xl z-50 p-5 sm:p-8"
            >
              <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg flex-shrink-0">
                    <MessageSquare size={20} className="text-blue-600 sm:w-6 sm:h-6" strokeWidth={1.5} />
                  </div>
                  <h2 className="font-serif text-lg sm:text-2xl text-black" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    Mensaje del fotógrafo
                  </h2>
                </div>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="p-1 hover:bg-black/5 rounded-full transition-colors flex-shrink-0"
                >
                  <X size={18} strokeWidth={1.5} className="text-black/60 sm:w-5 sm:h-5" />
                </button>
              </div>

              <p className="font-fira text-sm sm:text-base text-black leading-relaxed">
                "{customMessage}"
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MODAL EMAIL PROMPT ===== */}
      <AnimatePresence>
        {showEmailPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => {
                setShowEmailPrompt(false);
                setShowEmailTooltip(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white rounded-sm shadow-2xl z-50 p-8"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-rose-50 rounded-lg">
                  <Heart size={24} className="text-rose-500" strokeWidth={1.5} />
                </div>
                <h2 className="font-serif text-3xl text-black" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Favoritos
                </h2>
              </div>

              <p className="text-sm text-black/60 mb-6 font-light leading-relaxed">
                Guarda tus fotos favoritas y vuelve a visitarlas en cualquier momento usando tu dirección de correo electrónico. Puedes compartir esta lista con tu fotógrafo, familiares y amigos.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = e.target.name.value.trim();
                  const email = e.target.email.value.trim();
                  if (name && email) handleEmailSubmit(email, name);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs text-black/60 mb-2 font-light">
                    Tu nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Tu nombre completo"
                    required
                    className="w-full px-4 py-3 border border-black/10 rounded-sm text-sm text-black placeholder:text-black/50 focus:outline-none focus:border-black/30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-black/60 mb-2 font-light">
                    Tu correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="tu@email.com"
                    required
                    className="w-full px-4 py-3 border border-black/10 rounded-sm text-sm text-black placeholder:text-black/50 focus:outline-none focus:border-black/30 transition-colors"
                  />

                  {/* Tooltip explicativo */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowEmailTooltip(!showEmailTooltip)}
                      className="text-xs text-black/40 hover:text-black/60 transition-colors underline decoration-dotted"
                    >
                      ¿Por qué necesitas mi correo electrónico?
                    </button>

                    <AnimatePresence>
                      {showEmailTooltip && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 bg-black/5 rounded-sm overflow-hidden"
                        >
                          <p className="text-xs text-black/60 font-light leading-relaxed">
                            Usamos tu correo electrónico para guardar tu selección de fotos favoritas de forma segura.
                            Esto te permite volver a verlas en cualquier momento desde cualquier dispositivo, y compartir tu selección
                            con el fotógrafo para facilitar la edición y entrega final.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#79502A] hover:bg-[#8B5A2F] text-white rounded-sm font-light text-sm tracking-wide transition-colors"
                >
                  Guardar y continuar
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MODAL COMPARTIR ===== */}
      <AnimatePresence>
        {showShareModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowShareModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm bg-white rounded-sm shadow-2xl z-50 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl text-black" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Compartir
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X size={20} strokeWidth={1.5} className="text-black/60" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Compartir Galería Completa */}
                <div>
                  <h4 className="font-light text-xs text-black/50 uppercase tracking-wider mb-3">
                    Galería Completa
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-black/10 hover:border-black/20 rounded-sm transition-colors text-left"
                    >
                      {linkCopied ? (
                        <Check size={18} strokeWidth={1.5} className="text-green-600" />
                      ) : (
                        <Share2 size={18} strokeWidth={1.5} className="text-black/60" />
                      )}
                      <span className="text-sm text-black/80 font-light">
                        {linkCopied ? 'Enlace copiado' : 'Copiar enlace'}
                      </span>
                    </button>

                    <button
                      onClick={handleShareWhatsApp}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-black/10 hover:border-black/20 rounded-sm transition-colors text-left"
                    >
                      <svg className="w-[18px] h-[18px] text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      <span className="text-sm text-black/80 font-light">
                        Compartir por WhatsApp
                      </span>
                    </button>

                    <button
                      onClick={handleShareEmail}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-black/10 hover:border-black/20 rounded-sm transition-colors text-left"
                    >
                      <Mail size={18} strokeWidth={1.5} className="text-black/60" />
                      <span className="text-sm text-black/80 font-light">
                        Compartir por email
                      </span>
                    </button>
                  </div>
                </div>

                {/* Compartir Mis Favoritos */}
                {maxFavorites > 0 && (
                  <div>
                    <h4 className="font-light text-xs text-black/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Heart size={14} className="text-pink-500 fill-pink-500" />
                      Mis Favoritos ({favoritePhotoIds.length})
                    </h4>
                    <div className="space-y-2">
                      {!allowShareFavorites || favoritePhotoIds.length === 0 ? (
                        <div className="px-4 py-3 border border-black/10 rounded-sm bg-black/5">
                          <p className="text-xs text-black/40 font-light">
                            {!allowShareFavorites
                              ? 'El fotógrafo no ha habilitado compartir favoritos'
                              : 'Primero selecciona algunas fotos favoritas'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={handleCopyFavoritesLink}
                            className="w-full flex items-center gap-3 px-4 py-3 border border-black/10 hover:border-black/20 rounded-sm transition-colors text-left"
                          >
                            <Share2 size={18} strokeWidth={1.5} className="text-pink-600" />
                            <span className="text-sm text-black/80 font-light">
                              Copiar enlace de favoritos
                            </span>
                          </button>

                          <button
                            onClick={handleShareFavoritesWhatsApp}
                            className="w-full flex items-center gap-3 px-4 py-3 border border-black/10 hover:border-black/20 rounded-sm transition-colors text-left"
                          >
                            <svg className="w-[18px] h-[18px] text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span className="text-sm text-black/80 font-light">
                              Compartir por WhatsApp
                            </span>
                          </button>

                          <button
                            onClick={handleShareFavoritesEmail}
                            className="w-full flex items-center gap-3 px-4 py-3 border border-black/10 hover:border-black/20 rounded-sm transition-colors text-left"
                          >
                            <Mail size={18} strokeWidth={1.5} className="text-black/60" />
                            <span className="text-sm text-black/80 font-light">
                              Compartir por email
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MODAL DESCARGA (tipo Pixieset) ===== */}
      <AnimatePresence>
        {showDownloadModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => !isDownloading && setShowDownloadModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-white rounded-sm shadow-2xl z-50 p-8"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-2xl text-black" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Descargar fotos
                </h3>
                {!isDownloading && (
                  <button
                    onClick={() => setShowDownloadModal(false)}
                    className="p-1 hover:bg-black/5 rounded-full transition-colors"
                  >
                    <X size={20} strokeWidth={1.5} className="text-black/60" />
                  </button>
                )}
              </div>

              <p className="text-xs text-black/50 mb-6 font-light">
                Tu correo electrónico se utilizará para notificarte cuando los archivos estén listos para descargar.
              </p>

              {isDownloading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-10 h-10 text-black/40 animate-spin mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-sm text-black/60 font-light">Preparando tus archivos...</p>
                </div>
              ) : (
                <form onSubmit={handleDownloadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-black/60 mb-2 font-light">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                      <input
                        type="email"
                        value={downloadEmail}
                        onChange={(e) => setDownloadEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-black/10 rounded-sm text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:border-black/30 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-black/60 mb-2 font-light">
                      PIN de descarga
                    </label>
                    <div className="relative">
                      <Lock size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                      <input
                        type="password"
                        value={downloadPin}
                        onChange={(e) => setDownloadPin(e.target.value)}
                        placeholder="Ingresa tu PIN"
                        required
                        maxLength={6}
                        className="w-full pl-10 pr-4 py-3 border border-black/10 rounded-sm text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:border-black/30 transition-colors"
                      />
                    </div>
                  </div>

                  {downloadError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-sm"
                    >
                      <AlertCircle size={16} strokeWidth={1.5} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 font-light">
                        {downloadError}
                      </p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-black hover:bg-black/90 text-white rounded-sm font-light text-sm tracking-wide transition-colors"
                  >
                    Descargar
                  </button>

                  <p className="text-[11px] text-black/40 text-center font-light">
                    Si no tienes el PIN, contacta al fotógrafo
                  </p>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== MODAL TESTIMONIO ===== */}
      <AnimatePresence>
        {showTestimonialModal && allowComments && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowTestimonialModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-hidden"
            >
              {/* Header del Modal */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
                <h3 className="font-voga text-lg sm:text-xl text-black">
                  Dejar un Testimonio
                </h3>
                <button
                  onClick={() => setShowTestimonialModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <X size={18} strokeWidth={1.5} className="text-black/60" />
                </button>
              </div>

              {/* Contenido del Modal */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
                <TestimonialForm
                  galleryId={galleryId}
                  galleryTitle={title}
                  clientEmail={clientEmail}
                  compact={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== LIGHTBOX ELEGANTE ===== */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/97 z-[60] flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Botón cerrar */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X size={24} strokeWidth={1} className="text-white/80" />
            </button>

            {/* Contador */}
            <div className="absolute top-6 left-6 z-10">
              <span className="text-sm text-white/60 font-light">
                {selectedPhoto.index + 1} / {photos.length}
              </span>
            </div>

            {/* Botón favorito */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(selectedPhoto.id);
              }}
              className={`absolute bottom-6 left-6 p-3 rounded-full transition-all z-10 ${
                favoritePhotoIds.includes(selectedPhoto.id)
                  ? 'bg-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Heart
                size={20}
                strokeWidth={1.5}
                className={favoritePhotoIds.includes(selectedPhoto.id) ? 'fill-rose-500 text-rose-500' : 'text-white'}
              />
            </button>

            {/* Navegación */}
            {selectedPhoto.index > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-6 p-3 hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <ChevronLeft size={32} strokeWidth={1} className="text-white/80" />
              </button>
            )}

            {selectedPhoto.index < photos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-6 p-3 hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <ChevronRight size={32} strokeWidth={1} className="text-white/80" />
              </button>
            )}

            {/* Imagen con gestos táctiles */}
            <motion.div
              key={selectedPhoto.id}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) * velocity.x;

                // Si se arrastró hacia la izquierda (swipe left) → siguiente foto
                if (swipe < -500 && selectedPhoto.index < photos.length - 1) {
                  goToNext();
                }
                // Si se arrastró hacia la derecha (swipe right) → foto anterior
                else if (swipe > 500 && selectedPhoto.index > 0) {
                  goToPrevious();
                }
              }}
              className="relative max-w-[90vw] max-h-[85vh] w-full h-full cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedPhoto.cloudinary_url || selectedPhoto.file_path}
                alt={`${title} - ${selectedPhoto.file_name || `Foto ${selectedPhoto.index + 1}`}`}
                fill
                className="object-contain pointer-events-none"
                sizes="90vw"
                priority
                quality={95}
                unoptimized
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
