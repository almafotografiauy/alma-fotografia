'use client';

import { useState, useCallback, useEffect, memo, useRef } from 'react';
import Image from 'next/image';
import Masonry from 'react-masonry-css';
import {
  Download, X, ChevronLeft, ChevronRight, Heart,
  Share2, Check, Mail, Lock, Loader2, AlertCircle,
  ChevronDown, Play, Pause, MessageSquare, Info, Star, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import TestimonialForm from '@/components/public/TestimonialForm';
import { toggleFavorite, getClientFavorites, submitFavoritesSelection, checkExistingFavoritesClient, getShareClient, registerShareClient } from '@/app/actions/favorites-actions';
import { getGallerySections, getPhotosGroupedBySections } from '@/app/actions/photo-sections-actions';
import { useToast } from '@/components/ui/Toast';
import { formatDateWithoutTimezone } from '@/lib/date-utils';

/**
 * SectionHeader - Componente para mostrar headers de secciones
 */
const SectionHeader = memo(({ section }) => {
  return (
    <div className="w-full mb-6 mt-8 text-center">
      <h3 className="font-voga text-2xl text-black mb-2">
        {section.name}
      </h3>
      <div className="flex justify-center mb-3">
        <div className="w-16 h-[1px] bg-black/30"></div>
      </div>
      {section.description && (
        <p className="font-fira text-sm text-black/60 max-w-2xl mx-auto">
          {section.description}
        </p>
      )}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';

/**
 * PhotoItem - Componente individual de foto con lazy loading optimizado
 * Mantiene aspect ratio original con CSS Grid
 */
const PhotoItem = ({
  photo,
  index,
  galleryTitle,
  gallerySlug,
  onPhotoClick,
  onToggleFavorite,
  isFavorite,
  maxFavorites,
  downloadEnabled,
  onDownloadPhoto,
  isSelectingFavorites,
  isSelectingDownloads,
  isSelectingDownloadsRef,
  isSelected,
  isSelectedForDownload,
  onToggleTemp,
  onToggleDownload,
  isPreview,
  isPriority,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Usar cloudinary_url primero, luego file_path
  const imageUrl = photo.cloudinary_url || photo.file_path;

  // Optimizar URL de Cloudinary para thumbnails (más rápido)
  const getOptimizedUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
    // Para thumbnails en grid: calidad 80, ancho máximo 600px, formato auto
    return `${parts[0]}/upload/q_80,w_600,f_auto/${parts[1]}`;
  };

  const optimizedUrl = getOptimizedUrl(imageUrl);

  return (
    <div className="group relative mb-2 break-inside-avoid">
      <div
        className={`relative w-full bg-gray-100 overflow-hidden cursor-pointer ${
          isSelectingFavorites && isSelected ? 'ring-4 ring-rose-500' : ''
        } ${
          isSelectingDownloads && isSelectedForDownload ? 'ring-4 ring-blue-500' : ''
        }`}
        onClick={() => {
          const isDownloadMode = isSelectingDownloadsRef?.current || false;
          console.log('PhotoItem onClick', {
            isSelectingFavorites,
            isSelectingDownloads,
            isDownloadMode,
            photoId: photo.id,
            hasRef: isSelectingDownloadsRef !== undefined,
            refValue: isSelectingDownloadsRef?.current,
            hasOnToggleDownload: typeof onToggleDownload === 'function'
          });

          if (isSelectingFavorites) {
            console.log('Branch: isSelectingFavorites');
            onToggleTemp(photo.id);
          } else if (isDownloadMode) {
            console.log('Branch: isSelectingDownloads - Calling onToggleDownload');
            onToggleDownload(photo.id);
          } else {
            console.log('Branch: normal - opening lightbox');
            onPhotoClick(photo, index);
          }
        }}
      >
        {/* Imagen con aspect ratio natural */}
        {!hasError && (
          <Image
            src={optimizedUrl}
            alt={`${galleryTitle} - ${photo.file_name || `Foto ${index + 1}`}`}
            width={400}
            height={400}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`w-full h-auto transition-opacity duration-300 group-hover:scale-105 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ width: '100%', height: 'auto' }}
            loading={isPriority ? 'eager' : 'lazy'}
            priority={isPriority}
            quality={80}
            onLoad={() => {
              setIsLoaded(true);
            }}
            onError={() => {
              setHasError(true);
              setIsLoaded(true);
            }}
          />
        )}

        {/* Skeleton loader mientras carga */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}

        {/* Error placeholder */}
        {hasError && (
          <div className="w-full min-h-[150px] flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-xs">Error</span>
          </div>
        )}

        {/* Overlay en modo selección de favoritas */}
        {isSelectingFavorites && (
          <>
            {!isSelected && (
              <div className="absolute inset-0 bg-white/60 transition-all duration-300" />
            )}
            {isSelected && (
              <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg">
                <Heart size={20} className="fill-rose-500 text-rose-500" strokeWidth={1.5} />
              </div>
            )}
          </>
        )}

        {/* Overlay en modo selección de descargas */}
        {isSelectingDownloads && (
          <>
            {!isSelectedForDownload && (
              <div className="absolute inset-0 bg-white/60 transition-all duration-300" />
            )}
            {isSelectedForDownload && (
              <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg">
                <Download size={20} className="fill-blue-500 text-blue-500" strokeWidth={1.5} />
              </div>
            )}
          </>
        )}

        {/* Overlay en hover */}
        {!isSelectingFavorites && !isSelectingDownloads && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
        )}

        {/* Botones de favorito y descarga */}
        {!isSelectingFavorites && !isSelectingDownloads && !isPreview && (
          <>
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

            {downloadEnabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadPhoto(photo, index, gallerySlug);
                }}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-white transition-all duration-300"
                title="Descargar foto"
              >
                <Download size={18} className="text-gray-700" strokeWidth={1.5} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

PhotoItem.displayName = 'PhotoItem';

const PhotoGrid = ({
  photos,
  galleryTitle,
  gallerySlug,
  onPhotoClick,
  onToggleFavorite,
  favoritePhotoIds,
  maxFavorites,
  downloadEnabled,
  onDownloadPhoto,
  isSelectingFavorites,
  isSelectingDownloads,
  isSelectingDownloadsRef,
  tempFavoriteIds,
  tempDownloadIds,
  onToggleTemp,
  onToggleDownload,
  isPreview = false,
}) => {
  // Primeras 8 fotos cargan con prioridad (above the fold)
  const PRIORITY_COUNT = 8;

  // Masonry breakpoints para layout horizontal
  const masonryBreakpoints = {
    default: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 2
  };

  return (
    <Masonry
      breakpointCols={masonryBreakpoints}
      className="flex -ml-2 w-auto"
      columnClassName="pl-2 bg-clip-padding"
    >
      {photos.map((photo, index) => (
        <PhotoItem
          key={photo.id}
          photo={photo}
          index={index}
          galleryTitle={galleryTitle}
          gallerySlug={gallerySlug}
          onPhotoClick={onPhotoClick}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favoritePhotoIds.includes(photo.id)}
          maxFavorites={maxFavorites}
          downloadEnabled={downloadEnabled}
          onDownloadPhoto={onDownloadPhoto}
          isSelectingFavorites={isSelectingFavorites}
          isSelectingDownloads={isSelectingDownloads}
          isSelectingDownloadsRef={isSelectingDownloadsRef}
          isSelected={isSelectingFavorites ? tempFavoriteIds.includes(photo.id) : false}
          isSelectedForDownload={isSelectingDownloads ? tempDownloadIds.includes(photo.id) : false}
          onToggleTemp={onToggleTemp}
          onToggleDownload={onToggleDownload}
          isPreview={isPreview}
          isPriority={index < PRIORITY_COUNT}
        />
      ))}
    </Masonry>
  );
};

PhotoGrid.displayName = 'PhotoGrid';

/**
 * Componente principal - Vista pública tipo Pixieset
 */
export default function PublicGalleryView({ gallery, token, isFavoritesView = false, isPreview = false }) {
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const slideshowIntervalRef = useRef(null);
  const hasRegisteredView = useRef(false);
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [hasSeenMessage, setHasSeenMessage] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [isSelectingFavorites, setIsSelectingFavorites] = useState(false);
  const [existingClient, setExistingClient] = useState(null); // Cliente existente con favoritos
  const [tempFavoriteIds, setTempFavoriteIds] = useState([]);
  const [isSelectingDownloads, setIsSelectingDownloads] = useState(false);
  const isSelectingDownloadsRef = useRef(false);
  const [tempDownloadIds, setTempDownloadIds] = useState([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [sections, setSections] = useState([]);

  // Sincronizar ref con state
  useEffect(() => {
    isSelectingDownloadsRef.current = isSelectingDownloads;
    console.log('🔵 isSelectingDownloads cambió a:', isSelectingDownloads, '(ref también actualizado)');
  }, [isSelectingDownloads]);
  const [selectedSection, setSelectedSection] = useState(null); // Auto-selección de primera sección
  const favoritesDebounceRef = useRef(null);
  const lastNotificationSentRef = useRef(false);
  const isSubmittingRef = useRef(false); // Flag para evitar submissions simultáneas
  const { showToast } = useToast();

  // Masonry breakpoints para layout horizontal
  const masonryBreakpoints = {
    default: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 2
  };

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
    showAllSections,
  } = gallery;

  const [filteredPhotos, setFilteredPhotos] = useState(photos);

  // Formatear fecha elegante
  const formattedDate = eventDate
    ? formatDateWithoutTimezone(eventDate, {
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
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [galleryId]);

  // Cargar cliente desde el share (BD) - prioridad sobre localStorage
  // Esto asegura que el email sea el mismo en cualquier dispositivo/navegador
  useEffect(() => {
    const initializeClient = async () => {
      // 1. Primero verificar si hay un cliente registrado en el share (BD)
      if (token) {
        const shareResult = await getShareClient(token);
        if (shareResult.success && shareResult.client) {
          // Cliente ya registrado en el share - usar ese email
          setClientEmail(shareResult.client.email);
          setClientName(shareResult.client.name);
          // Sincronizar con localStorage
          localStorage.setItem(`gallery_${galleryId}_email`, shareResult.client.email);
          if (shareResult.client.name) {
            localStorage.setItem(`gallery_${galleryId}_name`, shareResult.client.name);
          }
          loadFavorites(shareResult.client.email);
          return;
        }
      }

      // 2. Si no hay cliente en el share, verificar localStorage (fallback)
      const savedEmail = localStorage.getItem(`gallery_${galleryId}_email`);
      const savedName = localStorage.getItem(`gallery_${galleryId}_name`);

      if (savedEmail) {
        setClientEmail(savedEmail);
        if (savedName) {
          setClientName(savedName);
        }
        loadFavorites(savedEmail);
      } else {
        // 3. No hay email - verificar si ya existe un cliente con favoritos
        const result = await checkExistingFavoritesClient(galleryId);
        if (result.success && result.existingClient) {
          setExistingClient(result.existingClient);
        }
        setIsLoadingFavorites(false);
      }

      // Verificar si ya vio el mensaje personalizado
      const messageSeenKey = `gallery_${galleryId}_message_seen`;
      const messageSeen = localStorage.getItem(messageSeenKey);
      setHasSeenMessage(messageSeen === 'true');
    };

    initializeClient();
  }, [galleryId, token, loadFavorites]);

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
  // También registra el cliente en el share (BD) para persistir entre dispositivos
  const handleEmailSubmit = async (email, name) => {
    const trimmedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    // Registrar en el share (BD) si hay token
    if (token) {
      const result = await registerShareClient(token, trimmedEmail, trimmedName);
      if (!result.success && result.error?.includes('Ya hay un cliente')) {
        // Ya hay otro cliente registrado - cargar ese en lugar
        const shareResult = await getShareClient(token);
        if (shareResult.success && shareResult.client) {
          setClientEmail(shareResult.client.email);
          setClientName(shareResult.client.name);
          localStorage.setItem(`gallery_${galleryId}_email`, shareResult.client.email);
          localStorage.setItem(`gallery_${galleryId}_name`, shareResult.client.name);
          setShowEmailPrompt(false);
          setShowEmailTooltip(false);
          loadFavorites(shareResult.client.email);
          return;
        }
      }
    }

    setClientEmail(trimmedEmail);
    setClientName(trimmedName);
    localStorage.setItem(`gallery_${galleryId}_email`, trimmedEmail);
    localStorage.setItem(`gallery_${galleryId}_name`, trimmedName);
    setShowEmailPrompt(false);
    setShowEmailTooltip(false);
    loadFavorites(trimmedEmail);
  };

  // Auto-submit de favoritos después de 1 minuto de inactividad
  const scheduleAutoSubmit = useCallback(() => {
    // Limpiar timer anterior si existe
    if (favoritesDebounceRef.current) {
      clearTimeout(favoritesDebounceRef.current);
    }

    // Programar nuevo auto-submit para 5 minutos (300000 ms)
    favoritesDebounceRef.current = setTimeout(async () => {

      if (!clientEmail) {
        return;
      }

      if (favoritePhotoIds.length === 0) {
        return;
      }

      // Evitar enviar notificación duplicada
      if (lastNotificationSentRef.current) {
        return;
      }

      // ANTI-DUPLICADOS: Si ya hay una submission en proceso, cancelar
      if (isSubmittingRef.current) {
        return;
      }

      try {
        isSubmittingRef.current = true;
        const result = await submitFavoritesSelection(galleryId, clientEmail, clientName);

        if (result.success) {
          lastNotificationSentRef.current = true;
          showToast({
            message: 'Tu selección ha sido guardada',
            type: 'success'
          });
        } else {
        }
      } catch (error) {
      } finally {
        isSubmittingRef.current = false;
      }
    }, 300000); // 5 minutos

  }, [clientEmail, clientName, galleryId, favoritePhotoIds, showToast]);

  // Limpiar timer al desmontar componente
  useEffect(() => {
    return () => {
      if (favoritesDebounceRef.current) {
        clearTimeout(favoritesDebounceRef.current);
      }
    };
  }, []);

  // Cargar secciones de la galería y auto-seleccionar primera
  useEffect(() => {
    const loadSections = async () => {
      try {
        const result = await getGallerySections(galleryId);
        if (result.success && result.sections) {
          setSections(result.sections);

          // Auto-seleccionar primera sección si no hay ninguna seleccionada
          if (result.sections.length > 0 && !selectedSection) {
            setSelectedSection(result.sections[0].id);
          }
        }
      } catch (error) {
      }
    };

    loadSections();
    // Note: selectedSection is intentionally not in dependencies to only auto-select on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId]);

  // Enviar notificación al salir de la página si hay cambios pendientes
  useEffect(() => {
    const sendPendingNotification = () => {
      // Si hay timer activo, significa que hay cambios sin notificar
      if (favoritesDebounceRef.current && clientEmail && favoritePhotoIds.length > 0) {
        // ANTI-DUPLICADOS: Si ya hay una submission en proceso, no enviar otra
        if (isSubmittingRef.current) {
          return;
        }

        // Cancelar timer
        clearTimeout(favoritesDebounceRef.current);
        favoritesDebounceRef.current = null;

        try {
          isSubmittingRef.current = true;
          // Enviar notificación de forma síncrona con keepalive
          // keepalive garantiza que la petición se complete incluso si se cierra la página
          submitFavoritesSelection(galleryId, clientEmail, clientName).then(() => {
            isSubmittingRef.current = false;
          }).catch((error) => {
            isSubmittingRef.current = false;
          });
        } catch (error) {
          isSubmittingRef.current = false;
        }
      }
    };

    // beforeunload: cuando cierra pestaña/ventana
    const handleBeforeUnload = (e) => {
      if (favoritesDebounceRef.current && clientEmail && favoritePhotoIds.length > 0) {
        sendPendingNotification();
      }
    };

    // pagehide: cuando la página se oculta (más confiable que beforeunload en algunos casos)
    const handlePageHide = (e) => {
      if (favoritesDebounceRef.current && clientEmail && favoritePhotoIds.length > 0) {
        sendPendingNotification();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup: limpiar timer y listeners cuando el componente se desmonte
    return () => {
      if (favoritesDebounceRef.current) {
        clearTimeout(favoritesDebounceRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [clientEmail, clientName, galleryId, favoritePhotoIds.length]);

  // Filtrar fotos según sección seleccionada y ordenar por display_order
  useEffect(() => {
    if (selectedSection) {
      const filtered = photos
        .filter(photo => photo.section_id === selectedSection)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setFilteredPhotos(filtered);
    } else {
      // Si no hay sección seleccionada aún, mostrar todas las fotos ordenadas
      const sorted = [...photos].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setFilteredPhotos(sorted);
    }
  }, [selectedSection, photos]);

  // Toggle selección temporal (modo selección)
  const handleToggleTemp = (photoId) => {
    if (tempFavoriteIds.includes(photoId)) {
      setTempFavoriteIds(prev => prev.filter(id => id !== photoId));
    } else {
      if (tempFavoriteIds.length >= maxFavorites) {
        showToast({ message: `Máximo ${maxFavorites} favoritas`, type: 'error' });
        return;
      }
      setTempFavoriteIds(prev => [...prev, photoId]);
    }
  };

  // Toggle selección de descargas
  const handleToggleDownload = (photoId) => {
    console.log('handleToggleDownload called', { photoId, tempDownloadIds });
    if (tempDownloadIds.includes(photoId)) {
      setTempDownloadIds(prev => prev.filter(id => id !== photoId));
    } else {
      setTempDownloadIds(prev => [...prev, photoId]);
    }
  };

  // Función helper para obtener URL de máxima calidad de Cloudinary
  const getOriginalQualityUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }

    try {
      const urlParts = url.split('/upload/');
      if (urlParts.length === 2) {
        const [base, rest] = urlParts;
        const pathParts = rest.split('/');
        let cleanPath = rest;

        if (pathParts[0] && !pathParts[0].match(/^(v\d+|[a-zA-Z])/)) {
          cleanPath = pathParts.slice(1).join('/');
        }

        // Construir URL con máxima calidad HD
        // q_100 = calidad 100% (sin compresión adicional)
        // f_jpg = forzar formato JPG para compatibilidad
        // NO usar transformaciones de tamaño para obtener resolución original completa
        return `${base}/upload/q_100,f_jpg/${cleanPath}`;
      }
      return url;
    } catch (error) {
      console.error('Error procesando URL:', error);
      return url;
    }
  };

  // Función para descargar fotos seleccionadas (optimizada)
  const handleDownloadSelected = async (selectedPhotoIds) => {
    const photosToDownload = photos.filter(p => selectedPhotoIds.includes(p.id));

    if (!photosToDownload || photosToDownload.length === 0) {
      showToast({ message: 'No hay fotos para descargar', type: 'error' });
      return;
    }

    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const total = photosToDownload.length;
      let successCount = 0;
      let errorCount = 0;

      // BATCH_SIZE aumentado para máxima velocidad (25 paralelas)
      const BATCH_SIZE = 25;

      const downloadPhoto = async (photo, index, retries = 3) => {
        const originalUrl = photo?.cloudinary_url || photo?.file_path;
        if (!originalUrl) {
          errorCount++;
          return null;
        }

        const photoUrl = getOriginalQualityUrl(originalUrl);

        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const response = await fetch(photoUrl, {
              method: 'GET',
              mode: 'cors',
              cache: 'force-cache',
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const blob = await response.blob();
            if (blob.size === 0) throw new Error('Archivo vacío');

            let filename = photo.file_name || `foto_${String(index + 1).padStart(4, '0')}.jpg`;
            filename = filename.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
            filename = filename
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
              .replace(/ Foto /, ' - Foto ');
            filename += '.jpg';

            zip.file(filename, blob);
            successCount++;
            return { success: true };
          } catch (error) {
            if (attempt === retries) {
              errorCount++;
              return { success: false, error: error.message };
            }
            await new Promise(resolve => setTimeout(resolve, 300 * attempt));
          }
        }
      };

      // Descargar en batches
      for (let i = 0; i < photosToDownload.length; i += BATCH_SIZE) {
        const batch = photosToDownload.slice(i, i + BATCH_SIZE);
        const promises = batch.map((photo, batchIndex) =>
          downloadPhoto(photo, i + batchIndex)
        );
        await Promise.allSettled(promises);
      }

      // Generar ZIP sin compresión (STORE)
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
        streamFiles: true,
      });

      // Descargar
      const safeName = title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const zipName = `${safeName}_seleccion.zip`;

      saveAs(zipBlob, zipName);

      showToast({
        message: `¡Listo! ${successCount} fotos descargadas`,
        type: 'success'
      });

      if (errorCount > 0) {
        showToast({
          message: `${successCount} descargadas, ${errorCount} fallaron`,
          type: 'warning'
        });
      }
    } catch (error) {
      showToast({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

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

      }
    } catch (error) {
      // Revertir cambio si hubo error
      if (wasFavorite) {
        setFavoritePhotoIds(prev => [...prev, photoId]);
      } else {
        setFavoritePhotoIds(prev => prev.filter(id => id !== photoId));
      }
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
          body: JSON.stringify({
            galleryId: gallery.id,
            isFavoritesView,
          }),
        });
      } catch (error) {
        sessionStorage.removeItem(storageKey);
        hasRegisteredView.current = false;
      }
    };

    registerView();
  }, [gallery.id, isFavoritesView]);

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
      const prevPhoto = filteredPhotos[current.index - 1];
      return { ...prevPhoto, index: current.index - 1 };
    });
  }, [filteredPhotos]);

  const goToNext = useCallback(() => {
    setSelectedPhoto(current => {
      if (!current || current.index === filteredPhotos.length - 1) return current;
      const nextPhoto = filteredPhotos[current.index + 1];
      return { ...nextPhoto, index: current.index + 1 };
    });
  }, [filteredPhotos]);

  // Iniciar slideshow
  const startSlideshow = useCallback(() => {
    if (filteredPhotos.length === 0) return;

    // Abrir lightbox con la primera foto si no hay ninguna abierta
    if (!selectedPhoto) {
      openLightbox(filteredPhotos[0], 0);
    }

    setIsSlideshow(true);
  }, [filteredPhotos, selectedPhoto, openLightbox]);

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
          if (current.index === filteredPhotos.length - 1) {
            return { ...filteredPhotos[0], index: 0 };
          }

          const nextPhoto = filteredPhotos[current.index + 1];
          return { ...nextPhoto, index: current.index + 1 };
        });
      }, 3000); // Cambiar cada 3 segundos

      return () => {
        if (slideshowIntervalRef.current) {
          clearInterval(slideshowIntervalRef.current);
        }
      };
    }
  }, [isSlideshow, selectedPhoto, filteredPhotos]);

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

  // Cerrar menú mobile al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sistema de descarga con PIN
  // También registra el cliente en el share si es la primera vez
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

    // Si no hay clientEmail aún, usar el email de descarga y registrar
    if (!clientEmail && downloadEmail) {
      const trimmedEmail = downloadEmail.toLowerCase().trim();

      // Registrar en el share (BD) si hay token
      if (token) {
        await registerShareClient(token, trimmedEmail, '');
      }

      setClientEmail(trimmedEmail);
      localStorage.setItem(`gallery_${galleryId}_email`, trimmedEmail);
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

      // Generar nombre coherente: slug-galeria-001.jpg
      const paddedNumber = String(photoIndex + 1).padStart(3, '0');
      const fileName = `${slug || 'galeria'}-${paddedNumber}.jpg`;

      // Si es URL de Cloudinary, forzar formato JPG y máxima calidad
      let downloadUrl = url;
      if (url.includes('cloudinary.com')) {
        // Forzar formato JPG con máxima calidad
        downloadUrl = url.replace(/\/upload\/.*?\//g, '/upload/f_jpg,q_100,fl_attachment/');
      }

      // Fetchear la imagen y crear blob para forzar nombre de archivo
      const response = await fetch(downloadUrl);
      const blob = await response.blob();

      // Crear URL del blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Crear elemento 'a' temporal para forzar descarga
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Liberar memoria
      window.URL.revokeObjectURL(blobUrl);

      showToast({
        message: 'Descargando foto...',
        type: 'success'
      });
    } catch (error) {
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
            quality={90}
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
            {/* Título + Alma + Secciones */}
            <div className="flex-shrink min-w-0 max-w-[65%] sm:max-w-[70%]">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h2 className="font-voga text-base sm:text-xl md:text-2xl text-black">
                  {title}
                </h2>
                {/* Secciones */}
                {sections.length > 0 && (
                  sections.length <= 3 ? (
                    // Mostrar en línea si son pocas
                    <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] md:text-xs font-fira font-medium">
                      {sections.map((section, index) => (
                        <div key={section.id} className="flex items-center gap-1 sm:gap-2">
                          {index > 0 && <span className="text-black/30">\</span>}
                          <button
                            onClick={() => setSelectedSection(section.id)}
                            className={`uppercase tracking-wide transition-colors hover:text-[#79502A] ${
                              selectedSection === section.id ? 'text-black' : 'text-black/40'
                            }`}
                          >
                            {section.name}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Mostrar como select si son muchas
                    <select
                      value={selectedSection || sections[0]?.id}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="appearance-none px-3 py-1 pr-8 border border-gray-200 rounded-lg font-fira text-xs text-black focus:outline-none bg-white shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>
                          {section.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  )
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-black/40 tracking-widest uppercase font-light mt-0.5">
                Alma Fotografía
              </p>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              {isSelectingFavorites ? (
                /* Botones de modo selección de favoritas */
                <>
                  <span className="text-xs sm:text-sm text-black/60 font-fira mr-1">
                    {tempFavoriteIds.length}/{maxFavorites}
                  </span>
                  <button
                    onClick={() => {
                      setIsSelectingFavorites(false);
                      setTempFavoriteIds([]);
                    }}
                    className="px-3 py-1.5 text-xs sm:text-sm font-fira text-black/70 hover:bg-black/5 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      // Cancelar timer de auto-submit
                      if (favoritesDebounceRef.current) {
                        clearTimeout(favoritesDebounceRef.current);
                        favoritesDebounceRef.current = null;
                      }

                      // Guardar selecciones
                      const added = tempFavoriteIds.filter(id => !favoritePhotoIds.includes(id));
                      const removed = favoritePhotoIds.filter(id => !tempFavoriteIds.includes(id));

                      // ANTI-DUPLICADOS: Verificar si ya hay una submission en proceso
                      if (isSubmittingRef.current) {
                        showToast({ message: 'Procesando selección...', type: 'info' });
                        return;
                      }

                      // Procesar cambios SIN resetear el timer (lo cancelamos arriba)
                      for (const photoId of added) {
                        const result = await toggleFavorite(galleryId, photoId, clientEmail, maxFavorites, clientName);
                        if (result.success) {
                          setFavoritePhotoIds(prev => [...prev, photoId]);
                        }
                      }
                      for (const photoId of removed) {
                        const result = await toggleFavorite(galleryId, photoId, clientEmail, maxFavorites, clientName);
                        if (result.success) {
                          setFavoritePhotoIds(prev => prev.filter(id => id !== photoId));
                        }
                      }

                      // Enviar notificación inmediatamente
                      try {
                        isSubmittingRef.current = true;
                        const submitResult = await submitFavoritesSelection(galleryId, clientEmail, clientName);

                        if (submitResult.success) {
                          showToast({ message: 'Selección enviada a la fotógrafa', type: 'success' });
                          setHasSubmitted(true);
                        } else {
                          showToast({ message: 'Favoritas actualizadas', type: 'success' });
                        }
                      } finally {
                        isSubmittingRef.current = false;
                      }

                      setIsSelectingFavorites(false);
                      setTempFavoriteIds([]);
                    }}
                    disabled={tempFavoriteIds.length === 0}
                    className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-fira font-semibold bg-rose-500 hover:bg-rose-600 !text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar
                  </button>
                </>
              ) : isSelectingDownloads ? (
                /* Botones de modo selección de descargas */
                <>
                  <span className="text-xs sm:text-sm text-black/60 font-fira mr-1">
                    {tempDownloadIds.length} seleccionadas
                  </span>
                  <button
                    onClick={() => {
                      setIsSelectingDownloads(false);
                      setTempDownloadIds([]);
                    }}
                    className="px-3 py-1.5 text-xs sm:text-sm font-fira text-black/70 hover:bg-black/5 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (tempDownloadIds.length === 0) {
                        showToast({ message: 'Selecciona al menos una foto', type: 'error' });
                        return;
                      }

                      // Iniciar descarga
                      await handleDownloadSelected(tempDownloadIds);

                      // Salir del modo selección
                      setIsSelectingDownloads(false);
                      setTempDownloadIds([]);
                    }}
                    disabled={tempDownloadIds.length === 0}
                    className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-fira font-semibold bg-blue-500 hover:bg-blue-600 !text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Descargar ({tempDownloadIds.length})
                  </button>
                </>
              ) : (
                <>
                  {/* Botones Desktop - Ocultos en mobile y en modo preview */}
                  {!isPreview && (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="hidden sm:flex p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
                      title="Compartir"
                    >
                      <Share2 size={16} className="text-black/70 sm:w-[18px] sm:h-[18px]" strokeWidth={1.5} />
                    </button>
                  )}

              <button
                onClick={toggleSlideshow}
                className="hidden sm:flex p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
                title={isSlideshow ? "Pausar presentación" : "Iniciar presentación"}
              >
                {isSlideshow ? (
                  <Pause size={18} strokeWidth={1.5} className="text-black/70" />
                ) : (
                  <Play size={18} strokeWidth={1.5} className="text-black/70" />
                )}
              </button>

              {!isPreview && customMessage && (
                <button
                  onClick={handleOpenMessage}
                  className="hidden sm:flex relative p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
                  title="Mensaje del fotógrafo"
                >
                  <MessageSquare size={16} strokeWidth={1.5} className="text-black/70 sm:w-[18px] sm:h-[18px]" />
                  {!hasSeenMessage && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-[#79502A] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" />
                  )}
                </button>
              )}

              {/* Botón de favoritas - Modo selección (oculto en preview) */}
              {!isPreview && maxFavorites > 0 && !isSelectingFavorites && (
                <button
                  onClick={() => {
                    if (!clientEmail) {
                      setShowEmailPrompt(true);
                    } else {
                      // Entrar en modo selección
                      setTempFavoriteIds([...favoritePhotoIds]);
                      setIsSelectingFavorites(true);
                    }
                  }}
                  className="relative p-1.5 sm:p-2 hover:bg-black/5 rounded-full transition-colors"
                  title="Seleccionar favoritas"
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

              {/* Botón de descargas - Desktop (oculto en preview) */}
              {!isPreview && allowDownloads && (
                <div className="relative">
                  <button
                    onClick={() => {
                      if (downloadEnabled) {
                        // Si las descargas ya están habilitadas, mostrar menú
                        setShowDownloadMenu(!showDownloadMenu);
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
                        : 'hidden sm:flex p-1.5 sm:p-2 rounded-full relative'
                    } hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={downloadEnabled ? (isDownloading ? "Descargando..." : "Opciones de descarga") : "Descargar"}
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
                    <>
                      <span className={`font-fira text-[10px] sm:text-xs font-semibold ${isDownloading ? 'text-green-600' : 'text-black/70'}`}>
                        {isDownloading ? `${downloadProgress}%` : 'Descargar'}
                      </span>
                      {!isDownloading && <ChevronDown size={14} className="text-black/70" />}
                    </>
                  )}
                </button>

                {/* Menú dropdown de opciones de descarga */}
                {showDownloadMenu && downloadEnabled && !isDownloading && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setShowDownloadMenu(false);
                        handleDownloadAll();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-200"
                    >
                      <div className="font-fira text-sm font-semibold text-black">
                        Descargar todas
                      </div>
                      <div className="font-fira text-xs text-gray-500 mt-0.5">
                        {photos.length} fotos
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        console.log('Activando modo selección de descargas');
                        setShowDownloadMenu(false);
                        setTempDownloadIds([]);
                        setIsSelectingDownloads(true);
                        console.log('isSelectingDownloads should now be true');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-fira text-sm font-semibold text-blue-600">
                        Seleccionar fotos
                      </div>
                      <div className="font-fira text-xs text-gray-500 mt-0.5">
                        Elegir qué fotos descargar
                      </div>
                    </button>
                  </div>
                )}
              </div>
              )}

              {/* Botón de testimonio - Desktop (oculto en preview) */}
              {!isPreview && allowComments && (
                <motion.button
                  onClick={() => setShowTestimonialModal(true)}
                  className="hidden sm:flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-transparent border border-[#79502A] hover:bg-[#79502A]/5 text-[#79502A] rounded-full transition-all"
                  title="Dejar testimonio"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Star size={14} strokeWidth={0.5} className="fill-yellow-400 text-black sm:w-4 sm:h-4" />
                  <span className="font-fira text-[10px] sm:text-xs font-semibold">Testimonio</span>
                </motion.button>
              )}
              </>
              )}

              {/* Menú de tres puntos - Solo mobile (oculto en preview) */}
              {!isPreview && (
                <div className="relative sm:hidden" ref={mobileMenuRef}>
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
                  title="Más opciones"
                >
                  <MoreVertical size={16} className="text-black/70" strokeWidth={1.5} />
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {showMobileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[200px]"
                    >
                      {/* Compartir */}
                      <button
                        onClick={() => {
                          setShowShareModal(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                      >
                        <Share2 size={16} className="text-black/70" strokeWidth={1.5} />
                        <span className="font-fira text-sm text-black">Compartir</span>
                      </button>

                      {/* Mensaje del fotógrafo */}
                      {customMessage && (
                        <button
                          onClick={() => {
                            handleOpenMessage();
                            setShowMobileMenu(false);
                          }}
                          className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left relative"
                        >
                          <MessageSquare size={16} className="text-black/70" strokeWidth={1.5} />
                          <span className="font-fira text-sm text-black">Mensaje del fotógrafo</span>
                          {!hasSeenMessage && (
                            <span className="ml-auto bg-[#79502A] w-2 h-2 rounded-full" />
                          )}
                        </button>
                      )}

                      {/* Descargar - Solo si no están habilitadas aún */}
                      {allowDownloads && !downloadEnabled && (
                        <button
                          onClick={() => {
                            if (!galleryDownloadPin) {
                              setDownloadEnabled(true);
                              showToast({
                                message: '¡Descargas habilitadas exitosamente!',
                                type: 'success'
                              });
                            } else {
                              setShowDownloadModal(true);
                            }
                            setShowMobileMenu(false);
                          }}
                          className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                        >
                          <Download size={16} className="text-black/70" strokeWidth={1.5} />
                          <span className="font-fira text-sm text-black">Descargar</span>
                        </button>
                      )}

                      {/* Testimonio */}
                      {allowComments && (
                        <button
                          onClick={() => {
                            setShowTestimonialModal(true);
                            setShowMobileMenu(false);
                          }}
                          className="w-full px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                        >
                          <Star size={16} className="fill-yellow-400 text-black" strokeWidth={0.5} />
                          <span className="font-fira text-sm text-black">Dejar testimonio</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              )}
            </div>
          </div>
        </motion.header>
      </div>

      {/* ===== INICIO DE GALERÍA (anchor) ===== */}
      <div id="gallery-start" className="h-px" />

      {/* ===== GRID DE FOTOS ===== */}
      <main className="px-4 pb-8">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-black/40 font-light">
              {selectedSection === 'all'
                ? 'Esta galería aún no tiene fotos.'
                : 'Esta sección no tiene fotos.'}
            </p>
          </div>
        ) : selectedSection === 'all' && sections.length > 0 ? (
          /* Vista mixta: fotos sin sección + secciones con sus fotos */
          <div>
            {(() => {
              // Crear array mixto de items (fotos sin sección + headers de sección)
              const photosWithoutSection = photos
                .filter(p => !p.section_id)
                .map(p => ({ type: 'photo', data: p, order: p.display_order ?? -1000 }));

              const sectionItems = sections
                .map(s => ({ type: 'section', data: s, order: s.display_order ?? 1000000 }));

              const mixedItems = [...photosWithoutSection, ...sectionItems]
                .sort((a, b) => a.order - b.order);

              let photoIndexCounter = 0;

              return mixedItems.map((item, idx) => {
                if (item.type === 'photo') {
                  const photo = item.data;
                  const isFavorite = favoritePhotoIds.includes(photo.id);
                  const currentIndex = photoIndexCounter++;

                  return (
                    <div key={`photo-${photo.id}`} className="mb-2">
                      <Masonry
                        breakpointCols={masonryBreakpoints}
                        className="flex -ml-2 w-auto"
                        columnClassName="pl-2 bg-clip-padding"
                      >
                        <div className="group relative">
                          <div
                            className={`relative w-full bg-gray-100 overflow-hidden cursor-pointer ${
                              isSelectingFavorites && favoritePhotoIds.includes(photo.id) ? 'ring-4 ring-rose-500' : ''
                            } ${
                              isSelectingDownloads && tempDownloadIds.includes(photo.id) ? 'ring-4 ring-blue-500' : ''
                            }`}
                            onClick={() => {
                              const isDownloadMode = isSelectingDownloadsRef?.current || false;
                              console.log('🔴 INLINE PHOTO onClick', {
                                isSelectingFavorites,
                                isSelectingDownloads,
                                isDownloadMode,
                                photoId: photo.id
                              });

                              if (isSelectingFavorites) {
                                console.log('🔴 Branch: isSelectingFavorites');
                                handleToggleTemp(photo.id);
                              } else if (isDownloadMode) {
                                console.log('🔴 Branch: isSelectingDownloads');
                                handleToggleDownload(photo.id);
                              } else {
                                console.log('🔴 Branch: normal - opening lightbox');
                                openLightbox(photo, currentIndex);
                              }
                            }}
                          >
                            <Image
                              src={photo.file_path}
                              alt={`${title} - ${photo.file_name || `Foto ${currentIndex + 1}`}`}
                              width={1200}
                              height={1200}
                              className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                              loading="lazy"
                              quality={85}
                            />

                            {/* Overlay en modo selección de favoritas */}
                            {isSelectingFavorites && (
                              <>
                                {!favoritePhotoIds.includes(photo.id) && (
                                  <div className="absolute inset-0 bg-white/60 transition-all duration-300" />
                                )}
                                {favoritePhotoIds.includes(photo.id) && (
                                  <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg">
                                    <Heart size={20} className="fill-rose-500 text-rose-500" strokeWidth={1.5} />
                                  </div>
                                )}
                              </>
                            )}

                            {/* Overlay en modo selección de descargas */}
                            {isSelectingDownloads && (
                              <>
                                {!tempDownloadIds.includes(photo.id) && (
                                  <div className="absolute inset-0 bg-white/60 transition-all duration-300" />
                                )}
                                {tempDownloadIds.includes(photo.id) && (
                                  <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg">
                                    <Download size={20} className="fill-blue-500 text-blue-500" strokeWidth={1.5} />
                                  </div>
                                )}
                              </>
                            )}

                            {/* Overlay en hover normal */}
                            {!isSelectingFavorites && !isSelectingDownloads && (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                            )}

                            {!isSelectingFavorites && !isSelectingDownloads && maxFavorites > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(photo.id);
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

                            {!isSelectingFavorites && !isSelectingDownloads && downloadEnabled && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPhoto(photo, currentIndex, gallerySlug);
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
                      </Masonry>
                    </div>
                  );
                } else {
                  // Renderizar header de sección + sus fotos (ordenadas por display_order)
                  const section = item.data;
                  const sectionPhotos = photos
                    .filter(p => p.section_id === section.id)
                    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

                  return (
                    <div key={`section-${section.id}`}>
                      <SectionHeader section={section} />
                      {sectionPhotos.length > 0 && (
                        <PhotoGrid
                          photos={sectionPhotos}
                          galleryTitle={title}
                          gallerySlug={gallerySlug}
                          onPhotoClick={openLightbox}
                          onToggleFavorite={handleToggleFavorite}
                          favoritePhotoIds={favoritePhotoIds}
                          maxFavorites={maxFavorites}
                          downloadEnabled={downloadEnabled}
                          onDownloadPhoto={handleDownloadPhoto}
                          isSelectingFavorites={isSelectingFavorites}
                          isSelectingDownloads={isSelectingDownloads}
                          isSelectingDownloadsRef={isSelectingDownloadsRef}
                          tempFavoriteIds={tempFavoriteIds}
                          tempDownloadIds={tempDownloadIds}
                          onToggleTemp={handleToggleTemp}
                          onToggleDownload={handleToggleDownload}
                          isPreview={isPreview}
                        />
                      )}
                    </div>
                  );
                }
              });
            })()}
          </div>
        ) : (
          /* Vista normal de sección específica o todas sin secciones */
          <PhotoGrid
            photos={filteredPhotos}
            galleryTitle={title}
            gallerySlug={gallerySlug}
            onPhotoClick={openLightbox}
            onToggleFavorite={handleToggleFavorite}
            favoritePhotoIds={favoritePhotoIds}
            maxFavorites={maxFavorites}
            downloadEnabled={downloadEnabled}
            onDownloadPhoto={handleDownloadPhoto}
            isSelectingFavorites={isSelectingFavorites}
            isSelectingDownloads={isSelectingDownloads}
            isSelectingDownloadsRef={isSelectingDownloadsRef}
            tempFavoriteIds={tempFavoriteIds}
            tempDownloadIds={tempDownloadIds}
            onToggleTemp={handleToggleTemp}
            onToggleDownload={handleToggleDownload}
            isPreview={isPreview}
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

              {/* Si ya hay un cliente con favoritos, mostrar opción de continuar */}
              {existingClient ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm">
                    <p className="text-sm text-amber-800 font-medium mb-1">
                      Ya hay una selección en progreso
                    </p>
                    <p className="text-xs text-amber-700">
                      {existingClient.name || existingClient.email.split('@')[0]} ya tiene {existingClient.count} foto{existingClient.count !== 1 ? 's' : ''} seleccionada{existingClient.count !== 1 ? 's' : ''}.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      handleEmailSubmit(existingClient.email, existingClient.name || existingClient.email.split('@')[0]);
                      setExistingClient(null);
                    }}
                    className="w-full py-3 bg-[#79502A] hover:bg-[#8B5A2F] text-white rounded-sm font-light text-sm tracking-wide transition-colors"
                  >
                    Continuar como {existingClient.name || existingClient.email.split('@')[0]}
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-black/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-black/40">o usar otro email</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setExistingClient(null)}
                    className="w-full py-2 border border-black/10 hover:border-black/20 text-black/60 rounded-sm font-light text-xs tracking-wide transition-colors"
                  >
                    Usar un email diferente
                  </button>
                </div>
              ) : (
                <>
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
                      className="w-full py-3 bg-[#79502A] hover:bg-[#8B5A2F] !text-white rounded-sm font-light text-sm tracking-wide transition-colors"
                    >
                      Guardar y continuar
                    </button>
                  </form>
                </>
              )}
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
                        onChange={(e) => !clientEmail && setDownloadEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                        disabled={!!clientEmail}
                        className={`w-full pl-10 pr-4 py-3 border border-black/10 rounded-sm text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:border-black/30 transition-colors ${clientEmail ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    {clientEmail && (
                      <p className="text-[10px] text-black/40 mt-1 font-light">
                        Email vinculado a esta galería
                      </p>
                    )}
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
                {selectedPhoto.index + 1} / {filteredPhotos.length}
              </span>
            </div>

            {/* Botón favorito (oculto en preview) */}
            {!isPreview && (
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
            )}

            {/* Navegación */}
            {selectedPhoto.index > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-6 p-3 hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <ChevronLeft size={32} strokeWidth={2} className="text-white" />
              </button>
            )}

            {selectedPhoto.index < filteredPhotos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-6 p-3 hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <ChevronRight size={32} strokeWidth={2} className="text-white" />
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
                if (swipe < -500 && selectedPhoto.index < filteredPhotos.length - 1) {
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
                quality={90}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
