'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
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
  ChevronDown,
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
  Heart,
  Folder,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ShareGalleryModal from './ShareGalleryModal';
import { getThumbnailUrl } from '@/lib/image-utils';
import EditGalleryModal from './EditGalleryModal';
import PhotoUploader from './PhotoUploader';
import SectionsManager from './SectionsManager';
import Modal from '@/components/ui/Modal';
import { useModal } from '@/hooks/useModal';
import { createClient } from '@/lib/supabaseClient';
import { iconMap } from '@/lib/validations/gallery';
import { deleteCloudinaryImage, deleteGalleries, updateAllowShareFavorites, updateGallerySortOrder } from '@/app/actions/gallery-actions';
import { assignPhotosToSection } from '@/app/actions/photo-sections-actions';
import { useToast } from '@/components/ui/Toast';
import GalleryStorageSize from './GalleryStorageSize';
import { formatDateWithoutTimezone } from '@/lib/date-utils';

// Componente SortableSectionHeader para drag & drop de secciones (OLD - sin fotos)
function SortableSectionHeader({ section }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section.id}` });

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
      className={`relative mb-3 break-inside-avoid ${
        isDragging ? 'ring-2 ring-[#8B5A2F] shadow-xl scale-[1.01]' : ''
      }`}
    >
      <div className="relative w-full bg-gradient-to-r from-[#8B5A2F] to-[#79502A] rounded-xl p-5 shadow-sm border border-[#79502A]/30">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1/2 -translate-y-1/2 left-4 p-2 bg-black/10 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing z-20 touch-none hover:bg-black/20 transition-all duration-200"
        >
          <GripVertical size={18} className="text-white" />
        </div>

        {/* Contenido */}
        <div className="pl-12">
          <div className="flex items-center gap-2.5 mb-1">
            <Folder size={18} className="text-white/90" />
            <h3 className="font-voga text-lg text-white font-medium">
              {section.name}
            </h3>
          </div>
          {section.description && (
            <p className="font-fira text-sm text-white/80 font-light">
              {section.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente SortableSectionBlock - Bloque colapsable con fotos de una sección
function SortableSectionBlock({ section, photos, sections, cover_image, handleSetAsCover, changingCover, isCollapsed, onToggleCollapse }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  // Estilos para secciones
  const bgColor = 'bg-gradient-to-r from-[#8B5A2F] to-[#79502A]';
  const borderColor = 'border border-[#79502A]/30';
  const dragHandleBg = 'bg-black/10 hover:bg-black/20';
  const textColor = 'text-white';
  const iconColor = 'text-white';
  const ringColor = 'ring-[#8B5A2F]';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-5 ${
        isDragging ? `ring-2 ${ringColor} shadow-xl scale-[1.01]` : ''
      }`}
    >
      <div className={`${bgColor} ${borderColor} rounded-xl shadow-sm overflow-hidden`}>
        {/* Header del bloque */}
        <div className="relative p-5 flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className={`p-2 ${dragHandleBg} backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing z-20 touch-none transition-all duration-200`}
          >
            <GripVertical size={18} className={iconColor} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <Folder size={18} className="text-white/90" />
              <h3 className={`font-voga text-lg ${textColor} font-medium`}>
                {section.name}
              </h3>
              <span className="font-fira text-sm text-white/70 font-light">
                ({photos.length} {photos.length === 1 ? 'foto' : 'fotos'})
              </span>
            </div>
            {section.description && !isCollapsed && (
              <p className="font-fira text-sm text-white/80 font-light mt-1.5">
                {section.description}
              </p>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-black/10 rounded-lg transition-all duration-200"
          >
            <ChevronDown
              size={20}
              className={`text-white transition-transform duration-200 ${
                isCollapsed ? '-rotate-90' : ''
              }`}
            />
          </button>
        </div>

        {/* Contenido colapsable */}
        {!isCollapsed && photos.length > 0 && (
          <div className="px-5 pb-5 pt-2">
            <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-2.5 space-y-2.5">
              {photos.map((photo) => (
                <SortablePhoto
                  key={photo.id}
                  photo={photo}
                  photoIndex={0}
                  isCover={cover_image === photo.file_path}
                  isReorderMode={true}
                  handleSetAsCover={handleSetAsCover}
                  changingCover={changingCover}
                  sections={sections}
                  showSectionBadge={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente SortablePhoto para drag & drop
function SortablePhoto({ photo, photoIndex, isCover, isReorderMode, handleSetAsCover, changingCover, sections = [] }) {
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
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  };

  // Mismo layout en todos los modos (masonry)
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${isDragging ? 'opacity-40 scale-105 z-50' : 'opacity-100'}`}
    >
      <div className="relative w-full bg-gray-200 overflow-hidden">
        <Image
          src={getThumbnailUrl(photo.file_path)}
          alt={photo.file_name || `Foto ${photoIndex + 1}`}
          width={400}
          height={400}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          className="w-full h-auto block"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0iI2UwZTBlMCIvPjwvc3ZnPg=="
          style={{ width: '100%', height: 'auto' }}
        />

        {/* Drag handle - solo en modo reordenar */}
        {isReorderMode && (
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 p-1.5 bg-[#79502A] rounded shadow-md cursor-grab active:cursor-grabbing z-20 touch-none hover:bg-[#8B5A2F] hover:scale-110 active:scale-95 transition-all duration-150"
          >
            <GripVertical size={18} className="text-white" />
          </div>
        )}

        {/* Badge de portada - solo cuando NO está en modo reordenar */}
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
        <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 px-1 sm:px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded">
          <span className="font-fira text-[8px] sm:text-[9px] font-bold text-white">
            #{photoIndex + 1}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GalleryDetailView({ gallery }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  // Configuración de breakpoints para Masonry (orden horizontal)
  const masonryBreakpoints = {
    default: 4, // 4 columnas en desktop
    1024: 4,    // lg: 4 columnas
    768: 3,     // md: 3 columnas
    640: 2      // sm: 2 columnas
  };
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [deletingPhotos, setDeletingPhotos] = useState(false);
  const [changingCover, setChangingCover] = useState(false);
  const [localPhotos, setLocalPhotos] = useState(gallery.photos);
  const [photosBeforeReorder, setPhotosBeforeReorder] = useState(null); // Para restaurar al cancelar
  const [savingOrder, setSavingOrder] = useState(false);
  const [collapsedBlocks, setCollapsedBlocks] = useState(new Set()); // Para trackear bloques colapsados
  const [deletingGallery, setDeletingGallery] = useState(false);
  const [serviceIcon, setServiceIcon] = useState(null);
  const [serviceName, setServiceName] = useState(null);
  const [coverImageSize, setCoverImageSize] = useState(0);
  const [allowShareFavorites, setAllowShareFavorites] = useState(gallery.allow_share_favorites || false);
  const [isUpdatingShareSetting, setIsUpdatingShareSetting] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(null);
  const [sections, setSections] = useState([]);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null); // Se auto-seleccionará primera sección
  const [sortOrder, setSortOrder] = useState(gallery.sort_order || 'name'); // 'name' o 'date'
  const [sortDirection, setSortDirection] = useState(gallery.sort_direction || 'desc'); // 'asc' o 'desc' - solo para date
  const [activeId, setActiveId] = useState(null); // Para DragOverlay


  // Actualizar localPhotos cuando cambien las fotos desde el servidor
  useEffect(() => {
    setLocalPhotos(gallery.photos);
  }, [gallery.photos]);

  // Actualizar orden en BD cuando cambia sortOrder o sortDirection
  useEffect(() => {
    // Evitar ejecutar en primer render (solo cuando el usuario hace cambios)
    const initialSortOrder = gallery.sort_order || 'name';
    const initialSortDirection = gallery.sort_direction || 'desc';

    if (sortOrder !== initialSortOrder || sortDirection !== initialSortDirection) {
      console.log(`\n╔═══════════════════════════════════════════════════╗`);
      console.log(`║  🔄 GUARDANDO CAMBIO DE ORDEN EN BD              ║`);
      console.log(`╠═══════════════════════════════════════════════════╣`);
      console.log(`║  Orden: ${sortOrder === 'name' ? 'Por nombre' : 'Por fecha'}`.padEnd(52) + '║');
      if (sortOrder === 'date') {
        console.log(`║  Dirección: ${sortDirection === 'desc' ? 'Más reciente primero ⬇️' : 'Más antigua primero ⬆️'}`.padEnd(52) + '║');
      }
      console.log(`╚═══════════════════════════════════════════════════╝\n`);

      const updateSort = async () => {
        const result = await updateGallerySortOrder(gallery.id, sortOrder, sortDirection);

        if (result.success) {
          console.log(`✅ Orden guardado exitosamente en BD\n`);
        } else {
          console.log(`❌ Error al guardar orden\n`);
          showToast({ message: result.error || 'Error al actualizar orden', type: 'error' });
        }
      };

      updateSort();
    }
  }, [sortOrder, sortDirection]); // Solo ejecutar cuando cambian estos valores
  const { modalState, showModal, closeModal } = useModal();

  // Sensores para drag & drop (desktop + mobile) - CONFIGURACIÓN PROFESIONAL
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Distancia mínima para activar drag (evita clicks accidentales)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Delay corto para mejor respuesta
        tolerance: 5,
      },
    })
  );

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
    show_all_sections,
  } = gallery;

  // Extraer primer número encontrado en el nombre del archivo
  const extractNumber = useCallback((filename) => {
    const match = filename?.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : null;
  }, []);

  // Usar localPhotos para permitir reordenar antes de guardar
  // Memoizar para evitar re-renders innecesarios
  const workingPhotos = useMemo(() => {
    let photos = [...localPhotos];

    // Filtrar por sección
    if (selectedSection) {
      photos = photos.filter(photo => photo.section_id === selectedSection);
    } else {
      photos = [];
    }

    // Ordenar según la opción seleccionada
    if (sortOrder === 'date') {
      const fotosConFecha = photos.filter(p => p.capture_date).length;

      console.log(`\n╔═══════════════════════════════════════════════════╗`);
      console.log(`║  📸 ORDENANDO FOTOS POR FECHA                    ║`);
      console.log(`╠═══════════════════════════════════════════════════╣`);
      console.log(`║  Total fotos: ${photos.length.toString().padEnd(37)}║`);
      console.log(`║  Con fecha: ${fotosConFecha.toString().padEnd(39)}║`);
      console.log(`║  Sin fecha: ${(photos.length - fotosConFecha).toString().padEnd(39)}║`);
      console.log(`║  Dirección: ${sortDirection === 'desc' ? 'Más reciente primero ⬇️' : 'Más antigua primero ⬆️'}`.padEnd(52) + '║');
      console.log(`╚═══════════════════════════════════════════════════╝`);

      // Ordenar por fecha de captura (crear nueva copia para que React detecte el cambio)
      const sorted = [...photos].sort((a, b) => {
        if (!a.capture_date && !b.capture_date) return 0;
        if (!a.capture_date) return 1; // Sin fecha va al final
        if (!b.capture_date) return -1;

        const dateA = new Date(a.capture_date);
        const dateB = new Date(b.capture_date);

        // Aplicar dirección: desc = más reciente primero, asc = más antigua primero
        const result = sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
        return result;
      });

      if (sorted.length > 0) {
        console.log(`\n📌 PRIMERA FOTO: ${sorted[0]?.file_name}`);
        console.log(`   Fecha: ${sorted[0]?.capture_date ? new Date(sorted[0].capture_date).toLocaleString('es-UY') : 'Sin fecha'}`);
        console.log(`\n📌 ÚLTIMA FOTO: ${sorted[sorted.length - 1]?.file_name}`);
        console.log(`   Fecha: ${sorted[sorted.length - 1]?.capture_date ? new Date(sorted[sorted.length - 1].capture_date).toLocaleString('es-UY') : 'Sin fecha'}\n`);
      }

      return sorted;
    } else {
      console.log(`\n╔═══════════════════════════════════════════════════╗`);
      console.log(`║  📸 ORDENANDO FOTOS POR NOMBRE (display_order)   ║`);
      console.log(`╠═══════════════════════════════════════════════════╣`);
      console.log(`║  Total fotos: ${photos.length.toString().padEnd(37)}║`);
      console.log(`╚═══════════════════════════════════════════════════╝\n`);

      // Orden por nombre (display_order - orden guardado en BD)
      return [...photos].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }
  }, [localPhotos, selectedSection, sortOrder, sortDirection]);

  // Memoizar IDs para SortableContext (evita re-inicialización de drag-drop)
  const sortableIds = useMemo(() => workingPhotos.map(p => p.id), [workingPhotos]);

  // Tamaño total de TODAS las fotos (no solo la sección seleccionada)
  const photosSize = localPhotos?.reduce((sum, photo) => sum + (photo.file_size || 0), 0) || 0;
  const totalSize = photosSize + coverImageSize;
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);

  const formattedEventDate = event_date
    ? formatDateWithoutTimezone(event_date, {
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

  // Cargar datos iniciales en paralelo: favoritos, secciones, servicio
  useEffect(() => {
    const loadInitialData = async () => {
      const supabase = createClient();

      // Ejecutar todas las consultas en paralelo
      const [favoritesResult, sectionsResult, serviceResult] = await Promise.all([
        // Favoritos
        supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('gallery_id', id),
        // Secciones
        supabase
          .from('photo_sections')
          .select('*')
          .eq('gallery_id', id)
          .order('display_order', { ascending: true }),
        // Servicio (solo si hay service_type)
        service_type
          ? supabase
              .from('service_types')
              .select('icon_name, name')
              .eq('slug', service_type)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      // Procesar favoritos
      if (!favoritesResult.error) {
        setFavoritesCount(favoritesResult.count || 0);
      } else {
        setFavoritesCount(0);
      }

      // Procesar secciones
      if (!sectionsResult.error) {
        const loadedSections = sectionsResult.data || [];
        setSections(loadedSections);

        // Auto-seleccionar la primera sección
        if (loadedSections.length > 0) {
          setSelectedSection(loadedSections[0].id);
        }
      } else {
        setSections([]);
      }

      // Procesar servicio
      if (serviceResult.data) {
        setServiceIcon(serviceResult.data.icon_name);
        setServiceName(serviceResult.data.name);
      }
    };

    loadInitialData();
  }, [id, service_type]);

  // Auto-asignar fotos sin section_id a la primera sección
  useEffect(() => {
    const autoAssignPhotos = async () => {
      if (sections.length === 0 || localPhotos.length === 0) return;

      const photosWithoutSection = localPhotos.filter(photo => !photo.section_id);

      if (photosWithoutSection.length > 0) {
        try{
          const supabase = createClient();
          const firstSectionId = sections[0].id;

          // Asignar todas las fotos sin sección a la primera sección
          const { error } = await supabase
            .from('photos')
            .update({ section_id: firstSectionId })
            .in('id', photosWithoutSection.map(p => p.id));

          if (!error) {
            // Actualizar localPhotos para reflejar el cambio
            setLocalPhotos(prev => prev.map(photo =>
              photosWithoutSection.some(p => p.id === photo.id)
                ? { ...photo, section_id: firstSectionId }
                : photo
            ));
          }
        } catch (error) {
          // Error en auto-asignación
        }
      }
    };

    autoAssignPhotos();
  }, [sections, localPhotos.length]);

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
      setCoverImageSize(0);
    }
  };

  const handleUploadComplete = async () => {
    // Dar un breve tiempo para que Cloudinary procese las imágenes
    await new Promise(resolve => setTimeout(resolve, 500));

    // Forzar refresh completo de la página
    router.refresh();

    // Si las imágenes aún no cargan, hacer un hard refresh después de 1 segundo
    setTimeout(() => {
      const images = document.querySelectorAll('img[src*="cloudinary"]');
      let allLoaded = true;
      images.forEach(img => {
        if (!img.complete) {
          allLoaded = false;
        }
      });

      if (!allLoaded) {
        router.refresh();
      }
    }, 1000);
  };

  // Manejar toggle de compartir favoritos
  const handleToggleShareFavorites = async () => {
    setIsUpdatingShareSetting(true);
    const newValue = !allowShareFavorites;

    try {
      const result = await updateAllowShareFavorites(id, newValue);

      if (result.success) {
        setAllowShareFavorites(newValue);
        showToast({
          message: newValue
            ? 'Los clientes ahora pueden compartir sus favoritos'
            : 'Se deshabilitó el compartir favoritos',
          type: 'success'
        });
      } else {
        showToast({ message: result.error || 'Error al actualizar configuración', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Error al actualizar configuración', type: 'error' });
    } finally {
      setIsUpdatingShareSetting(false);
    }
  };

  // Handler para cuando cambian las secciones
  const handleSectionsChange = (updatedSections) => {
    setSections(updatedSections);
  };

  // Handler para asignar fotos seleccionadas a una sección
  const handleAssignToSection = async (sectionId) => {
    if (selectedPhotos.size === 0) {
      showModal({
        title: 'Sin fotos seleccionadas',
        message: 'Selecciona al menos una foto para asignar a la sección.',
        type: 'error'
      });
      return;
    }

    try {
      const photoIds = Array.from(selectedPhotos);
      const result = await assignPhotosToSection(photoIds, sectionId);

      if (!result.success) {
        throw new Error(result.error || 'Error al asignar fotos');
      }

      showModal({
        title: '¡Fotos asignadas!',
        message: `${photoIds.length} foto${photoIds.length === 1 ? '' : 's'} asignada${photoIds.length === 1 ? '' : 's'} exitosamente.`,
        type: 'success'
      });

      setSelectedPhotos(new Set());
      setSelectionMode(false);
      router.refresh();
    } catch (error) {
      showModal({
        title: 'Error',
        message: error.message || 'No se pudieron asignar las fotos a la sección.',
        type: 'error'
      });
    }
  };

  // Toggle collapse de bloques
  const toggleBlockCollapse = (blockId) => {
    setCollapsedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  // Manejar inicio de drag
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Manejar cancelación de drag
  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Manejar fin de drag
  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Limpiar activeId
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Encontrar índices en workingPhotos
    const oldIndex = workingPhotos.findIndex((p) => p.id === active.id);
    const newIndex = workingPhotos.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Usar arrayMove para reordenar
    const reorderedPhotos = arrayMove(workingPhotos, oldIndex, newIndex);

    // Actualizar display_order en las fotos reordenadas para mantener el orden
    const reorderedWithOrder = reorderedPhotos.map((photo, index) => ({
      ...photo,
      display_order: index + 1
    }));

    // Reconstruir localPhotos: mantener fotos de otras secciones + fotos reordenadas con nuevo orden
    const photosFromOtherSections = localPhotos.filter(p => p.section_id !== selectedSection);
    const updatedLocalPhotos = [...photosFromOtherSections, ...reorderedWithOrder];

    setLocalPhotos(updatedLocalPhotos);
  };

  // Guardar nuevo orden en BD - OPTIMIZADO con Promise.all
  const saveNewOrder = async () => {
    setSavingOrder(true);

    try {
      const supabase = createClient();

      // Actualizar display_order de fotos de la sección actual
      const updatePromises = workingPhotos.map((photo, index) =>
        supabase
          .from('photos')
          .update({ display_order: index + 1 })
          .eq('id', photo.id)
      );

      // Ejecutar todas las actualizaciones en paralelo
      const results = await Promise.all(updatePromises);

      // Verificar si hubo errores
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Algunas fotos no se pudieron actualizar');
      }

      // Actualizar localPhotos con los nuevos display_order ANTES de salir del modo reordenar
      const updatedPhotos = localPhotos.map(photo => {
        const indexInSection = workingPhotos.findIndex(p => p.id === photo.id);
        if (indexInSection !== -1) {
          return { ...photo, display_order: indexInSection + 1 };
        }
        return photo;
      });
      setLocalPhotos(updatedPhotos);

      showToast({ message: 'Orden guardado correctamente', type: 'success' });

      setPhotosBeforeReorder(null); // Limpiar estado de respaldo
      setReorderMode(false);

    } catch (error) {
      showToast({ message: 'Error al guardar el orden', type: 'error' });
    } finally {
      setSavingOrder(false);
    }
  };

  // Cancelar reordenamiento
  const cancelReorder = () => {
    // Restaurar al estado antes de entrar en modo reordenar (no al original del servidor)
    if (photosBeforeReorder) {
      setLocalPhotos(photosBeforeReorder);
    }
    setPhotosBeforeReorder(null);
    setReorderMode(false);
  };

  // Eliminar galería completa
  const handleDeleteGallery = () => {
    showModal({
      title: '¿Eliminar galería?',
      message: `Esta acción eliminará "${title}" con todas sus ${workingPhotos.length} fotos. No puede deshacerse.`,
      type: 'warning',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: confirmDeleteGallery
    });
  };

  const confirmDeleteGallery = async () => {
    setDeletingGallery(true);

    try {
      // Usar Server Action con atomicidad (todo o nada)
      const result = await deleteGalleries([id]);

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al eliminar galería');
      }

      // Navegación forzada para evitar errores de re-renderizado
      // En lugar de router.replace(), usar window.location para navegación completa
      window.location.href = '/dashboard/galerias';

    } catch (error) {
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
      title: `¿Eliminar ${selectedPhotos.size} ${selectedPhotos.size === 1 ? 'foto' : 'fotos'}?`,
      message: 'Esta acción no puede deshacerse.',
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

      // 1. Eliminar de base de datos primero
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .in('id', Array.from(selectedPhotos));

      if (dbError) throw dbError;

      // 2. Eliminar de Cloudinary en paralelo con Promise.all
      const deletePromises = photosToDelete.map(async (photo) => {
        const publicId = extractPublicIdFromUrl(photo.file_path);
        if (publicId) {
          const result = await deleteCloudinaryImage(publicId);
          return result;
        }
        return { success: true };
      });

      await Promise.all(deletePromises);

      setSelectedPhotos(new Set());
      setSelectionMode(false);
      router.refresh();

    } catch (error) {
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
            await deleteCloudinaryImage(publicId);
          }
        }
      }

      router.refresh();

    } catch (error) {
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
      message: 'La galería quedará sin imagen de portada.',
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
            await deleteCloudinaryImage(publicId);
          }
        }
      }

      router.refresh();

    } catch (error) {
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

  // Sin paginado - mostrar todas las fotos con scroll (lazy loading se encarga del rendimiento)
  const photosToShow = workingPhotos;

  // Si está eliminando, mostrar solo el overlay para evitar flash de 404
  if (deletingGallery) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-3 sm:gap-4 shadow-2xl border border-[#79502A]/30 w-full max-w-sm">
          <Loader2 size={36} className="text-red-600 animate-spin" />
          <p className="font-fira text-sm text-[#2D2D2D] font-medium text-center">
            Eliminando galería...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full max-w-full">
      <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6 overflow-x-hidden">

        {/* Header oscuro */}
        <div className="w-full max-w-full bg-gradient-to-br from-[#2D2D2D] to-[#1a1a1a] text-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8 max-w-full overflow-hidden">

            <button
              onClick={() => router.push('/dashboard/galerias')}
              className="flex items-center gap-2 text-[#C6A97D] hover:text-[#FFF8E2] transition-colors duration-200 font-fira text-sm mb-4"
            >
              <ArrowLeft size={16} />
              <span>Volver</span>
            </button>

            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3 max-w-full">
                    <h1 className="font-voga text-base sm:text-xl md:text-2xl lg:text-3xl break-words max-w-full overflow-hidden text-ellipsis">
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
                    <p className="font-fira text-sm text-[#C6A97D] leading-relaxed mb-3">
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

                <div className="flex gap-2 flex-shrink-0 flex-wrap w-full sm:w-auto max-w-full">
                  <motion.button
                    onClick={() => favoritesCount > 0 && router.push(`/dashboard/galerias/${gallery.id}/favoritos`)}
                    whileHover={favoritesCount > 0 ? { scale: 1.02 } : {}}
                    whileTap={favoritesCount > 0 ? { scale: 0.98 } : {}}
                    disabled={favoritesCount === 0}
                    title={favoritesCount === 0 ? 'No hay favoritas aún' : `Ver ${favoritesCount} favorita${favoritesCount === 1 ? '' : 's'}`}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-200 font-fira text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm ${
                      favoritesCount === 0
                        ? '!text-neutral-500 bg-neutral-800/30 cursor-not-allowed opacity-50'
                        : '!text-pink-300 bg-pink-500/20 hover:bg-pink-500/30 cursor-pointer border border-pink-500/20'
                    }`}
                  >
                    <Heart size={16} className={favoritesCount > 0 ? 'fill-pink-300' : ''} />
                    <span>Favoritas{favoritesCount !== null && favoritesCount > 0 ? ` (${favoritesCount})` : ''}</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setShowShareModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] rounded-lg transition-all duration-200 font-fira text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                  >
                    <Share2 size={14} className="sm:w-4 sm:h-4" />
                    <span>Compartir</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setShowEditModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-[#79502A] hover:bg-[#5a3c1f] rounded-lg transition-all duration-200 font-fira text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                  >
                    <Edit size={14} className="sm:w-4 sm:h-4" />
                    <span>Editar</span>
                  </motion.button>
                  <motion.button
                    onClick={handleDeleteGallery}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 font-fira text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 sm:gap-3 md:gap-4 lg:gap-6 pt-3 sm:pt-4 border-t border-white/10 max-w-full overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="p-2 bg-[#79502A]/20 rounded-lg"
                >
                  <ImageIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#C6A97D]" />
                </motion.div>
                <div>
                  <p className="font-fira text-base sm:text-lg font-semibold text-[#FFF8E2]">{localPhotos.length}</p>
                  <p className="font-fira text-xs text-[#C6A97D]">Fotos</p>
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
                  className="p-2 bg-[#79502A]/20 rounded-lg"
                >
                  <Eye className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#C6A97D]" />
                </motion.div>
                <div>
                  <p className="font-fira text-base sm:text-lg font-semibold text-[#FFF8E2]">
                    {has_active_link ? (views_count || 0) : 'Sin enlace'}
                  </p>
                  <p className="font-fira text-xs text-[#C6A97D]">Vistas</p>
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
                  className="p-2 bg-[#79502A]/20 rounded-lg"
                >
                  <Download className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#C6A97D]" />
                </motion.div>
                <div>
                  <div className="font-fira text-base sm:text-lg font-semibold text-[#FFF8E2]">
                    <GalleryStorageSize galleryId={id} />
                  </div>
                  <p className="font-fira text-xs text-[#C6A97D]">Tamaño</p>
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
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10 max-w-full overflow-hidden">
                <div className="bg-[#fff]/20 border border-[#a27145] rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={12} className="sm:w-3.5 sm:h-3.5 text-[#d5975b] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-fira text-[10px] sm:text-xs font-semibold text-[#d5975b] mb-1">
                        Mensaje para el cliente
                      </p>
                      <p className="font-fira text-xs sm:text-sm text-[#fff] leading-relaxed break-words">
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
        <div className="space-y-6">

          {/* Portada */}
          {cover_image ? (
            <div className="w-full max-w-full bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-4 md:px-6 lg:px-8">
                <div className="relative w-full max-w-3xl mx-auto aspect-[3/2] bg-gray-100 rounded-lg sm:rounded-xl overflow-hidden shadow-md border border-gray-200">
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
                <p className="text-center mt-4 font-fira text-xs text-gray-600 font-light">
                  Imagen de portada de la galería
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-full bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-4 md:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto border-2 border-dashed border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 text-center bg-gray-50">
                  <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3">
                    <ImageIcon size={32} className="text-[#8B5E3C]" />
                  </div>
                  <h3 className="font-fira text-base font-semibold text-gray-900 mb-1">
                    Sin portada
                  </h3>
                  <p className="font-fira text-sm text-gray-600 mb-4">
                    Sube una imagen o selecciona una de la galería
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <label className="flex-1 sm:flex-none px-6 py-3 bg-[#8B5E3C] hover:bg-[#6d4a2f] text-white rounded-lg transition-all duration-200 font-fira text-sm font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm">
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
                        className="flex-1 sm:flex-none px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 rounded-lg transition-all duration-200 font-fira text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Star size={16} />
                        Usar primera foto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Uploader */}
          <div className="w-full max-w-full bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-4 md:px-6 lg:px-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                  <Upload size={16} className="sm:w-5 sm:h-5 text-[#8B5E3C]" />
                </div>
                <h2 className="font-voga text-base sm:text-lg md:text-xl text-gray-900">
                  Subir fotos
                </h2>
              </div>
              <PhotoUploader
                galleryId={id}
                gallerySlug={slug}
                galleryTitle={title}
                sections={sections}
                sortOrder={sortOrder}
                sortDirection={sortDirection}
                existingPhotos={localPhotos}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          </div>

          {/* Grid de fotos con MASONRY */}
          <div className="w-full max-w-full bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-4 md:px-6 lg:px-8 border-b border-gray-200 max-w-full overflow-hidden">
              <div className="flex flex-col gap-3 sm:gap-4 max-w-full">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap max-w-full">
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                      <ImageIcon size={16} className="sm:w-[18px] sm:h-[18px] text-[#8B5E3C]" />
                    </div>
                    <h2 className="font-voga text-base sm:text-lg md:text-xl text-gray-900">
                      {workingPhotos.length} {workingPhotos.length === 1 ? 'foto' : 'fotos'}
                    </h2>
                  </div>

                  {/* Selector de secciones */}
                  {sections.length > 0 && (
                    sections.length <= 3 ? (
                      <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] md:text-xs font-fira font-medium">
                        {sections.map((section, index) => (
                          <div key={section.id} className="flex items-center gap-1 sm:gap-2">
                            {index > 0 && <span className="text-gray-400">\</span>}
                            <button
                              onClick={() => setSelectedSection(section.id)}
                              className={`uppercase tracking-wide transition-colors hover:text-[#8B5E3C] ${
                                selectedSection === section.id ? 'text-gray-900' : 'text-gray-400'
                              }`}
                            >
                              {section.name}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <select
                        value={selectedSection || sections[0]?.id}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="appearance-none px-3 py-1 pr-8 border border-gray-200 rounded-lg font-fira text-xs text-gray-900 focus:outline-none bg-white shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
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

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {!selectionMode && !reorderMode && (
                    <>
                      <button
                        onClick={() => setSelectionMode(true)}
                        className="!text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs md:text-sm font-medium flex items-center gap-1 sm:gap-1.5 md:gap-2 whitespace-nowrap flex-shrink-0 shadow-sm text-white"
                      >
                        <CheckSquare size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                        <span>Seleccionar</span>
                      </button>
                      {workingPhotos.length > 1 && (
                        <button
                          onClick={() => {
                            setPhotosBeforeReorder([...localPhotos]); // Guardar estado actual antes de reordenar
                            setReorderMode(true);
                          }}
                          className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs md:text-sm font-medium flex items-center gap-1 sm:gap-1.5 md:gap-2 whitespace-nowrap flex-shrink-0 shadow-sm text-gray-900"
                        >
                          <GripVertical size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                          <span>Reordenar</span>
                        </button>
                      )}

                      {workingPhotos.length > 1 && (
                        <>
                          <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all duration-200 font-fira !text-[10px] sm:!text-xs md:!text-sm font-medium flex items-center gap-1 sm:gap-1.5 md:gap-2 whitespace-nowrap flex-shrink-0 shadow-sm text-gray-900"
                            style={{ paddingRight: '1.5rem', fontSize: 'inherit' }}
                          >
                            <option value="name">Por nombre</option>
                            <option value="date">Por fecha</option>
                          </select>

                          {sortOrder === 'date' && (
                            <button
                              onClick={() => {
                                console.log(`\n╔═══════════════════════════════════════════════════╗`);
                                console.log(`║  🔄 CAMBIANDO DIRECCIÓN DE ORDENAMIENTO         ║`);
                                console.log(`╠═══════════════════════════════════════════════════╣`);
                                console.log(`║  Anterior: ${sortDirection === 'desc' ? 'Más reciente primero ⬇️' : 'Más antigua primero ⬆️'}`.padEnd(52) + '║');

                                setSortDirection(prev => {
                                  const newDirection = prev === 'desc' ? 'asc' : 'desc';
                                  console.log(`║  Nueva: ${newDirection === 'desc' ? 'Más reciente primero ⬇️' : 'Más antigua primero ⬆️'}`.padEnd(52) + '║');
                                  console.log(`╚═══════════════════════════════════════════════════╝\n`);
                                  return newDirection;
                                });
                              }}
                              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-center whitespace-nowrap flex-shrink-0 shadow-sm text-gray-900"
                              title={sortDirection === 'desc' ? 'Más reciente primero' : 'Más antigua primero'}
                            >
                              {sortDirection === 'desc' ? (
                                <ArrowDown size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                              ) : (
                                <ArrowUp size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                              )}
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => setShowSectionsModal(true)}
                        className="p-1.5 sm:p-2 md:p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-center whitespace-nowrap flex-shrink-0 shadow-sm text-gray-900"
                        title="Gestionar secciones"
                      >
                        <Folder size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      </button>
                    </>
                  )}

                  {selectionMode && (
                    <>
                      <button
                        onClick={toggleSelectAll}
                        className="bg-white border border-gray-200 hover:bg-gray-50 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0 shadow-sm text-gray-900"
                      >
                        {selectedPhotos.size === photosToShow.length ? 'Ninguna' : 'Todas'}
                      </button>

                      {/* Asignar a sección */}
                      {sections.length > 0 && selectedPhotos.size > 0 && (
                        <div className="relative group flex-shrink-0">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignToSection(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap cursor-pointer appearance-none pr-6 sm:pr-7 md:pr-8 shadow-sm text-white"
                            defaultValue=""
                          >
                            <option value="" disabled>Asignar</option>
                            {sections.map(section => (
                              <option key={section.id} value={section.id}>
                                {section.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        onClick={handleDeleteSelected}
                        disabled={selectedPhotos.size === 0 || deletingPhotos}
                        className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs md:text-sm font-medium flex items-center gap-1 sm:gap-1.5 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 shadow-sm text-white"
                      >
                        {deletingPhotos ? (
                          <Loader2 size={10} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 animate-spin" />
                        ) : (
                          <Trash2 size={10} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                        )}
                        {selectedPhotos.size > 0 && `(${selectedPhotos.size})`}
                      </button>
                      <button
                        onClick={() => {
                          setSelectionMode(false);
                          setSelectedPhotos(new Set());
                        }}
                        className="bg-white border border-gray-200 hover:bg-gray-50 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0 shadow-sm text-gray-900"
                      >
                        X
                      </button>
                    </>
                  )}

                  {reorderMode && (
                    <>
                      <button
                        onClick={saveNewOrder}
                        disabled={savingOrder}
                        className="!text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs md:text-sm font-medium flex items-center gap-1 sm:gap-1.5 md:gap-2 disabled:opacity-50 whitespace-nowrap flex-shrink-0 shadow-sm text-white"
                      >
                        {savingOrder ? (
                          <Loader2 size={10} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 animate-spin" />
                        ) : (
                          <CheckSquare size={10} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                        )}
                        <span>OK</span>
                      </button>
                      <button
                        onClick={cancelReorder}
                        disabled={savingOrder}
                        className="bg-white border border-gray-200 hover:bg-gray-50 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs md:text-sm font-medium disabled:opacity-50 whitespace-nowrap flex-shrink-0 shadow-sm text-gray-900"
                      >
                        X
                      </button>
                      <span className="font-fira text-[10px] sm:text-xs text-gray-600 font-light ml-1 hidden sm:inline whitespace-nowrap">
                        Arrastra para ordenar
                      </span>
                    </>
                  )}

                </div>
              </div>
            </div>

            {/* 🎨 MASONRY LAYOUT con Drag & Drop */}
            {workingPhotos.length === 0 ? (
              <div className="py-8 sm:py-12 md:py-16 px-3 sm:px-4 text-center">
                <div className="inline-flex p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
                  <ImageIcon size={32} className="sm:w-12 sm:h-12 text-[#8B5E3C]" />
                </div>
                <p className="font-fira text-xs sm:text-sm text-gray-600 font-light">No hay fotos en esta sección</p>
              </div>
            ) : reorderMode ? (
              /* Modo reordenar: Drag & Drop activo con masonry */
              <div className="px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8 max-w-full overflow-hidden">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <SortableContext
                    items={sortableIds}
                    strategy={rectSortingStrategy}
                  >
                    {/* Masonry layout con orden horizontal */}
                    <Masonry
                      breakpointCols={masonryBreakpoints}
                      className="flex -ml-2 w-auto"
                      columnClassName="pl-2 bg-clip-padding"
                    >
                      {workingPhotos.map((photo, index) => (
                        <div key={`${photo.id}-reorder-${index}`} className="mb-2">
                          <SortablePhoto
                            photo={photo}
                            photoIndex={index}
                            isCover={cover_image === photo.file_path}
                            isReorderMode={true}
                            handleSetAsCover={handleSetAsCover}
                            changingCover={changingCover}
                          />
                        </div>
                      ))}
                    </Masonry>
                  </SortableContext>

                  {/* DragOverlay: Preview flotante durante el drag */}
                  <DragOverlay
                    dropAnimation={{
                      duration: 250,
                      easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                    }}
                  >
                    {activeId ? (
                      <div className="shadow-2xl ring-3 ring-[#79502A] rounded-lg overflow-hidden rotate-2 scale-105">
                        <Image
                          src={getThumbnailUrl(workingPhotos.find(p => p.id === activeId)?.file_path)}
                          alt="Arrastrando"
                          width={150}
                          height={150}
                          className="w-24 h-24 sm:w-28 sm:h-28 object-cover"
                          quality={75}
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            ) : selectionMode ? (
              /* Modo selección: masonry con checkboxes */
              <div className="px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8 max-w-full overflow-hidden">
                <Masonry
                  breakpointCols={masonryBreakpoints}
                  className="flex -ml-2 w-auto"
                  columnClassName="pl-2 bg-clip-padding"
                >
                  {photosToShow.map((photo, index) => {
                    const isSelected = selectedPhotos.has(photo.id);
                    const isCover = cover_image === photo.file_path;

                    return (
                      <div
                        key={`${photo.id}-select-${index}`}
                        onClick={() => togglePhotoSelection(photo.id)}
                        className={`group relative mb-2 max-w-full cursor-pointer transition-all hover:opacity-80 ${
                          isSelected ? 'ring-2 sm:ring-4 ring-[#79502A]' : ''
                        }`}
                      >
                        <div className="relative w-full max-w-full bg-gray-200 overflow-hidden">
                          <Image
                            src={getThumbnailUrl(photo.file_path)}
                            alt={photo.file_name || `Foto ${index + 1}`}
                            width={400}
                            height={400}
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            className="w-full h-auto block"
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0iI2UwZTBlMCIvPjwvc3ZnPg=="
                            style={{ width: '100%', height: 'auto' }}
                          />

                          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10">
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#8B5E3C] border-[#8B5E3C]'
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
                </Masonry>
              </div>
            ) : (
              /* Modo normal: masonry layout con orden horizontal */
              <div className="px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8 max-w-full overflow-hidden">
                <Masonry
                  breakpointCols={masonryBreakpoints}
                  className="flex -ml-2 w-auto"
                  columnClassName="pl-2 bg-clip-padding"
                >
                  {photosToShow.map((photo, index) => (
                    <div key={`${photo.id}-normal-${index}`} className="mb-2">
                      <SortablePhoto
                        photo={photo}
                        photoIndex={index}
                        isCover={cover_image === photo.file_path}
                        isReorderMode={false}
                        handleSetAsCover={handleSetAsCover}
                        changingCover={changingCover}
                        sections={sections}
                      />
                    </div>
                  ))}
                </Masonry>
              </div>
            )}
          </div>

        </div>
      </div>

      {changingCover && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-3 sm:gap-4 shadow-2xl border border-gray-200 w-full max-w-sm">
            <Loader2 size={36} className="text-[#8B5E3C] animate-spin" />
            <p className="font-fira text-sm text-gray-900 font-medium text-center">
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
          onClose={() => {
            setShowEditModal(false);
            router.refresh();
          }}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Modal de Secciones */}
      <AnimatePresence>
        {showSectionsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
              onClick={() => setShowSectionsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-2 sm:inset-x-3 md:inset-x-4 top-1/2 -translate-y-1/2 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 w-auto lg:w-full lg:max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 lg:p-8 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 md:p-2.5 bg-gray-100 rounded-lg sm:rounded-xl">
                    <Folder size={16} className="sm:w-5 sm:h-5 md:w-[22px] md:h-[22px] text-[#8B5E3C]" />
                  </div>
                  <h2 className="font-voga text-base sm:text-lg md:text-xl lg:text-2xl text-gray-900">
                    Gestionar Secciones
                  </h2>
                </div>
                <button
                  onClick={() => setShowSectionsModal(false)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <X size={16} className="sm:w-5 sm:h-5 text-[#8B5E3C]" />
                </button>
              </div>

              {/* Contenido del Modal */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
                <SectionsManager
                  galleryId={id}
                  sections={sections}
                  onSectionsChange={handleSectionsChange}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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