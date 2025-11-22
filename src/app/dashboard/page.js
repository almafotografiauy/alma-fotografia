import { Suspense } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PageTransition from '@/components/dashboard/PageTransition';
import AnimatedSection from '@/components/dashboard/AnimatedSection';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import DashboardQuickAction from '@/components/dashboard/DashboardQuickAction';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import PendingBookingsWidget from '@/components/dashboard/PendingBookingsWidget';
import UpcomingEventsWidget from '@/components/dashboard/UpcomingEventsWidget';
import RecentNotificationsWidget from '@/components/dashboard/RecentNotificationsWidget';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import StorageCard from '@/components/dashboard/StorageCard';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  // Obtener fechas del mes actual
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  const [
    { count: galleriesCount },
    { count: testimonialsCount },
    { count: photosCount },
    { data: publicBookings },
    { data: privateBookings },
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

    // Reservas públicas del mes
    supabase
      .from('public_bookings')
      .select('*')
      .gte('booking_date', monthStart)
      .lte('booking_date', monthEnd),

    // Eventos privados del mes
    supabase
      .from('private_bookings')
      .select('*')
      .gte('booking_date', monthStart)
      .lte('booking_date', monthEnd),
  ]);

  const totalBookingsThisMonth = (publicBookings?.length || 0) + (privateBookings?.length || 0);

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
      id: 'bookings',
      title: 'Reservas del Mes',
      value: totalBookingsThisMonth,
      iconName: 'Calendar',
      href: '/dashboard/agenda',
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <AnimatedSection key={stat.id} delay={index * 0.1}>
            <DashboardStatCard stat={stat} />
          </AnimatedSection>
        ))}
      </div>
    </>
  );
}

async function DashboardWidgets() {
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

  const today = format(new Date(), 'yyyy-MM-dd');

  // Obtener datos en paralelo
  const [
    { data: pendingBookings },
    { data: publicBookings },
    { data: privateBookings },
    { data: notifications },
  ] = await Promise.all([
    // Reservas públicas pendientes
    supabase
      .from('public_bookings')
      .select('*, booking_type:public_booking_types(id, name, slug)')
      .eq('status', 'pending')
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true }),

    // Próximas reservas públicas confirmadas
    supabase
      .from('public_bookings')
      .select('*, booking_type:public_booking_types(id, name, slug)')
      .eq('status', 'confirmed')
      .gte('booking_date', today)
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(10),

    // Próximos eventos privados
    supabase
      .from('private_bookings')
      .select('*, service_type:service_types(id, name)')
      .gte('booking_date', today)
      .order('booking_date', { ascending: true })
      .limit(10),

    // Notificaciones recientes
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15),
  ]);

  // Combinar eventos públicos y privados y ordenar por fecha
  const upcomingEvents = [
    ...(publicBookings || []).map(b => ({ ...b, type: 'public' })),
    ...(privateBookings || []).map(b => ({ ...b, type: 'private' })),
  ].sort((a, b) => {
    const dateCompare = a.booking_date.localeCompare(b.booking_date);
    if (dateCompare !== 0) return dateCompare;

    const timeA = a.start_time || '00:00:00';
    const timeB = b.start_time || '00:00:00';
    return timeA.localeCompare(timeB);
  });

  const hasPendingBookings = (pendingBookings || []).length > 0;

  return (
    <>
      {/* Reservas Pendientes - Prioridad Alta */}
      {hasPendingBookings && (
        <AnimatedSection delay={0.3}>
          <div className="mb-6">
            <PendingBookingsWidget initialBookings={pendingBookings || []} />
          </div>
        </AnimatedSection>
      )}

      {/* Grid de Próximos Eventos y Notificaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AnimatedSection delay={hasPendingBookings ? 0.4 : 0.3}>
          <UpcomingEventsWidget events={upcomingEvents} />
        </AnimatedSection>

        <AnimatedSection delay={hasPendingBookings ? 0.5 : 0.4}>
          <RecentNotificationsWidget notifications={notifications || []} />
        </AnimatedSection>
      </div>

      {/* Reservas Pendientes - Si no hay, mostrar en el grid inferior */}
      {!hasPendingBookings && (
        <AnimatedSection delay={0.5}>
          <div className="mb-6">
            <PendingBookingsWidget initialBookings={[]} />
          </div>
        </AnimatedSection>
      )}

      {/* Storage Card */}
      <AnimatedSection delay={hasPendingBookings ? 0.6 : 0.6}>
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
      iconName: 'MessageSquare',
      title: 'Gestionar testimonios',
      description: 'Ver y moderar opiniones',
      variant: 'secondary',
    },
  ];

  return (
    <PageTransition>
      <DashboardHeader
        title={`Bienvenida, ${displayName}`}
        subtitle={`Hoy es ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}`}
      />

      <div className="mt-8">
        {/* Estadísticas */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <DashboardSkeleton type="stat" />
              <DashboardSkeleton type="stat" />
              <DashboardSkeleton type="stat" />
            </div>
          }
        >
          <DashboardStats />
        </Suspense>

        {/* Widgets */}
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardSkeleton type="widget" />
                <DashboardSkeleton type="widget" />
              </div>
              <DashboardSkeleton type="widget" />
            </div>
          }
        >
          <DashboardWidgets />
        </Suspense>

        {/* Acciones Rápidas */}
        <AnimatedSection delay={0.7}>
          <div className="mt-12">
            <h2 className="text-2xl text-[#2D2D2D] mb-6 font-voga">
              Acciones rápidas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {quickActions.map((action) => (
                <DashboardQuickAction key={action.id} {...action} />
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </PageTransition>
  );
}
