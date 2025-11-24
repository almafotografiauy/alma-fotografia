import { getProfileInfo } from '@/lib/server-actions';
import { Heart, Instagram, Facebook, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

/**
 * Footer - Server Component
 *
 * Footer profesional con datos del perfil
 * 3 columnas: Brand, Enlaces, Contacto
 */

export default async function FooterServer() {
  const { profile } = await getProfileInfo();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-[#2d1f15] to-[#1a1108] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Column */}
          <div>
            <h3 className="font-voga text-2xl mb-3">
              Alma Fotografía
            </h3>
            <p className="font-fira text-sm text-white/70 leading-relaxed">
              Capturamos pedacitos de vida para que puedas recordarlos siempre
              que sientas esa nostalgia en el corazón.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-fira text-sm font-semibold mb-4 text-white/90">
              Enlaces rápidos
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#servicios"
                  className="font-fira text-sm text-white/70 hover:text-white transition-colors"
                >
                  Servicios
                </a>
              </li>
              <li>
                <a
                  href="#testimonios"
                  className="font-fira text-sm text-white/70 hover:text-white transition-colors"
                >
                  Testimonios
                </a>
              </li>
              <li>
                <a
                  href="#sobre-alma"
                  className="font-fira text-sm text-white/70 hover:text-white transition-colors"
                >
                  Sobre Alma
                </a>
              </li>
              <li>
                <a
                  href="#contacto"
                  className="font-fira text-sm text-white/70 hover:text-white transition-colors"
                >
                  Contacto
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  className="font-fira text-sm text-white/70 hover:text-white transition-colors"
                >
                  Acceso clientes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-fira text-sm font-semibold mb-4 text-white/90">
              Contacto
            </h4>

            {/* Social Links */}
            <div className="flex items-center gap-3 mb-4">
              {profile?.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors group"
                  aria-label="Instagram"
                >
                  <Instagram size={16} className="group-hover:scale-110 transition-transform" />
                </a>
              )}

              {profile?.facebook && (
                <a
                  href={`https://facebook.com/${profile.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors group"
                  aria-label="Facebook"
                >
                  <Facebook size={16} className="group-hover:scale-110 transition-transform" />
                </a>
              )}

              {profile?.tiktok && (
                <a
                  href={`https://tiktok.com/@${profile.tiktok.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors group"
                  aria-label="TikTok"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
            </div>

            <p className="font-fira text-xs text-white/60 leading-relaxed">
              Montevideo, Uruguay
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="font-fira text-xs text-white/60 text-center sm:text-left">
              © {currentYear} Alma Fotografía. Todos los derechos reservados.
            </p>

            <p className="font-fira text-xs text-white/60 flex items-center gap-1">
              Hecho con <Heart size={12} className="fill-[#B89968] text-[#B89968]" /> en Uruguay
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
