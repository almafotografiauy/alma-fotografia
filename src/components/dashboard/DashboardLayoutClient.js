'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import NotificationBell from '@/components/ui/NotificationBell';

/**
 * DashboardLayoutClient - Layout del dashboard con sidebar oscuro
 * 
 * Maneja:
 * - Navegación con animaciones
 * - Sidebar mobile con framer-motion
 * - Logout
 * - Notificaciones (nuevo)
 */
export default function DashboardLayoutClient({ children, userName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Inicio',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Galerías',
      href: '/dashboard/galerias',
      icon: ImageIcon,
    },
    {
      label: 'Testimonios',
      href: '/dashboard/testimonios',
      icon: MessageSquare,
    },
    {
      label: 'Configuración',
      href: '/dashboard/configuracion',
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* ============================================ */}
      {/* SIDEBAR DESKTOP */}
      {/* ============================================ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[280px] lg:fixed lg:inset-y-0 border-r border-white/10 bg-[#1a1a1a]">
        {/* Logo */}
        <div className="p-8 border-b border-white/10 flex flex-col items-center justify-center gap-3">
          <Link href="/dashboard" className="flex flex-col items-center gap-2">
            <Image
              src="/img/logos/Logo_BN_SF.png"
              alt="Alma Fotografía Logo"
              width={180}
              height={132}
              className="w-auto h-22 object-contain"
              priority
              quality={100}
            />
          </Link>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center gap-3 px-4 py-3
                  overflow-hidden transition-all duration-300
                  ${isActive
                    ? '!text-white'
                    : '!text-white/60 hover:!text-white'
                  }
                `}
              >
                {/* Línea lateral animada */}
                <div
                  className={`
                    absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300
                    ${isActive
                      ? 'bg-[#caad81] scale-y-100'
                      : 'bg-[#caad8166] scale-y-0 group-hover:scale-y-100'
                    }
                  `}
                  style={{ transformOrigin: 'top' }}
                />

                {/* Fondo animado */}
                <div
                  className={`
                    absolute inset-0 transition-all duration-300
                    ${isActive
                      ? 'bg-[#caad8166] scale-x-100'
                      : 'bg-[#caad8122] scale-x-0 group-hover:scale-x-100'
                    }
                  `}
                  style={{ transformOrigin: 'left' }}
                />

                {/* Contenido */}
                <div className="relative z-10 flex items-center gap-3">
                  <Icon
                    size={20}
                    className={`
                      transition-all duration-300
                      ${isActive
                        ? 'text-white'
                        : 'text-white/60 group-hover:text-white group-hover:scale-110'
                      }
                    `}
                    strokeWidth={1.5}
                  />
                  <span className="font-fira font-medium text-sm">
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer con notificaciones, usuario y logout */}
        <div className="p-6 border-t border-white/10 space-y-3">
          {/* Notificaciones - Desktop */}
          <div className="flex justify-center mb-2">
            <NotificationBell />
          </div>

          <div className="px-4 py-2">
            <p className="font-fira text-xs uppercase tracking-wider text-white/40 mb-1">
              Usuario
            </p>
            <p className="font-fira font-medium text-sm text-white truncate">
              {userName}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-none bg-white/10 hover:bg-white/15 transition-colors duration-200"
          >
            <LogOut size={20} strokeWidth={1.5} className="!text-white" />
            <span className="font-fira font-medium text-sm !text-white">
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      {/* ============================================ */}
      {/* SIDEBAR MOBILE */}
      {/* ============================================ */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Panel lateral mobile */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[#1a1a1a] border-r border-white/10 z-50 lg:hidden flex flex-col"
            >
              {/* Header con logo y botón cerrar */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex flex-col items-center gap-1">
                  <Image
                    src="/img/logos/Logo_BN_SF.png"
                    alt="Alma Fotografía Logo"
                    width={150}
                    height={110}
                    className="w-auto h-16 object-contain"
                    priority
                    quality={100}
                  />
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-none transition-colors"
                >
                  <X size={20} className="text-white" strokeWidth={1.5} />
                </button>
              </div>

              {/* Navegación */}
              <nav className="flex-1 p-6 space-y-2 !text-white">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group relative flex items-center gap-3 px-4 py-3
                        overflow-hidden transition-all duration-300
                        ${isActive
                          ? 'text-white'
                          : 'text-white/60 hover:text-white'
                        }
                      `}
                    >
                      {/* Línea lateral animada */}
                      <div
                        className={`
                          absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300
                          ${isActive
                            ? 'bg-[#caad81] scale-y-100'
                            : 'bg-[#caad8166] scale-y-0 group-hover:scale-y-100'
                          }
                        `}
                        style={{ transformOrigin: 'top' }}
                      />

                      {/* Fondo animado */}
                      <div
                        className={`
                          absolute inset-0 transition-all duration-300
                          ${isActive
                            ? 'bg-[#caad8166] scale-x-100'
                            : 'bg-[#caad8122] scale-x-0 group-hover:scale-x-100'
                          }
                        `}
                        style={{ transformOrigin: 'left' }}
                      />

                      {/* Contenido */}
                      <div className="relative z-10 flex items-center gap-3">
                        <Icon
                          size={20}
                          className={`
                            transition-all duration-300
                            ${isActive
                              ? 'text-white'
                              : 'text-white/60 group-hover:text-white group-hover:scale-110'
                            }
                          `}
                          strokeWidth={1.5}
                        />
                        <span className="!text-white font-fira font-medium text-sm">
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 space-y-3">
                <div className="px-4 py-2">
                  <p className="font-fira text-xs uppercase tracking-wider text-white/40 mb-1">
                    Usuario
                  </p>
                  <p className="font-fira font-medium text-sm text-white">
                    {userName}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-none bg-white/10 hover:bg-white/15 transition-colors duration-200"
                >
                  <LogOut size={20} strokeWidth={1.5} className="!text-white" />
                  <span className="font-fira font-medium text-sm !text-white">
                    Cerrar sesión
                  </span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      {/* ============================================ */}
      <main className="flex-1 lg:ml-[280px] bg-white">
        {/* Header mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#1a1a1a] border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/img/logos/Logo_BN_SF.png"
                alt="Alma Fotografía Logo"
                className="w-auto h-12 object-contain brightness-0 invert"
              />
            </div>
            
            {/* Notificaciones + Menu - Mobile */}
            <div className="flex items-center gap-2">
              <NotificationBell isMobile />
              
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-white/10 rounded-none transition-colors"
              >
                <Menu size={24} className="text-white" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </header>

        {/* Contenido de las páginas */}
        <div className="p-6 lg:p-12 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}