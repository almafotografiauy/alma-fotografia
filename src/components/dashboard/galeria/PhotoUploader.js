'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { Upload, X, Loader2, AlertCircle, ChevronLeft, ChevronRight, CheckSquare, Trash2, Eye, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function PhotoUploader({ galleryId, gallerySlug, galleryTitle, onUploadComplete }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [previewPage, setPreviewPage] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPreviews, setSelectedPreviews] = useState(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const PREVIEWS_PER_PAGE = 30;
  const { showToast } = useToast();

  const startIdx = previewPage * PREVIEWS_PER_PAGE;
  const endIdx = startIdx + PREVIEWS_PER_PAGE;
  const previewsToShow = selectedFiles.slice(startIdx, endIdx);
  const totalPages = Math.ceil(selectedFiles.length / PREVIEWS_PER_PAGE);

  // Generar nombre SEO-friendly basado en slug/título de galería
  const generatePrettyFileName = (index) => {
    // Usar slug si existe, sino crear uno del título
    const baseName = gallerySlug || galleryTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales con guiones
      .replace(/^-+|-+$/g, ''); // Quitar guiones al inicio/fin

    // Número con padding (001, 002, etc)
    const paddedNumber = String(index + 1).padStart(3, '0');

    // ✅ Incluir "foto" para mejor SEO
    // Ej: casamiento-maria-juan-foto-001.webp
    return `${baseName}-foto-${paddedNumber}.webp`;
  };

  const togglePreviewSelection = (fileId) => {
    setSelectedPreviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPreviews.size === previewsToShow.length) {
      setSelectedPreviews(new Set());
    } else {
      setSelectedPreviews(new Set(previewsToShow.map(f => f.id)));
    }
  };

  const removeSelectedPreviews = () => {
    setSelectedFiles(prev => {
      const toRemove = prev.filter(f => selectedPreviews.has(f.id));
      toRemove.forEach(f => URL.revokeObjectURL(f.preview));
      return prev.filter(f => !selectedPreviews.has(f.id));
    });
    setSelectedPreviews(new Set());
    setSelectionMode(false);
  };

  const openLightbox = (index) => {
    setLightboxIndex(startIdx + index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = () => {
    setLightboxIndex((prev) => (prev + 1) % selectedFiles.length);
  };

  const prevPhoto = () => {
    setLightboxIndex((prev) => (prev - 1 + selectedFiles.length) % selectedFiles.length);
  };

  const optimizeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = document.createElement('img');

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const MAX_DIMENSION = 1920;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              if (width > MAX_DIMENSION) {
                height = (height * MAX_DIMENSION) / width;
                width = MAX_DIMENSION;
              }
            } else {
              if (height > MAX_DIMENSION) {
                width = (width * MAX_DIMENSION) / height;
                height = MAX_DIMENSION;
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
            0.85
          );
        };

        img.onerror = () => reject(new Error('Error al cargar imagen'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Error al leer archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (files) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const isValid = validTypes.includes(file.type) && file.size <= 15 * 1024 * 1024;

      if (!isValid) {
        console.warn(`Archivo rechazado: ${file.name}`);
      }

      return isValid;
    });

    if (validFiles.length === 0) {
      showToast({ message: 'No se seleccionaron archivos válidos. Usa JPG, PNG o WebP menores a 15MB.', type: 'error' });
      return;
    }

    const filesWithPreviews = await Promise.all(
      validFiles.map(async (file) => {
        const preview = URL.createObjectURL(file);
        return {
          file,
          preview,
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
        };
      })
    );

    setSelectedFiles(prev => [...prev, ...filesWithPreviews]);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, []);

  const removeFile = (fileId) => {
    setSelectedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const removed = prev.find(f => f.id === fileId);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const uploadSinglePhoto = async (fileData, index) => {
    const { file, id, name } = fileData;
    let uploadedCloudinaryUrl = null; // Rastrear URL para rollback

    try {
      setUploadProgress(prev => ({
        ...prev,
        [id]: { status: 'optimizing', progress: 0 }
      }));

      const optimizedBlob = await optimizeImage(file);

      // Generar nombre bonito basado en galería + número
      const prettyFileName = generatePrettyFileName(index);

      const optimizedFile = new File(
        [optimizedBlob],
        prettyFileName,
        { type: 'image/webp' }
      );

      if (process.env.NODE_ENV === 'development') {
        const reduction = ((1 - optimizedBlob.size / file.size) * 100).toFixed(1);
        console.log(`📸 ${name} → ${prettyFileName}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(optimizedBlob.size / 1024).toFixed(0)}KB (-${reduction}%)`);
      }

      // ==========================================
      // PASO 1: Subir a Cloudinary con retry automático
      // ==========================================

      setUploadProgress(prev => ({
        ...prev,
        [id]: { status: 'uploading', progress: 50 }
      }));

      const formData = new FormData();
      formData.append('file', optimizedFile);
      formData.append('folder', `galleries/${galleryId}`);
      formData.append('resourceType', 'image');

      // ✅ Retry logic: 3 intentos con backoff exponencial
      let result = null;
      const MAX_RETRIES = 3;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Error al subir imagen`);
          }

          result = await response.json();

          if (!result.success) {
            throw new Error(result.error || 'Upload to Cloudinary failed');
          }

          // ✅ Upload exitoso, salir del loop
          break;

        } catch (error) {
          console.warn(`⚠️ Intento ${attempt}/${MAX_RETRIES} falló para ${prettyFileName}:`, error.message);

          // Si es el último intento, lanzar error
          if (attempt === MAX_RETRIES) {
            throw new Error(`Error después de ${MAX_RETRIES} intentos: ${error.message}`);
          }

          // Esperar antes de reintentar (backoff exponencial: 2s, 4s, 8s)
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Esperando ${waitTime/1000}s antes de reintentar...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      uploadedCloudinaryUrl = result.url; // ✅ Guardar para posible rollback

      // ==========================================
      // PASO 2: Guardar en BD solo si Cloudinary fue exitoso
      // ==========================================

      setUploadProgress(prev => ({
        ...prev,
        [id]: { status: 'saving', progress: 75 }
      }));

      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          gallery_id: galleryId,
          file_path: result.url,
          file_name: prettyFileName,
          file_size: optimizedBlob.size,
          display_order: index,
        });

      if (dbError) {
        console.error('❌ Error guardando en BD:', dbError);

        // ✅ ROLLBACK: Eliminar de Cloudinary si falló BD
        if (uploadedCloudinaryUrl) {
          console.log('🔄 Ejecutando rollback: eliminando de Cloudinary...');
          try {
            const publicId = uploadedCloudinaryUrl.match(/\/v\d+\/(.+)\.\w+$/)?.[1];
            if (publicId) {
              await fetch('/api/cloudinary/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId })
              });
              console.log('✅ Rollback exitoso: foto eliminada de Cloudinary');
            }
          } catch (rollbackError) {
            console.error('⚠️ Error en rollback:', rollbackError);
          }
        }

        throw new Error(`Error guardando en base de datos: ${dbError.message}`);
      }

      setUploadProgress(prev => ({
        ...prev,
        [id]: { status: 'completed', progress: 100 }
      }));

      URL.revokeObjectURL(fileData.preview);

      return { success: true, id };

    } catch (error) {
      console.error(`❌ Error uploading ${name}:`, error);

      setUploadErrors(prev => ({
        ...prev,
        [id]: error.message
      }));

      setUploadProgress(prev => ({
        ...prev,
        [id]: { status: 'error', progress: 0 }
      }));

      return { success: false, id, error };
    }
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    // ✅ Batch size de 3 para evitar saturar servidor y Cloudinary
    const BATCH_SIZE = 3;
    const batches = [];

    // Crear batches con índice global correcto
    for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
      batches.push({
        files: selectedFiles.slice(i, i + BATCH_SIZE),
        startIndex: i, // ✅ Guardar índice inicial del batch
      });
    }

    // Procesar cada batch secuencialmente
    for (const batch of batches) {
      await Promise.all(
        batch.files.map((fileData, batchIndex) =>
          uploadSinglePhoto(fileData, batch.startIndex + batchIndex) // ✅ Usar índice global
        )
      );
    }

    // Cleanup
    selectedFiles.forEach(f => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });

    setSelectedFiles([]);
    setUploadProgress({});
    setUploadErrors({});
    setPreviewPage(0);
    setUploading(false);

    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  return (
    <div className="space-y-4">
      {selectedFiles.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative border-2 border-dashed rounded-lg p-6 sm:p-12 text-center transition-all border-gray-300 hover:border-[#79502A] hover:bg-[#79502A]/5 cursor-pointer"
        >
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="photo-upload"
          />

          <label htmlFor="photo-upload" className="cursor-pointer block">
            <div className="inline-flex p-3 sm:p-4 bg-gray-100 rounded-full mb-3 sm:mb-4">
              <Upload size={24} className="sm:w-8 sm:h-8 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="font-fira text-sm sm:text-base font-semibold text-black mb-2">
              Arrastra fotos aquí o haz click para seleccionar
            </p>
            <p className="font-fira text-xs sm:text-sm text-gray-500">
              JPG, PNG o WebP • Max 15MB • Optimización automática
            </p>
          </label>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <p className="font-fira text-sm font-semibold text-black">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'foto' : 'fotos'}
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
                    disabled={previewPage === 0}
                    className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    type="button"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-fira text-xs text-gray-600">
                    {previewPage + 1}/{totalPages}
                  </span>
                  <button
                    onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={previewPage === totalPages - 1}
                    className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    type="button"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {!uploading && !selectionMode && (
                <>
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="!text-black/80 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                    type="button"
                  >
                    <CheckSquare size={14} />
                    <span className="hidden sm:inline">Seleccionar</span>
                  </button>
                  <button
                    onClick={handleUploadAll}
                    className="!text-white px-4 sm:px-6 py-2 bg-[#79502A] hover:bg-[#8B5A2F] text-white rounded-lg transition-colors font-fira text-sm font-semibold flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                    type="button"
                  >
                    <Upload size={16} />
                    Subir {selectedFiles.length}
                  </button>
                </>
              )}

              {selectionMode && (
                <>
                  <button
                    onClick={toggleSelectAll}
                    className="px-3 py-2 !text-black/80 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                    type="button"
                  >
                    {selectedPreviews.size === previewsToShow.length ? 'Deseleccionar' : 'Todo'}
                  </button>
                  <button
                    onClick={removeSelectedPreviews}
                    disabled={selectedPreviews.size === 0}
                    className="!text-white px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium flex items-center gap-2 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                    type="button"
                  >
                    <Trash2 size={14} />
                    Eliminar {selectedPreviews.size > 0 && `(${selectedPreviews.size})`}
                  </button>
                  <button
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedPreviews(new Set());
                    }}
                    className="px-3 py-2 !text-black/80 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-fira text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                    type="button"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Grid previews - 3 columnas en móvil para mejor visualización */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1.5 sm:gap-2">
            {/* Card de "Agregar más" como primer elemento */}
            {!uploading && !selectionMode && (
              <label className="relative group aspect-square bg-gradient-to-br from-[#C6A97D]/20 to-[#79502A]/20 rounded overflow-hidden cursor-pointer border-2 border-dashed border-[#C6A97D] hover:border-[#79502A] hover:from-[#C6A97D]/30 hover:to-[#79502A]/30 transition-all">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 sm:gap-2">
                  <Plus size={24} className="sm:w-8 sm:h-8 text-[#79502A]" strokeWidth={2} />
                  <span className="font-fira text-[10px] sm:text-xs font-semibold text-[#79502A] text-center px-2">
                    Agregar más
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </label>
            )}

            {previewsToShow.map((fileData, index) => {
              const progress = uploadProgress[fileData.id];
              const isSelected = selectedPreviews.has(fileData.id);

              return (
                <div
                  key={fileData.id}
                  onClick={() => selectionMode && togglePreviewSelection(fileData.id)}
                  className={`relative group aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer ${
                    isSelected ? 'ring-2 ring-[#79502A]' : ''
                  }`}
                >
                  <Image
                    src={fileData.preview}
                    alt={fileData.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, 10vw"
                  />

                  {progress && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                      {progress.status === 'optimizing' && (
                        <Loader2 className="text-white animate-spin" size={20} />
                      )}
                      {progress.status === 'uploading' && (
                        <Loader2 className="text-white animate-spin" size={20} />
                      )}
                      {progress.status === 'saving' && (
                        <Loader2 className="text-white animate-spin" size={20} />
                      )}
                      {progress.status === 'error' && (
                        <AlertCircle className="text-red-400" size={20} />
                      )}
                    </div>
                  )}

                  {selectionMode && !progress && (
                    <div className="absolute top-1 left-1 z-10">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-[#79502A] border-[#79502A]' : 'bg-white/90 border-gray-300'
                      }`}>
                        {isSelected && <CheckSquare size={10} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                  )}

                  {!progress && !uploading && !selectionMode && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(fileData.id);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        type="button"
                      >
                        <X size={10} className="text-white" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openLightbox(index);
                        }}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                        type="button"
                      >
                        <Eye size={16} className="text-white" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {uploading && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-fira text-black font-semibold">
                  Optimizando y subiendo...
                </span>
                <span className="font-fira text-gray-600">
                  {Object.keys(uploadProgress).filter(id => uploadProgress[id]?.status === 'completed').length}/{selectedFiles.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#79502A] h-3 transition-all duration-300"
                  style={{
                    width: `${(Object.keys(uploadProgress).filter(id => uploadProgress[id]?.status === 'completed').length / selectedFiles.length) * 100}%`
                  }}
                />
              </div>
              <p className="font-fira text-xs text-gray-500 mt-2">
                Comprimiendo a ~300KB por foto para galerías ligeras y rápidas
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} className="text-white" />
          </button>

          <button
            onClick={prevPhoto}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft size={32} className="text-white" />
          </button>

          <button
            onClick={nextPhoto}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight size={32} className="text-white" />
          </button>

          <div className="relative w-full h-full max-w-6xl max-h-[90vh] p-8">
            <Image
              src={selectedFiles[lightboxIndex].preview}
              alt={selectedFiles[lightboxIndex].name}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full">
            <p className="font-fira text-sm text-white">
              {lightboxIndex + 1} / {selectedFiles.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}