'use client';

import { Globe, Lock, ImageIcon, Eye, Briefcase, Archive, Heart, Download, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { iconMap } from '@/lib/validations/gallery';

/**
 * GalleriesSidebar - TODOS LOS COLORES UNIFORMES
 * Todos los filtros seleccionados: bg-[#FFF8E2] text-[#79502A] border border-[#C6A97D]
 */
export default function GalleriesSidebar({
  serviceTypes,
  selectedService,
  setSelectedService,
  selectedStatus,
  setSelectedStatus,
  selectedLinkStatus,
  setSelectedLinkStatus,
  selectedArchiveStatus,
  setSelectedArchiveStatus,
  selectedFavorites,
  setSelectedFavorites,
  selectedDownloads,
  setSelectedDownloads,
  selectedYear,
  setSelectedYear,
  availableYears,
  sortBy,
  setSortBy,
  stats,
  selectedViews,
  setSelectedViews,
  selectedPhotos,
  setSelectedPhotos,
  selectedExpiration,
  setSelectedExpiration,
  selectedSmartFilter,
  setSelectedSmartFilter,
}) {
  // Clase uniforme para todos los botones seleccionados
  const selectedClass = 'bg-[#FFF8E2] text-[#79502A] font-semibold border border-[#C6A97D]';
  const unselectedClass = 'hover:bg-gray-100 text-gray-700';

  return (
    <div className="space-y-6">
      {/* ESTADÍSTICAS */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Resumen
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-fira text-sm text-gray-600">Total activas</span>
            <span className="font-fira text-base font-bold text-black">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-fira text-sm text-gray-600 flex items-center gap-1.5">
              <Globe size={12} className="text-green-600" />
              Públicas
            </span>
            <span className="font-fira text-base font-bold text-green-600">{stats.public}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-fira text-sm text-gray-600 flex items-center gap-1.5">
              <Lock size={12} className="text-gray-400" />
              Privadas
            </span>
            <span className="font-fira text-base font-bold text-gray-600">{stats.private}</span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-fira text-sm text-gray-600 flex items-center gap-1.5">
                <ImageIcon size={12} className="text-[#79502A]" />
                Fotos
              </span>
              <span className="font-fira text-base font-bold text-[#79502A]">{stats.totalPhotos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-fira text-sm text-gray-600 flex items-center gap-1.5">
                <Eye size={12} className="text-blue-600" />
                Vistas
              </span>
              <span className="font-fira text-base font-bold text-blue-600">{stats.totalViews}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="font-fira text-sm text-gray-600 flex items-center gap-1.5">
              <Archive size={12} className="text-gray-400" />
              Archivadas
            </span>
            <span className="font-fira text-base font-bold text-gray-600">{stats.archived}</span>
          </div>
        </div>
      </div>

      {/* FILTROS INTELIGENTES */}
      {setSelectedSmartFilter && (
        <div className="bg-gradient-to-br from-[#79502A]/10 to-[#79502A]/5 rounded-xl border border-[#79502A]/20 p-4">
          <h3 className="font-fira text-xs font-semibold text-[#79502A] uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle size={14} />
            Vistas rápidas
          </h3>
          <div className="space-y-2">
            <button onClick={() => setSelectedSmartFilter('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedSmartFilter === 'all' ? selectedClass : unselectedClass}`}>
              Todas
            </button>
            <button onClick={() => setSelectedSmartFilter('pending-share')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm flex items-center gap-2 ${selectedSmartFilter === 'pending-share' ? selectedClass : unselectedClass}`}>
              <Clock size={14} />
              Pendientes de compartir
            </button>
            <button onClick={() => setSelectedSmartFilter('no-activity')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm flex items-center gap-2 ${selectedSmartFilter === 'no-activity' ? selectedClass : unselectedClass}`}>
              <AlertCircle size={14} />
              Sin actividad
            </button>
            <button onClick={() => setSelectedSmartFilter('needs-attention')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm flex items-center gap-2 ${selectedSmartFilter === 'needs-attention' ? selectedClass : unselectedClass}`}>
              <AlertCircle size={14} />
              Requieren atención
            </button>
            <button onClick={() => setSelectedSmartFilter('complete')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm flex items-center gap-2 ${selectedSmartFilter === 'complete' ? selectedClass : unselectedClass}`}>
              <CheckCircle size={14} />
              Completas
            </button>
          </div>
        </div>
      )}

      {/* FILTRO POR ARCHIVO */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Archivo
        </h3>
        <div className="space-y-2">
          <button onClick={() => setSelectedArchiveStatus('active')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedArchiveStatus === 'active' ? selectedClass : unselectedClass}`}>
            Activas
          </button>
          <button onClick={() => setSelectedArchiveStatus('archived')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm flex items-center gap-2 ${selectedArchiveStatus === 'archived' ? selectedClass : unselectedClass}`}>
            <Archive size={14} />
            Archivadas ({stats.archived})
          </button>
          <button onClick={() => setSelectedArchiveStatus('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedArchiveStatus === 'all' ? selectedClass : unselectedClass}`}>
            Todas
          </button>
        </div>
      </div>

      {/* FILTRO POR VISTAS */}
      {setSelectedViews && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye size={14} />
            Vistas
          </h3>
          <div className="space-y-2">
            <button onClick={() => setSelectedViews('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedViews === 'all' ? selectedClass : unselectedClass}`}>
              Todas
            </button>
            <button onClick={() => setSelectedViews('none')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedViews === 'none' ? selectedClass : unselectedClass}`}>
              Sin vistas (0)
            </button>
            <button onClick={() => setSelectedViews('low')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedViews === 'low' ? selectedClass : unselectedClass}`}>
              Pocas vistas (1-9)
            </button>
            <button onClick={() => setSelectedViews('medium')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedViews === 'medium' ? selectedClass : unselectedClass}`}>
              Con actividad (10-49)
            </button>
            <button onClick={() => setSelectedViews('high')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedViews === 'high' ? selectedClass : unselectedClass}`}>
              Populares (≥50)
            </button>
          </div>
        </div>
      )}

      {/* FILTRO POR CANTIDAD DE FOTOS */}
      {setSelectedPhotos && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ImageIcon size={14} />
            Cantidad de fotos
          </h3>
          <div className="space-y-2">
            <button onClick={() => setSelectedPhotos('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedPhotos === 'all' ? selectedClass : unselectedClass}`}>
              Todas
            </button>
            <button onClick={() => setSelectedPhotos('empty')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedPhotos === 'empty' ? selectedClass : unselectedClass}`}>
              Vacías (0)
            </button>
            <button onClick={() => setSelectedPhotos('small')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedPhotos === 'small' ? selectedClass : unselectedClass}`}>
              Pequeñas (1-20)
            </button>
            <button onClick={() => setSelectedPhotos('medium')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedPhotos === 'medium' ? selectedClass : unselectedClass}`}>
              Medianas (21-100)
            </button>
            <button onClick={() => setSelectedPhotos('large')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedPhotos === 'large' ? selectedClass : unselectedClass}`}>
              Grandes (&gt;100)
            </button>
          </div>
        </div>
      )}

      {/* FILTRO POR VENCIMIENTO */}
      {setSelectedExpiration && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar size={14} />
            Vencimiento
          </h3>
          <div className="space-y-2">
            <button onClick={() => setSelectedExpiration('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedExpiration === 'all' ? selectedClass : unselectedClass}`}>
              Todas
            </button>
            <button onClick={() => setSelectedExpiration('never')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedExpiration === 'never' ? selectedClass : unselectedClass}`}>
              Sin vencimiento
            </button>
            <button onClick={() => setSelectedExpiration('soon')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedExpiration === 'soon' ? selectedClass : unselectedClass}`}>
              Vence pronto (&lt;7 días)
            </button>
            <button onClick={() => setSelectedExpiration('expired')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedExpiration === 'expired' ? selectedClass : unselectedClass}`}>
              Ya vencidas
            </button>
          </div>
        </div>
      )}

      {/* FILTRO POR SERVICIO */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Tipo de servicio
        </h3>
        <div className="space-y-2">
          <button onClick={() => setSelectedService('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedService === 'all' ? selectedClass : unselectedClass}`}>
            Todos
          </button>
          {serviceTypes.map((service) => {
            const Icon = iconMap[service.icon_name] || Briefcase;
            return (
              <button key={service.slug} onClick={() => setSelectedService(service.slug)} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm flex items-center gap-2 ${selectedService === service.slug ? selectedClass : unselectedClass}`}>
                <Icon size={14} />
                {service.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTRO POR ESTADO */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Estado
        </h3>
        <div className="space-y-2">
          <button onClick={() => setSelectedStatus('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedStatus === 'all' ? selectedClass : unselectedClass}`}>
            Todas
          </button>
          <button onClick={() => setSelectedStatus('public')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm flex items-center gap-2 ${selectedStatus === 'public' ? selectedClass : unselectedClass}`}>
            <Globe size={14} />
            Públicas
          </button>
          <button onClick={() => setSelectedStatus('private')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm flex items-center gap-2 ${selectedStatus === 'private' ? selectedClass : unselectedClass}`}>
            <Lock size={14} />
            Privadas
          </button>
        </div>
      </div>

      {/* FILTRO POR ESTADO DEL ENLACE */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Estado del enlace
        </h3>
        <div className="space-y-2">
          <button onClick={() => setSelectedLinkStatus('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedLinkStatus === 'all' ? selectedClass : unselectedClass}`}>
            Todos
          </button>
          <button onClick={() => setSelectedLinkStatus('active')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedLinkStatus === 'active' ? selectedClass : unselectedClass}`}>
            Con enlace activo
          </button>
          <button onClick={() => setSelectedLinkStatus('expired')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedLinkStatus === 'expired' ? selectedClass : unselectedClass}`}>
            Enlace expirado
          </button>
          <button onClick={() => setSelectedLinkStatus('none')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedLinkStatus === 'none' ? selectedClass : unselectedClass}`}>
            Sin enlace
          </button>
        </div>
      </div>

      {/* FILTRO POR FAVORITOS */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Heart size={14} />
          Favoritos
        </h3>
        <div className="space-y-2">
          <button onClick={() => setSelectedFavorites('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedFavorites === 'all' ? selectedClass : unselectedClass}`}>
            Todas
          </button>
          <button onClick={() => setSelectedFavorites('with')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedFavorites === 'with' ? selectedClass : unselectedClass}`}>
            Con favoritos
          </button>
          <button onClick={() => setSelectedFavorites('without')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedFavorites === 'without' ? selectedClass : unselectedClass}`}>
            Sin favoritos
          </button>
        </div>
      </div>

      {/* FILTRO POR DESCARGAS */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Download size={14} />
          Descargas
        </h3>
        <div className="space-y-2">
          <button onClick={() => setSelectedDownloads('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedDownloads === 'all' ? selectedClass : unselectedClass}`}>
            Todas
          </button>
          <button onClick={() => setSelectedDownloads('enabled')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedDownloads === 'enabled' ? selectedClass : unselectedClass}`}>
            Descargas permitidas
          </button>
          <button onClick={() => setSelectedDownloads('disabled')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedDownloads === 'disabled' ? selectedClass : unselectedClass}`}>
            Descargas deshabilitadas
          </button>
        </div>
      </div>

      {/* FILTRO POR AÑO */}
      {availableYears.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Año
          </h3>
          <div className="space-y-2">
            <button onClick={() => setSelectedYear('all')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedYear === 'all' ? selectedClass : unselectedClass}`}>
              Todos los años
            </button>
            {availableYears.map((year) => (
              <button key={year} onClick={() => setSelectedYear(year.toString())} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${selectedYear === year.toString() ? selectedClass : unselectedClass}`}>
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ORDENAMIENTO */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-fira text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Ordenar por
        </h3>
        <div className="space-y-2">
          <button onClick={() => setSortBy('newest')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${sortBy === 'newest' ? selectedClass : unselectedClass}`}>
            Más recientes
          </button>
          <button onClick={() => setSortBy('oldest')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${sortBy === 'oldest' ? selectedClass : unselectedClass}`}>
            Más antiguas
          </button>
          <button onClick={() => setSortBy('most-viewed')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${sortBy === 'most-viewed' ? selectedClass : unselectedClass}`}>
            Más vistas
          </button>
          <button onClick={() => setSortBy('most-photos')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${sortBy === 'most-photos' ? selectedClass : unselectedClass}`}>
            Más fotos
          </button>
          <button onClick={() => setSortBy('alphabetical')} className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-fira text-sm ${sortBy === 'alphabetical' ? selectedClass : unselectedClass}`}>
            A → Z
          </button>
        </div>
      </div>
    </div>
  );
}