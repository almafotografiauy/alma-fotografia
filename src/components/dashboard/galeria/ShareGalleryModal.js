'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Link as LinkIcon, Loader2, Eye, Calendar, AlertCircle, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '@/components/ui/Modal';

export default function ShareGalleryModal({ galleryId, gallerySlug, onClose }) {
  const [shareLink, setShareLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);
  const [existingShare, setExistingShare] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [expirationDays, setExpirationDays] = useState(30);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [expirationStatus, setExpirationStatus] = useState(null); // 'expired' | 'soon' | 'ok'

  useEffect(() => {
    if (galleryId) {
      setErrorMessage('');
      setIsCheckingExisting(true);
      checkExistingShare();
    }
  }, [galleryId]);

  // Verificar estado de vencimiento
  useEffect(() => {
    if (existingShare?.expires_at) {
      checkExpirationStatus();
    } else {
      // Si no hay enlace existente, resetear el estado
      setExpirationStatus(null);
    }
  }, [existingShare]);

  const checkExpirationStatus = () => {
    if (!existingShare?.expires_at) {
      setExpirationStatus(null);
      return;
    }

    const now = new Date();
    const expiresAt = new Date(existingShare.expires_at);
    const daysUntilExpiration = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration <= 0) {
      setExpirationStatus('expired');
      // Auto-desactivar si ya venció
      autoDeactivateExpiredLink();
    } else if (daysUntilExpiration <= 7) {
      setExpirationStatus('soon');
    } else {
      setExpirationStatus('ok');
    }
  };

  const autoDeactivateExpiredLink = async () => {
    try {
      const { error } = await supabase
        .from('gallery_shares')
        .delete()
        .eq('id', existingShare.id);

      if (!error) {
        // Actualizar estado local - limpiar todo
        setExistingShare(null);
        setShareLink('');
      }
    } catch (error) {
      console.error('Error auto-deleting expired link:', error);
    }
  };

  const checkExistingShare = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_shares')
        .select('*')
        .eq('gallery_id', galleryId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Solo loggear si hay un error con información útil
      if (error) {
        // Verificar si el error tiene información real (message, code, details, etc.)
        const hasErrorInfo = error.message || error.code || error.details;
        if (hasErrorInfo) {
          console.error('Error checking existing share:', error);
        }
        // Si no hay data y hay error, salir silenciosamente
        if (!data) {
          setIsCheckingExisting(false);
          return;
        }
      }

      if (data) {
        // Verificar si está vencido ANTES de mostrarlo
        const now = new Date();
        const expiresAt = new Date(data.expires_at);

        if (expiresAt <= now) {
          // Ya venció - eliminar automáticamente
          await supabase
            .from('gallery_shares')
            .delete()
            .eq('id', data.id);

          // No mostrar nada, como si no hubiera enlace
          setExistingShare(null);
          setShareLink('');
          setIsCheckingExisting(false);
          return;
        }

        setExistingShare(data);
        const slugToUse = gallerySlug || galleryId;
        const link = `${window.location.origin}/galeria/${slugToUse}?token=${data.share_token}`;
        setShareLink(link);
      }

      setIsCheckingExisting(false);
    } catch (err) {
      // Solo loggear errores reales con información útil
      if (err && (err.message || err.code || err.details)) {
        console.error('Error in checkExistingShare:', err);
      }
      setIsCheckingExisting(false);
    }
  };

  const generateShareLink = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('No se pudo obtener el usuario autenticado');
      }

      // 1. ELIMINAR todos los enlaces anteriores de esta galería creados por este usuario
      // Solo eliminamos los del usuario actual para evitar problemas de permisos
      const { error: deleteError } = await supabase
        .from('gallery_shares')
        .delete()
        .eq('gallery_id', galleryId)
        .eq('created_by', user.id);

      if (deleteError) {
        console.error('Error deleting old shares:', deleteError);
        // Continuar de todas formas, el nuevo enlace se creará igual
      }

      // 2. Crear el nuevo enlace
      const token = `${crypto.randomUUID()}-${Date.now()}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      const shareData = {
        gallery_id: galleryId,
        share_token: token,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      };

      const { data, error } = await supabase
        .from('gallery_shares')
        .insert(shareData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Error al crear el enlace');
      }

      if (!data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      const slugToUse = gallerySlug || galleryId;
      const link = `${window.location.origin}/galeria/${slugToUse}?token=${token}`;

      setShareLink(link);
      setExistingShare(data);

    } catch (error) {
      console.error('Error generating share link:', error);
      setErrorMessage(error.message || 'Error al generar el enlace.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const deactivateLink = async () => {
    setShowDeactivateModal(true);
  };

  const confirmDeactivate = async () => {
    setShowDeactivateModal(false);
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Llamar a la API que desactiva y envía notificación
      const response = await fetch('/api/gallery-shares/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareId: existingShare.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al desactivar el enlace');
      }

      // Reset state
      setExistingShare(null);
      setShareLink('');
      setErrorMessage('');
    } catch (error) {
      console.error('Error deactivating link:', error);
      setErrorMessage(error.message || 'Error al desactivar el enlace.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysUntilExpiration = () => {
    if (!existingShare?.expires_at) return null;
    const now = new Date();
    const expiresAt = new Date(existingShare.expires_at);
    return Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
  };

  const getExpirationMessage = () => {
    const days = getDaysUntilExpiration();
    if (days === null) return '';
    
    if (days <= 0) return 'Este enlace ha vencido';
    if (days === 1) return 'Vence mañana';
    if (days <= 7) return `Vence en ${days} días`;
    return `Válido por ${days} días más`;
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="share-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      {/* Modal - 100% Responsive */}
      <motion.div
        key="share-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, type: "spring", damping: 25, stiffness: 300 }}
        className="fixed min-h-[90vh] inset-2 sm:inset-4 md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl w-auto bg-white rounded-lg sm:rounded-xl shadow-2xl z-50 flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] md:max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="font-voga text-base sm:text-lg md:text-xl lg:text-2xl text-black truncate">
              Compartir galería
            </h2>
            <p className="font-fira text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5 sm:mt-1">
              Genera un enlace privado para compartir
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={18} className="sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        {/* Content - Con scroll pero sin cortar dropdowns */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">

          {/* Loading inicial */}
          {isCheckingExisting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={40} className="animate-spin text-[#79502A] mb-4" />
              <p className="font-fira text-sm text-gray-600">Verificando enlaces existentes...</p>
            </div>
          ) : (
            <>
              {/* Error message */}
              {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3 md:p-4 flex items-start gap-2 sm:gap-3">
              <AlertCircle size={16} className="sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="font-fira text-[11px] sm:text-xs md:text-sm text-red-800 leading-snug">{errorMessage}</p>
            </div>
          )}

          {/* Alerta de vencimiento */}
          {existingShare && expirationStatus === 'soon' && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-2.5 sm:p-3 md:p-4 flex items-start gap-2 sm:gap-3">
              <AlertTriangle size={16} className="sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-fira text-[11px] sm:text-xs md:text-sm text-amber-900 font-semibold">
                  ⏰ {getExpirationMessage()}
                </p>
                <p className="font-fira text-[10px] sm:text-xs text-amber-700 mt-1">
                  Considera generar un nuevo enlace con más duración.
                </p>
              </div>
            </div>
          )}

          {/* Enlace vencido */}
          {existingShare && expirationStatus === 'expired' && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-2.5 sm:p-3 md:p-4 flex items-start gap-2 sm:gap-3">
              <AlertCircle size={16} className="sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-fira text-[11px] sm:text-xs md:text-sm text-red-900 font-semibold">
                  ❌ Este enlace ha vencido
                </p>
                <p className="font-fira text-[10px] sm:text-xs text-red-700 mt-1">
                  Genera un nuevo enlace para compartir esta galería.
                </p>
              </div>
            </div>
          )}

          {/* Enlace existente */}
          {existingShare && shareLink && expirationStatus !== 'expired' ? (
            <div className="space-y-4">
              {/* Link box - Rediseñado */}
              <div className="bg-gradient-to-br from-[#79502A]/5 to-[#C6A97D]/5 border border-[#79502A]/20 rounded-xl p-4 md:p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 bg-[#79502A]/10 rounded-lg">
                    <LinkIcon size={20} className="text-[#79502A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-fira text-sm font-semibold text-black">
                        Enlace privado activo
                      </h3>
                      {expirationStatus === 'soon' && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-fira text-[10px] font-semibold flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Vence pronto
                        </span>
                      )}
                    </div>
                    <div className="bg-white border border-[#79502A]/20 rounded-lg p-3 break-all group hover:border-[#79502A]/40 transition-colors">
                      <p className="font-fira text-xs text-gray-700 leading-relaxed">
                        {shareLink}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción - Rediseñados */}
                <div className="grid grid-cols-1 gap-2">
                  {/* Copiar */}
                  <button
                    onClick={copyToClipboard}
                    className="!text-white px-4 py-2.5 bg-[#79502A] hover:bg-[#8B5A2F] text-white rounded-lg transition-all hover:scale-105 active:scale-95 font-fira text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isCopied ? (
                      <>
                        <Check size={16} />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {/* Abrir */}
                  <button
                    onClick={() => window.open(shareLink, '_blank')}
                    className="!text-[#79502A] px-4 py-2.5 bg-white border-2 border-[#79502A] hover:bg-[#79502A]/5 text-[#79502A] rounded-lg transition-all hover:scale-105 active:scale-95 font-fira text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ExternalLink size={16} />
                    <span>Abrir</span>
                  </button>

                  {/* Desactivar */}
                  <button
                    onClick={deactivateLink}
                    disabled={isLoading}
                    className="!text-white px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all hover:scale-105 active:scale-95 font-fira text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        <span>Desactivar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Estadísticas - Rediseñadas */}
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
                {/* Vistas */}
                <div className="bg-white border border-[#79502A]/20 rounded-lg p-3 hover:border-[#79502A]/40 transition-all hover:shadow-md">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2 bg-[#79502A]/10 rounded-lg mb-2">
                      <Eye size={18} className="text-[#79502A]" />
                    </div>
                    <p className="font-fira text-2xl font-bold text-[#79502A]">
                      {existingShare.views_count || 0}
                    </p>
                    <p className="font-fira text-xs text-gray-600 mt-1">
                      Vistas
                    </p>
                  </div>
                </div>

                {/* Creado */}
                <div className="bg-white border border-[#79502A]/20 rounded-lg p-3 hover:border-[#79502A]/40 transition-all hover:shadow-md">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2 bg-blue-500/10 rounded-lg mb-2">
                      <Calendar size={18} className="text-blue-600" />
                    </div>
                    <p className="font-fira text-xs font-semibold text-gray-700 truncate w-full">
                      {formatDate(existingShare.created_at)}
                    </p>
                    <p className="font-fira text-xs text-gray-600 mt-1">
                      Creado
                    </p>
                  </div>
                </div>

                {/* Expira */}
                <div className={`rounded-lg p-3 transition-all hover:shadow-md ${
                  expirationStatus === 'soon'
                    ? 'bg-amber-50 border-2 border-amber-300'
                    : 'bg-white border border-[#79502A]/20 hover:border-[#79502A]/40'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-2 rounded-lg mb-2 ${
                      expirationStatus === 'soon' ? 'bg-amber-100' : 'bg-green-500/10'
                    }`}>
                      <Calendar size={18} className={
                        expirationStatus === 'soon' ? 'text-amber-600' : 'text-green-600'
                      } />
                    </div>
                    <p className={`font-fira text-xs font-semibold truncate w-full ${
                      expirationStatus === 'soon' ? 'text-amber-800' : 'text-gray-700'
                    }`}>
                      {formatDate(existingShare.expires_at)}
                    </p>
                    <p className={`font-fira text-xs mt-1 ${
                      expirationStatus === 'soon' ? 'text-amber-600' : 'text-gray-600'
                    }`}>
                      {expirationStatus === 'soon' ? getExpirationMessage() : 'Expira'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info adicional - Rediseñada */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="font-fira text-xs text-blue-800 leading-relaxed">
                    <strong className="font-semibold">Enlace privado:</strong> Solo las personas con este enlace podrán acceder a la galería. El enlace se desactivará automáticamente cuando expire.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* No hay enlace - Generar nuevo - Rediseñado */
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5">
                {/* Icon y título */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 bg-[#79502A]/10 rounded-lg">
                    <LinkIcon size={20} className="text-[#79502A]" />
                  </div>
                  <div>
                    <h3 className="font-fira text-sm font-semibold text-black mb-1">
                      Generar enlace para compartir
                    </h3>
                    <p className="font-fira text-xs text-gray-600">
                      Crea un enlace privado con fecha de expiración
                    </p>
                  </div>
                </div>

                {/* Duración */}
                <div>
                  <label className="block font-fira text-sm font-medium text-black mb-2">
                    Duración del enlace
                  </label>
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-fira text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent bg-white hover:border-[#79502A]/40 transition-colors"
                  >
                    <option value={7}>7 días</option>
                    <option value={14}>14 días</option>
                    <option value={30}>30 días (recomendado)</option>
                    <option value={90}>3 meses</option>
                    <option value={180}>6 meses</option>
                    <option value={360}>1 año</option>
                  </select>
                </div>

                {/* Generar button */}
                <button
                  onClick={generateShareLink}
                  disabled={isLoading}
                  className="!text-white w-full mt-4 py-3 bg-[#79502A] hover:bg-[#8B5A2F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all hover:scale-105 active:scale-95 font-fira text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon size={18} />
                      <span>Generar enlace privado</span>
                    </>
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="font-fira text-xs text-blue-800 leading-relaxed">
                    El enlace será válido por el período seleccionado y se desactivará automáticamente al vencer. Podrás compartirlo con tus clientes por WhatsApp, email, etc.
                  </p>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-3 sm:p-4 md:p-3 bg-gray-100 border-t border-gray-200 flex-shrink-0">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="!text-black/70 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 border border-black/20 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-fira text-xs sm:text-sm font-semibold text-gray-700"
          >
            Cerrar
          </motion.button>
        </div>
      </motion.div>

      {/* Modal de confirmación para desactivar */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="¿Desactivar enlace?"
        message="Los clientes ya no podrán acceder a la galería con este enlace. Esta acción no se puede deshacer."
        type="warning"
        confirmText="Desactivar"
        cancelText="Cancelar"
        onConfirm={confirmDeactivate}
      />
    </AnimatePresence>
  );
}