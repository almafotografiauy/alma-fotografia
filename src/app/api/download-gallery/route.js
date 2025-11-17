import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import JSZip from 'jszip';

/**
 * API Route para descargar todas las fotos de una galería como ZIP
 *
 * GET /api/download-gallery?galleryId=xxx&pin=xxxx
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const galleryId = searchParams.get('galleryId');
    const pin = searchParams.get('pin');

    if (!galleryId) {
      return NextResponse.json(
        { error: 'galleryId es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener información de la galería
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, title, slug, download_pin, allow_downloads')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: 'Galería no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la galería permite descargas
    if (!gallery.allow_downloads) {
      return NextResponse.json(
        { error: 'Esta galería no permite descargas' },
        { status: 403 }
      );
    }

    // Verificar PIN si está configurado
    if (gallery.download_pin && gallery.download_pin !== pin) {
      return NextResponse.json(
        { error: 'PIN incorrecto' },
        { status: 403 }
      );
    }

    // Obtener todas las fotos de la galería
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, file_name, cloudinary_url, file_path')
      .eq('gallery_id', galleryId)
      .order('order_index', { ascending: true });

    if (photosError) {
      throw new Error('Error al obtener fotos: ' + photosError.message);
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json(
        { error: 'La galería no tiene fotos' },
        { status: 404 }
      );
    }

    // Crear ZIP
    const zip = new JSZip();
    const folder = zip.folder(gallery.slug || gallery.title);

    // Descargar y agregar cada foto al ZIP
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const url = photo.cloudinary_url || photo.file_path;

      // Obtener la versión de máxima calidad de Cloudinary
      let downloadUrl = url;
      if (url.includes('cloudinary.com')) {
        // Reemplazar transformaciones para obtener imagen original
        downloadUrl = url.replace(/\/upload\/.*?\//g, '/upload/');
      }

      try {
        // Descargar la imagen
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          console.error(`Error descargando foto ${photo.id}:`, response.statusText);
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();

        // Generar nombre de archivo
        const fileName = photo.file_name || `foto-${i + 1}.jpg`;

        // Agregar al ZIP
        folder.file(fileName, arrayBuffer);
      } catch (error) {
        console.error(`Error procesando foto ${photo.id}:`, error);
        // Continuar con las demás fotos
      }
    }

    // Generar el ZIP
    const zipBlob = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Nombre del archivo ZIP
    const zipFileName = `${gallery.slug || gallery.title.toLowerCase().replace(/\s+/g, '-')}.zip`;

    // Retornar el ZIP
    return new NextResponse(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': zipBlob.length.toString(),
      },
    });

  } catch (error) {
    console.error('[download-gallery] Error:', error);
    return NextResponse.json(
      { error: 'Error al generar el ZIP: ' + error.message },
      { status: 500 }
    );
  }
}
