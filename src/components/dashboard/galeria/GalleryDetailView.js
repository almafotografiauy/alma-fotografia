'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Mail,
  Eye,
  Image as ImageIcon,
  Share2,
  Edit,
  Globe,
  Lock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Upload,
  X,
  CheckSquare,
  Square,
  Download,
  Star,
  Loader2,
  Briefcase,
  GripVertical,
  MessageSquare,
  Heart
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ShareGalleryModal from './ShareGalleryModal';
import EditGalleryModal from './EditGalleryModal';
import PhotoUploader from './PhotoUploader';
import Modal from '@/components/ui/Modal';
import { useModal } from '@/hooks/useModal';
import { createClient } from '@/lib/supabaseClient';
import { iconMap } from '@/lib/validations/gallery';
import { deleteCloudinaryImage, deleteGalleries } from '@/app/actions/gallery-actions';

// Componente SortablePhoto para drag & drop
function SortablePhoto({ photo, photoIndex, isCover, isReorderMode, handleSetAsCover, changingCover }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative mb-0.5 sm:mb-2 break-inside-avoid ${
        isDragging ? 'ring-4 ring-[#79502A] shadow-2xl scale-105' : ''
      }`}
    >
      <div className="relative w-full bg-gray-100 overflow-hidden">
        <Image
          src={photo.file_path}
          alt={photo.file_name || `Foto ${photoIndex + 1}`}
          width={800}
          height={800}
          className="w-full h-auto"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />

        {/* Drag handle - SOLO desde el icono para permitir scroll */}
        {isReorderMode && (
          <>
            {/* Overlay visual (sin drag) */}
            <div className="absolute inset-0 bg-[#79502A]/10 border-2 border-[#79502A]/50 sm:border-none sm:bg-transparent pointer-events-none">
            </div>

            {/* Icono de agarre - ÚNICO punto draggable */}
            <div
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 p-3 sm:p-3.5 bg-[#79502A] backdrop-blur-sm rounded-lg shadow-lg cursor-grab active:cursor-grabbing z-20 touch-none hover:bg-[#8B5A2F] transition-colors"
            >
              <GripVertical size={28} className="sm:w-6 sm:h-6 text-white" />
            </div>
          </>
        )}

        {/* Badge de portada */}
        {isCover && !isReorderMode && (
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/70 backdrop-blur-sm rounded">
            <span className="font-fira text-[8px] sm:text-[9px] font-bold text-white flex items-center gap-1">
              <Star size={8} className="sm:w-[10px] sm:h-[10px] fill-[#79502A] text-[#79502A]" />
              PORTADA
            </span>
          </div>
        )}

        {/* Botones hover - solo cuando NO está en modo reordenar */}
        {!isReorderMode && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200">
            <div className="absolute bottom-0 left-0 right-0 p-1 sm:p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              {!isCover && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetAsCover(photo.file_path);
                  }}
                  disabled={changingCover}
                  className="flex-1 py-1 sm:py-1.5 bg-white/95 hover:bg-white rounded text-[9px] sm:text-[10px] font-fira font-bold text-black flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Star size={10} />
                  <span className="hidden sm:inline">PORTADA</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Número de foto */}
        {!isReorderMode && (
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 px-1 sm:px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded">
            <span className="font-fira text-[8px] sm:text-[9px] font-bold text-white">
              #{photoIndex + 1}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GalleryDetailView({ gallery }) {
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [photosPage, setPhotosPage] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [deletingPhotos, setDeletingPhotos] = useState(false);
  const [changingCover, setChangingCover] = useState(false);
  const [localPhotos, setLocalPhotos] = useState(gallery.photos);
  const [savingOrder, setSavingOrder] = useState(false);
  const [deletingGallery, setDeletingGallery] = useState(false);
  const [serviceIcon, setServiceIcon] = useState(null);
  const [serviceName, setServiceName] = useState(null);
  const [coverImageSize, setCoverImageSize] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(null);
  const { modalState, showModal, closeModal } = useModal();

  // Sensores para drag & drop (desktop + mobile) - OPTIMIZADO PARA MOBILE
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Reducido de 200 a 100ms para respuesta más rápida
        tolerance: 5, // Reducido de 8 a 5px para mayor sensibilidad
      },
    })
  );

  const PHOTOS_PER_PAGE = 30;

  const {
    id,
    title,
    slug,
    description,
    event_date,
    client_email,
    cover_image,
    is_public,
    views_count,
    photos,
    created_at,
    service_type,
    allow_downloads,
    allow_comments,
    notify_on_view,
    notify_on_favorites,
    custom_message,
    password,
    expiration_date,
    max_favorites,
    has_active_link,
    download_pin,
  } = gallery;

  // Usar localPhotos para permitir reordenar antes de guardar
  const workingPhotos = localPhotos;

  const photosSize = workingPhotos?.reduce((sum, photo) => sum + (photo.file_size || 0), 0) || 0;
  const totalSize = photosSize + coverImageSize;
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);

  const formattedEventDate = event_date
    ? new Date(event_date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : null;

  const formattedCreatedDate = created_at
    ? new Date(created_at).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : null;

  // Sincronizar localPhotos cuando gallery.photos cambie (después de refresh)
  useEffect(() => {
    setLocalPhotos(gallery.photos);
  }, [gallery.photos]);

  // Cargar conteo de favoritos
  useEffect(() => {
    const loadFavoritesCount = async () => {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('gallery_id', id);

        if (error) {
          console.error('Error loading favorites count:', error);
          setFavoritesCount(0);
        } else {
          setFavoritesCount(count || 0);
        }
      } catch (error) {
        console.error('Error loading favorites count:', error);
        setFavoritesCount(0);
      }
    };

    loadFavoritesCount();
  }, [id]);

  // Cargar ícono del servicio si existe
  useEffect(() => {
    if (service_type) {
      loadServiceIcon();
    }
  }, [service_type]);

  // Calcular tamaño de portada si es independiente
  useEffect(() => {
    if (cover_image) {
      const isGalleryPhoto = workingPhotos.some(p => p.file_path === cover_image);
      if (!isGalleryPhoto) {
        // Portada independiente, obtener su tamaño
        getCoverImageSize();
      } else {
        setCoverImageSize(0); // Ya está contada en las fotos
      }
    } else {
      setCoverImageSize(0);
    }
  }, [cover_image, workingPhotos]);

  const getCoverImageSize = async () => {
    try {
      // Intentar obtener el tamaño desde el header de la imagen
      const response = await fetch(cover_image, { method: 'HEAD' });
      const size = parseInt(response.headers.get('content-length') || '0');
      setCoverImageSize(size);
    } catch (err) {
      console.error('Error getting cover image size:', err);
      setCoverImageSize(0);
    }
  };

  const loadServiceIcon = async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('service_types')
        .select('icon_name, name')
        .eq('slug', service_type)
        .maybeSingle();

      if (!error && data) {
        setServiceIcon(data.icon_name);
        setServiceName(data.name);
      }
    } catch (err) {
      console.error('Error loading service icon:', err);
    }
  };

  const handleUploadComplete = () => router.refresh();

  // Manejar drag and drop
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = workingPhotos.findIndex((p) => p.id === active.id);
    const newIndex = workingPhotos.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reordenar array localmente
    const newPhotos = [...workingPhotos];
    const [movedPhoto] = newPhotos.splice(oldIndex, 1);
    newPhotos.splice(newIndex, 0, movedPhoto);

    setLocalPhotos(newPhotos);
  };

  // Guardar nuevo orden en BD - OPTIMIZADO con Promise.all
  const saveNewOrder = async () => {
    setSavingOrder(true);

    try {
      const supabase = createClient(); // NO usar await - createClient() no es async

      // Crear array de promesas - se ejecutan en paralelo
      const updatePromises = workingPhotos.map((photo, index) =>
        supabase
          .from('photos')
          .update({ display_order: index + 1 })
          .eq('id', photo.id)
      );

      // Ejecutar todas las actualizaciones en paralelo (mucho más rápido que secuencial)
      const results = await Promise.all(updatePromises);

      // Verificar si hubo errores
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Errores en actualización:', errors);
        throw new Error('Algunas fotos no se pudieron actualizar');
      }

      showModal({
        title: '¡Orden guardado!',
        message: 'El nuevo orden de las fotos se ha guardado exitosamente.',
        type: 'success'
      });

      setReorderMode(false);
      router.refresh();

    } catch (error) {
      console.error('Error guardando orden:', error);
      showModal({
        title: 'Error',
        message: 'No se pudo guardar el nuevo orden.',
        type: 'error'
      });
    } finally {
      setSavingOrder(false);
    }
  };

  // Cancelar reordenamiento
  const cancelReorder = () => {
    setLocalPhotos(gallery.photos); // Restaurar orden original
    setReorderMode(false);
  };

  // Eliminar galería completa
  const handleDeleteGallery = () => {
    showModal({
      title: '¿Eliminar galería completa?',
      message: `Esta acción eliminará permanentemente la galería "${title}" con todas sus ${workingPhotos.length} fotos. Esta acción NO se puede deshacer.`,
      type: 'warning',
      confirmText: 'Eliminar galería',
      cancelText: 'Cancelar',
      onConfirm: confirmDeleteGallery
    });
  };

  const confirmDeleteGallery = async () => {
    setDeletingGallery(true);

    try {
      console.log('🗑️ Eliminando galería:', id);

      // Usar Server Action con atomicidad (todo o nada)
      const result = await deleteGalleries([id]);

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al eliminar galería');
      }

      console.log('✅ Galería eliminada exitosamente');

      // Navegación forzada para evitar errores de re-renderizado
      // En lugar de router.replace(), usar window.location para navegación completa
      window.location.href = '/dashboard/galerias';

    } catch (error) {
      console.error('❌ Error eliminando galería:', error);
      showModal({
        title: 'Error al eliminar',
        message: error.message || 'No se pudo eliminar la galería. Por favor intenta nuevamente.',
        type: 'error'
      });
      setDeletingGallery(false);
    }
  };

  const extractPublicIdFromUrl = (url) => {
    if (!url) return null;
    try {
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return null;
      const pathParts = parts.slice(uploadIndex + 2);
      const fullPath = pathParts.join('/');
      return fullPath.replace(/\.[^/.]+$/, '');
    } catch (error) {
      console.error('Error extracting public_id:', error);
      return null;
    }
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.size === photosToShow.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photosToShow.map(p => p.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedPhotos.size === 0) return;

    showModal({
      title: `¿Eliminar ${selectedPhotos.size} fotos?`,
      message: 'Esta acción no se puede deshacer. Las fotos se eliminarán permanentemente.',
      type: 'warning',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: confirmDeleteSelected
    });
  };

  const confirmDeleteSelected = async () => {
    setDeletingPhotos(true);

    try {
      const photosToDelete = workingPhotos.filter(p => selectedPhotos.has(p.id));
      const supabase = await createClient();

      console.log(`🗑️ Eliminando ${photosToDelete.length} fotos...`);

      // 1. Eliminar de base de datos primero
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .in('id', Array.from(selectedPhotos));

      if (dbError) throw dbError;

      console.log('✅ Fotos eliminadas de BD');

      // 2. Eliminar de Cloudinary en paralelo con Promise.all
      const deletePromises = photosToDelete.map(async (photo) => {
        const publicId = extractPublicIdFromUrl(photo.file_path);
        if (publicId) {
          console.log('🗑️ Eliminando foto de Cloudinary:', publicId);
          const result = await deleteCloudinaryImage(publicId);

          if (result.success) {
            console.log('✅ Foto eliminada:', publicId);
          } else {
            console.warn('⚠️ No se pudo eliminar foto:', publicId, result.error);
          }

          return result;
        }
        return { success: true };
      });

      await Promise.all(deletePromises);
      console.log('✅ Todas las fotos eliminadas de Cloudinary');

      setSelectedPhotos(new Set());
      setSelectionMode(false);
      router.refresh();

    } catch (error) {
      console.error('Error eliminando fotos:', error);
      showModal({
        title: 'Error',
        message: 'No se pudieron eliminar las fotos.',
        type: 'error'
      });
    } finally {
      setDeletingPhotos(false);
    }
  };

  const handleSetAsCover = async (photoUrl) => {
    setChangingCover(true);

    try {
      const previousCoverUrl = cover_image;
      const supabase = await createClient();

      const { error } = await supabase
        .from('galleries')
        .update({ cover_image: photoUrl })
        .eq('id', id);

      if (error) throw error;

      // Eliminar portada anterior de Cloudinary si no es foto de galería
      if (previousCoverUrl) {
        const isGalleryPhoto = workingPhotos.some(p => p.file_path === previousCoverUrl);

        if (!isGalleryPhoto) {
          const publicId = extractPublicIdFromUrl(previousCoverUrl);
          if (publicId) {
            console.log('🗑️ Eliminando portada anterior:', publicId);
            const deleteResult = await deleteCloudinaryImage(publicId);

            if (deleteResult.success) {
              console.log('✅ Portada anterior eliminada de Cloudinary');
            } else {
              console.warn('⚠️ No se pudo eliminar portada anterior:', deleteResult.error);
            }
          }
        }
      }

      router.refresh();

    } catch (error) {
      console.error('Error cambiando portada:', error);
      showModal({
        title: 'Error',
        message: 'No se pudo cambiar la portada.',
        type: 'error'
      });
    } finally {
      setChangingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    showModal({
      title: '¿Quitar portada?',
      message: 'La galería quedará sin imagen de portada. La imagen se eliminará permanentemente.',
      type: 'warning',
      confirmText: 'Quitar',
      cancelText: 'Cancelar',
      onConfirm: confirmRemoveCover
    });
  };

  const confirmRemoveCover = async () => {
    setChangingCover(true);

    try {
      const imageToDelete = cover_image;

      const supabase = await createClient();
      const { error } = await supabase
        .from('galleries')
        .update({ cover_image: null })
        .eq('id', id);

      if (error) throw error;

      // Eliminar portada de Cloudinary si no es foto de galería
      if (imageToDelete) {
        const isGalleryPhoto = workingPhotos.some(p => p.file_path === imageToDelete);

        if (!isGalleryPhoto) {
          const publicId = extractPublicIdFromUrl(imageToDelete);
          if (publicId) {
            console.log('🗑️ Eliminando portada:', publicId);
            const deleteResult = await deleteCloudinaryImage(publicId);

            if (deleteResult.success) {
              console.log('✅ Portada eliminada de Cloudinary:', publicId);
            } else {
              console.warn('⚠️ No se pudo eliminar portada de Cloudinary:', deleteResult.error);
            }
          }
        } else {
          console.log('ℹ️ Portada es foto de galería, no se elimina de Cloudinary');
        }
      }

      router.refresh();

    } catch (error) {
      console.error('Error quitando portada:', error);
      showModal({
        title: 'Error',
        message: 'No se pudo quitar la portada.',
        type: 'error'
      });
    } finally {
      setChangingCover(false);
    }
  };

  const handleUploadCoverFromPlaceholder = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showModal({
        title: 'Formato inválido',
        message: 'Solo se permiten imágenes JPG, PNG o WebP',
        type: 'error'
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showModal({
        title: 'Archivo muy pesado',
        message: 'La imagen no debe superar los 15MB',
        type: 'error'
      });
      return;
    }

    setChangingCover(true);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Configuración de Cloudinary incompleta');
      }

      const optimizedBlob = await optimizeImageForCover(file);

      // Generar nombre profesional: portada-nombreGaleria-timestamp.webp
      const gallerySlug = slug || title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const timestamp = Date.now();
      const prettyFileName = `portada-${gallerySlug}-${timestamp}.webp`;

      const optimizedFile = new File(
        [optimizedBlob],
        prettyFileName,
        { type: 'image/webp' }
      );

      const formData = new FormData();
      formData.append('file', optimizedFile);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', `gallery-covers/${id}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al subir');
      }

      const data = await response.json();

      const supabase = await createClient();
      const { error } = await supabase
        .from('galleries')
        .update({ cover_image: data.secure_url })
        .eq('id', id);

      if (error) throw error;

      router.refresh();

    } catch (error) {
      console.error('Error subiendo portada:', error);
      showModal({
        title: 'Error al subir',
        message: error.message || 'No se pudo subir la portada.',
        type: 'error'
      });
    } finally {
      setChangingCover(false);
    }
  };

  const optimizeImageForCover = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = document.createElement('img');

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const MAX_WIDTH = 2000;
          const MAX_HEIGHT = 2000;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width > height) {
              if (width > MAX_WIDTH) {
                height = (height * MAX_WIDTH) / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = (width * MAX_HEIGHT) / height;
                height = MAX_HEIGHT;
              }
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Error al optimizar'));
              }
            },
            'image/webp',
            0.90
          );
        };

        img.onerror = () => reject(new Error('Error al cargar imagen'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Error al leer archivo'));
      reader.readAsDataURL(file);
    });
  };

  const totalPages = Math.ceil(workingPhotos.length / PHOTOS_PER_PAGE);
  const startIdx = photosPage * PHOTOS_PER_PAGE;
  const endIdx = startIdx + PHOTOS_PER_PAGE;
  const photosToShow = workingPhotos.slice(startIdx, endIdx);

  // Si está eliminando, mostrar solo el overlay para evitar flash de 404
  if (deletingGallery) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3 shadow-2xl max-w-sm mx-4">
          <Loader2 size={32} className="text-red-600 animate-spin" />
          <p className="font-fira text-sm text-black/80 text-center">
            Eliminando galería y todos sus archivos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-[2000px] mx-auto">

        {/* Header oscuro */}
        <div className="bg-[#2d2d2d] text-white rounded-xl">
          <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-6">

            <button
              onClick={() => router.push('/dashboard/galerias')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-fira text-sm mb-4"
            >
              <ArrowLeft size={16} />
              <span>Volver</span>
            </button>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <h1 className="font-voga text-xl sm:text-2xl lg:text-3xl break-words">
                      {title}
                    </h1>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-fira text-xs font-semibold flex-shrink-0 ${is_public
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-white/10 text-white/70'
                      }`}>
                      {is_public ? <Globe size={12} /> : <Lock size={12} />}
                      {is_public ? 'Pública' : 'Privada'}
                    </span>
                  </div>

                  {description && (
                    <p className="font-fira text-sm text-white/80 leading-relaxed mb-3">
                      {description}
                    </p>
                  )}

                  {/* Configuraciones activas */}
                  {(allow_downloads || allow_comments || password || max_favorites !== 150) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {allow_downloads && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#af7c4b] text-black rounded-full font-fira text-[10px] font-medium">
                            <Download size={10} />
                            Descargas
                          </span>
                          {download_pin && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#b8824f] text-black rounded-full font-fira text-[10px] font-medium">
                              <Lock size={10} />
                              PIN: {download_pin}
                            </span>
                          )}
                        </>
                      )}
                      {allow_comments && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#89613B] text-black rounded-full font-fira text-[10px] font-medium">
                          <MessageSquare size={10} />
                          Comentarios
                        </span>
                      )}
                      {password && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#d5975b] text-black rounded-full font-fira text-[10px] font-medium">
                          <Lock size={10} />
                          Protegida
                        </span>
                      )}
                      {max_favorites && max_favorites !== 151 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#a27145] text-black rounded-full font-fira text-[10px] font-medium">
                          <Star size={10} />
                          Máx {max_favorites} favoritos
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-white/60">
                    {service_type && (
                      <div className="flex items-center gap-2">
                        {(() => {
                          if (serviceIcon && iconMap[serviceIcon]) {
                            const IconComponent = iconMap[serviceIcon];
                            return <IconComponent size={14} className="text-white/40 flex-shrink-0" />;
                          }
                          return <Briefcase size={14} className="text-white/40 flex-shrink-0" />;
                        })()}
                        <span className="font-fira">{serviceName || service_type}</span>
                      </div>
                    )}
                    {formattedEventDate && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-white/40 flex-shrink-0" />
                        <span className="font-fira">Evento: {formattedEventDate}</span>
                      </div>
                    )}
                    {client_email && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail size={14} className="text-white/40 flex-shrink-0" />
                        <span className="font-fira truncate">{client_email}</span>
                      </div>
                    )}
                    {formattedCreatedDate && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-white/40 flex-shrink-0" />
                        <span className="font-fira">Creada: {formattedCreatedDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <motion.button
                    onClick={() => favoritesCount > 0 && router.push(`/dashboard/galerias/${gallery.id}/favoritos`)}
                    whileHover={favoritesCount > 0 ? { scale: 1.02 } : {}}
                    whileTap={favoritesCount > 0 ? { scale: 0.98 } : {}}
                    disabled={favoritesCount === 0}
                    title={favoritesCount === 0 ? 'No hay favoritas aún' : `Ver ${favoritesCount} foto${favoritesCount === 1 ? '' : 's'} favorita${favoritesCount === 1 ? '' : 's'}`}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 ${
                      favoritesCount === 0
                        ? '!text-neutral-500 bg-neutral-800/30 cursor-not-allowed opacity-50'
                        : '!text-pink-300 bg-pink-500/20 hover:bg-pink-500/30 cursor-pointer'
                    }`}
                  >
                    <Heart size={16} className={favoritesCount > 0 ? 'fill-pink-300' : ''} />
                    <span>Favoritas{favoritesCount !== null && favoritesCount > 0 ? ` (${favoritesCount})` : ''}</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setShowShareModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1a1a] hover:bg-[#3a3a3a] rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Share2 size={16} />
                    <span>Compartir</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setShowEditModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    <span>Editar</span>
                  </motion.button>
                  <motion.button
                    onClick={handleDeleteGallery}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline ">Eliminar</span>
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-3 sm:gap-4 md:gap-6 pt-4 border-t border-white/10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="p-2 bg-white/10 rounded-lg"
                >
                  <ImageIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#d5975b]" />
                </motion.div>
                <div>
                  <p className="font-fira text-base sm:text-lg font-semibold">{workingPhotos.length}</p>
                  <p className="font-fira text-xs text-white/60">Fotos</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="p-2 bg-white/10 rounded-lg"
                >
                  <Eye className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#d5975b]" />
                </motion.div>
                <div>
                  <p className="font-fira text-base sm:text-lg font-semibold">
                    {has_active_link ? (views_count || 0) : 'Sin enlace'}
                  </p>
                  <p className="font-fira text-xs text-white/60">Vistas</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="p-2 bg-white/10 rounded-lg"
                >
                  <Download className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#d5975b]" />
                </motion.div>
                <div>
                  <p className="font-fira text-base sm:text-lg font-semibold">{totalSizeMB} MB</p>
                  <p className="font-fira text-xs text-white/60">Tamaño</p>
                </div>
              </motion.div>

              {serviceName && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    {(() => {
                      if (serviceIcon && iconMap[serviceIcon]) {
                        const IconComponent = iconMap[serviceIcon];
                        return <IconComponent size={18} className="text-[#d5975b]" />;
                      }
                      return <Briefcase className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#d5975b]" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-fira text-base sm:text-lg font-semibold">{serviceName}</p>
                    <p className="font-fira text-xs text-white/60">Servicio</p>
                  </div>
                </div>
              )}

              {/* Descargas permitidas */}
              {allow_downloads !== undefined && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Download className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${allow_downloads ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <div>
                    <p className="font-fira text-base sm:text-lg font-semibold">{allow_downloads ? 'Sí' : 'No'}</p>
                    <p className="font-fira text-xs text-white/60">Descargas</p>
                  </div>
                </div>
              )}

              {/* Límite de favoritos */}
              {max_favorites !== undefined && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Heart className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#d5975b]" />
                  </div>
                  <div>
                    <p className="font-fira text-base sm:text-lg font-semibold">{max_favorites}</p>
                    <p className="font-fira text-xs text-white/60">Máx. favoritos</p>
                  </div>
                </div>
              )}

              {/* Contraseña */}
              {password && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Lock className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#d5975b]" />
                  </div>
                  <div>
                    <p className="font-fira text-base sm:text-lg font-semibold">Protegida</p>
                    <p className="font-fira text-xs text-white/60">Contraseña</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mensaje personalizado */}
            {custom_message && (
              <div className="mt-4 pt-4 border-t border-white/10 ">
                <div className="bg-[#fff]/20 border border-[#a27145] rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={14} className="text-[#d5975b] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-fira text-xs font-semibold text-[#d5975b] mb-1">
                        Mensaje para el cliente
                      </p>
                      <p className="font-fira text-sm text-[#fff] leading-relaxed">
                        {custom_message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="space-y-1">

          {/* Portada */}
          {cover_image ? (
            <div className="bg-white py-4 sm:py-6 px-2 sm:px-6 lg:px-8 border-b border-gray-200">
              <div className="relative w-full max-w-2xl mx-auto aspect-[3/2] bg-gray-200 rounded-lg overflow-hidden shadow-md">
                <Image
                  src={cover_image}
                  alt="Portada"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/70 backdrop-blur-sm rounded-full">
                  <span className="font-fira text-xs font-bold text-white flex items-center gap-1.5">
                    <Star size={12} className="fill-[#d5975b] text-[#d5975b]" />
                    Portada
                  </span>
                </div>
                <button
                  onClick={handleRemoveCover}
                  className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-red-600/90 hover:bg-red-700 backdrop-blur-sm rounded-full transition-colors"
                  title="Quitar portada"
                >
                  <X size={14} className="sm:w-4 sm:h-4 text-white" />
                </button>
              </div>
              <p className="text-center mt-2 font-fira text-xs text-gray-500">
                Esta es la imagen de portada de la galería
              </p>
            </div>
          ) : (
            <div className="bg-white py-4 sm:py-6 px-2 sm:px-6 lg:px-8 border-b border-gray-200">
              <div className="max-w-2xl mx-auto border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
                <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3">
                  <ImageIcon size={32} className="text-gray-400" />
                </div>
                <h3 className="font-fira text-base font-semibold text-black mb-1">
                  Sin portada
                </h3>
                <p className="font-fira text-sm text-gray-500 mb-4">
                  Sube una imagen o selecciona una de la galería
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <label className="flex-1 sm:flex-none px-6 py-3 bg-[#79502A] hover:bg-[#8B5A2F] text-white rounded-lg transition-colors font-fira text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer">
                    <Upload size={16} />
                    Subir portada
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleUploadCoverFromPlaceholder}
                      className="hidden"
                    />
                  </label>

                  {photos.length > 0 && (
                    <button
                      onClick={() => handleSetAsCover(photos[0].file_path)}
                      className="flex-1 sm:flex-none px-6 py-3 bg-white hover:bg-gray-50 border-2 border-gray-300 text-black rounded-lg transition-colors font-fira text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Star size={16} />
                      Usar primera foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Uploader */}
          <div className="bg-white py-4 sm:py-6 px-2 sm:px-6 lg:px-8 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Upload size={18} className="text-[#79502A]" />
              <h2 className="font-fira text-base sm:text-lg font-semibold text-black">
                Subir fotos
              </h2>
            </div>
            <PhotoUploader 
              galleryId={id} 
              gallerySlug={slug}
              galleryTitle={title}
              onUploadComplete={handleUploadComplete} 
            />
          </div>

          {/* Grid de fotos con MASONRY */}
          <div className="bg-white">
            {/* Toolbar */}
            <div className="py-4 sm:py-6 px-2 sm:px-6 lg:px-8 border-b border-gray-200">
              <div className="flex flex-col gap-3">
                <h2 className="font-fira text-base sm:text-lg font-semibold text-black flex items-center gap-2">
                  <ImageIcon size={18} className="text-gray-400" />
                  {workingPhotos.length} {workingPhotos.length === 1 ? 'foto' : 'fotos'}
                </h2>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {!selectionMode && !reorderMode && (
                    <>
                      <button
                        onClick={() => setSelectionMode(true)}
                        className="!text-white px-3 sm:px-4 py-2 bg-[#8b5a2fff] hover:bg-[#9c6b3fff] rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                      >
                        <CheckSquare size={16} />
                        <span>Seleccionar</span>
                      </button>
                      {workingPhotos.length > 1 && (
                        <button
                          onClick={() => setReorderMode(true)}
                          className="!text-white px-3 sm:px-4 py-2 bg-[#C6A97D] hover:bg-[#D7B98E] rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                        >
                          <GripVertical size={16} />
                          <span>Reordenar</span>
                        </button>
                      )}
                    </>
                  )}

                  {selectionMode && (
                    <>
                      <button
                        onClick={toggleSelectAll}
                        className="!text-black/80 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                      >
                        {selectedPhotos.size === photosToShow.length ? 'Deseleccionar' : 'Todo'}
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        disabled={selectedPhotos.size === 0 || deletingPhotos}
                        className="!text-white px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                      >
                        {deletingPhotos ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        <span className="hidden sm:inline">Eliminar</span>
                        {selectedPhotos.size > 0 && ` (${selectedPhotos.size})`}
                      </button>
                      <button
                        onClick={() => {
                          setSelectionMode(false);
                          setSelectedPhotos(new Set());
                        }}
                        className="!text-black/80 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {reorderMode && (
                    <>
                      <button
                        onClick={saveNewOrder}
                        disabled={savingOrder}
                        className="!text-white px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium flex items-center gap-2 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                      >
                        {savingOrder ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckSquare size={14} />
                        )}
                        <span>Guardar</span>
                      </button>
                      <button
                        onClick={cancelReorder}
                        disabled={savingOrder}
                        className="!text-black/80 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                      >
                        Cancelar
                      </button>
                      <span className="font-fira text-xs text-gray-500 ml-2 hidden md:inline whitespace-nowrap">
                        Arrastra las fotos para cambiar el orden
                      </span>
                    </>
                  )}

                  {workingPhotos.length > PHOTOS_PER_PAGE && !reorderMode && (
                    <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                      <button
                        onClick={() => setPhotosPage(p => Math.max(0, p - 1))}
                        disabled={photosPage === 0}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="font-fira text-xs sm:text-sm text-gray-600 px-1 whitespace-nowrap">
                        {photosPage + 1}/{totalPages}
                      </span>
                      <button
                        onClick={() => setPhotosPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={photosPage === totalPages - 1}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🎨 MASONRY LAYOUT con Drag & Drop */}
            {workingPhotos.length === 0 ? (
              <div className="py-12 px-2 text-center">
                <ImageIcon size={40} className="sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-fira text-sm text-gray-500">No hay fotos en esta galería</p>
              </div>
            ) : reorderMode ? (
              /* Modo reordenar: Drag & Drop activo */
              <div className="px-0 sm:px-2 lg:px-4 py-2 sm:py-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={workingPhotos.map(p => p.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                      {workingPhotos.map((photo, index) => (
                        <SortablePhoto
                          key={photo.id}
                          photo={photo}
                          photoIndex={index}
                          isCover={cover_image === photo.file_path}
                          isReorderMode={true}
                          handleSetAsCover={handleSetAsCover}
                          changingCover={changingCover}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ) : selectionMode ? (
              /* Modo selección: checkboxes */
              <div className="px-0 sm:px-2 lg:px-4 py-2 sm:py-4">
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {photosToShow.map((photo, index) => {
                    const photoIndex = startIdx + index;
                    const isSelected = selectedPhotos.has(photo.id);
                    const isCover = cover_image === photo.file_path;

                    return (
                      <div
                        key={photo.id}
                        onClick={() => togglePhotoSelection(photo.id)}
                        className={`group relative mb-0.5 sm:mb-2 break-inside-avoid cursor-pointer transition-all hover:opacity-80 ${
                          isSelected ? 'ring-2 sm:ring-4 ring-[#79502A]' : ''
                        }`}
                      >
                        <div className="relative w-full bg-gray-100 overflow-hidden">
                          <Image
                            src={photo.file_path}
                            alt={photo.file_name || `Foto ${photoIndex + 1}`}
                            width={800}
                            height={800}
                            className="w-full h-auto"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          />

                          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10">
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#79502A] border-[#79502A]'
                                : 'bg-white/90 border-gray-300'
                            }`}>
                              {isSelected && <CheckSquare size={14} className="sm:w-4 sm:h-4 text-white" strokeWidth={3} />}
                            </div>
                          </div>

                          {isCover && (
                            <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/70 backdrop-blur-sm rounded">
                              <span className="font-fira text-[8px] sm:text-[9px] font-bold text-white flex items-center gap-1">
                                <Star size={8} className="sm:w-[10px] sm:h-[10px] fill-[#79502A] text-[#79502A]" />
                                PORTADA
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Modo normal: solo visualización con paginación */
              <div className="px-0 sm:px-2 lg:px-4 py-2 sm:py-4">
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {photosToShow.map((photo, index) => (
                    <SortablePhoto
                      key={photo.id}
                      photo={photo}
                      photoIndex={startIdx + index}
                      isCover={cover_image === photo.file_path}
                      isReorderMode={false}
                      handleSetAsCover={handleSetAsCover}
                      changingCover={changingCover}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {changingCover && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3 shadow-2xl">
            <Loader2 size={32} className="text-[#79502A] animate-spin" />
            <p className="font-fira text-sm text-black font-medium">
              Subiendo portada...
            </p>
          </div>
        </div>
      )}

      {showShareModal && (
        <ShareGalleryModal
          galleryId={id}
          gallerySlug={slug}
          onClose={() => {
            setShowShareModal(false);
            router.refresh(); // Actualizar vistas y has_active_link
          }}
        />
      )}

      {showEditModal && (
        <EditGalleryModal
          gallery={gallery}
          hasActiveLink={has_active_link}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => router.refresh()}
        />
      )}

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </div>
  );
}