'use client';

import { X, AlertTriangle, Archive, Trash2, ArchiveRestore } from 'lucide-react';

/**
 * ConfirmModal - Modal de confirmación profesional
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: función
 * - onConfirm: función
 * - title: string
 * - message: string
 * - confirmText: string (default "Confirmar")
 * - cancelText: string (default "Cancelar")
 * - variant: 'danger' | 'warning' | 'info' (default 'warning')
 * - icon: 'archive' | 'delete' | 'restore' (optional)
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  icon,
  count,
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
      border: 'border-red-200',
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700',
      border: 'border-amber-200',
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      border: 'border-blue-200',
    },
  };

  const styles = variantStyles[variant];

  const IconComponent = icon === 'archive' 
    ? Archive 
    : icon === 'delete' 
    ? Trash2 
    : icon === 'restore'
    ? ArchiveRestore
    : AlertTriangle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl">
        {/* Header con ícono */}
        <div className={`${styles.bg} ${styles.border} border-b p-6 rounded-t-xl`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 ${styles.bg} rounded-full border-2 ${styles.border}`}>
              <IconComponent size={24} className={styles.icon} />
            </div>
            <div className="flex-1">
              <h3 className="font-voga text-xl text-black mb-1">{title}</h3>
              {count && (
                <p className="font-fira text-sm text-gray-600">
                  {count} {count === 1 ? 'galería seleccionada' : 'galerías seleccionadas'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="font-fira text-sm text-gray-700 leading-relaxed">
            {message}
          </p>

          {variant === 'danger' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-fira text-xs text-red-800">
                ⚠️ Esta acción no se puede deshacer
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-xl flex gap-3">
          <button
            onClick={onClose}
            className="!text-[#2d2d2d] flex-1 px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg font-fira text-sm font-semibold transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`!text-white flex-1 px-4 py-2.5 ${styles.button} text-white rounded-lg font-fira text-sm font-semibold transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}