'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { archiveGalleries, deleteGalleries, restoreGalleries } from '@/app/actions/gallery-actions';
import {
  Search, Grid3x3, List, X, ImageIcon, Trash2, Archive,
  CheckSquare, ArchiveRestore, SlidersHorizontal
} from 'lucide-react';
import GalleryCard from './GalleryCard';
import GalleryCardHorizontal from './GalleryCardHorizontal';
import CreateGalleryCard from './CreateGalleryCard';
import GalleriesSidebar from './GalleriesSidebar';
import GalleryPreviewModal from './GalleryPreviewModal';
import ShareGalleryModal from './ShareGalleryModal';
import ConfirmModal from './ConfirmModal';

/**
 * ============================================
 * GALLERIES VIEW - Vista principal de galerías
 * ============================================
 * 
 * Gestiona la visualización y acciones de galerías.
 * 
 * FEATURES:
 * - Filtros avanzados (servicio, estado, enlaces, archivo)
 * - Búsqueda en tiempo real
 * - Selección múltiple con acciones batch
 * - Vista grid y list (desktop)
 * - Cards horizontales (mobile)
 * - Sidebar de filtros
 * - Modales de confirmación
 * 
 * VERSIÓN: v5 - Corregida con Links funcionales
 */
export default function GalleriesView({ galleries, serviceTypes }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLinkStatus, setSelectedLinkStatus] = useState('all');
  const [selectedArchiveStatus, setSelectedArchiveStatus] = useState('active');
  const [selectedFavorites, setSelectedFavorites] = useState('all');
  const [selectedDownloads, setSelectedDownloads] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  
  // Selección múltiple
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedGalleries, setSelectedGalleries] = useState(new Set());
  
  // Modals y sidebar
  const [previewGallery, setPreviewGallery] = useState(null);
  const [shareGallery, setShareGallery] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Modales de confirmación
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Refs para prevenir dobles llamadas (useRef persiste durante Fast Refresh)
  const isArchivingRef = useRef(false);
  const isRestoringRef = useRef(false);
  const isDeletingRef = useRef(false);

  // Filtrar galerías
  const filteredGalleries = useMemo(() => {
    let result = [...galleries];

    if (selectedArchiveStatus === 'active') {
      result = result.filter(g => !g.archived_at);
    } else if (selectedArchiveStatus === 'archived') {
      result = result.filter(g => g.archived_at);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          g.client_email?.toLowerCase().includes(query) ||
          g.description?.toLowerCase().includes(query)
      );
    }

    if (selectedService !== 'all') {
      result = result.filter((g) => g.service_type === selectedService);
    }

    if (selectedStatus !== 'all') {
      result = result.filter((g) =>
        selectedStatus === 'public' ? g.is_public : !g.is_public
      );
    }

    if (selectedLinkStatus !== 'all') {
      result = result.filter((g) => {
        if (selectedLinkStatus === 'active') return g.has_active_link;
        if (selectedLinkStatus === 'expired') return g.has_expired_link;
        if (selectedLinkStatus === 'none') return !g.has_active_link && !g.has_expired_link;
        return true;
      });
    }

    if (selectedFavorites !== 'all') {
      result = result.filter((g) => {
        if (selectedFavorites === 'with') return g.favorites_count > 0;
        if (selectedFavorites === 'without') return !g.favorites_count || g.favorites_count === 0;
        return true;
      });
    }

    if (selectedDownloads !== 'all') {
      result = result.filter((g) =>
        selectedDownloads === 'enabled' ? g.allow_downloads : !g.allow_downloads
      );
    }

    if (selectedYear !== 'all') {
      result = result.filter((g) => {
        const year = new Date(g.event_date || g.created_at).getFullYear().toString();
        return year === selectedYear;
      });
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'most-viewed':
        result.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        break;
      case 'most-photos':
        result.sort((a, b) => b.photoCount - a.photoCount);
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [galleries, searchQuery, selectedService, selectedStatus, selectedLinkStatus, selectedArchiveStatus, selectedFavorites, selectedDownloads, selectedYear, sortBy]);

  const stats = useMemo(() => {
    const activeGalleries = galleries.filter(g => !g.archived_at);
    return {
      total: activeGalleries.length,
      public: activeGalleries.filter((g) => g.is_public).length,
      private: activeGalleries.filter((g) => !g.is_public).length,
      totalPhotos: activeGalleries.reduce((sum, g) => sum + g.photoCount, 0),
      totalViews: activeGalleries.reduce((sum, g) => sum + (g.views_count || 0), 0),
      archived: galleries.filter(g => g.archived_at).length,
    };
  }, [galleries]);

  const hasActiveFilters = 
    searchQuery || 
    selectedService !== 'all' || 
    selectedStatus !== 'all' ||
    selectedLinkStatus !== 'all' ||
    selectedArchiveStatus !== 'active' ||
    selectedFavorites !== 'all' ||
    selectedDownloads !== 'all' ||
    selectedYear !== 'all' ||
    sortBy !== 'newest';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedService('all');
    setSelectedStatus('all');
    setSelectedLinkStatus('all');
    setSelectedArchiveStatus('active');
    setSelectedFavorites('all');
    setSelectedDownloads('all');
    setSelectedYear('all');
    setSortBy('newest');
  };

  const toggleSelection = (galleryId) => {
    setSelectedGalleries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(galleryId)) {
        newSet.delete(galleryId);
      } else {
        newSet.add(galleryId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedGalleries.size === filteredGalleries.length) {
      setSelectedGalleries(new Set());
    } else {
      setSelectedGalleries(new Set(filteredGalleries.map(g => g.id)));
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedGalleries(new Set());
  };

  const selectedGalleriesData = useMemo(() => {
    const ids = Array.from(selectedGalleries);
    const data = filteredGalleries.filter(g => ids.includes(g.id));
    const hasArchived = data.some(g => g.archived_at);
    const hasActive = data.some(g => !g.archived_at);
    return { hasArchived, hasActive, hasMixed: hasArchived && hasActive };
  }, [selectedGalleries, filteredGalleries]);

  const handleBatchArchive = async () => {
    if (isArchivingRef.current) {
      return;
    }

    isArchivingRef.current = true;

    try {
      const ids = Array.from(selectedGalleries);
      const result = await archiveGalleries(ids);

      if (result.success) {
        setSelectedGalleries(new Set());
        setSelectionMode(false);
        router.refresh();
      } else {
        console.error('[handleBatchArchive] Error:', result.error);
        alert('Error al archivar galerías: ' + result.error);
      }
    } finally {
      isArchivingRef.current = false;
    }
  };

  const handleBatchRestore = async () => {
    if (isRestoringRef.current) {
      return;
    }

    isRestoringRef.current = true;

    try {
      const ids = Array.from(selectedGalleries);
      const result = await restoreGalleries(ids);

      if (result.success) {
        setSelectedGalleries(new Set());
        setSelectionMode(false);
        router.refresh();
      } else {
        console.error('[handleBatchRestore] Error:', result.error);
        alert('Error al restaurar galerías: ' + result.error);
      }
    } finally {
      isRestoringRef.current = false;
    }
  };

  const handleBatchDelete = async () => {
    if (isDeletingRef.current) {
      return;
    }

    isDeletingRef.current = true;

    try {
      const ids = Array.from(selectedGalleries);
      const result = await deleteGalleries(ids);

      if (result.success) {
        setSelectedGalleries(new Set());
        setSelectionMode(false);
        router.refresh();
      } else {
        console.error('[handleBatchDelete] Error:', result.error);
        alert('Error al eliminar galerías: ' + result.error);
      }
    } finally {
      isDeletingRef.current = false;
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set();
    galleries.forEach(g => {
      const year = new Date(g.event_date || g.created_at).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [galleries]);

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por título, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg font-fira text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
              />
            </div>

            <button 
              onClick={() => setShowSidebar(true)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-fira text-sm font-medium text-gray-700 flex items-center justify-center gap-2"
            >
              <SlidersHorizontal size={16} />
              <span>Filtros</span>
            </button>

            <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid3x3 size={16} className="text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="font-fira text-xs text-gray-500">Filtros:</span>
              
              {searchQuery && (
                <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-fira text-xs font-medium flex items-center gap-1">
                  <span>"{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')}><X size={12} /></button>
                </div>
              )}

              {selectedArchiveStatus === 'archived' && (
                <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-fira text-xs font-medium flex items-center gap-1">
                  <Archive size={10} />
                  <span>Archivadas</span>
                  <button onClick={() => setSelectedArchiveStatus('active')}><X size={12} /></button>
                </div>
              )}

              <button
                onClick={clearFilters}
                className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full font-fira text-xs font-medium flex items-center gap-1"
              >
                <X size={12} />
                Limpiar
              </button>
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="font-fira text-sm text-gray-600">
            {filteredGalleries.length === 0
              ? 'No hay galerías'
              : filteredGalleries.length === 1
              ? '1 galería'
              : `${filteredGalleries.length} galerías`}
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!selectionMode ? (
              <button
                onClick={() => setSelectionMode(true)}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-fira text-sm font-medium text-gray-700 flex items-center justify-center gap-2"
              >
                <CheckSquare size={16} />
                <span>Seleccionar</span>
              </button>
            ) : (
              <>
                <span className="font-fira text-sm text-gray-600 flex-1 sm:flex-none">
                  {selectedGalleries.size} seleccionadas
                </span>
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-fira text-xs font-medium text-gray-700"
                >
                  {selectedGalleries.size === filteredGalleries.length ? 'Ninguna' : 'Todas'}
                </button>
                <button
                  onClick={cancelSelection}
                  className="px-3 py-2 hover:bg-gray-100 rounded-lg font-fira text-xs font-medium text-gray-700"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {selectionMode && selectedGalleries.size > 0 && (
          <div className="sticky top-0 z-20 mb-4 p-4 bg-[#2d2d2d] border-[#C6A97D] border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <span className="font-fira text-sm font-semibold text-white">
              {selectedGalleries.size} {selectedGalleries.size === 1 ? 'galería seleccionada' : 'galerías seleccionadas'}
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              {selectedGalleriesData.hasMixed ? (
                <button 
                  disabled
                  className="flex-1 sm:flex-none px-4 py-2 bg-white/10 text-white/40 rounded-lg font-fira text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                  title="No puedes archivar y desarchivar al mismo tiempo"
                >
                  <Archive size={16} />
                  <span>Mezcladas</span>
                </button>
              ) : selectedGalleriesData.hasArchived ? (
                <button 
                  onClick={() => setShowRestoreModal(true)}
                  className="flex-1 sm:flex-none px-4 !text-white  py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-fira text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <ArchiveRestore size={16} />
                  <span>Desarchivar</span>
                </button>
              ) : (
                <button 
                  onClick={() => setShowArchiveModal(true)}
                  className="!text-white flex-1 sm:flex-none px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-fira text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Archive size={16} />
                  <span>Archivar</span>
                </button>
              )}

              <button 
                onClick={() => setShowDeleteModal(true)}
                className="!text-white flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-fira text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        )}

        {viewMode === 'grid' ? (
          <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <CreateGalleryCard />
            
            {filteredGalleries.map((gallery) => (
              <GalleryCard 
                key={gallery.id} 
                gallery={gallery} 
                serviceTypes={serviceTypes}
                selectionMode={selectionMode}
                isSelected={selectedGalleries.has(gallery.id)}
                onToggleSelect={() => toggleSelection(gallery.id)}
                onPreview={() => setPreviewGallery(gallery)}
              />
            ))}

            {filteredGalleries.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center min-h-[40vh] p-12">
                <Search size={32} className="text-gray-400 mb-4" />
                <h3 className="font-voga text-xl text-black mb-2">No se encontraron galerías</h3>
                <p className="font-fira text-sm text-gray-600">
                  {hasActiveFilters ? 'Intenta ajustar los filtros' : ''}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:block space-y-4">
            <Link href="/dashboard/galerias/new">
              <div className="bg-[#2d2d2d] mb-4 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 active:scale-[0.99]">
                <div className="flex items-center gap-3 text-white">
                  <ImageIcon size={20} className="text-[#caad81]" />
                  <p className="font-fira text-sm font-semibold">Crear nueva galería</p>
                </div>
              </div>
            </Link>

            {filteredGalleries.map((gallery) => (
              <GalleryCardHorizontal 
                key={gallery.id} 
                gallery={gallery} 
                serviceTypes={serviceTypes}
                selectionMode={selectionMode}
                isSelected={selectedGalleries.has(gallery.id)}
                onToggleSelect={() => toggleSelection(gallery.id)}
                onPreview={() => setPreviewGallery(gallery)}
              />
            ))}

            {filteredGalleries.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-xl border border-gray-200 p-12">
                <Search size={32} className="text-gray-400 mb-4" />
                <h3 className="font-voga text-xl text-black mb-2">No se encontraron galerías</h3>
                <p className="font-fira text-sm text-gray-600">
                  {hasActiveFilters ? 'Intenta ajustar los filtros' : ''}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="lg:hidden space-y-4">
          <Link href="/dashboard/galerias/new" className="block mb-4">
            <div className="bg-[#2d2d2d] rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-all duration-300">
              <div className="flex items-center justify-center gap-2 text-white">
                <ImageIcon size={16} className="text-[#caad81]" />
                <p className="font-fira text-xs font-semibold">Crear nueva galería</p>
              </div>
            </div>
          </Link>

          {filteredGalleries.map((gallery) => (
            <GalleryCardHorizontal 
              key={gallery.id} 
              gallery={gallery} 
              serviceTypes={serviceTypes}
              selectionMode={selectionMode}
              isSelected={selectedGalleries.has(gallery.id)}
              onToggleSelect={() => toggleSelection(gallery.id)}
              onPreview={() => setPreviewGallery(gallery)}
            />
          ))}

          {filteredGalleries.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[20vh] p-6">
              <Search size={24} className="text-gray-400 mb-2" />
              <h3 className="font-voga text-base text-black mb-1">No se encontraron galerías</h3>
              <p className="font-fira text-xs text-gray-600 text-center">
                {hasActiveFilters ? 'Intenta ajustar los filtros' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              onClick={() => setShowSidebar(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-voga text-xl text-black">Filtros</h3>
                  <motion.button
                    onClick={() => setShowSidebar(false)}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </motion.button>
                </div>

                <GalleriesSidebar
                serviceTypes={serviceTypes}
                selectedService={selectedService}
                setSelectedService={setSelectedService}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                selectedLinkStatus={selectedLinkStatus}
                setSelectedLinkStatus={setSelectedLinkStatus}
                selectedArchiveStatus={selectedArchiveStatus}
                setSelectedArchiveStatus={setSelectedArchiveStatus}
                selectedFavorites={selectedFavorites}
                setSelectedFavorites={setSelectedFavorites}
                selectedDownloads={selectedDownloads}
                setSelectedDownloads={setSelectedDownloads}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                availableYears={availableYears}
                sortBy={sortBy}
                setSortBy={setSortBy}
                stats={stats}
              />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {previewGallery && (
        <GalleryPreviewModal
          gallery={previewGallery}
          onClose={() => setPreviewGallery(null)}
          onShare={() => {
            setShareGallery(previewGallery);
            setPreviewGallery(null);
          }}
          onEdit={() => {
            window.location.href = `/dashboard/galerias/${previewGallery.id}`;
          }}
        />
      )}

      {shareGallery && (
        <ShareGalleryModal
          galleryId={shareGallery.id}
          gallerySlug={shareGallery.slug}
          onClose={() => setShareGallery(null)}
        />
      )}

      <ConfirmModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleBatchArchive}
        title="Archivar galerías"
        message="Las galerías archivadas se ocultarán de la vista principal pero podrás restaurarlas en cualquier momento desde el filtro de archivadas."
        confirmText="Archivar"
        cancelText="Cancelar"
        variant="warning"
        icon="archive"
        count={selectedGalleries.size}
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={handleBatchRestore}
        title="Restaurar galerías"
        message="Las galerías volverán a estar activas y visibles en tu lista principal."
        confirmText="Restaurar"
        cancelText="Cancelar"
        variant="info"
        icon="restore"
        count={selectedGalleries.size}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleBatchDelete}
        title="Eliminar galerías permanentemente"
        message="Esta acción eliminará permanentemente las galerías, todas sus fotos de Cloudinary, las portadas y todos los enlaces compartidos. No se podrá recuperar."
        confirmText="Eliminar permanentemente"
        cancelText="Cancelar"
        variant="danger"
        icon="delete"
        count={selectedGalleries.size}
      />
    </div>
  );
}