import { getFeaturedTestimonials } from '@/lib/server-actions';
import TestimoniosClient from './Testimonios.client';

/**
 * Testimonios - Server Component
 *
 * Fetch de testimonios destacados (is_featured = true AND is_active = true)
 * Pasa los datos al Client Component para animaciones
 */

export default async function TestimoniosServer() {
  const { testimonials } = await getFeaturedTestimonials();

  // Si no hay testimonios destacados, mostrar placeholder
  if (!testimonials || testimonials.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-[#f8f6f3] via-white to-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-voga text-4xl text-gray-900 mb-4">
            Testimonios
          </h2>
          <p className="font-fira text-gray-600">
            Próximamente compartiremos las experiencias de nuestros clientes
          </p>
        </div>
      </section>
    );
  }

  return <TestimoniosClient testimonials={testimonials} />;
}
