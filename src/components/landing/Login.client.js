'use client';

/**
 * Login - Client Component
 *
 * Botón/link para acceder al login
 * Usado en navegación
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function LoginClient() {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link
        href="/login"
        className="px-4 py-2 bg-[#8B5E3C] text-white rounded-full font-fira text-sm font-semibold hover:bg-[#6d4a2f] transition-colors flex items-center gap-2"
      >
        <LogIn size={16} />
        <span className="hidden sm:inline">Acceso clientes</span>
        <span className="sm:hidden">Acceder</span>
      </Link>
    </motion.div>
  );
}
