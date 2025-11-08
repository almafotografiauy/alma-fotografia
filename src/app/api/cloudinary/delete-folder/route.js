import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * DELETE /api/cloudinary/delete-folder
 * Elimina una carpeta completa de Cloudinary con todos sus archivos
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

    // 1. Listar todos los recursos en la carpeta
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 500, // Cloudinary max es 500
    });

    console.log('📋 Recursos encontrados:', resources.resources.length);

    // 2. Eliminar todos los recursos en paralelo
    if (resources.resources.length > 0) {
      const publicIds = resources.resources.map(resource => resource.public_id);
      
      // Cloudinary permite eliminar hasta 100 recursos a la vez
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < publicIds.length; i += batchSize) {
        batches.push(publicIds.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await cloudinary.api.delete_resources(batch);
        console.log('✅ Batch eliminado:', batch.length, 'archivos');
      }
    }

    // 3. Eliminar la carpeta (solo si está vacía)
    try {
      await cloudinary.api.delete_folder(folder);
      console.log('✅ Carpeta eliminada:', folder);
    } catch (folderError) {
      // Si la carpeta no está vacía o no existe, ignorar el error
      console.warn('⚠️ No se pudo eliminar carpeta:', folderError.message);
    }

    return NextResponse.json({
      success: true,
      message: `Carpeta ${folder} eliminada`,
      deletedCount: resources.resources.length,
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