import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/cloudinary/delete-folder
 * Elimina una carpeta completa de Cloudinary con TODOS sus archivos
 *
 * PAGINACIÓN RECURSIVA:
 * - Cloudinary API limita a 500 recursos por request
 * - Si una galería tiene >500 fotos, hace múltiples requests
 * - Continúa hasta vaciar completamente la carpeta
 *
 * BATCH DELETION:
 * - Elimina en grupos de 100 recursos (límite de delete_resources)
 * - Logging detallado de cada batch para debugging
 *
 * CASOS DE USO:
 * - Galería con 100 fotos: 1 iteración, 1 batch
 * - Galería con 700 fotos: 2 iteraciones, 7 batches
 * - Galería con 1500 fotos: 3 iteraciones, 15 batches
 */
export async function POST(request) {
  try {
    const { folder } = await request.json();

    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Folder path is required' },
        { status: 400 }
      );
    }

    console.log('📁 Eliminando carpeta de Cloudinary:', folder);

    let totalDeleted = 0;
    let iteration = 0;
    let hasMoreResources = true;

    // ✅ PAGINACIÓN RECURSIVA: Continuar hasta vaciar carpeta
    while (hasMoreResources) {
      iteration++;
      console.log(`🔄 Iteración ${iteration}: Buscando recursos...`);

      // 1. Obtener siguiente página de recursos (máximo 500)
      const resources = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: 500, // Límite de Cloudinary API
      });

      const resourceCount = resources.resources.length;
      console.log(`📋 Encontrados: ${resourceCount} recursos en iteración ${iteration}`);

      // Si no hay recursos, terminamos
      if (resourceCount === 0) {
        hasMoreResources = false;
        console.log('✅ Carpeta vacía, finalizando...');
        break;
      }

      // 2. Extraer public_ids de los recursos
      const publicIds = resources.resources.map(resource => resource.public_id);

      // 3. Eliminar en batches de 100 (límite de delete_resources)
      const BATCH_SIZE = 100;
      const batches = [];

      for (let i = 0; i < publicIds.length; i += BATCH_SIZE) {
        batches.push(publicIds.slice(i, i + BATCH_SIZE));
      }

      console.log(`📦 ${batches.length} batches a procesar en iteración ${iteration}`);

      // 4. Eliminar cada batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          await cloudinary.api.delete_resources(batch);
          totalDeleted += batch.length;
          console.log(`✅ Batch ${i + 1}/${batches.length} eliminado: ${batch.length} archivos (Total acumulado: ${totalDeleted})`);
        } catch (batchError) {
          console.error(`❌ Error eliminando batch ${i + 1}:`, batchError.message);
          // Continuar con el siguiente batch aunque uno falle
        }
      }

      // 5. Si obtuvimos menos de 500, no hay más recursos
      if (resourceCount < 500) {
        hasMoreResources = false;
        console.log(`✅ Última página procesada (${resourceCount} < 500)`);
      }
    }

    console.log(`📊 Total eliminado: ${totalDeleted} archivos en ${iteration} iteraciones`);

    // 6. Intentar eliminar la carpeta (solo si está vacía)
    try {
      await cloudinary.api.delete_folder(folder);
      console.log('✅ Carpeta eliminada:', folder);
    } catch (folderError) {
      // Si la carpeta no está vacía o no existe, no es crítico
      console.warn('⚠️ No se pudo eliminar carpeta:', folderError.message);
    }

    return NextResponse.json({
      success: true,
      message: `Carpeta ${folder} eliminada completamente`,
      deletedCount: totalDeleted,
      iterations: iteration,
    });

  } catch (error) {
    console.error('❌ Error eliminando carpeta de Cloudinary:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al eliminar carpeta de Cloudinary'
      },
      { status: 500 }
    );
  }
}