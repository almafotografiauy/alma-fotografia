'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Tiempo de inactividad en milisegundos (30 minutos)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Eventos que resetean el contador de inactividad
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
];

export default function SessionTimeout() {
  const router = useRouter();
  const timeoutRef = useRef(null);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      // Error al cerrar sesión
    }
  }, [router]);

  const resetTimer = useCallback(() => {
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
  }, [resetTimer]);

  return null; // Este componente no renderiza nada
}
