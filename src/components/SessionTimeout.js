'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Tiempo de inactividad en milisegundos (20 minutos)
const INACTIVITY_TIMEOUT = 20 * 60 * 1000;

// Nombre de la cookie para última actividad
const LAST_ACTIVITY_COOKIE = 'last_activity';

// Eventos que resetean el contador de inactividad
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
];

// Función para establecer cookie
function setActivityCookie() {
  const timestamp = Date.now().toString();
  // Cookie expira en 24 horas (pero la validación es cada 20 min)
  document.cookie = `${LAST_ACTIVITY_COOKIE}=${timestamp}; path=/; max-age=86400; SameSite=Lax`;
}

// Función para obtener cookie
function getActivityCookie() {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === LAST_ACTIVITY_COOKIE) {
      return parseInt(value, 10);
    }
  }
  return null;
}

export default function SessionTimeout() {
  const router = useRouter();
  const timeoutRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const logout = useCallback(async () => {
    try {
      // Limpiar cookie de actividad
      document.cookie = `${LAST_ACTIVITY_COOKIE}=; path=/; max-age=0`;
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      // Error al cerrar sesión
    }
  }, [router]);

  const resetTimer = useCallback(() => {
    const now = Date.now();

    // Throttle: actualizar cookie máximo cada 30 segundos para no sobrecargar
    if (now - lastUpdateRef.current > 30000) {
      setActivityCookie();
      lastUpdateRef.current = now;
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Crear nuevo timeout
    timeoutRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    // Al montar, verificar si la sesión expiró mientras estaba cerrado
    const lastActivity = getActivityCookie();
    if (lastActivity) {
      const timeSinceLastActivity = Date.now() - lastActivity;
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        // Sesión expirada, hacer logout
        logout();
        return;
      }
    }

    // Establecer actividad inicial
    setActivityCookie();
    lastUpdateRef.current = Date.now();

    // Iniciar el timer
    resetTimer();

    // Agregar event listeners para detectar actividad
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer, true);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [resetTimer, logout]);

  return null; // Este componente no renderiza nada
}
