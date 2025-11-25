'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

/**
 * DashboardSidebar - Navegación lateral con tema oscuro
 */
export default function DashboardSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      name: 'Inicio',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Galerías',
      href: '/dashboard/galerias',
      icon: ImageIcon,
    },
    {
      name: 'Testimonios',
      href: '/dashboard/testimonios',
      icon: MessageSquare,
    },
    {
      name: 'Configuración',
      href: '/dashboard/configuracion',
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-black border-r border-white/10 flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-white/10">
        <h1 className="font-voga text-2xl text-white">
          ALMA
        </h1>
        <p className="font-fira text-xs text-white/50 mt-1">
          FOTOGRAFÍA
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group
                  ${active
                    ? 'bg-white !text-black'
                    : '!text-white/70 hover:bg-white/10 hover:!text-white'
                  }`}
              >
                <Icon
                  size={20}
                  className={`transition-colors ${
                    active ? '!text-black' : '!text-white/70 group-hover:!text-white'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={`font-fira text-sm font-medium ${
                  active ? '!text-black' : '!text-white/70 group-hover:!text-white'
                }`}>
                  {item.name}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3">
          <p className="font-fira text-xs !text-white/40 uppercase tracking-wide mb-1">
            Usuario
          </p>
          <p className="font-fira text-sm !text-white font-medium truncate">
            {user?.email || 'admin'}
          </p>
        </div>

        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
            !text-white/70 hover:bg-white/10 hover:!text-white transition-all group"
        >
          <LogOut
            size={20}
            className="!text-white/70 group-hover:!text-white transition-colors"
            strokeWidth={2}
          />
          <span className="font-fira text-sm font-medium !text-white/70 group-hover:!text-white transition-colors">
            Cerrar sesión
          </span>
        </motion.button>
      </div>
    </aside>
  );
}