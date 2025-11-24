'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CambiarContrasenaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Validaciones de contraseña en tiempo real
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validar contraseña en tiempo real
    if (field === 'newPassword') {
      setPasswordValidation({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
      });
    }
  };

  async function handleChangePassword(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Validar que las contraseñas coincidan
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validar contraseña segura
    if (!Object.values(passwordValidation).every(v => v)) {
      setErrorMsg('La contraseña no cumple con todos los requisitos de seguridad');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setErrorMsg(result.error || 'Error al cambiar la contraseña');
        setLoading(false);
        return;
      }

      setSuccessMsg('Contraseña cambiada correctamente. Redirigiendo...');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1500);
    } catch (error) {
      setErrorMsg('Error al cambiar la contraseña');
      setLoading(false);
    }
  }

  const isPasswordValid = Object.values(passwordValidation).every(v => v);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Cambiar Contraseña
          </h1>
          <p className="text-gray-600">
            Por seguridad, debés cambiar tu contraseña antes de continuar
          </p>
        </div>

        {/* Formulario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
        >
          <form onSubmit={handleChangePassword} className="space-y-6">
            {/* Contraseña actual */}
            <div>
              <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                Contraseña actual
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                  placeholder="••••••••"
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  required
                />
              </div>

              {/* Validaciones de contraseña */}
              {formData.newPassword && (
                <div className="mt-3 space-y-1.5 bg-gray-50 rounded-lg p-3">
                  <ValidationItem valid={passwordValidation.length} text="Al menos 8 caracteres" />
                  <ValidationItem valid={passwordValidation.uppercase} text="Una mayúscula" />
                  <ValidationItem valid={passwordValidation.lowercase} text="Una minúscula" />
                  <ValidationItem valid={passwordValidation.number} text="Un número" />
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block font-fira text-sm font-semibold text-gray-700 mb-2">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/10 font-fira text-sm text-gray-900 transition-all"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Mensaje de error */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <p className="font-fira text-sm text-red-800">
                    {errorMsg}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Mensaje de éxito */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  <p className="font-fira text-sm text-green-800">
                    {successMsg}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full px-6 py-2.5 bg-[#8B5E3C] text-white rounded-lg font-fira text-sm font-semibold hover:bg-[#6d4a2f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Cambiando contraseña...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Cambiar contraseña</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

// Componente para mostrar validaciones
function ValidationItem({ valid, text }) {
  return (
    <div className="flex items-center gap-2">
      {valid ? (
        <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
      )}
      <span className={`text-xs font-medium font-fira ${valid ? 'text-green-700' : 'text-gray-600'}`}>
        {text}
      </span>
    </div>
  );
}
