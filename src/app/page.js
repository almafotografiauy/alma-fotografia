import { Suspense } from 'react';
import Hero from '@/components/landing/Hero';
import Servicios from '@/components/landing/Servicios';
import Testimonios from '@/components/landing/Testimonios';
import SobreAlma from '@/components/landing/SobreAlma';
import Contacto from '@/components/landing/Contacto';
import Footer from '@/components/landing/Footer';
import ServiciosSkeleton from '@/components/landing/skeletons/ServiciosSkeleton';
import TestimoniosSkeleton from '@/components/landing/skeletons/TestimoniosSkeleton';
import {
  getFeaturedTestimonials,
  getPublicGalleriesPreview,
  getProfileInfo,
} from '@/app/actions/landing-actions';
import { createClient } from '@/lib/server';
import Link from 'next/link';

export const metadata = {
  title: 'Alma Fotografía | Capturando momentos especiales',
  description: 'Fotografía profesional en Uruguay. Sesiones personalizadas de bodas, eventos, retratos y más. Tu historia merece ser contada con sensibilidad y arte.',
  keywords: 'fotografía, Uruguay, bodas, eventos, retratos, sesiones fotográficas',
  openGraph: {
    title: 'Alma Fotografía',
    description: 'Capturando momentos especiales con sensibilidad y arte',
    type: 'website',
    siteName: 'Alma Fotografía',
  },
};

// ISR - Revalidar cada 5 minutos
export const revalidate = 300;

/**
 * Landing Page - Página principal pública
 *
 * Arquitectura:
 * - Server Components para fetch de datos
 * - Suspense para streaming y mejor UX
 * - ISR para cacheo y performance
 * - Animaciones suaves con Framer Motion
 * - Diseño delicado y femenino
 */

// Componente que carga los testimonios
async function TestimoniosContent() {
  const { testimonials } = await getFeaturedTestimonials();
  return <Testimonios testimonials={testimonials} />;
}

// Componente que carga los servicios con galerías
async function ServiciosContent() {
  const { services } = await getPublicGalleriesPreview();
  return <Servicios services={services} />;
}

// Componente que carga el perfil
async function SobreAlmaContent() {
  const { profile } = await getProfileInfo();
  return <SobreAlma profile={profile} />;
}

// Componente que carga el formulario de contacto
async function ContactoContent() {
  const supabase = await createClient();

  // Obtener tipos de servicio para el formulario
  const { data: services } = await supabase
    .from('service_types')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  return <Contacto services={services || []} />;
}

// Componente que carga el footer
async function FooterContent() {
  const { profile } = await getProfileInfo();
  return <Footer profile={profile} />;
}

// Navegación superior
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-voga text-xl text-gray-900">
            Alma Fotografía
          </Link>

          {/* Nav Links */}
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
            <Link
              href="/login"
              className="px-4 py-2 bg-[#8B5E3C] text-white rounded-full font-fira text-sm font-semibold hover:bg-[#6d4a2f] transition-colors"
            >
              Acceso clientes
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Link
            href="/login"
            className="md:hidden px-4 py-2 bg-[#8B5E3C] text-white rounded-full font-fira text-sm font-semibold"
          >
            Acceder
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Página principal
export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <Hero />

      {/* Servicios Section con Suspense */}
      <Suspense fallback={<ServiciosSkeleton />}>
        <ServiciosContent />
      </Suspense>

      {/* Testimonios Section con Suspense */}
      <Suspense fallback={<TestimoniosSkeleton />}>
        <TestimoniosContent />
      </Suspense>

      {/* Sobre Alma Section con Suspense */}
      <Suspense fallback={<div className="py-20 bg-white" />}>
        <SobreAlmaContent />
      </Suspense>

      {/* Contacto Section con Suspense */}
      <Suspense fallback={<div className="py-20 bg-gradient-to-br from-[#f8f6f3] via-white to-[#faf8f5]" />}>
        <ContactoContent />
      </Suspense>

      {/* Footer con Suspense */}
      <Suspense fallback={<div className="bg-gradient-to-br from-[#2d1f15] to-[#1a1108] py-12" />}>
        <FooterContent />
      </Suspense>
    </main>
  );
}
