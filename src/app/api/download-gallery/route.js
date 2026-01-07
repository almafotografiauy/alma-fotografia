import { createAdminClient } from '@/lib/server';
import archiver from 'archiver';
import { Readable } from 'stream';

/**
 * API Route para descargar todas las fotos de una galería como ZIP
 *
 * GET /api/download-gallery?galleryId=xxx&pin=xxxx
 *
 * OPTIMIZADO CON STREAMING:
 * - Usa archiver en lugar de JSZip
 * - Genera y envía el ZIP mientras descarga (no espera a tener todo en memoria)
 * - Soporta galerías de 500+ fotos sin problemas
 * - Descarga múltiples fotos en paralelo
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const galleryId = searchParams.get('galleryId');
    const pin = searchParams.get('pin');

    if (!galleryId) {
      return new Response(
        JSON.stringify({ error: 'galleryId es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Usar admin client para bypassear RLS (protegido por PIN si está configurado)
    const supabase = createAdminClient();

    // Obtener información de la galería
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('id, title, slug, download_pin, allow_downloads')
      .eq('id', galleryId)
      .single();

    if (galleryError || !gallery) {
      return new Response(
        JSON.stringify({ error: 'Galería no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que la galería permite descargas
    if (!gallery.allow_downloads) {
      return new Response(
        JSON.stringify({ error: 'Esta galería no permite descargas' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar PIN si está configurado
    if (gallery.download_pin && gallery.download_pin !== pin) {
      return new Response(
        JSON.stringify({ error: 'PIN incorrecto' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener todas las fotos de la galería
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, file_name, file_path')
      .eq('gallery_id', galleryId)
      .order('display_order', { ascending: true });

    if (photosError) {
      throw new Error('Error al obtener fotos: ' + photosError.message);
    }

    if (!photos || photos.length === 0) {
      return new Response(
        JSON.stringify({ error: 'La galería no tiene fotos' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[download-gallery] Iniciando descarga STREAMING de ${photos.length} fotos`);
    const startTime = Date.now();

    // ==========================================
    // STREAMING ZIP CON ARCHIVER
    // ==========================================

    // Crear el archiver con compresión mínima (STORE = sin compresión)
    const archive = archiver('zip', {
      store: true, // Sin compresión (JPG ya está comprimido)
    });

    // Nombre del archivo ZIP
    const zipFileName = `${gallery.slug || gallery.title.toLowerCase().replace(/\s+/g, '-')}.zip`;

    // Headers para streaming
    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipFileName}"`,
      'Cache-Control': 'no-cache',
    });

    // Convertir stream de Node.js a Web Stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Pipe del archive al writer
    archive.on('data', (chunk) => {
      writer.write(chunk);
    });

    archive.on('end', () => {
      const totalTime = Date.now() - startTime;
      console.log(`[download-gallery] ZIP completado en ${totalTime}ms (${photos.length} fotos)`);
      writer.close();
    });

    archive.on('error', (err) => {
      console.error('[download-gallery] Error en archive:', err);
      writer.abort(err);
    });

    // ==========================================
    // DESCARGAR Y AGREGAR FOTOS EN PARALELO
    // ==========================================

    const BATCH_SIZE = 30; // Aumentado a 30 para máxima velocidad
    let processedCount = 0;

    // Función para procesar un lote
    const processBatch = async (batch, batchIndex) => {
      const batchStartTime = Date.now();

      const results = await Promise.all(
        batch.map(async (photo, indexInBatch) => {
          const globalIndex = batchIndex * BATCH_SIZE + indexInBatch;
          const url = photo.file_path;

          // Generar nombre coherente: slug-galeria-001.jpg
          const paddedNumber = String(globalIndex + 1).padStart(3, '0');
          const fileName = `${gallery.slug || 'galeria'}-${paddedNumber}.jpg`;

          // Obtener versión optimizada de Cloudinary
          let downloadUrl = url;
          if (url.includes('cloudinary.com')) {
            // q_80 y max 2048px para balance perfecto velocidad/calidad
            downloadUrl = url.replace(/\/upload\/.*?\//g, '/upload/f_jpg,q_80,w_2048/');
          }

          try {
            // Timeout de 15 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(downloadUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
              console.error(`[download-gallery] Error descargando foto ${photo.id}:`, response.statusText);
              return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            return { fileName, buffer: Buffer.from(arrayBuffer) };
          } catch (error) {
            if (error.name === 'AbortError') {
              console.error(`[download-gallery] Timeout foto ${photo.id}`);
            } else {
              console.error(`[download-gallery] Error foto ${photo.id}:`, error.message);
            }
            return null;
          }
        })
      );

      // Agregar las fotos exitosas al ZIP
      let successCount = 0;
      for (const result of results) {
        if (result) {
          archive.append(result.buffer, { name: `${gallery.slug || gallery.title}/${result.fileName}` });
          successCount++;
          processedCount++;
        }
      }

      const batchTime = Date.now() - batchStartTime;
      console.log(`[download-gallery] Lote ${batchIndex + 1}: ${successCount}/${batch.length} fotos en ${batchTime}ms (${processedCount}/${photos.length} total)`);
    };

    // Procesar todos los lotes de forma asíncrona mientras el ZIP se genera
    (async () => {
      try {
        const batches = [];
        for (let i = 0; i < photos.length; i += BATCH_SIZE) {
          batches.push(photos.slice(i, i + BATCH_SIZE));
        }

        console.log(`[download-gallery] Procesando ${batches.length} lotes de máximo ${BATCH_SIZE} fotos`);

        for (let i = 0; i < batches.length; i++) {
          await processBatch(batches[i], i);
        }

        // Finalizar el ZIP
        await archive.finalize();
      } catch (error) {
        console.error('[download-gallery] Error procesando lotes:', error);
        archive.destroy();
      }
    })();

    // Retornar el stream inmediatamente
    return new Response(readable, { headers });

  } catch (error) {
    console.error('[download-gallery] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error al generar el ZIP: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
