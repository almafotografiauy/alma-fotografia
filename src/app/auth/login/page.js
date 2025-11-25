'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser } from '@/app/actions/auth-actions';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Home } from 'lucide-react';

/**
 * LoginPage - Página de inicio de sesión elegante
 * Diseño minimalista con animaciones fluidas
 */
export default function LoginPage() {
  const router = useRouter();

  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Estados de focus
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Estado para partículas decorativas
  const [particles, setParticles] = useState([]);

  // Generar partículas flotantes (reducido para mejor performance)
  useEffect(() => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  // Función para manejar el inicio de sesión
  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const result = await loginUser({
      usernameOrEmail: email,
      password: password,
    });

    if (!result.success) {
      setLoading(false);
      setErrorMsg(result.error || 'Credenciales incorrectas');
    } else {
      setSuccess(true);
      // Redirigir inmediatamente sin delay para mayor velocidad
      router.replace('/dashboard');
    }
  }

  return (
    <main className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo con gradiente animado */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]" />

        {/* Círculos decorativos difuminados */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -left-32 w-96 h-96 bg-[#8B5E3C] rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#6d4a2f] rounded-full blur-[120px]"
        />

        {/* Partículas flotantes */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-[#8B5E3C]/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Botón de volver al inicio */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 left-6 z-20"
      >
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors group"
        >
          <Home size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-fira text-sm">Volver al inicio</span>
        </Link>
      </motion.div>

      {/* Contenedor principal */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Tarjeta del formulario */}
        <div className="relative">
          {/* Borde brillante animado */}
          <motion.div
            className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-[#8B5E3C]/50 via-[#B89968]/30 to-[#8B5E3C]/50"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% 200%' }}
          />

          {/* Contenido del formulario */}
          <div className="relative bg-[#2d2d2d] rounded-2xl p-8 sm:p-10">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <div className="relative w-32 h-12">
                <Image
                  src="/img/logos/logo_BN_SF.png"
                  alt="Alma Fotografía"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>

            {/* Título */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#8B5E3C]" />
                <Sparkles size={16} className="text-[#8B5E3C]" />
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#8B5E3C]" />
              </div>
              <h1 className="font-voga text-3xl text-white mb-2">Bienvenida</h1>
              <p className="font-fira text-sm text-gray-400">
                Ingresá a tu panel de administración
              </p>
            </motion.div>

            {/* Formulario */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Campo de email */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block font-fira text-xs text-gray-400 mb-2 uppercase tracking-wider">
                  Usuario o Email
                </label>
                <div className="relative group">
                  {/* Icono */}
                  <Mail
                    size={18}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${
                      emailFocused ? 'text-[#8B5E3C]' : 'text-gray-500'
                    }`}
                  />

                  {/* Efecto de brillo en focus */}
                  <AnimatePresence>
                    {emailFocused && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-lg bg-[#8B5E3C]/10 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  {/* Input */}
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className={`w-full pl-12 pr-4 py-3.5 bg-[#1a1a1a] border rounded-lg font-fira text-white placeholder-gray-600 focus:outline-none transition-all duration-300 ${
                      emailFocused
                        ? 'border-[#8B5E3C] shadow-[0_0_20px_rgba(139,94,60,0.15)]'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    placeholder="tu@email.com"
                    required
                  />

                  {/* Línea animada inferior */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#8B5E3C] to-[#B89968] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: emailFocused ? '100%' : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>

              {/* Campo de contraseña */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block font-fira text-xs text-gray-400 mb-2 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative group">
                  {/* Icono */}
                  <Lock
                    size={18}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${
                      passwordFocused ? 'text-[#8B5E3C]' : 'text-gray-500'
                    }`}
                  />

                  {/* Efecto de brillo en focus */}
                  <AnimatePresence>
                    {passwordFocused && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-lg bg-[#8B5E3C]/10 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  {/* Input */}
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`w-full pl-12 pr-12 py-3.5 bg-[#1a1a1a] border rounded-lg font-fira text-white placeholder-gray-600 focus:outline-none transition-all duration-300 ${
                      passwordFocused
                        ? 'border-[#8B5E3C] shadow-[0_0_20px_rgba(139,94,60,0.15)]'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    placeholder="••••••••"
                    required
                  />

                  {/* Botón mostrar/ocultar contraseña */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  {/* Línea animada inferior */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#8B5E3C] to-[#B89968] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: passwordFocused ? '100%' : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>

              {/* Mensaje de error */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="font-fira text-sm text-red-400 text-center">
                        {errorMsg}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón de submit */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <button
                  type="submit"
                  disabled={loading || success}
                  className="relative w-full mt-4 py-4 rounded-lg font-fira font-semibold text-sm uppercase tracking-wider overflow-hidden group disabled:cursor-not-allowed"
                >
                  {/* Fondo del botón */}
                  <div className={`absolute inset-0 transition-all duration-500 ${
                    success
                      ? 'bg-green-600'
                      : 'bg-gradient-to-r from-[#8B5E3C] to-[#6d4a2f] group-hover:from-[#6d4a2f] group-hover:to-[#8B5E3C]'
                  }`} />

                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>

                  {/* Contenido del botón */}
                  <span className="relative z-10 flex items-center justify-center gap-2 !text-white">
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span>Ingresando...</span>
                      </>
                    ) : success ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          <Sparkles size={18} />
                        </motion.div>
                        <span>¡Bienvenida!</span>
                      </>
                    ) : (
                      <>
                        <span>Ingresar</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            </form>

            {/* Decoración inferior */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 pt-6 border-t border-gray-700/50"
            >
              <p className="font-fira text-xs text-gray-500 text-center">
                Panel exclusivo para administradores
              </p>
            </motion.div>
          </div>
        </div>

        {/* Esquinas decorativas */}
        <div className="absolute -top-2 -left-2 w-6 h-6 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#8B5E3C] to-transparent" />
          <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#8B5E3C] to-transparent" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#8B5E3C] to-transparent" />
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-[#8B5E3C] to-transparent" />
        </div>
        <div className="absolute -bottom-2 -left-2 w-6 h-6 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#8B5E3C] to-transparent" />
          <div className="absolute bottom-0 left-0 w-[1px] h-full bg-gradient-to-t from-[#8B5E3C] to-transparent" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#8B5E3C] to-transparent" />
          <div className="absolute bottom-0 right-0 w-[1px] h-full bg-gradient-to-t from-[#8B5E3C] to-transparent" />
        </div>
      </motion.div>
    </main>
  );
}
