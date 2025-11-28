import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Tiempo de inactividad en milisegundos (20 minutos)
const INACTIVITY_TIMEOUT = 20 * 60 * 1000;
const LAST_ACTIVITY_COOKIE = 'last_activity';

export async function middleware(request) {
  // Crear una response mutable
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Verificar que las variables de entorno estén disponibles
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANTE: Llamar a getUser() para refrescar la sesión
  const { data, error } = await supabase.auth.getUser();

  if (error && error.message !== 'Auth session missing!') {
    console.error('Supabase error:', error.message);
  }

  // Proteger rutas del dashboard - Si no está logueado, redirigir al login
  if (!data?.user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Verificar timeout por inactividad (incluso si cerró el navegador)
  if (data?.user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const lastActivityCookie = request.cookies.get(LAST_ACTIVITY_COOKIE);

    if (lastActivityCookie?.value) {
      const lastActivity = parseInt(lastActivityCookie.value, 10);
      const timeSinceLastActivity = Date.now() - lastActivity;

      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        // Sesión expirada por inactividad, cerrar sesión
        await supabase.auth.signOut();

        // Limpiar cookie de actividad
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('error', 'sesion_expirada');
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.cookies.delete(LAST_ACTIVITY_COOKIE);
        return redirectResponse;
      }
    }
  }

  // Si está logueado, verificar que el usuario esté activo en user_profiles
  if (data?.user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_active, permissions, requires_password_change')
      .eq('id', data.user.id)
      .single();

    // Si no se encuentra el perfil o está inactivo, cerrar sesión y redirigir
    if (profileError || !profile || !profile.is_active) {
      await supabase.auth.signOut();
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('error', 'cuenta_deshabilitada');
      return NextResponse.redirect(redirectUrl);
    }

    // Si requiere cambio de contraseña, redirigir a la página de cambio
    if (profile.requires_password_change && !request.nextUrl.pathname.startsWith('/dashboard/cambiar-contrasena')) {
      return NextResponse.redirect(new URL('/dashboard/cambiar-contrasena', request.url));
    }

    // Validar permisos SOLO para gestión de usuarios
    const pathname = request.nextUrl.pathname;

    // Solo administradores pueden gestionar usuarios
    if (pathname.startsWith('/dashboard/configuracion/usuarios') ||
        pathname.startsWith('/auth/register')) {
      if (!profile.permissions?.manage_users) {
        return NextResponse.redirect(new URL('/dashboard?error=sin_permisos', request.url));
      }
    }
  }

  // Si está logueado y trata de ir al login, redirigir al dashboard
  if (data?.user && request.nextUrl.pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/login', '/auth/register'],
};