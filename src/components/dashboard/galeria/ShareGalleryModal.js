'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Link as LinkIcon, Loader2, Eye, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ShareGalleryModal({ galleryId, gallerySlug, onClose }) {
  const [shareLink, setShareLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingShare, setExistingShare] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [expirationDays, setExpirationDays] = useState(30);

  useEffect(() => {
    if (galleryId) {
      setErrorMessage('');
      checkExistingShare();
    }
  }, [galleryId]);

  const checkExistingShare = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_shares')
        .select('*')
        .eq('gallery_id', galleryId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing share:', error);
        return;
      }

      if (data) {
        setExistingShare(data);
        const slugToUse = gallerySlug || galleryId;
        const link = `${window.location.origin}/galeria/${slugToUse}?token=${data.share_token}`;
        setShareLink(link);
      }
    } catch (err) {
      console.error('Error in checkExistingShare:', err);
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
      console.error('Error copying to clipboard:', err);
      setErrorMessage('No se pudo copiar al portapapeles');
    }
  };

  const deactivateShare = async () => {
    if (!existingShare) return;

    try {
      const { error } = await supabase
        .from('gallery_shares')
        .update({ is_active: false })
        .eq('id', existingShare.id);

      if (error) throw error;

      setShareLink('');
      setExistingShare(null);
      setErrorMessage('');
    } catch (error) {
      console.error('Error deactivating share:', error);
      setErrorMessage('Error al desactivar el enlace');
    }
  };

  const handleClose = () => {
    setShareLink('');
    setIsCopied(false);
    setExistingShare(null);
    setErrorMessage('');
    onClose();
  };

  if (!galleryId) {
    console.error('ShareGalleryModal: No galleryId provided');
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="font-voga text-xl sm:text-2xl text-black">
              Compartir galería
            </h2>
            <p className="font-fira text-xs sm:text-sm text-gray-500 mt-1">
              Genera un enlace para compartir con tus clientes
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Error message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="font-fira text-sm text-red-800">
                {errorMessage}
              </p>
            </div>
          )}

          {shareLink ? (
            /* Enlace generado */
            <div className="space-y-4">
              {/* Link input */}
              <div>
                <label className="font-fira text-sm font-semibold text-black block mb-2">
                  Enlace compartible
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg font-fira text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2.5 bg-[#79502A] hover:bg-[#8B5A2F] text-white rounded-lg transition-colors flex items-center gap-2 font-fira text-sm font-semibold whitespace-nowrap"
                  >
                    {isCopied ? (
                      <>
                        <Check size={16} />
                        <span className="hidden sm:inline">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Stats */}
              {existingShare && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye size={16} className="text-gray-500" />
                      <span className="font-fira text-sm text-gray-600">
                        <span className="font-semibold text-black">{existingShare.views_count || 0}</span> vistas
                      </span>
                    </div>
                    {existingShare.expires_at && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" />
                        <span className="font-fira text-xs text-gray-600">
                          Expira: {new Date(existingShare.expires_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  {existingShare.last_viewed_at && (
                    <p className="font-fira text-xs text-gray-500 mt-2">
                      Última vista: {new Date(existingShare.last_viewed_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Info box */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="font-fira text-sm text-blue-900">
                  <span className="font-semibold">¿Cómo funciona?</span>
                  <br />
                  Comparte este enlace con tus clientes. Podrán ver, marcar favoritas y descargar sus fotos sin necesidad de crear una cuenta.
                </p>
              </div>

              {/* Deactivate button */}
              <button
                onClick={deactivateShare}
                className="w-full px-4 py-2.5 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-fira text-sm font-semibold"
              >
                Desactivar enlace
              </button>
            </div>
          ) : (
            /* Generar enlace */
            <div className="space-y-4">
              {/* Info box */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="font-fira text-sm text-gray-700">
                  Genera un enlace único para compartir esta galería con tus clientes. Ellos podrán ver las fotos, marcar sus favoritas y descargarlas.
                </p>
              </div>

              {/* Expiration selector */}
              <div>
                <label className="block font-fira text-sm font-semibold text-black mb-2">
                  Tiempo de expiración
                </label>
                <select
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-fira text-sm focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                >
                  <option value={7}>7 días</option>
                  <option value={15}>15 días</option>
                  <option value={30}>30 días (recomendado)</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                  <option value={180}>6 meses</option>
                  <option value={365}>1 año</option>
                </select>
                <p className="font-fira text-xs text-gray-500 mt-2">
                  Después de este tiempo, el enlace dejará de funcionar automáticamente.
                </p>
              </div>

              {/* Generate button */}
              <button
                onClick={generateShareLink}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#79502A] hover:bg-[#8B5A2F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-fira text-sm font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <LinkIcon size={18} />
                    <span>Generar enlace</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}