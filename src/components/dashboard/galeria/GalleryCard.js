'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Calendar, Eye, ImageIcon, Globe, Lock, Mail, Share2, 
  MoreVertical, Edit, Trash2, Copy, Heart, Download,
  Briefcase, Sparkles, Check, Archive
} from 'lucide-react';
import ShareGalleryModal from './ShareGalleryModal';
import { iconMap } from '@/lib/validations/gallery';
import { formatDateWithoutTimezone } from '@/lib/date-utils';

/**
 * GalleryCard v3 - Con selección múltiple
 */
export default function GalleryCard({ gallery, serviceTypes, selectionMode, isSelected, onToggleSelect, onPreview }) {
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);

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
    photoCount,
    created_at,
    service_type,
    allow_downloads,
    password,
    download_pin,
    has_active_link,
    favorites_count = 0,
    archived_at,
  } = gallery;

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

  const isNew = (new Date() - new Date(created_at)) < 7 * 24 * 60 * 60 * 1000;
  const displayViews = has_active_link ? (views_count || 0) : 'Sin enlace';
  const isArchived = !!archived_at;

  const serviceData = serviceTypes?.find(s => s.slug === service_type);
  const ServiceIcon = serviceData?.icon_name && iconMap[serviceData.icon_name] 
    ? iconMap[serviceData.icon_name] 
    : Briefcase;

  const handleClick = (e) => {
    // Si está en modo selección, toggle selección
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelect?.();
      return;
    }

    // No navegar si clickeó en botones
    if (e.target.closest('button')) return;
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

  const handlePreview = (e) => {
    e.stopPropagation();
    onPreview?.();
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="group relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] flex flex-col border border-gray-200"
      >
        {/* Imagen de portada */}
        <div className="relative w-full aspect-[4/3] bg-gray-800 overflow-hidden">
          {/* Checkbox de selección - NUEVO */}
          {selectionMode && (
            <div className="absolute top-3 left-3 z-20">
              <button
                onClick={handleClick}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#79502A] border-[#79502A]'
                    : 'bg-white/90 border-white backdrop-blur-sm hover:bg-white'
                }`}
              >
                {isSelected && <Check size={14} className="text-white" />}
              </button>
            </div>
          )}

          {cover_image ? (
            <Image
              src={cover_image}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <ImageIcon size={48} className="text-gray-600" />
            </div>
          )}

          {/* Overlay archivada */}
          {isArchived && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center">
                <Archive size={32} className="text-white/80 mx-auto mb-2" />
                <p className="font-fira text-sm font-semibold text-white">ARCHIVADA</p>
              </div>
            </div>
          )}

          {/* Badges superiores */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-end gap-2">
            <div className="flex flex-wrap gap-1.5 justify-end">
              {/* Badge Archivada */}
              {isArchived && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-fira text-xs font-semibold bg-gray-500/80 text-white backdrop-blur-sm">
                  <Archive size={10} />
                  Archivada
                </span>
              )}

              {/* Badge Nueva */}
              {isNew && !isArchived && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-fira text-xs font-semibold bg-[#79502A] text-white backdrop-blur-sm">
                  <Sparkles size={10} />
                  Nueva
                </span>
              )}

              {/* Badge público/privado */}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full font-fira text-xs font-semibold backdrop-blur-sm ${
                  is_public
                    ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                    : 'bg-white/20 text-white border border-white/30'
                }`}
              >
                {is_public ? <Globe size={10} /> : <Lock size={10} />}
              </span>

              {/* Badge con contraseña */}
              {password && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-fira text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
                  <Lock size={10} />
                  Protegida
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 flex flex-col flex-1">
          {/* Título y tipo de servicio */}
          <div className="mb-2">
            <h3 className="font-voga text-lg text-gray-900 mb-1 truncate group-hover:text-[#8B5E3C] transition-colors duration-200">
              {title}
            </h3>
            {serviceData && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <ServiceIcon size={12} />
                <span className="font-fira text-xs">{serviceData.name}</span>
              </div>
            )}
          </div>

          {/* Descripción */}
          {description && (
            <p className="font-fira text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* Metadata */}
          <div className="space-y-2 mb-4">
            {/* Fecha */}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={12} className="flex-shrink-0" />
              <span className="font-fira text-xs truncate">{formattedDate}</span>
            </div>

            {/* Email */}
            {client_email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={12} className="flex-shrink-0" />
                <span className="font-fira text-xs truncate">{client_email}</span>
              </div>
            )}

            {/* PIN de descarga */}
            {allow_downloads && download_pin && (
              <div className="flex items-center gap-2">
                <Lock size={12} className="flex-shrink-0 text-gray-600" />
                <span className="font-fira text-xs font-semibold text-gray-600">
                  PIN: {download_pin}
                </span>
              </div>
            )}
          </div>

          {/* Spacer - empuja stats y botones abajo */}
          <div className="flex-1"></div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Fotos */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded">
                <ImageIcon size={12} className="text-gray-600" />
              </div>
              <div>
                <p className="font-fira text-sm font-semibold text-gray-900">{photoCount}</p>
                <p className="font-fira text-[10px] text-gray-600">Fotos</p>
              </div>
            </div>

            {/* Vistas */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded">
                <Eye size={12} className="text-gray-600" />
              </div>
              <div>
                <p className="font-fira text-sm font-semibold text-gray-900">{displayViews}</p>
                <p className="font-fira text-[10px] text-gray-600">Vistas</p>
              </div>
            </div>

            {/* Favoritos */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded">
                <Heart size={12} className={favorites_count > 0 ? 'text-pink-400' : 'text-gray-400'} />
              </div>
              <div>
                <p className={`font-fira text-sm font-semibold ${favorites_count > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                  {favorites_count}
                </p>
                <p className="font-fira text-[10px] text-gray-600">Favs</p>
              </div>
            </div>
          </div>

          {/* Acciones - SIEMPRE AL FONDO */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 mt-auto">
            <button
              onClick={handleShare}
              disabled={isArchived}
              className={`!text-white py-2 rounded-lg transition-all duration-200 font-fira text-xs font-semibold flex items-center justify-center gap-1.5 ${
                isArchived
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-[#8B5E3C] hover:bg-[#6d4a2f] text-white'
              }`}
              title={isArchived ? 'No se puede compartir una galería archivada' : 'Compartir'}
            >
              <Share2 size={12} />
            </button>
            <button
              onClick={handleEdit}
              className="py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-all duration-200 font-fira text-xs font-semibold flex items-center justify-center gap-1.5"
              title="Editar"
            >
              <Edit size={12} />
            </button>
            <button
              onClick={handleFavorites}
              disabled={favorites_count === 0}
              className={`py-2 rounded-lg transition-all duration-200 font-fira text-xs font-semibold flex items-center justify-center gap-1.5 ${
                favorites_count > 0
                  ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-600'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              title={favorites_count > 0 ? 'Ver favoritas' : 'Sin favoritas'}
            >
              <Heart size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de compartir */}
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