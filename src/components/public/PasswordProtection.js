'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';

/**
 * PasswordProtection - Formulario de contraseña para galerías protegidas
 *
 * Muestra un formulario elegante para ingresar contraseña antes de ver la galería
 */
export default function PasswordProtection({ galleryTitle, coverImage, onPasswordSubmit }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Por favor ingresa la contraseña');
      return;
    }

    setError('');
    setIsValidating(true);

    // Llamar al callback con la contraseña
    const result = await onPasswordSubmit(password);

    if (!result.success) {
      setError(result.error || 'Contraseña incorrecta');
      setIsValidating(false);
      setPassword('');
    }
    // Si es success, el componente padre se encargará de mostrar la galería
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/95 via-[#79502A]/20 to-black/95 flex items-center justify-center p-4">
      {/* Background image con overlay */}
      {coverImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={coverImage}
            alt={galleryTitle}
            fill
            className="object-cover opacity-20"
            priority
            quality={60}
          />
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        </div>
      )}

      {/* Formulario */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#79502A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#79502A]" />
            </div>
            <h1 className="font-voga text-2xl md:text-3xl text-black mb-2">
              Galería Protegida
            </h1>
            <p className="font-fira text-sm text-black/60">
              {galleryTitle}
            </p>
            <p className="font-fira text-sm text-black/60 mt-2">
              Esta galería está protegida con contraseña
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password input */}
            <div>
              <label className="block font-fira text-sm font-medium text-black mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Ingresa la contraseña"
                  disabled={isValidating}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg font-fira text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isValidating}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="font-fira text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isValidating || !password.trim()}
              className="!text-white w-full py-3 bg-[#79502A] hover:bg-[#8B5A2F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-fira text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Acceder a la galería</span>
                </>
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="font-fira text-xs text-center text-gray-500">
              Si no tienes la contraseña, contacta al fotógrafo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
