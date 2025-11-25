import { Suspense } from 'react';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Servicios from '@/components/landing/Servicios';
import Testimonios from '@/components/landing/Testimonios';
import Reservas, { Contacto } from '@/components/landing/Reservas';
import Footer from '@/components/landing/Footer';
import ServiciosSkeleton from '@/components/landing/skeletons/ServiciosSkeleton';
import TestimoniosSkeleton from '@/components/landing/skeletons/TestimoniosSkeleton';
import {
  getFeaturedTestimonials,
  getPublicGalleriesPreview,
} from '@/app/actions/landing-actions';

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



// Página principal
export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <Header />

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

      {/* Reservas Section */}
      <Reservas />

      {/* Contacto Section */}
      <Contacto />

      {/* Footer */}
      <Footer />
    </main>
  );
}
