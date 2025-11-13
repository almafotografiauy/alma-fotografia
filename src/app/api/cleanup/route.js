import { NextResponse } from 'next/server';
import { cleanOrphanedPhotos } from '@/app/actions/gallery-actions';

/**
 * ENDPOINT TEMPORAL DE LIMPIEZA
 *
 * Ejecuta la limpieza de fotos huérfanas
 *
 * USO:
 * 1. Abre el navegador en http://localhost:3000/api/cleanup
 * 2. Verás un JSON con el resultado de la limpieza
 *
 * IMPORTANTE: Eliminar este archivo después de usarlo
 */
export async function GET() {
  try {
    console.log('🧹 Iniciando limpieza desde API endpoint...');

    const result = await cleanOrphanedPhotos();

    if (result.success) {
      console.log('✅ Limpieza completada:', result);
      return NextResponse.json({
        success: true,
        message: result.message,
        cleanedPhotos: result.cleanedPhotos,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Error en limpieza:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error crítico en cleanup endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
