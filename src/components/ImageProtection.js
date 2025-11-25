'use client';

import { useEffect } from 'react';

/**
 * ImageProtection - Componente que protege las imágenes del sitio
 * Deshabilita el click derecho y el arrastre de imágenes
 */
export default function ImageProtection() {
  useEffect(() => {
    // Deshabilitar click derecho en imágenes
    const handleContextMenu = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // Deshabilitar arrastre de imágenes
    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // Deshabilitar combinaciones de teclado para guardar
    const handleKeyDown = (e) => {
      // Ctrl+S o Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    // Agregar event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
}
