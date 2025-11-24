'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Modal - Componente de modal reutilizable con Portal
 * 
 * Tipos:
 * - success: Verde con check
 * - error: Rojo con alerta
 * - warning: Naranja con triángulo
 * - info: Azul con info (default)
 */
export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  confirmText = 'Aceptar',
  cancelText,
  onConfirm,
  onCancel
}) {
  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle size={48} className="text-green-600" strokeWidth={1.5} />,
    error: <AlertCircle size={48} className="text-red-600" strokeWidth={1.5} />,
    warning: <AlertTriangle size={48} className="text-orange-600" strokeWidth={1.5} />,
    info: <AlertCircle size={48} className="text-blue-600" strokeWidth={1.5} />,
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999]" 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 min-h-[100vh] bg-black/60 backdrop-blur-sm"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%'
            }}
          />

          {/* Modal container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  {icons[type]}
                  <h3 className="font-fira text-lg font-semibold text-black">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-black/40 hover:text-black transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="font-fira text-sm text-black/70 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
                {cancelText && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancel}
                    className="px-4 py-2 border-2 border-gray-300 text-black font-fira text-sm font-medium
                      rounded-lg transition-all hover:border-gray-400 hover:bg-gray-100"
                  >
                    {cancelText}
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-[#79502A] !text-white font-fira text-sm font-medium
                    rounded-lg transition-all hover:bg-[#8B5A2F] shadow-sm"
                >
                  {confirmText}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  // Renderizar en el body usando portal
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}