'use client';

import { motion } from 'framer-motion';
import { Heart, Camera, Sparkles, Instagram, Facebook } from 'lucide-react';
import Image from 'next/image';

export default function SobreAlma({ profile }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8B5E3C]/20 to-[#B89968]/20" />
              {/* Placeholder for photographer photo - replace with actual image */}
              <div className="w-full h-full bg-gradient-to-br from-[#8B5E3C]/10 to-[#B89968]/10 flex items-center justify-center">
                <Camera size={80} className="text-[#8B5E3C]/30" />
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#B89968]/20 rounded-full blur-2xl -z-10" />
          </motion.div>

          {/* Right Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-voga text-4xl sm:text-5xl text-gray-900 mb-4">
              Sobre Alma Fotografía
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#8B5E3C] to-[#B89968] rounded-full mb-6" />

            <div className="space-y-4 mb-8">
              <p className="font-fira text-gray-700 leading-relaxed">
                Soy <span className="font-semibold text-[#8B5E3C]">{profile?.full_name || 'Fernanda'}</span>,
                fotógrafa profesional especializada en capturar los momentos más especiales de tu vida.
              </p>

              <p className="font-fira text-gray-700 leading-relaxed">
                Con años de experiencia y una pasión genuina por mi trabajo, me dedico a crear
                recuerdos visuales que perdurarán para siempre. Cada sesión es única y personalizada,
                diseñada para reflejar tu esencia y la magia de tus momentos especiales.
              </p>

              <p className="font-fira text-gray-700 leading-relaxed">
                Más que fotografías, creo historias visuales que emocionan, conectan y permanecen
                en el tiempo. Tu historia merece ser contada con sensibilidad y arte.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Feature
                icon={Heart}
                title="Pasión"
                description="Amor genuino por mi trabajo"
              />
              <Feature
                icon={Camera}
                title="Profesionalismo"
                description="Equipo de alta gama"
              />
              <Feature
                icon={Sparkles}
                title="Creatividad"
                description="Mirada artística única"
              />
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <span className="font-fira text-sm text-gray-600">Seguime en:</span>
              {profile?.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#8B5E3C]/10 hover:bg-[#8B5E3C]/20 flex items-center justify-center transition-colors group"
                  aria-label="Instagram"
                >
                  <Instagram size={18} className="text-[#8B5E3C] group-hover:scale-110 transition-transform" />
                </a>
              )}
              {profile?.facebook && (
                <a
                  href={`https://facebook.com/${profile.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#8B5E3C]/10 hover:bg-[#8B5E3C]/20 flex items-center justify-center transition-colors group"
                  aria-label="Facebook"
                >
                  <Facebook size={18} className="text-[#8B5E3C] group-hover:scale-110 transition-transform" />
                </a>
              )}
              {profile?.tiktok && (
                <a
                  href={`https://tiktok.com/@${profile.tiktok.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#8B5E3C]/10 hover:bg-[#8B5E3C]/20 flex items-center justify-center transition-colors group"
                  aria-label="TikTok"
                >
                  <svg className="w-4 h-4 text-[#8B5E3C] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Feature Component
function Feature({ icon: Icon, title, description }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-[#8B5E3C]/10 flex items-center justify-center mx-auto mb-2">
        <Icon size={20} className="text-[#8B5E3C]" />
      </div>
      <h4 className="font-fira text-sm font-semibold text-gray-900 mb-1">
        {title}
      </h4>
      <p className="font-fira text-xs text-gray-600">
        {description}
      </p>
    </div>
  );
}
