'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * PublicDownloadAllButton - Descarga directa desde Cloudinary
 * 
 * Enfoque optimizado:
 * - Descarga directa desde Cloudinary (sin proxy)
 * - Procesamiento en lotes de 3 fotos
 * - Retry automático con backoff
 * - Manejo robusto de errores
 */
export default function PublicDownloadAllButton({ photos, galleryTitle }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');

    /**
     * Obtiene la URL de máxima calidad desde Cloudinary
     * Elimina transformaciones y fuerza calidad original
     */
    /**
 * Obtiene la URL original sin transformaciones de Cloudinary
 * Para descargas, queremos la máxima calidad posible
 */
    const getOriginalQualityUrl = (url) => {
        if (!url || !url.includes('cloudinary.com')) {
            return url;
        }

        try {
            // Cloudinary URL format: 
            // https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{version}/{public_id}.{format}

            const urlParts = url.split('/upload/');

            if (urlParts.length === 2) {
                const [base, rest] = urlParts;

                // Extraer el path sin transformaciones
                // Ejemplo: v1234567/folder/image.jpg o folder/image.jpg
                const pathParts = rest.split('/');

                // Si hay transformaciones, las saltamos
                // Buscamos el path que empieza con 'v' (version) o directamente el folder
                let cleanPath = rest;

                // Si el primer segmento tiene transformaciones (no empieza con v o letra)
                if (pathParts[0] && !pathParts[0].match(/^(v\d+|[a-zA-Z])/)) {
                    // Remover primer segmento (transformaciones)
                    cleanPath = pathParts.slice(1).join('/');
                }

                // Construir URL de descarga con máxima calidad
                // fl_attachment fuerza descarga en lugar de mostrar en navegador
                // q_100 asegura calidad máxima (aunque hayamos guardado con auto:best)
                return `${base}/upload/fl_attachment,q_100/${cleanPath}`;
            }

            return url;
        } catch (error) {
            console.error('Error procesando URL:', error);
            return url;
        }
    };

    const handleDownloadAll = async () => {
        if (!photos || photos.length === 0) {
            alert('No hay fotos para descargar');
            return;
        }

        setIsDownloading(true);
        setProgress(0);
        setStatus('Preparando descarga...');

        try {
            const zip = new JSZip();
            const total = photos.length;
            let completedCount = 0;
            let successCount = 0;
            let errorCount = 0;

            // Reducir a 3 descargas simultáneas para mayor estabilidad
            const BATCH_SIZE = 5;

            /**
             * Descarga una foto usando fetch con CORS
             * Cloudinary permite CORS si la URL es pública
             */
            const downloadPhoto = async (photo, index, retries = 3) => {
                const originalUrl = photo?.cloudinary_url || photo?.file_path;

                if (!originalUrl) {
                    errorCount++;
                    return null;
                }
                // Obtener URL de máxima calidad
                const photoUrl = getOriginalQualityUrl(originalUrl);

                for (let attempt = 1; attempt <= retries; attempt++) {
                    try {
                        // Fetch directo desde Cloudinary
                        const response = await fetch(photoUrl, {
                            method: 'GET',
                            mode: 'cors', // Cloudinary permite CORS
                            cache: 'force-cache', // Usar cache del navegador
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }

                        const blob = await response.blob();

                        if (blob.size === 0) {
                            throw new Error('Archivo vacío');
                        }

                        // Extraer y formatear nombre amigable del archivo
                        let filename = photo.file_name || `foto_${String(index + 1).padStart(4, '0')}.jpg`;

                        // Remover extensión
                        filename = filename.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');

                        // Convertir a formato amigable: "nombre-galeria-foto-001" → "Nombre Galeria - Foto 001"
                        filename = filename
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                            .replace(/ Foto /, ' - Foto ');

                        // Determinar extensión (JPG por defecto, PNG si corresponde)
                        const extension = blob.type === 'image/png' ? '.png' : '.jpg';
                        filename += extension;

                        // Agregar al ZIP
                        zip.file(filename, blob);
                        successCount++;

                        return { success: true };

                    } catch (error) {
                        if (attempt === retries) {
                            console.error(`❌ Foto ${index + 1} falló después de ${retries} intentos`);
                            errorCount++;
                            return { success: false, error: error.message };
                        }

                        // Esperar antes de reintentar (backoff exponencial)
                        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                    }
                }
            };

            /**
             * Procesar fotos en lotes pequeños
             */
            setStatus('Descargando fotos...');

            for (let i = 0; i < photos.length; i += BATCH_SIZE) {
                const batch = photos.slice(i, i + BATCH_SIZE);

                const promises = batch.map((photo, batchIndex) =>
                    downloadPhoto(photo, i + batchIndex)
                );

                await Promise.allSettled(promises);

                completedCount += batch.length;
                const progressPercent = Math.round((completedCount / total) * 100);
                setProgress(progressPercent);
                setStatus(`Descargadas ${completedCount} de ${total}...`);

                // Pequeña pausa entre lotes para no saturar
                if (i + BATCH_SIZE < photos.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Verificar que hay archivos en el ZIP
            const fileCount = Object.keys(zip.files).length;

            if (fileCount === 0) {
                throw new Error('No se pudo descargar ninguna foto. Verifica tu conexión.');
            }

            // Generar el ZIP
            setStatus('Generando archivo ZIP...');
            setProgress(95);

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            // Crear nombre del archivo ZIP
            const safeName = galleryTitle
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/gi, '_')
                .toLowerCase();

            const zipName = `${safeName}_fotos.zip`;

            // Descargar el ZIP
            setStatus('Iniciando descarga...');
            setProgress(100);
            saveAs(zipBlob, zipName);

            // Mostrar resumen
            if (errorCount > 0) {
                alert(
                    `✅ Descarga completada\n\n` +
                    `${successCount} fotos descargadas\n` +
                    `${errorCount} fotos fallaron`
                );
            }

        } catch (error) {
            console.error('❌ Error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsDownloading(false);
            setProgress(0);
            setStatus('');
        }
    };

    return (
        <button
            onClick={handleDownloadAll}
            disabled={isDownloading || !photos || photos.length === 0}
            className="
        px-4 py-2.5 
        bg-brown hover:bg-brown/90 
        text-white rounded-lg 
        transition-all duration-200
        flex items-center gap-2 
        font-fira text-sm font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        shadow-sm hover:shadow-md
      "
            title={status || 'Descargar todas las fotos'}
        >
            <Download
                size={16}
                className={isDownloading ? 'animate-bounce' : ''}
            />
            {isDownloading ? (
                <span className="hidden sm:inline">
                    {progress > 0 ? `${progress}%` : 'Preparando...'}
                </span>
            ) : (
                <span className="hidden sm:inline">Descargar todas</span>
            )}
            <span className="sr-only">
                {isDownloading
                    ? status || `Descargando ${progress}%`
                    : `Descargar todas las fotos (${photos?.length || 0})`
                }
            </span>
        </button>
    );
}