'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {mounted && createPortal(
        <div className="fixed top-4 right-4 z-[100000] flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map(toast => (
              <ToastItem
                key={toast.id}
                {...toast}
                onClose={() => hideToast(toast.id)}
              />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ id, message, type, onClose }) {
  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-emerald-500',
      text: 'text-white',
      iconClass: 'text-white'
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-500',
      text: 'text-white',
      iconClass: 'text-white'
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-amber-500',
      text: 'text-white',
      iconClass: 'text-white'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-500',
      text: 'text-white',
      iconClass: 'text-white'
    }
  };

  const { icon: Icon, bg, text, iconClass } = config[type] || config.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`${bg} ${text} rounded-xl shadow-2xl px-4 py-3 min-w-[280px] max-w-md pointer-events-auto flex items-start gap-3`}
    >
      <Icon size={20} className={`${iconClass} flex-shrink-0 mt-0.5`} />
      <p className="flex-1 font-fira text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
