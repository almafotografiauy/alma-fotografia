'use client';

import { useState, useEffect } from 'react';
import PasswordProtection from './PasswordProtection';
import PublicGalleryView from './PublicGalleryView';
import { validateGalleryPassword } from '@/app/actions/password-actions';

/**
 * ProtectedGalleryWrapper - Maneja la protección por contraseña de galerías
 *
 * Si la galería tiene contraseña:
 * 1. Verifica si ya fue desbloqueada en sessionStorage
 * 2. Si no, muestra PasswordProtection
 * 3. Al validar, guarda en sessionStorage y muestra la galería
 */
export default function ProtectedGalleryWrapper({ gallery, token }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const hasPassword = gallery.password && gallery.password.trim() !== '';
  const storageKey = `gallery_unlocked_${gallery.id}`;

  // Verificar si ya fue desbloqueada
  useEffect(() => {
    if (!hasPassword) {
      setIsUnlocked(true);
      setIsChecking(false);
      return;
    }

    // Verificar sessionStorage
    const unlocked = sessionStorage.getItem(storageKey);
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
    setIsChecking(false);
  }, [hasPassword, storageKey]);

  const handlePasswordSubmit = async (password) => {
    const result = await validateGalleryPassword(gallery.id, password);

    if (result.success) {
      // Guardar en sessionStorage
      sessionStorage.setItem(storageKey, 'true');
      setIsUnlocked(true);
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Contraseña incorrecta'
    };
  };

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#79502A]/30 border-t-[#79502A] rounded-full animate-spin" />
      </div>
    );
  }

  // Mostrar protección por contraseña
  if (hasPassword && !isUnlocked) {
    return (
      <PasswordProtection
        galleryTitle={gallery.title}
        coverImage={gallery.coverImage}
        onPasswordSubmit={handlePasswordSubmit}
      />
    );
  }

  // Mostrar galería
  return <PublicGalleryView gallery={gallery} token={token} />;
}
