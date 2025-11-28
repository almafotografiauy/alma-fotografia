'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Video,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  Play,
  Eye,
  EyeOff,
  AlertCircle,
  Check
} from 'lucide-react';
import {
  getCloudinarySignature,
  saveLandingVideo,
  updateLandingVideo,
  deleteLandingVideo
} from '@/app/actions/landing-video-actions';

export default function LandingVideoManager({ initialVideos = [] }) {
  const [videos, setVideos] = useState(initialVideos);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const canUpload = videos.length < 2;

  // Limpiar mensajes después de 4 segundos
  const showMessage = (type, message) => {
    if (type === 'error') {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 4000);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('video/')) {
      showMessage('error', 'Por favor selecciona un archivo de video');
      return;
    }

    // Validar tamaño (máximo 100MB - límite de Cloudinary)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      showMessage('error', `El video pesa ${sizeMB}MB. El máximo permitido es 100MB.`);
      return;
    }

    setUploading(true);
    setUploadProgress(5);

    try {
      // Obtener firma para upload directo
      const signatureResult = await getCloudinarySignature();
      if (!signatureResult.success) {
        showMessage('error', signatureResult.error || 'Error al preparar subida');
        return;
      }

      setUploadProgress(10);

      const { signature, timestamp, folder, cloudName, apiKey } = signatureResult;

      // Subir directamente a Cloudinary desde el cliente
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const xhr = new XMLHttpRequest();

      // Monitorear progreso real de subida
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 80) + 10;
          setUploadProgress(percent);
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
      xhr.send(formData);

      const cloudinaryResult = await uploadPromise;
      setUploadProgress(95);

      // Guardar en base de datos
      const saveResult = await saveLandingVideo({
        videoUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        title: '',
        description: ''
      });

      setUploadProgress(100);

      if (saveResult.success) {
        setVideos(prev => [...prev, saveResult.video]);
        showMessage('success', 'Video subido correctamente');
      } else {
        showMessage('error', saveResult.error || 'Error al guardar el video');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('error', 'Error al subir el video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEdit = (video) => {
    setEditingId(video.id);
    setEditForm({
      title: video.title || '',
      description: video.description || ''
    });
  };

  const handleSaveEdit = async (videoId) => {
    try {
      const result = await updateLandingVideo(videoId, editForm);
      if (result.success) {
        setVideos(prev => prev.map(v =>
          v.id === videoId ? { ...v, ...editForm } : v
        ));
        setEditingId(null);
        showMessage('success', 'Video actualizado');
      } else {
        showMessage('error', result.error || 'Error al actualizar');
      }
    } catch (error) {
      showMessage('error', 'Error al actualizar');
    }
  };

  const handleToggleActive = async (video) => {
    try {
      const result = await updateLandingVideo(video.id, {
        ...video,
        is_active: !video.is_active
      });
      if (result.success) {
        setVideos(prev => prev.map(v =>
          v.id === video.id ? { ...v, is_active: !v.is_active } : v
        ));
        showMessage('success', video.is_active ? 'Video ocultado' : 'Video visible');
      }
    } catch (error) {
      showMessage('error', 'Error al cambiar visibilidad');
    }
  };

  const handleDelete = async (videoId) => {
    if (!confirm('¿Estás segura de eliminar este video? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingId(videoId);
    try {
      const result = await deleteLandingVideo(videoId);
      if (result.success) {
        setVideos(prev => prev.filter(v => v.id !== videoId));
        showMessage('success', 'Video eliminado');
      } else {
        showMessage('error', result.error || 'Error al eliminar');
      }
    } catch (error) {
      showMessage('error', 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Mensajes */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 font-fira text-sm">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700 font-fira text-sm">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 font-fira text-sm">
          Puedes subir hasta <strong>2 videos</strong> que se mostrarán en la página principal.
          Los videos se optimizan automáticamente para una carga rápida.
          <br />
          <span className="text-amber-600">Tamaño máximo: 100MB por video. Formatos: MP4, MOV, WebM.</span>
        </p>
      </div>

      {/* Zona de subida */}
      {canUpload && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="video-upload"
          />
          <label
            htmlFor="video-upload"
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              uploading
                ? 'border-[#79502A] bg-[#79502A]/5'
                : 'border-gray-300 hover:border-[#79502A] hover:bg-[#79502A]/5'
            }`}
          >
            {uploading ? (
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-[#79502A] animate-spin mx-auto mb-3" />
                <p className="font-fira text-[#79502A] font-medium">Subiendo video...</p>
                <div className="w-48 h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-[#79502A] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                <p className="font-fira text-gray-600 font-medium">
                  Click para seleccionar video
                </p>
                <p className="font-fira text-gray-400 text-sm mt-1">
                  o arrastra y suelta aquí
                </p>
              </>
            )}
          </label>
        </motion.div>
      )}

      {/* Lista de videos */}
      <div className="space-y-4">
        <h3 className="font-fira font-semibold text-black">
          Videos subidos ({videos.length}/2)
        </h3>

        {videos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-fira text-gray-500">No hay videos subidos</p>
            <p className="font-fira text-gray-400 text-sm mt-1">
              Sube tu primer video para mostrarlo en la landing
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {videos.map((video) => (
              <motion.div
                key={video.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white border-2 rounded-xl overflow-hidden ${
                  video.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Preview del video */}
                  <div className="relative w-full sm:w-64 h-40 bg-black flex-shrink-0">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      poster={video.thumbnail_url}
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-12 h-12 text-white/80" />
                    </div>
                    {!video.is_active && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-white text-xs font-fira">
                        Oculto
                      </div>
                    )}
                  </div>

                  {/* Info y acciones */}
                  <div className="flex-1 p-4">
                    {editingId === video.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Título (opcional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-fira text-sm text-black focus:outline-none focus:border-[#79502A]"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descripción (opcional)"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-fira text-sm text-black focus:outline-none focus:border-[#79502A] resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(video.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#79502A] !text-white rounded-lg font-fira text-sm hover:bg-[#5d3d20] transition-colors"
                          >
                            <Save size={14} />
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-fira text-sm hover:bg-gray-200 transition-colors"
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-fira font-semibold text-black mb-1">
                          {video.title || 'Sin título'}
                        </h4>
                        <p className="font-fira text-gray-500 text-sm mb-4 line-clamp-2">
                          {video.description || 'Sin descripción'}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEdit(video)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-fira text-sm hover:bg-gray-200 transition-colors"
                          >
                            <Edit3 size={14} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleActive(video)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-fira text-sm transition-colors ${
                              video.is_active
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {video.is_active ? (
                              <>
                                <EyeOff size={14} />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <Eye size={14} />
                                Mostrar
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(video.id)}
                            disabled={deletingId === video.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg font-fira text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            {deletingId === video.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview link */}
      {videos.some(v => v.is_active) && (
        <div className="pt-4 border-t border-gray-200">
          <a
            href="/#videos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#79502A] font-fira text-sm hover:underline"
          >
            <Eye size={16} />
            Ver cómo se ven en la landing
          </a>
        </div>
      )}
    </div>
  );
}
