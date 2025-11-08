import { Suspense } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PageTransition from '@/components/dashboard/PageTransition';
import AnimatedSection from '@/components/dashboard/AnimatedSection';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import DashboardQuickAction from '@/components/dashboard/DashboardQuickAction';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import StorageCard from '@/components/dashboard/StorageCard';

export const revalidate = 60;

async function getUserInfo() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Usuario';

  return userName.charAt(0).toUpperCase() + userName.slice(1);
}

async function DashboardStats() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const [
    { count: galleriesCount },
    { count: testimonialsCount },
    { count: photosCount },
  ] = await Promise.all([
    supabase
      .from('galleries')
      .select('*', { count: 'exact', head: true }),

    supabase
      .from('testimonials')
      .select('*', { count: 'exact', head: true }),

    supabase
      .from('photos')
      .select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    {
      id: 'galleries',
      title: 'Galerías',
      value: galleriesCount || 0,
      iconName: 'Image',
      href: '/dashboard/galerias',
    },
    {
      id: 'testimonios',
      title: 'Testimonios',
      value: testimonialsCount || 0,
      iconName: 'MessageSquare',
      href: '/dashboard/testimonios',
    },
    {
      id: 'fotos',
      title: 'Fotos Totales',
      value: photosCount || 0,
      iconName: 'Camera',
      href: '/dashboard/galerias',
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 ">
        {stats.map((stat, index) => (
          <AnimatedSection key={stat.id} delay={index * 0.1}>
            <DashboardStatCard stat={stat} />
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.3}>
        <StorageCard />
      </AnimatedSection>
    </>
  );
}

export default async function DashboardHome() {
  const displayName = await getUserInfo();

  const quickActions = [
    {
      id: 'new-gallery',
      href: '/dashboard/galerias/new',
      iconName: 'Image',
      title: 'Crear nueva galería',
      description: 'Subir y organizar fotos',
      variant: 'primary',
    },
    {
      id: 'manage-testimonials',
      href: '/dashboard/testimonios',
      iconName: 'Users',
      title: 'Gestionar testimonios',
      description: 'Ver y moderar opiniones',
      variant: 'secondary',
    },
  ];

  return (
    <PageTransition>
      <DashboardHeader
        title={`Bienvenida, ${displayName}`}
        subtitle="Resumen de tu actividad reciente"
      />

      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <DashboardSkeleton type="stat" />
            <DashboardSkeleton type="stat" />
            <DashboardSkeleton type="stat" />
          </div>
        }
      >
        <DashboardStats />
      </Suspense>

      <AnimatedSection delay={0.4}>
        <div className="mb-8">
          <h2 className="font-voga text-3xl text-black mb-8">
            Acciones rápidas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {quickActions.map((action) => (
              <DashboardQuickAction key={action.id} {...action} />
            ))}
          </div>
        </div>
      </AnimatedSection>
    </PageTransition>
  );
}