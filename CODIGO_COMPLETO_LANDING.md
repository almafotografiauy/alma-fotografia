# 🎨 CÓDIGO COMPLETO - LANDING PAGE ALMA FOTOGRAFÍA

> **Landing profesional, delicada y optimizada | Next.js App Router | JavaScript**

---

## 📦 ARCHIVO 1: `src/app/layout.js`

```javascript
import { Fira_Sans } from 'next/font/google';
import './globals.css';

const firaSans = Fira_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-fira',
  display: 'swap',
});

export const metadata = {
  title: 'Alma Fotografía | Capturando momentos especiales en Uruguay',
  description: 'Fotografía profesional en Uruguay. Sesiones personalizadas de bodas, eventos, retratos y más. Capturamos pedacitos de vida para que puedas recordarlos siempre.',
  keywords: ['fotografía', 'Uruguay', 'bodas', 'eventos', 'retratos', 'sesiones fotográficas', 'Montevideo'],
  authors: [{ name: 'Fernanda - Alma Fotografía' }],
  creator: 'Alma Fotografía',
  publisher: 'Alma Fotografía',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Alma Fotografía - Momentos que perduran',
    description: 'Capturamos pedacitos de vida para que puedas recordarlos siempre que sientas esa nostalgia en el corazón.',
    url: 'https://almafotografia.uy',
    siteName: 'Alma Fotografía',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Alma Fotografía - Portfolio',
      },
    ],
    locale: 'es_UY',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alma Fotografía',
    description: 'Fotografía profesional en Uruguay',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={firaSans.variable}>
      <head>
        {/* Fuente Voga desde CDN */}
        <link
          href="https://fonts.cdnfonts.com/css/voga"
          rel="stylesheet"
        />

        {/* JSON-LD Schema para SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'Alma Fotografía',
              image: 'https://almafotografia.uy/og-image.jpg',
              '@id': 'https://almafotografia.uy',
              url: 'https://almafotografia.uy',
              telephone: '+598-XX-XXX-XXX',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Montevideo',
                addressCountry: 'UY',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: -34.9011,
                longitude: -56.1645,
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                opens: '09:00',
                closes: '19:00',
              },
              sameAs: [
                'https://www.instagram.com/almafotografiauy',
                'https://www.facebook.com/almafotografia',
              ],
              priceRange: '$$',
            }),
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
```

---

## 📦 ARCHIVO 2: `src/app/page.js`

```javascript
import { Suspense } from 'react';
import HeroClient from '@/components/landing/Hero.client';
import ServiciosServer from '@/components/landing/Servicios.server';
import TestimoniosServer from '@/components/landing/Testimonios.server';
import SobreAlmaServer from '@/components/landing/SobreAlma.server';
import ContactoClient from '@/components/landing/Contacto.client';
import FooterServer from '@/components/landing/Footer.server';
import ServiciosSkeleton from '@/components/landing/skeletons/ServiciosSkeleton';
import TestimoniosSkeleton from '@/components/landing/skeletons/TestimoniosSkeleton';
import LoginClient from '@/components/landing/Login.client';

/**
 * Landing Page Principal - Alma Fotografía
 *
 * Arquitectura:
 * - ISR con revalidate cada 5 minutos
 * - Suspense boundaries para streaming
 * - Server Components para fetch de datos
 * - Client Components para interactividad
 */

// ISR - Cachea y revalida cada 5 minutos
export const revalidate = 300;

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Navigation fixed */}
      <Navigation />

      {/* Hero Section - Client Component (animaciones) */}
      <HeroClient />

      {/* Servicios Section - Server Component con Suspense */}
      <Suspense fallback={<ServiciosSkeleton />}>
        <ServiciosServer />
      </Suspense>

      {/* Testimonios Section - Server Component con Suspense */}
      <Suspense fallback={<TestimoniosSkeleton />}>
        <TestimoniosServer />
      </Suspense>

      {/* Sobre Alma Section - Server Component */}
      <Suspense fallback={<SkeletonSection />}>
        <SobreAlmaServer />
      </Suspense>

      {/* Contacto Section - Client Component (form) */}
      <ContactoClient />

      {/* Footer - Server Component */}
      <Suspense fallback={<div className="bg-[#2d1f15] py-12" />}>
        <FooterServer />
      </Suspense>
    </main>
  );
}

// Navigation Component
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="font-voga text-xl text-gray-900 hover:text-[#8B5E3C] transition-colors">
            Alma Fotografía
          </a>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#servicios"
              className="font-fira text-sm text-gray-700 hover:text-[#8B5E3C] transition-colors"
            >
              Servicios
            </a>
            <a
              href="#testimonios"
              className="font-fira text-sm text-gray-700 hover:text-[#8B5E3C] transition-colors"
            >
              Testimonios
            </a>
            <a
              href="#contacto"
              className="font-fira text-sm text-gray-700 hover:text-[#8B5E3C] transition-colors"
            >
              Contacto
            </a>
            <LoginClient />
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <LoginClient />
          </div>
        </div>
      </div>
    </nav>
  );
}

// Skeleton genérico
function SkeletonSection() {
  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
      </div>
    </div>
  );
}
```

---

## 📦 ARCHIVO 3: `src/app/api/public-booking/route.js`

```javascript
import { NextResponse } from 'next/server';
import { createPublicBooking } from '@/lib/validation';

/**
 * API Route: POST /api/public-booking
 *
 * Crea una nueva reserva pública desde el formulario de contacto
 * Valida disponibilidad usando la lógica de agendaProvisoria
 */

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      serviceTypeId,
      clientName,
      clientEmail,
      clientPhone,
      eventDate,
      eventTime,
      message,
    } = body;

    // Validación básica de campos
    if (!serviceTypeId || !clientName || !clientEmail || !clientPhone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: servicio, nombre, email y teléfono son obligatorios'
        },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Crear reserva (la función ya valida disponibilidad internamente)
    const result = await createPublicBooking({
      serviceTypeId,
      clientName,
      clientEmail,
      clientPhone,
      eventDate: eventDate || null,
      eventTime: eventTime || null,
      message: message || null,
    });

    if (!result.success) {
      // Si el horario no está disponible, devolver 409 Conflict
      const statusCode = result.error?.includes('disponible') ? 409 : 400;

      return NextResponse.json(
        { success: false, error: result.error },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      message: '¡Reserva creada! Te contactaremos pronto.'
    });

  } catch (error) {
    console.error('Error in public-booking API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor. Por favor intentá de nuevo.'
      },
      { status: 500 }
    );
  }
}

// Método OPTIONS para CORS (si hace falta)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

---

## 📦 ARCHIVO 4: `src/components/landing/Servicios.server.js`

```javascript
import { getPublicGalleriesPreview } from '@/lib/server-actions';
import ServiciosClient from './Servicios.client';

/**
 * Servicios - Server Component
 *
 * Fetch de servicios con galerías públicas
 * Pasa los datos al Client Component para renderizado interactivo
 */

export default async function ServiciosServer() {
  const { services } = await getPublicGalleriesPreview();

  // Si no hay servicios con galerías públicas, mostrar mensaje
  if (!services || services.length === 0) {
    return (
      <section id="servicios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-voga text-4xl text-gray-900 mb-4">
            Nuestros Servicios
          </h2>
          <p className="font-fira text-gray-600">
            Próximamente publicaremos nuestras galerías
          </p>
        </div>
      </section>
    );
  }

  return <ServiciosClient services={services} />;
}
```

---

## 📦 ARCHIVO 5: `src/components/landing/Servicios.client.js`

```javascript
'use client';

/**
 * Servicios - Client Component
 *
 * Grid de servicios con lightbox interactivo
 * Usa dynamic import para cargar lightbox solo cuando se necesita
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ServiciosClient({ services }) {
  const [lightboxData, setLightboxData] = useState(null);

  const openLightbox = (gallery, photoIndex = 0) => {
    setLightboxData({ gallery, photoIndex });
  };

  const closeLightbox = () => {
    setLightboxData(null);
  };

  return (
    <>
      <section id="servicios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-voga text-4xl sm:text-5xl text-gray-900 mb-4">
              Nuestros Servicios
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#8B5E3C] to-[#B89968] mx-auto rounded-full mb-6" />
            <p className="font-fira text-gray-600 max-w-2xl mx-auto">
              Cada sesión es única y personalizada para capturar la esencia de tus momentos especiales
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
                onOpenLightbox={openLightbox}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxData && (
          <Lightbox
            gallery={lightboxData.gallery}
            initialIndex={lightboxData.photoIndex}
            onClose={closeLightbox}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Service Card Component
function ServiceCard({ service, index, onOpenLightbox }) {
  const gallery = service.gallery;
  const photos = gallery?.photos || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group relative bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
      onClick={() => photos.length > 0 && onOpenLightbox(gallery, 0)}
    >
      {/* Cover Image */}
      <div className="relative h-64 overflow-hidden">
        {gallery?.cover_image ? (
          <Image
            src={gallery.cover_image}
            alt={gallery.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#8B5E3C]/20 to-[#B89968]/20 flex items-center justify-center">
            <span className="font-voga text-4xl text-[#8B5E3C]/30">
              {service.name}
            </span>
          </div>
        )}

        {/* Overlay en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
          <p className="font-fira text-white text-sm">
            Ver galería completa →
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-voga text-2xl text-gray-900 mb-2">
          {service.name}
        </h3>

        {gallery?.description && (
          <p className="font-fira text-sm text-gray-600 mb-4 line-clamp-2">
            {gallery.description}
          </p>
        )}

        {photos.length > 0 && (
          <p className="font-fira text-xs text-gray-500">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Lightbox Component con keyboard navigation
function Lightbox({ gallery, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const photos = gallery.photos || [];

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') prevPhoto();
    if (e.key === 'ArrowRight') nextPhoto();
  };

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-label="Galería de fotos"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
        aria-label="Cerrar galería"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Gallery Title */}
      <div className="absolute top-4 left-4 z-50">
        <h3 className="font-voga text-2xl text-white">{gallery.title}</h3>
      </div>

      {/* Photo */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-6xl aspect-[4/3]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photos[currentIndex]?.cloudinary_url}
          alt={photos[currentIndex]?.file_name || 'Foto'}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </motion.div>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Foto anterior"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Siguiente foto"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        </>
      )}

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
        <span className="font-fira text-sm text-white">
          {currentIndex + 1} / {photos.length}
        </span>
      </div>
    </motion.div>
  );
}
```

---

Continúo en el siguiente mensaje con el resto de componentes...
