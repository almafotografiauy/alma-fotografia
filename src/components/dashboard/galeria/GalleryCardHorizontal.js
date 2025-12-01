'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Calendar, Eye, ImageIcon, Globe, Lock, Mail, ChevronRight, 
  Share2, Edit, Heart, Briefcase, Check, Archive 
} from 'lucide-react';
import ShareGalleryModal from './ShareGalleryModal';
import { iconMap } from '@/lib/validations/gallery';
import { formatDateWithoutTimezone } from '@/lib/date-utils';

/**
 * ============================================
 * GALLERY CARD HORIZONTAL - Mobile First
 * ============================================
 * 
 * Card horizontal optimizada para móvil y responsive.
 * 
 * BREAKPOINTS:
 * - Mobile (< 640px): Foto 96px izquierda, info compacta derecha
 * - Tablet (640-1024px): Foto 112px, más info visible
 * - Desktop (> 1024px): Foto 128px, layout completo
 * 
 * FEATURES:
 * - Selección múltiple con checkbox
 * - Preview rápido
 * - Share, edit y favoritos
 * - Badge de estado archivado
 * - Optimización de imágenes con next/image
 * 
 * @param {Object} gallery - Datos de la galería
 * @param {Array} serviceTypes - Tipos de servicio disponibles
 * @param {boolean} selectionMode - Modo selección activo
 * @param {boolean} isSelected - Si está seleccionada
 * @param {Function} onToggleSelect - Callback toggle selección
 * @param {Function} onPreview - Callback preview modal
 */
export default function GalleryCardHorizontal({ 
  gallery, 
  serviceTypes, 
  selectionMode, 
  isSelected, 
  onToggleSelect, 
  onPreview 
}) {
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);

  // ==========================================
  // Desestructurar datos de la galería
  // ==========================================
  
  const {
    id,
    slug,
    title,
    event_date,
    client_email,
    cover_image,
    is_public,
    views_count,
    photoCount,
    created_at,
    has_active_link,
    favorites_count = 0,
    service_type,
    allow_downloads,
    download_pin,
    archived_at,
  } = gallery;

  // ==========================================
  // Formatear fecha
  // ==========================================
  
  const formattedDate = event_date
    ? formatDateWithoutTimezone(event_date, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date(created_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  // ==========================================
  // Estado derivado
  // ==========================================
  
  const displayViews = has_active_link ? (views_count || 0) : 'Sin enlace';
  const isArchived = !!archived_at;

  const serviceData = serviceTypes?.find(s => s.slug === service_type);
  const ServiceIcon = serviceData?.icon_name && iconMap[serviceData.icon_name] 
    ? iconMap[serviceData.icon_name] 
    : Briefcase;

  // ==========================================
  // Handlers
  // ==========================================
  
  const handleClick = (e) => {
    // Modo selección: toggle checkbox
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelect?.();
      return;
    }

    // No navegar si clickeó botones
    if (e.target.closest('button')) return;
    
    // Navegar a detalle
    router.push(`/dashboard/galerias/${id}`);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleCloseShare = () => {
    setShowShareModal(false);
    router.refresh();
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    router.push(`/dashboard/galerias/${id}`);
  };

  const handleFavorites = (e) => {
    e.stopPropagation();
    if (favorites_count > 0) {
      router.push(`/dashboard/galerias/${id}/favoritos`);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <div
        onClick={handleClick}
        className="group bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.01] flex flex-row min-h-[140px] border border-gray-200"
      >
        {/* ============================================ */}
        {/* IMAGEN - Izquierda */}
        {/* Mobile: 96px | Tablet: 112px | Desktop: 128px */}
        {/* ============================================ */}
        
        <div className="relative w-24 sm:w-28 md:w-32 flex-shrink-0 bg-gray-800">
          {/* Checkbox selección */}
          {selectionMode && (
            <div className="absolute top-2 left-2 z-20">
              <button
                onClick={handleClick}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-[#79502A] border-[#79502A]'
                    : 'bg-white/90 border-white backdrop-blur-sm hover:bg-white'
                }`}
                aria-label={isSelected ? 'Deseleccionar galería' : 'Seleccionar galería'}
              >
                {isSelected && <Check size={10} className="sm:w-3 sm:h-3 text-white" />}
              </button>
            </div>
          )}

          {/* Imagen con optimización */}
          {cover_image ? (
            <Image
              src={cover_image}
              alt={`Portada de ${title}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
              priority={false}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <ImageIcon size={20} className="sm:w-6 sm:h-6 text-gray-600" />
            </div>
          )}

          {/* Overlay archivada */}
          {isArchived && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
              <Archive size={16} className="sm:w-5 sm:h-5 text-white/80" />
            </div>
          )}

          {/* Badge estado - Solo desktop */}
          <div className="hidden sm:flex absolute top-2 right-2 gap-1">
            {isArchived && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-fira text-[8px] font-semibold bg-gray-500/80 text-white backdrop-blur-sm">
                <Archive size={8} />
              </span>
            )}
            <span
              className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full font-fira text-[8px] font-semibold backdrop-blur-sm ${
                is_public
                  ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                  : 'bg-white/20 text-white border border-white/30'
              }`}
            >
              {is_public ? <Globe size={8} /> : <Lock size={8} />}
            </span>
          </div>
        </div>

        {/* ============================================ */}
        {/* CONTENIDO - Derecha */}
        {/* ============================================ */}
        
        <div className="flex-1 p-2.5 sm:p-3 md:p-4 flex flex-col justify-between min-w-0">
          {/* Header compacto */}
          <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
            <div className="flex-1 min-w-0">
              {/* Título */}
              <h3 className="font-voga text-sm sm:text-base md:text-lg text-gray-900 truncate group-hover:text-[#8B5E3C] transition-colors duration-200">
                {title}
              </h3>

              {/* Servicio + Fecha - Solo móvil */}
              <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                {serviceData && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <ServiceIcon size={10} />
                    <span className="font-fira text-[10px] font-medium truncate max-w-[80px]">
                      {serviceData.name}
                    </span>
                  </div>
                )}
                <span className="text-gray-400">•</span>
                <span className="font-fira text-[10px] text-gray-600 truncate">
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Badge estado - Solo móvil */}
            <div className="flex sm:hidden gap-0.5 flex-shrink-0">
              {isArchived && (
                <span className="inline-flex p-0.5 rounded-full bg-gray-500/80">
                  <Archive size={10} className="text-white" />
                </span>
              )}
              <span
                className={`inline-flex p-0.5 rounded-full ${
                  is_public ? 'bg-green-500/20' : 'bg-white/20'
                }`}
              >
                {is_public ? (
                  <Globe size={10} className="text-green-300" />
                ) : (
                  <Lock size={10} className="text-white" />
                )}
              </span>
            </div>

            {/* Flecha - Solo desktop */}
            <ChevronRight
              size={16}
              className="hidden sm:block text-gray-400 group-hover:text-[#8B5E3C] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0"
            />
          </div>

          {/* Metadata - Solo desktop */}
          <div className="hidden sm:flex flex-col gap-1 mb-2">
            {serviceData && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <ServiceIcon size={12} />
                <span className="font-fira text-xs font-semibold truncate">
                  {serviceData.name}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar size={10} />
              <span className="font-fira text-[10px] sm:text-xs truncate">
                {formattedDate}
              </span>
            </div>

            {client_email && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Mail size={10} />
                <span className="font-fira text-[10px] sm:text-xs truncate">
                  {client_email}
                </span>
              </div>
            )}

            {allow_downloads && download_pin && (
              <div className="flex items-center gap-1.5">
                <Lock size={10} className="text-gray-600" />
                <span className="font-fira text-[10px] sm:text-xs font-semibold text-gray-600">
                  PIN: {download_pin}
                </span>
              </div>
            )}
          </div>

          {/* Stats compactas */}
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            {/* Fotos */}
            <div className="flex items-center gap-1">
              <div className="p-0.5 sm:p-1 bg-gray-100 rounded">
                <ImageIcon size={10} className="sm:w-3 sm:h-3 text-gray-600" />
              </div>
              <span className="font-fira text-[10px] sm:text-xs font-semibold text-gray-900">
                {photoCount}
              </span>
            </div>

            {/* Vistas */}
            <div className="flex items-center gap-1">
              <div className="p-0.5 sm:p-1 bg-gray-100 rounded">
                <Eye size={10} className="sm:w-3 sm:h-3 text-gray-600" />
              </div>
              <span className="font-fira text-[10px] sm:text-xs font-semibold text-gray-900">
                {displayViews}
              </span>
            </div>

            {/* Favoritos */}
            <div className="flex items-center gap-1">
              <div className="p-0.5 sm:p-1 bg-gray-100 rounded">
                <Heart
                  size={10}
                  className={`sm:w-3 sm:h-3 ${
                    favorites_count > 0 ? 'text-pink-400' : 'text-gray-400'
                  }`}
                />
              </div>
              <span
                className={`font-fira text-[10px] sm:text-xs font-semibold ${
                  favorites_count > 0 ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {favorites_count}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {/* Compartir */}
            <button
              onClick={handleShare}
              disabled={isArchived}
              className={`py-1 sm:py-1.5 md:py-2 rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 ${
                isArchived
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-[#8B5E3C] hover:bg-[#6d4a2f] text-white'
              }`}
              aria-label="Compartir"
            >
              <Share2 size={10} className="sm:w-3 sm:h-3" />
            </button>

            {/* Editar */}
            <button
              onClick={handleEdit}
              className="py-1 sm:py-1.5 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1"
              aria-label="Editar"
            >
              <Edit size={10} className="sm:w-3 sm:h-3" />
            </button>

            {/* Favoritos */}
            <button
              onClick={handleFavorites}
              disabled={favorites_count === 0}
              className={`py-1 sm:py-1.5 md:py-2 rounded-lg transition-all duration-200 font-fira text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 ${
                favorites_count > 0
                  ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-600'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Ver favoritas"
            >
              <Heart size={10} className="sm:w-3 sm:h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal compartir */}
      {showShareModal && (
        <ShareGalleryModal
          galleryId={id}
          gallerySlug={slug}
          onClose={handleCloseShare}
        />
      )}
    </>
  );
}