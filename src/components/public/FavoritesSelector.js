'use client';

import { useState, useEffect } from 'react';
import { Heart, X, Send, Loader2, CheckCircle, Edit, Share2, Check, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitFavoritesSelection } from '@/app/actions/favorites-actions';
import { useToast } from '@/components/ui/Toast';

/**
 * Codifica el email a hash para compartir
 */
function encodeEmailToHash(email) {
  if (typeof window === 'undefined') return '';
  return btoa(email.toLowerCase().trim());
}

/**
 * FavoritesSelector - Floating button y modal para gestionar favoritos
 *
 * Muestra:
 * - Floating button con contador de favoritas
 * - Modal con lista de fotos seleccionadas
 * - Botón para enviar selección
 */
export default function FavoritesSelector({
  favoritesCount,
  maxFavorites,
  selectedPhotoIds,
  photos,
  galleryId,
  gallerySlug,
  shareToken,
  clientEmail,
  clientName,
  onRemoveFavorite,
  hasSubmitted = false,
  isEditingAfterSubmit = false,
  onEnableEditing,
  onSubmitAfterEdit,
}) {
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { showToast } = useToast();

  const selectedPhotos = photos.filter(p => selectedPhotoIds.includes(p.id));
  const hasSelection = favoritesCount > 0;

  // Generar URL de favoritos compartidos
  const generateShareUrl = () => {
    if (!clientEmail || !gallerySlug || !shareToken) return '';
    const hash = encodeEmailToHash(clientEmail);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/galeria/${gallerySlug}/favoritos/${hash}?token=${shareToken}`;
  };

  // Compartir - copiar enlace
  const handleCopyLink = async () => {
    const shareUrl = generateShareUrl();
    if (!shareUrl) {
      showToast({ message: 'Error al generar el enlace', type: 'error' });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      showToast({ message: 'Enlace copiado al portapapeles', type: 'success' });
    } catch (error) {
      showToast({ message: 'Error al copiar el enlace', type: 'error' });
    }
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    const shareUrl = generateShareUrl();
    if (!shareUrl) return;

    const text = `Mira mis fotos favoritas de la galería`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
  };

  // Compartir por Email
  const handleShareEmail = () => {
    const shareUrl = generateShareUrl();
    if (!shareUrl) return;

    const subject = `Mis Fotos Favoritas`;
    const body = `Te comparto mi selección de fotos favoritas:\n\n${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async () => {
    if (favoritesCount === 0) return;

    setIsSubmitting(true);

    try {
      const result = await submitFavoritesSelection(galleryId, clientEmail, clientName);

      if (result.success) {
        setSubmitSuccess(true);

        // Si es edición, llamar al callback
        if (isEditingAfterSubmit) {
          onSubmitAfterEdit?.();
        }

        setTimeout(() => {
          setShowModal(false);
          setSubmitSuccess(false);
        }, 2000);
      } else {
        showToast({ message: result.error || 'Error al enviar la selección', type: 'error' });
      }
    } catch (error) {
      showToast({ message: 'Error al enviar la selección. Intenta de nuevo.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasSelection) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setShowModal(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full shadow-2xl p-4 flex items-center gap-3 group"
      >
        <Heart size={24} className="fill-white" />
        <div className="flex flex-col items-start pr-2">
          <span className="font-fira text-xs font-semibold">
            {favoritesCount} / {maxFavorites}
          </span>
          <span className="font-fira text-[10px] opacity-90">
            Favoritas
          </span>
        </div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="font-voga text-2xl text-black">
                    Mis Fotos Favoritas
                  </h2>
                  <p className="font-fira text-sm text-gray-600 mt-1">
                    {favoritesCount} de {maxFavorites} seleccionadas
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Photos Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {submitSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <CheckCircle size={64} className="text-green-500 mb-4" />
                    <h3 className="font-voga text-2xl text-black mb-2">
                      ¡Selección enviada!
                    </h3>
                    <p className="font-fira text-sm text-gray-600 text-center">
                      El fotógrafo recibirá tu selección de {favoritesCount} fotos favoritas.
                    </p>
                  </motion.div>
                ) : selectedPhotos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Heart size={48} className="text-gray-300 mb-3" />
                    <p className="font-fira text-sm text-gray-500">
                      No has seleccionado ninguna foto favorita
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedPhotos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.cloudinary_url || photo.file_path}
                          alt={photo.file_name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => onRemoveFavorite(photo.id)}
                          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} className="text-red-500" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-white text-[10px] font-fira">
                          Foto {photos.findIndex(p => p.id === photo.id) + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!submitSuccess && (
                <div className="p-6 border-t border-gray-200">
                  {hasSubmitted && !isEditingAfterSubmit ? (
                    // Ya fue enviado - Mostrar botón de editar
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <p className="font-fira text-sm text-green-800 font-semibold">
                          Selección enviada al fotógrafo
                        </p>
                      </div>
                      <button
                        onClick={onEnableEditing}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-fira font-semibold flex items-center justify-center gap-2 transition-all"
                      >
                        <Edit size={20} />
                        <span>Editar Selección</span>
                      </button>
                      <p className="font-fira text-xs text-gray-500 text-center mt-3">
                        Puedes modificar tu selección y notificar nuevamente
                      </p>
                    </>
                  ) : (
                    // No enviado o editando - Mostrar botón de enviar
                    <>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || favoritesCount === 0}
                        className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg font-fira font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Send size={20} />
                            <span>{isEditingAfterSubmit ? 'Notificar Cambios' : 'Enviar Selección'}</span>
                          </>
                        )}
                      </button>

                      {/* Botón compartir favoritas */}
                      {gallerySlug && shareToken && (
                        <button
                          onClick={() => setShowShareModal(true)}
                          className="w-full py-2.5 mt-2 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg font-fira font-medium flex items-center justify-center gap-2 transition-all"
                        >
                          <Share2 size={18} />
                          <span>Compartir Mis Favoritas</span>
                        </button>
                      )}

                      <p className="font-fira text-xs text-gray-500 text-center mt-3">
                        {isEditingAfterSubmit
                          ? 'El fotógrafo recibirá una notificación con tus cambios'
                          : 'Al enviar, el fotógrafo recibirá tu selección de fotos favoritas'
                        }
                      </p>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Compartir Favoritas */}
      <AnimatePresence>
        {showShareModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowShareModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-sm bg-white rounded-sm shadow-2xl z-50 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl text-black" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Compartir favoritas
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X size={20} strokeWidth={1.5} className="text-black/60" />
                </button>
              </div>

              <p className="text-sm text-black/60 mb-6 font-light">
                Comparte tu selección de {favoritesCount} foto{favoritesCount !== 1 ? 's' : ''} favorita{favoritesCount !== 1 ? 's' : ''}
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-black/10 hover:border-black/20 rounded-sm transition-colors text-left"
                >
                  {linkCopied ? (
                    <Check size={18} strokeWidth={1.5} className="text-green-600" />
                  ) : (
                    <Share2 size={18} strokeWidth={1.5} className="text-black/60" />
                  )}
                  <span className="text-sm text-black/80 font-light">
                    {linkCopied ? 'Enlace copiado' : 'Copiar enlace'}
                  </span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-black/10 hover:border-black/20 rounded-sm transition-colors text-left"
                >
                  <svg className="w-[18px] h-[18px] text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="text-sm text-black/80 font-light">
                    Compartir por WhatsApp
                  </span>
                </button>

                <button
                  onClick={handleShareEmail}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-black/10 hover:border-black/20 rounded-sm transition-colors text-left"
                >
                  <Mail size={18} strokeWidth={1.5} className="text-black/60" />
                  <span className="text-sm text-black/80 font-light">
                    Compartir por email
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
