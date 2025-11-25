'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Header de la Landing Page
 *
 * Características:
 * - Fondo #2d2d2d con efecto de scroll (blur y opacidad)
 * - Logo a la izquierda
 * - Navegación con efectos hover elegantes
 * - Detalles con líneas finas y brillos
 * - Responsive
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 20);
      setVisible(scrollPosition > 100); // Aparece después de 100px de scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#servicios', label: 'Portafolio' },
    { href: '#testimonios', label: 'Testimonios' },
    { href: '#reservas', label: 'Reservas' },
    { href: '#contacto', label: 'Contacto' },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: visible ? 0 : -100,
        opacity: visible ? 1 : 0
      }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#2d2d2d]/95 backdrop-blur-xl shadow-2xl shadow-black/20'
          : 'bg-[#2d2d2d]/80 backdrop-blur-md'
      }`}
    >
      {/* Línea superior decorativa con brillo */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#B89968]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="relative group flex items-center">
            <div className="relative w-32 h-12 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/img/logos/logo_BN_SF.png"
                alt="Alma Fotografía"
                fill
                className="object-contain"
                priority
              />
            </div>
            {/* Brillo sutil debajo del logo al hover */}
            <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#B89968] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}

            {/* Separador vertical con brillo */}
            <div className="h-6 w-[1px] mx-4 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

            {/* Botón de inicio de sesión */}
            <Link
              href="/auth/login"
              className="group relative px-4 py-2.5 flex items-center gap-2 overflow-hidden"
            >
              {/* Fondo con brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#B89968] to-[#8B5E3C] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-[#B89968]/10 group-hover:bg-transparent transition-colors duration-300" />

              {/* Borde decorativo */}
              <div className="absolute inset-0 border border-[#B89968]/30 group-hover:border-[#B89968] transition-colors duration-300" />

              {/* Brillo animado */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </div>

              {/* Contenido */}
              <User size={18} className="relative z-10 text-[#B89968] group-hover:text-white transition-colors duration-300" />
              <span className="relative z-10 font-fira text-sm text-[#B89968] group-hover:text-white transition-colors duration-300 font-medium">
                Iniciar sesión
              </span>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white transition-colors relative group"
            aria-label="Menú"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-[2px] bg-current transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-[9px]' : ''}`} />
              <span className={`block h-[2px] bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-[2px] bg-current transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Línea inferior decorativa con brillo */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-white/10 bg-[#2d2d2d]/98 backdrop-blur-xl overflow-hidden"
          >
            <nav className="px-4 py-6 space-y-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <a
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200 border-l-2 border-transparent hover:border-[#B89968] font-fira"
                  >
                    {link.label}
                  </a>
                </motion.div>
              ))}

              {/* Separador */}
              <div className="h-[1px] my-4 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Login móvil */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.1 }}
              >
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-[#B89968] hover:text-white hover:bg-white/5 transition-all duration-200 border-l-2 border-[#B89968] font-fira"
                >
                  <User size={18} />
                  <span>Iniciar sesión</span>
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/**
 * NavLink Component - Link de navegación con efectos elegantes
 */
function NavLink({ href, children }) {
  return (
    <a
      href={href}
      className="group relative px-4 py-2 font-fira text-sm !text-white hover:!text-white transition-colors duration-300"
    >
      {/* Texto */}
      <span className="relative z-10 !text-white">{children}</span>

      {/* Línea inferior animada */}
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#B89968] to-transparent transition-all duration-300" />

      {/* Brillo sutil de fondo */}
      <span className="absolute inset-0 rounded opacity-0 group-hover:opacity-100 bg-white/5 transition-opacity duration-300" />
    </a>
  );
}
