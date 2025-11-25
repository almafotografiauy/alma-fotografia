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
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import NotificationBell from '@/components/ui/NotificationBell';
import { ToastProvider } from '@/components/ui/Toast';
import SessionTimeout from '@/components/SessionTimeout';

/**
 * REDISEÑO UI - DashboardLayoutClient
 *
 * PALETA BLANCO PREDOMINANTE:
 * - Sidebar: #2D2D2D (gris oscuro)
 * - Área principal: #FFFFFF (blanco puro)
 * - Acentos: #8B5E3C (marrón cálido)
 * - Item activo: #8B5E3C
 * - Bordes: #E5E7EB (gris sutil)
 * - Texto: #2D2D2D (oscuro)
 * - Texto secundario: #6B7280 (gris)
 *
 * Funcionalidad preservada:
 * - Navegación con pathname detection
 * - Sidebar mobile con framer-motion
 * - Logout con Supabase
 * - Sistema de notificaciones
 * - ToastProvider
 * - Responsive design
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
      label: 'Agenda',
      href: '/dashboard/agenda',
      icon: Calendar,
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
    <ToastProvider>
      <SessionTimeout />
    <div className="min-h-screen bg-white flex">
      {/* ============================================ */}
      {/* SIDEBAR DESKTOP */}
      {/* ============================================ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[280px] lg:fixed lg:inset-y-0 bg-[#2D2D2D] shadow-lg">
        {/* Logo */}
        <div className="p-8 border-b border-white/10 flex flex-col items-center justify-center">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-2 transition-transform duration-200 hover:scale-105"
          >
            <Image
              src="/img/logos/logo_BN_SF.png"
              alt="Alma Fotografía"
              width={180}
              height={132}
              className="w-auto h-20 object-contain"
              priority
              quality={100}
            />
          </Link>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center gap-3 px-4 py-3.5 rounded-lg
                  overflow-hidden transition-all duration-200 ease-in-out
                  ${isActive
                    ? 'bg-[#8B5E3C] !text-white shadow-md'
                    : '!text-white/70 hover:bg-white/10 hover:!text-white'
                  }
                `}
              >
                {/* Contenido */}
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <Icon
                    size={20}
                    className={`
                      transition-all duration-200
                      ${isActive
                        ? '!text-white'
                        : '!text-white/70 group-hover:!text-white group-hover:scale-110'
                      }
                    `}
                    strokeWidth={2}
                  />
                  <span className={`font-medium text-sm transition-colors duration-200 ${isActive ? '!text-white' : '!text-white/70 group-hover:!text-white'}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer con notificaciones, usuario y logout */}
        <div className="p-6 border-t border-white/10 space-y-4">
          {/* Usuario - Desktop */}
          <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg">
            <NotificationBell />
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/50 font-medium">
                Cuenta
              </p>
              <p className="font-medium text-sm text-white truncate">
                {userName}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#8B5E3C] hover:bg-[#6d4a2f] text-white transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut size={18} strokeWidth={2} />
            <span className="font-medium text-sm">
              Salir
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
                duration: 0.25,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[#2D2D2D] shadow-2xl z-50 lg:hidden flex flex-col"
            >
              {/* Header con logo y botón cerrar */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex flex-col items-center gap-1">
                  <Image
                    src="/img/logos/logo_BN_SF.png"
                    alt="Alma Fotografía"
                    width={150}
                    height={110}
                    className="w-auto h-16 object-contain"
                    priority
                    quality={100}
                  />
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <X size={20} className="text-white" strokeWidth={2} />
                </button>
              </div>

              {/* Navegación */}
              <nav className="flex-1 p-6 space-y-1">
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
                        group relative flex items-center gap-3 px-4 py-3.5 rounded-lg
                        overflow-hidden transition-all duration-200 ease-in-out
                        ${isActive
                          ? 'bg-[#8B5E3C] !text-white shadow-md'
                          : '!text-white/70 hover:bg-white/10 hover:!text-white'
                        }
                      `}
                    >
                      {/* Contenido */}
                      <div className="relative z-10 flex items-center gap-3 w-full">
                        <Icon
                          size={20}
                          className={`
                            transition-all duration-200
                            ${isActive
                              ? '!text-white'
                              : '!text-white/70 group-hover:!text-white group-hover:scale-110'
                            }
                          `}
                          strokeWidth={2}
                        />
                        <span className={`font-medium text-sm transition-colors duration-200 ${isActive ? '!text-white' : '!text-white/70 group-hover:!text-white'}`}>
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 space-y-4">
                <div className="px-3 py-2 bg-white/5 rounded-lg">
                  <p className="text-xs uppercase tracking-wider text-white/50 font-medium mb-1">
                    Cuenta
                  </p>
                  <p className="font-medium text-sm text-white truncate">
                    {userName}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#8B5E3C] hover:bg-[#6d4a2f] text-white transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LogOut size={18} strokeWidth={2} />
                  <span className="font-medium text-sm">
                    Salir
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
        <header className="lg:hidden sticky top-0 z-30 bg-[#2D2D2D] shadow-md px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 transition-transform duration-200 hover:scale-105">
              <Image
                src="/img/logos/logo_BN_SF.png"
                alt="Alma Fotografía"
                width={120}
                height={48}
                className="w-auto h-12 object-contain"
                priority
              />
            </Link>

            {/* Notificaciones + Menu - Mobile */}
            <div className="flex items-center gap-2">
              <NotificationBell isMobile />

              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <Menu size={24} className="text-white" strokeWidth={2} />
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
    </ToastProvider>
  );
}