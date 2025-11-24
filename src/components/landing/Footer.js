/**
 * Footer - Footer minimalista
 * Diseño oscuro con acentos marrones
 */

import Link from 'next/link';

export default function Footer({ profile }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2d2d2d] py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-6">
            <Link href="/" className="font-voga text-2xl text-white hover:text-[#B89968] transition-colors">
              Alma Fotografía
            </Link>
          </div>

          {/* Línea decorativa */}
          <div className="w-16 h-px bg-[#B89968]/30 mx-auto mb-6" />

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <a href="#servicios" className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors">
              Servicios
            </a>
            <a href="#testimonios" className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors">
              Testimonios
            </a>
            <a href="#contacto" className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors">
              Contacto
            </a>
            <Link href="/login" className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors">
              Acceso Clientes
            </Link>
          </div>

          {/* Copyright */}
          <div className="font-fira text-sm text-gray-500">
            &copy; {currentYear} Alma Fotografía. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
