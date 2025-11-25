'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Download,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Package,
  RefreshCw,
  Search,
  Filter,
  SortAsc,
  FileDown,
  Copy,
  MessageSquare,
  Edit3,
  Check,
  AlertCircle,
  BarChart3,
  Image as ImageIcon,
  Users,
  Trash2,
  MoreVertical,
  FolderPlus,
  History,
  Plus,
  Minus,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { updateAllowShareFavorites } from '@/app/actions/gallery-actions';

/**
 * ClientFavoritesSection - Sección de favoritas de un cliente
 */
function ClientFavoritesSection({
  clientData,
  galleryTitle,
  gallerySlug,
  onRefresh,
  isRefreshing,
  maxFavorites,
  workflowStatus,
  onStatusChange,
  onAddNote,
  onDeleteNote,
  allowShareFavorites,
  onToggleShareFavorites,
  isUpdatingShareSetting
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ show: false, current: 0, total: 0 });
  const { showToast } = useToast();

  const { email, name, submitted, submittedAt, photos, history } = clientData;

  // Usar historial real de la base de datos
  const activityHistory = useMemo(() => {
    if (!history || history.length === 0) {
      return [];
    }

    return history.map((entry, idx) => ({
      type: entry.action_type,
      count: entry.photo_count,
      addedCount: entry.added_count || 0,
      removedCount: entry.removed_count || 0,
      date: entry.created_at,
      isFirst: idx === history.length - 1 // El último en el array ordenado es el primero cronológicamente
    }));
  }, [history]);

  const PHOTOS_PER_PAGE = 20;
  const totalPages = Math.ceil(photos.length / PHOTOS_PER_PAGE);
  const startIndex = currentPage * PHOTOS_PER_PAGE;
  const endIndex = startIndex + PHOTOS_PER_PAGE;
  const paginatedPhotos = photos.slice(startIndex, endIndex);

  // Navegación con teclado
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e) => {
      const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
        setSelectedPhoto(photos[prevIndex]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
        setSelectedPhoto(photos[nextIndex]);
      } else if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, photos]);

  const handleDownloadPhoto = async (photo, galleryTitle) => {
    try {
      const photoUrl = photo.cloudinary_url || photo.file_path;
      const gallerySlug = galleryTitle.toLowerCase().replace(/\s+/g, '-');
      const extension = photo.file_name?.split('.').pop() || 'jpg';
      const fileName = `foto_favorita_${gallerySlug}.${extension}`;

      const response = await fetch(photoUrl, {
        mode: 'cors',
        credentials: 'omit',
        cache: 'force-cache'
      });

      if (!response.ok) throw new Error('Error al obtener la imagen');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

    } catch (error) {
      showToast({ message: 'Error al descargar la foto. Por favor intenta de nuevo.', type: 'error' });
    }
  };

  const handleDownloadAll = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      let photoIndex = 1;

      setDownloadProgress({ show: true, current: 0, total: photos.length });

      for (const photo of photos) {
        try {
          const photoUrl = photo.cloudinary_url || photo.file_path;
          let fetchUrl = photoUrl;

          if (fetchUrl.includes('res.cloudinary.com')) {
            const urlParts = fetchUrl.split('/upload/');
            if (urlParts.length === 2) {
              const isPNG = urlParts[1].toLowerCase().includes('.png') ||
                photo.file_name?.toLowerCase().endsWith('.png');
              const format = isPNG ? 'png' : 'jpg';
              fetchUrl = `${urlParts[0]}/upload/q_100,f_${format}/${urlParts[1]}`;
            }
          }

          const response = await fetch(fetchUrl, { mode: 'cors', credentials: 'omit' });
          if (!response.ok) throw new Error('Error al obtener la imagen');

          const blob = await response.blob();
          const extension = photo.file_name?.split('.').pop() || 'jpg';
          const fileName = `foto_favorita_${gallerySlug}_${photoIndex}.${extension}`;

          zip.file(fileName, blob);
          setDownloadProgress(prev => ({ ...prev, current: photoIndex }));
          photoIndex++;
        } catch (error) {
          console.error('Error adding photo to zip:', error);
          setDownloadProgress(prev => ({ ...prev, current: photoIndex }));
          photoIndex++;
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `favoritas_${gallerySlug}_${email.split('@')[0]}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(zipUrl);
      }, 150);

      setDownloadProgress({ show: false, current: 0, total: 0 });

    } catch (error) {
      setDownloadProgress({ show: false, current: 0, total: 0 });
      showToast({ message: 'Error al crear el archivo ZIP. Por favor intenta de nuevo.', type: 'error' });
    }
  };

  const handleDownloadSelected = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      let photoIndex = 1;

      const selectedPhotosList = photos.filter(p => selectedPhotos.has(p.id));

      for (const photo of selectedPhotosList) {
        try {
          const photoUrl = photo.cloudinary_url || photo.file_path;
          let fetchUrl = photoUrl;

          if (fetchUrl.includes('res.cloudinary.com')) {
            const urlParts = fetchUrl.split('/upload/');
            if (urlParts.length === 2) {
              const isPNG = urlParts[1].toLowerCase().includes('.png') ||
                photo.file_name?.toLowerCase().endsWith('.png');
              const format = isPNG ? 'png' : 'jpg';
              fetchUrl = `${urlParts[0]}/upload/q_100,f_${format}/${urlParts[1]}`;
            }
          }

          const response = await fetch(fetchUrl, { mode: 'cors', credentials: 'omit' });
          if (!response.ok) throw new Error('Error al obtener la imagen');

          const blob = await response.blob();
          const extension = photo.file_name?.split('.').pop() || 'jpg';
          const fileName = `seleccionadas_${gallerySlug}_${photoIndex}.${extension}`;

          zip.file(fileName, blob);
          photoIndex++;
        } catch (error) {
          console.error('Error adding photo to zip:', error);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `seleccionadas_${gallerySlug}_${email.split('@')[0]}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(zipUrl);
      }, 150);

      setIsSelectMode(false);
      setSelectedPhotos(new Set());

    } catch (error) {
      showToast({ message: 'Error al crear el archivo ZIP. Por favor intenta de nuevo.', type: 'error' });
    }
  };

  const togglePhotoSelection = (photoId) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  // Copiar lista de Lightroom para este cliente
  const handleCopyLightroomList = () => {
    const fileNames = photos
      .map(photo => photo.file_name)
      .filter(Boolean)
      .join(' OR ');

    navigator.clipboard.writeText(fileNames);
    showToast({ message: `Lista de ${email} copiada para Lightroom!`, type: 'success' });
    setShowActionsMenu(false);
  };

  // Exportar CSV para este cliente
  const handleExportCSV = () => {
    const rows = [
      ['Email Cliente', 'Nombre Archivo', 'Fecha Selección', 'Nota'].join(',')
    ];

    photos.forEach(photo => {
      const date = photo.created_at
        ? new Date(photo.created_at).toLocaleDateString('es-ES')
        : '';
      const note = photo.note || '';

      rows.push([
        email,
        photo.file_name || '',
        date,
        `"${note.replace(/"/g, '""')}"`
      ].join(','));
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `favoritas_${email.split('@')[0]}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowActionsMenu(false);
  };

  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // Obtener el estado del workflow
  const getWorkflowBadge = () => {
    // Si llegó al límite de favoritas, mostrar como "Completo"
    if (photos.length >= maxFavorites) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#79502A]/30 border border-[#C6A97D]/40 rounded-full">
          <CheckCircle size={14} className="text-[#C6A97D]" />
          <span className="text-xs font-fira font-medium text-[#D4B896]">Completo</span>
        </div>
      );
    }

    switch (workflowStatus) {
      case 'submitted':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
            <CheckCircle size={14} className="text-emerald-400" />
            <span className="text-xs font-fira font-medium text-emerald-300">Finalizado</span>
          </div>
        );
      case 'reviewed':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
            <Check size={14} className="text-blue-400" />
            <span className="text-xs font-fira font-medium text-blue-300">Revisado</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
            <Clock size={14} className="text-amber-400" />
            <span className="text-xs font-fira font-medium text-amber-300">Seleccionando</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white">
      {/* Header oscuro estilo GalleryDetailView */}
      <div className="bg-gradient-to-br from-[#2D2D2D] to-[#1a1a1a] text-white rounded-2xl shadow-sm border border-gray-200">
        <div className="px-5 sm:px-6 lg:px-8 py-4 sm:py-6">

          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                  <h3 className="font-voga text-xl sm:text-2xl lg:text-3xl break-words">
                    Fotos favoritas
                  </h3>
                  {getWorkflowBadge()}
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-white/40 flex-shrink-0" />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      {name && <span className="font-fira font-semibold text-white">{name}</span>}
                      <span className="font-fira text-white/60">{email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart size={14} className="text-pink-400 fill-pink-400 flex-shrink-0" />
                    <span className="font-fira">{photos.length} / {maxFavorites} favoritas</span>
                  </div>
                  {formattedDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-white/40 flex-shrink-0" />
                      <span className="font-fira">Enviado: {formattedDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {isSelectMode && selectedPhotos.size > 0 && (
                  <motion.button
                    onClick={handleDownloadSelected}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Descargar {selectedPhotos.size}</span>
                    <span className="sm:hidden">{selectedPhotos.size}</span>
                  </motion.button>
                )}

                <motion.button
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    setSelectedPhotos(new Set());
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 ${isSelectMode ? 'bg-pink-500/20 border border-pink-500/30' : 'bg-[#1a1a1a] hover:bg-[#3a3a3a]'} rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2`}
                >
                  <CheckCircle size={16} />
                  <span className="hidden md:inline">{isSelectMode ? 'Cancelar' : 'Seleccionar'}</span>
                  <span className="md:hidden">{isSelectMode ? 'X' : 'Sel'}</span>
                </motion.button>

                <motion.button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden lg:inline">Actualizar</span>
                </motion.button>

                <motion.button
                  onClick={() => setShowHistory(!showHistory)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 ${showHistory ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/10 hover:bg-white/20'} rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2`}
                >
                  <History size={16} />
                  <span className="hidden lg:inline">Historial</span>
                </motion.button>

                {/* Toggle Permitir Compartir Favoritas */}
                <motion.button
                  onClick={onToggleShareFavorites}
                  disabled={isUpdatingShareSetting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title={allowShareFavorites ? 'Compartir favoritas habilitado' : 'Compartir favoritas deshabilitado'}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-200 font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 ${
                    allowShareFavorites
                      ? '!text-pink-300 bg-pink-500/20 hover:bg-pink-500/30 cursor-pointer border border-pink-500/30'
                      : '!text-white bg-[#8B5E3C] hover:bg-[#6d4a2f] cursor-pointer'
                  } ${isUpdatingShareSetting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Share2 size={16} />
                  <span className="hidden lg:inline">{allowShareFavorites ? 'Compartir ON' : 'Compartir OFF'}</span>
                </motion.button>

                {photos.length > 0 && (
                  <motion.button
                    onClick={handleDownloadAll}
                    disabled={downloadProgress.show}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="!text-white flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#79502A] to-[#8B5A2F] hover:from-[#8B5A2F] hover:to-[#79502A] disabled:opacity-70 rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    {downloadProgress.show ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="hidden md:inline">{downloadProgress.current}/{downloadProgress.total}</span>
                        <span className="md:hidden">{Math.round((downloadProgress.current / downloadProgress.total) * 100)}%</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span className="hidden md:inline">Todas</span>
                      </>
                    )}
                  </motion.button>
                )}

                <div className="relative flex-shrink-0">
                  <motion.button
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="!text-white p-2 sm:p-2.5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Más acciones"
                  >
                    <MoreVertical size={18} className="sm:w-5 sm:h-5" />
                  </motion.button>

                  <AnimatePresence>
                    {showActionsMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowActionsMenu(false)}
                        />

                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                          <div className="py-2">
                            <button
                              onClick={handleCopyLightroomList}
                              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                            >
                              <Copy size={16} className="text-[#C6A97D]" />
                              <div>
                                <p className="font-fira text-sm font-medium text-neutral-200">Copiar para Lightroom</p>
                                <p className="font-fira text-xs text-neutral-400">Lista de archivos</p>
                              </div>
                            </button>

                            <button
                              onClick={handleExportCSV}
                              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                            >
                              <FileDown size={16} className="text-emerald-400" />
                              <div>
                                <p className="font-fira text-sm font-medium text-neutral-200">Exportar CSV</p>
                                <p className="font-fira text-xs text-neutral-400">Con notas y metadatos</p>
                              </div>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de progreso de descarga */}
          <AnimatePresence>
            {downloadProgress.show && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 bg-[#79502A]/20 border border-[#C6A97D]/30 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-fira text-sm text-white/80">
                    Descargando fotos...
                  </span>
                  <span className="font-fira text-sm font-semibold text-[#C6A97D]">
                    {downloadProgress.current} de {downloadProgress.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-[#79502A] to-[#C6A97D] rounded-full"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Historial de actividad expandible */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-white/10 pt-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <History size={16} className="text-blue-400" />
                    <h4 className="font-fira text-sm font-semibold text-neutral-200">Historial de Actividad</h4>
                  </div>

                  {activityHistory.length === 0 ? (
                    <div className="p-4 bg-neutral-900/40 rounded-lg border border-white/10 text-center">
                      <p className="font-fira text-sm text-neutral-400">
                        No hay envíos registrados aún
                      </p>
                      <p className="font-fira text-xs text-neutral-500 mt-1">
                        El historial se crea cuando el cliente presiona "Enviar Selección"
                      </p>
                    </div>
                  ) : activityHistory.map((activity, idx) => {
                    const getActivityConfig = () => {
                      const { type, count, addedCount, removedCount, isFirst } = activity;

                      let message;
                      let icon;
                      let bg;

                      if (type === 'added' && isFirst) {
                        icon = <Plus size={14} className="text-emerald-400" />;
                        bg = 'bg-emerald-500/20';
                        message = <>Seleccionó <span className="font-semibold text-emerald-400">{count} {count === 1 ? 'foto' : 'fotos'}</span> favoritas</>;
                      } else if (type === 'edited' || (addedCount > 0 && removedCount > 0)) {
                        icon = <AlertCircle size={14} className="text-blue-400" />;
                        bg = 'bg-blue-500/20';
                        message = (
                          <>
                            Editó su selección: eliminó <span className="font-semibold text-red-400">{removedCount}</span> y agregó <span className="font-semibold text-emerald-400">{addedCount}</span> (Total: <span className="font-semibold text-blue-400">{count}</span>)
                          </>
                        );
                      } else if (type === 'added' || addedCount > 0) {
                        icon = <Plus size={14} className="text-emerald-400" />;
                        bg = 'bg-emerald-500/20';
                        message = (
                          <>
                            Agregó <span className="font-semibold text-emerald-400">{addedCount} {addedCount === 1 ? 'foto' : 'fotos'}</span> (Total: <span className="font-semibold text-emerald-400">{count}</span>)
                          </>
                        );
                      } else if (type === 'removed' || removedCount > 0) {
                        icon = <Minus size={14} className="text-red-400" />;
                        bg = 'bg-red-500/20';
                        message = (
                          <>
                            Eliminó <span className="font-semibold text-red-400">{removedCount} {removedCount === 1 ? 'foto' : 'fotos'}</span> (Quedan: <span className="font-semibold text-red-400">{count}</span>)
                          </>
                        );
                      } else if (type === 'submitted') {
                        icon = <CheckCircle size={14} className="text-blue-400" />;
                        bg = 'bg-blue-500/20';
                        message = <>Envió su selección final (<span className="font-semibold text-blue-400">{count} fotos</span>)</>;
                      } else {
                        icon = <AlertCircle size={14} className="text-neutral-400" />;
                        bg = 'bg-neutral-500/20';
                        message = <>Actividad desconocida</>;
                      }

                      return { icon, bg, message };
                    };

                    const config = getActivityConfig();

                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-neutral-900/40 rounded-lg border border-white/10 hover:bg-neutral-900/60 transition-colors"
                      >
                        <div className={`p-1.5 rounded-lg ${config.bg}`}>
                          {config.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-fira text-sm text-neutral-100">
                            {config.message}
                          </p>
                          <p className="font-fira text-xs text-neutral-400 mt-1">
                            {new Date(activity.date).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Photos Grid - Masonry Layout directamente en el fondo */}
      <div className="bg-white py-3 sm:py-4">
        {photos.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Heart size={40} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-fira text-sm">
              Este cliente aún no ha seleccionado ninguna foto
            </p>
          </div>
        ) : (
          <div className="px-0">
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-1 sm:gap-2 space-y-1 sm:space-y-2">
            {paginatedPhotos.map((photo) => {
              const photoUrl = photo.cloudinary_url || photo.file_path;
              const isSelected = selectedPhotos.has(photo.id);

              if (!photoUrl) {
                console.warn('Photo missing URL:', photo);
                return null;
              }

              return (
                <div
                  key={photo.id}
                  className="group relative mb-0.5 sm:mb-2 break-inside-avoid"
                >
                  <div
                    onClick={() => {
                      if (isSelectMode) {
                        togglePhotoSelection(photo.id);
                      } else {
                        setSelectedPhoto(photo);
                      }
                    }}
                    className={`relative w-full bg-gray-100 overflow-hidden cursor-pointer transition-all ${
                      isSelected ? 'ring-4 ring-pink-500/50' : ''
                    }`}
                  >
                    <Image
                      src={photoUrl}
                      alt={photo.file_name || 'Foto favorita'}
                      width={800}
                      height={800}
                      className="w-full h-auto group-hover:opacity-95 transition-opacity"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      unoptimized
                    />

                    {/* Overlay con botones */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 pointer-events-none">
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPhoto(photo, galleryTitle);
                          }}
                          className="p-2 bg-[#79502A] hover:bg-[#8B5A2F] backdrop-blur-sm rounded-lg transition-all shadow-lg pointer-events-auto"
                          title="Descargar foto"
                        >
                          <Download size={14} className="text-white" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNote(photo.id);
                            setNoteText(photo.note || '');
                          }}
                          className={`p-2 backdrop-blur-sm rounded-lg transition-all shadow-lg pointer-events-auto ${
                            photo.note
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                          title={photo.note ? 'Editar nota' : 'Agregar nota'}
                        >
                          <MessageSquare size={14} className="text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Badge de favorita con corazón */}
                    <div className="absolute top-2 right-2 p-1.5 bg-pink-500/90 backdrop-blur-sm rounded-full shadow-lg">
                      <Heart size={12} className="fill-white text-white" />
                    </div>

                    {/* Checkbox para modo selección */}
                    {isSelectMode && (
                      <div className="absolute top-2 left-2">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-pink-500 border-pink-500'
                            : 'bg-white/90 border-gray-300'
                        }`}>
                          {isSelected && <Check size={16} className="text-white" />}
                        </div>
                      </div>
                    )}

                    {/* Indicador de nota */}
                    {photo.note && !isSelectMode && (
                      <div className="absolute top-2 left-2 p-1.5 bg-blue-600/90 backdrop-blur-sm rounded-full shadow-lg">
                        <MessageSquare size={12} className="text-white fill-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-4">
              <p className="text-xs sm:text-sm text-gray-600 font-fira">
                Mostrando {startIndex + 1}-{Math.min(endIndex, photos.length)} de {photos.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Página anterior"
                >
                  <ChevronLeft size={18} className="text-gray-700" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx;
                    } else if (currentPage < 3) {
                      pageNum = idx;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-fira text-xs sm:text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-[#79502A] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Página siguiente"
                >
                  <ChevronRight size={18} className="text-gray-700" />
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Modal de imagen con navegación */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-3 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-100 rounded-lg sm:rounded-xl transition-all z-10 backdrop-blur-sm"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>

            {/* Botón anterior */}
            {photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
                  setSelectedPhoto(photos[prevIndex]);
                }}
                className="absolute left-2 sm:left-4 p-2 sm:p-3 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-100 rounded-lg sm:rounded-xl transition-all z-10 backdrop-blur-sm hover:scale-110"
              >
                <ChevronLeft size={24} className="sm:w-8 sm:h-8" />
              </button>
            )}

            {/* Botón siguiente */}
            {photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
                  const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
                  setSelectedPhoto(photos[nextIndex]);
                }}
                className="absolute right-2 sm:right-4 p-2 sm:p-3 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-100 rounded-lg sm:rounded-xl transition-all z-10 backdrop-blur-sm hover:scale-110"
              >
                <ChevronRight size={24} className="sm:w-8 sm:h-8" />
              </button>
            )}

            <motion.div
              key={selectedPhoto.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-7xl max-h-[90vh] w-full"
            >
              <Image
                src={selectedPhoto.cloudinary_url || selectedPhoto.file_path}
                alt={selectedPhoto.file_name || 'Foto favorita'}
                width={1920}
                height={1080}
                className="w-full h-auto max-h-[90vh] object-contain rounded-xl"
                unoptimized
              />

              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex gap-1.5 sm:gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingNote(selectedPhoto.id);
                    setNoteText(selectedPhoto.note || '');
                  }}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-fira text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition-all shadow-lg backdrop-blur-sm ${
                    selectedPhoto.note
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-100'
                  }`}
                  title={selectedPhoto.note ? 'Editar comentario' : 'Agregar comentario'}
                >
                  <MessageSquare size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{selectedPhoto.note ? 'Editar Comentario' : 'Agregar Comentario'}</span>
                  <span className="sm:hidden">Nota</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPhoto(selectedPhoto, galleryTitle);
                  }}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#79502A] hover:bg-[#8B5A2F] !text-white rounded-lg font-fira text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition-all shadow-lg backdrop-blur-sm"
                >
                  <Download size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Descargar</span>
                </button>
              </div>

              {/* Contador de fotos */}
              <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-neutral-800/80 backdrop-blur-sm rounded-lg">
                <span className="font-fira text-xs sm:text-sm text-neutral-100 font-medium">
                  {photos.findIndex(p => p.id === selectedPhoto.id) + 1} / {photos.length}
                </span>
              </div>

              {/* Nota si existe */}
              {selectedPhoto.note && (
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 max-w-[calc(100vw-4rem)] sm:max-w-md px-2.5 sm:px-4 py-2 sm:py-3 bg-blue-600/90 backdrop-blur-sm rounded-lg">
                  <div className="flex items-start gap-1.5 sm:gap-2">
                    <MessageSquare size={14} className="sm:w-4 sm:h-4 text-white mt-0.5 flex-shrink-0" />
                    <p className="font-fira text-xs sm:text-sm text-white">{selectedPhoto.note}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para editar nota */}
      <AnimatePresence>
        {editingNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingNote(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
                  <MessageSquare size={18} className="sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <h3 className="font-fira text-base sm:text-lg font-semibold text-neutral-100">
                  {photos.find(p => p.id === editingNote)?.note ? 'Editar nota' : 'Agregar nota'}
                </h3>
              </div>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Ej: Retocar piel, Imprimir 20x30, Quitar fondo..."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-neutral-900 border border-white/10 rounded-lg text-neutral-100 placeholder-neutral-500 font-fira text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none"
                rows={4}
                autoFocus
              />

              <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
                <button
                  onClick={() => {
                    onAddNote(editingNote, noteText);
                    setEditingNote(null);
                    setNoteText('');
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-fira text-xs sm:text-sm font-semibold transition-all"
                >
                  Guardar
                </button>

                {photos.find(p => p.id === editingNote)?.note && (
                  <button
                    onClick={() => {
                      onDeleteNote(editingNote);
                      setEditingNote(null);
                      setNoteText('');
                    }}
                    className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-fira text-xs sm:text-sm font-semibold transition-all"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditingNote(null);
                    setNoteText('');
                  }}
                  className="px-3 sm:px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-fira text-xs sm:text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * FavoritesView - Vista principal de favoritas
 */
export default function FavoritesView({ gallery, favoritesByClient }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, email, count
  const [filterStatus, setFilterStatus] = useState('all'); // all, submitted, selecting
  const [showFilters, setShowFilters] = useState(false);
  const [allowShareFavorites, setAllowShareFavorites] = useState(gallery.allow_share_favorites || false);
  const [isUpdatingShareSetting, setIsUpdatingShareSetting] = useState(false);

  // Cargar notas existentes al estado inicial
  const initialNotes = {};
  favoritesByClient.forEach(client => {
    client.photos.forEach(photo => {
      if (photo.note) {
        initialNotes[photo.id] = photo.note;
      }
    });
  });

  const [clientNotes, setClientNotes] = useState(initialNotes);
  const [clientStatuses, setClientStatuses] = useState({});

  const gallerySlug = gallery.slug || gallery.title.toLowerCase().replace(/\s+/g, '-');
  const { showToast } = useToast();

  // Manejar toggle de compartir favoritos
  const handleToggleShareFavorites = async () => {
    setIsUpdatingShareSetting(true);
    const newValue = !allowShareFavorites;

    try {
      const result = await updateAllowShareFavorites(gallery.id, newValue);

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

  // Auto-refresh cada 3 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[FavoritesView] Auto-refreshing...');
      router.refresh();
    }, 3 * 60 * 1000); // 3 minutos

    return () => clearInterval(interval);
  }, [router]);

  // Función para refrescar datos
  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Agregar/editar nota
  const handleAddNote = async (photoId, note) => {
    // Actualizar estado local inmediatamente para UX
    setClientNotes(prev => ({
      ...prev,
      [photoId]: note
    }));

    // Importar server action dinámicamente
    const { upsertPhotoNote } = await import('@/app/actions/photo-notes-actions');

    // Guardar en base de datos
    const result = await upsertPhotoNote(gallery.id, photoId, note);

    if (!result.success) {
      console.error('Error saving note:', result.error);
      // Revertir cambio local si falla
      setClientNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[photoId];
        return newNotes;
      });
    }
  };

  // Eliminar nota
  const handleDeleteNote = async (photoId) => {
    // Actualizar estado local inmediatamente
    setClientNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[photoId];
      return newNotes;
    });

    // Importar server action dinámicamente
    const { deletePhotoNote } = await import('@/app/actions/photo-notes-actions');

    // Eliminar de base de datos
    const result = await deletePhotoNote(gallery.id, photoId);

    if (!result.success) {
      console.error('Error deleting note:', result.error);
    }
  };

  // Cambiar estado del workflow
  const handleStatusChange = (email, newStatus) => {
    setClientStatuses(prev => ({
      ...prev,
      [email]: newStatus
    }));
  };

  // Copiar lista para Lightroom
  const handleCopyLightroomList = () => {
    const allPhotos = favoritesByClient.flatMap(client => client.photos);
    const fileNames = allPhotos
      .map(photo => photo.file_name)
      .filter(Boolean)
      .join(' OR ');

    navigator.clipboard.writeText(fileNames);
    showToast({ message: 'Lista copiada para Lightroom!', type: 'success' });
  };

  // Exportar CSV
  const handleExportCSV = () => {
    const rows = [
      ['Email Cliente', 'Nombre Archivo', 'Fecha Selección', 'Nota'].join(',')
    ];

    favoritesByClient.forEach(client => {
      client.photos.forEach(photo => {
        const date = photo.created_at
          ? new Date(photo.created_at).toLocaleDateString('es-ES')
          : '';
        const note = clientNotes[photo.id] || '';

        rows.push([
          client.email,
          photo.file_name || '',
          date,
          `"${note.replace(/"/g, '""')}"`
        ].join(','));
      });
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `favoritas_${gallerySlug}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Descargar todas las favoritas de la galería
  const handleDownloadAllGalleryFavorites = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      let photoIndex = 1;

      for (const client of favoritesByClient) {
        for (const photo of client.photos) {
          try {
            const photoUrl = photo.cloudinary_url || photo.file_path;
            let fetchUrl = photoUrl;

            if (fetchUrl.includes('res.cloudinary.com')) {
              const urlParts = fetchUrl.split('/upload/');
              if (urlParts.length === 2) {
                const isPNG = urlParts[1].toLowerCase().includes('.png') ||
                  photo.file_name?.toLowerCase().endsWith('.png');
                const format = isPNG ? 'png' : 'jpg';
                fetchUrl = `${urlParts[0]}/upload/q_100,f_${format}/${urlParts[1]}`;
              }
            }

            const response = await fetch(fetchUrl, { mode: 'cors', credentials: 'omit' });
            if (!response.ok) throw new Error('Error al obtener la imagen');

            const blob = await response.blob();
            const extension = photo.file_name?.split('.').pop() || 'jpg';
            const fileName = `foto_favorita_${gallerySlug}_${photoIndex}.${extension}`;

            zip.file(fileName, blob);
            photoIndex++;
          } catch (error) {
            console.error('Error adding photo to zip:', error);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `favoritas_${gallerySlug}_todas.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(zipUrl);
      }, 150);

    } catch (error) {
      showToast({ message: 'Error al crear el archivo ZIP. Por favor intenta de nuevo.', type: 'error' });
    }
  };

  // Filtrar y ordenar clientes
  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...favoritesByClient];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => {
        const status = clientStatuses[client.email] || (client.submitted ? 'submitted' : 'selecting');
        return filterStatus === 'submitted'
          ? status === 'submitted' || status === 'reviewed'
          : status === 'selecting';
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'email':
          return a.email.localeCompare(b.email);
        case 'count':
          return b.photos.length - a.photos.length;
        case 'recent':
        default:
          const dateA = a.submittedAt ? new Date(a.submittedAt) : new Date(0);
          const dateB = b.submittedAt ? new Date(b.submittedAt) : new Date(0);
          return dateB - dateA;
      }
    });

    return filtered;
  }, [favoritesByClient, searchTerm, sortBy, filterStatus, clientStatuses]);

  // Estadísticas
  const stats = useMemo(() => {
    const totalClients = favoritesByClient.length;
    const totalPhotos = favoritesByClient.reduce((sum, client) => sum + client.photos.length, 0);
    const avgPerClient = totalClients > 0 ? (totalPhotos / totalClients).toFixed(1) : 0;
    const submitted = favoritesByClient.filter(c => c.submitted).length;

    // Foto más seleccionada
    const photoFrequency = {};
    favoritesByClient.forEach(client => {
      client.photos.forEach(photo => {
        photoFrequency[photo.id] = (photoFrequency[photo.id] || 0) + 1;
      });
    });

    const mostPopular = Object.entries(photoFrequency)
      .sort((a, b) => b[1] - a[1])[0];
    const mostPopularCount = mostPopular ? mostPopular[1] : 0;

    return {
      totalClients,
      totalPhotos,
      avgPerClient,
      submitted,
      mostPopularCount
    };
  }, [favoritesByClient]);

  return (
    <div className="w-full">
      {/* Header mejorado */}
      <div className="mb-4 px-2 sm:px-4">
        <button
          onClick={() => router.push(`/dashboard/galerias/${gallery.id}`)}
          className="flex items-center gap-2 text-[#8B5E3C] hover:text-[#6d4a2f] transition-colors font-fira text-sm font-semibold group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Volver a la galería
        </button>
      </div>

      {/* Lista de clientes */}
      <div className="space-y-4 px-2 sm:px-4">
        {filteredAndSortedClients.length === 0 && favoritesByClient.length === 0 ? (
          <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-900/30 border border-neutral-800 rounded-2xl p-12 sm:p-16 text-center shadow-2xl">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-800/50 border border-neutral-700 flex items-center justify-center">
                <Heart size={48} className="text-neutral-600" />
              </div>
              <h3 className="font-voga text-3xl text-neutral-300 mb-4">
                Aún no hay favoritas
              </h3>
              <p className="font-fira text-sm text-neutral-400 leading-relaxed">
                Cuando tus clientes seleccionen sus fotos favoritas, aparecerán aquí organizadas por cliente
              </p>
            </div>
          </div>
        ) : filteredAndSortedClients.length === 0 ? (
          <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-900/30 border border-neutral-800 rounded-2xl p-12 text-center">
            <AlertCircle size={40} className="text-neutral-600 mx-auto mb-4" />
            <p className="font-fira text-neutral-400">
              No se encontraron resultados con los filtros aplicados
            </p>
          </div>
        ) : (
          filteredAndSortedClients.map((client) => (
            <ClientFavoritesSection
              key={client.email}
              clientData={{
                ...client,
                photos: client.photos.map(photo => ({
                  ...photo,
                  note: clientNotes[photo.id] || photo.note
                }))
              }}
              galleryTitle={gallery.title}
              gallerySlug={gallerySlug}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              maxFavorites={gallery.max_favorites || 150}
              workflowStatus={clientStatuses[client.email] || (client.submitted ? 'submitted' : 'selecting')}
              onStatusChange={(newStatus) => handleStatusChange(client.email, newStatus)}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              allowShareFavorites={allowShareFavorites}
              onToggleShareFavorites={handleToggleShareFavorites}
              isUpdatingShareSetting={isUpdatingShareSetting}
            />
          ))
        )}
      </div>
    </div>
  );
}
