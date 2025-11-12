'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

/**
 * ============================================
 * CREATE GALLERY CARD
 * ============================================
 * 
 * Tarjeta para crear nueva galería.
 * Responsive y consistente en todos los dispositivos.
 * 
 * DISEÑO:
 * - Desktop: Card vertical alta con ícono grande
 * - Mobile: Card horizontal compacta
 * - Siempre usa Link (no div) para que funcione en todos lados
 */
export default function CreateGalleryCard() {
  return (
    <Link href="/dashboard/galerias/new" className="block h-full">
      {/* ============================================ */}
      {/* DESKTOP - Card vertical centrada */}
      {/* ============================================ */}
      <div className="hidden lg:flex group relative bg-[#2d2d2d] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] h-full min-h-[400px] flex-col items-center justify-center p-8">
        
        {/* Ícono grande */}
        <div className="mb-4 p-6 bg-white/5 rounded-full group-hover:bg-white/10 transition-all duration-300">
          <Plus size={40} className="text-[#caad81]" strokeWidth={1.5} />
        </div>

        {/* Texto */}
        <h3 className="font-voga text-xl text-white mb-2 text-center">
          Crear nueva galería
        </h3>
        <p className="font-fira text-sm text-white/60 text-center max-w-xs">
          Comienza una nueva sesión fotográfica
        </p>
      </div>

      {/* ============================================ */}
      {/* MOBILE/TABLET - Card horizontal compacta */}
      {/* ============================================ */}
      <div className="lg:hidden group bg-[#2d2d2d] rounded-xl overflow-hidden transition-all duration-300 active:scale-[0.98] p-4 flex items-center justify-center gap-3 min-h-[80px]">
        
        {/* Ícono compacto */}
        <div className="p-3 bg-white/5 rounded-full group-active:bg-white/10 transition-all duration-300 flex-shrink-0">
          <Plus size={24} className="text-[#79502A]" strokeWidth={2} />
        </div>

        {/* Texto compacto */}
        <div className="flex-1 min-w-0">
          <h3 className="font-voga text-base sm:text-lg text-white">
            Crear nueva galería
          </h3>
          <p className="font-fira text-xs text-white/60 hidden sm:block">
            Nueva sesión fotográfica
          </p>
        </div>
      </div>
    </Link>
  );
}