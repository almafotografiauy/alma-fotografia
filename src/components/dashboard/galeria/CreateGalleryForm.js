'use client';

import { useState, useEffect } from 'react'; // ✅ Agregado useEffect
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { defaultServiceTypes } from '@/lib/validations/gallery';
import { MessageSquare } from 'lucide-react';
import ServiceTypeSelector from './ServiceTypeSelector';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import { useModal } from '@/hooks/useModal';
import {
    Upload,
    Loader2,
    Check,
    X,
    Calendar,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Image as ImageIcon,
    Info,
    ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import { gallerySchema, generateSlug } from '@/lib/validations/gallery';
import { createClient } from '@/lib/supabaseClient';

/**
 * CreateGalleryForm - Formulario profesional de creación de galería
 *
 * Features completas inspiradas en Pixieset:
 * - Protección por contraseña (opcional)
 * - Control de descargas
 * - Control de comentarios
 * - Límite de favoritos personalizado
 * - Portada optimizada
 *
 * Optimizaciones:
 * - React Hook Form + Zod
 * - Animaciones con Framer Motion
 * - Optimización de imágenes
 * - Validaciones en tiempo real
 */
export default function CreateGalleryForm() {
    const router = useRouter();
    const { modalState, showModal, closeModal } = useModal();

    // ✅ Estado para el origin (fix hydration)
    const [origin, setOrigin] = useState('');

    const [coverImage, setCoverImage] = useState(null);
    const [coverImagePreview, setCoverImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // ✅ Setear origin en el cliente
    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(gallerySchema),
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            eventDate: '',
            isPublic: false,
            serviceType: '',
            customMessage: '',
            password: '',
            allowDownloads: true,
            allowComments: true,
            maxFavorites: 150,
            downloadPin: '',
        }
    });

    // Auto-generar slug cuando cambia el título
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setValue('title', newTitle);
        setValue('slug', generateSlug(newTitle));
    };

    /**
     * Optimiza imagen antes de subirla
     * - Resize a máximo 1920px
     * - Conversión a WebP
     * - Compresión 85%
     */
    const optimizeImage = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = document.createElement('img');

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1920;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = (height * MAX_WIDTH) / width;
                        width = MAX_WIDTH;
                    }

                    if (height > MAX_HEIGHT) {
                        width = (width * MAX_HEIGHT) / height;
                        height = MAX_HEIGHT;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error('Error al optimizar imagen'));
                        },
                        'image/webp',
                        0.85
                    );
                };

                img.onerror = () => reject(new Error('Error al cargar imagen'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Error al leer archivo'));
            reader.readAsDataURL(file);
        });
    };

    /**
     * Maneja selección y optimización de imagen
     */
    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showModal({
                title: 'Formato inválido',
                message: 'Solo se permiten imágenes JPG, PNG o WebP',
                type: 'error'
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showModal({
                title: 'Archivo muy grande',
                message: 'La imagen no debe superar los 10MB',
                type: 'error'
            });
            return;
        }

        try {
            setIsUploading(true);

            const optimizedBlob = await optimizeImage(file);

            // Generar nombre SEO-friendly: portada-galeria-nombreGaleria-timestamp.webp
            const gallerySlug = watch('slug') || watch('title')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            const timestamp = Date.now();
            // ✅ Incluir "galeria" para mejor SEO
            // Ej: portada-galeria-casamiento-maria-juan-1234567890.webp
            const prettyFileName = `portada-galeria-${gallerySlug}-${timestamp}.webp`;

            const optimizedFile = new File(
                [optimizedBlob],
                prettyFileName,
                { type: 'image/webp' }
            );

            setCoverImage(optimizedFile);

            const reader = new FileReader();
            reader.onloadend = () => setCoverImagePreview(reader.result);
            reader.readAsDataURL(optimizedFile);

            // Log optimización (solo dev)
            if (process.env.NODE_ENV === 'development') {
                const reduction = ((1 - optimizedBlob.size / file.size) * 100).toFixed(1);
                console.log(`📸 Portada optimizada → ${prettyFileName}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(optimizedBlob.size / 1024 / 1024).toFixed(2)}MB (-${reduction}%)`);
            }
        } catch (error) {
            showModal({
                title: 'Error procesando imagen',
                message: 'Error al procesar la imagen',
                type: 'error'
            });
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Sube imagen a Cloudinary
     */
    const uploadCoverImage = async () => {
        if (!coverImage) return null;

        try {
            const formData = new FormData();
            formData.append('file', coverImage);
            formData.append('folder', 'gallery-covers');
            formData.append('resourceType', 'image');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Error uploading image');

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            return result.url;
        } catch (error) {
            throw error;
        }
    };

    /**
     * Submit del formulario
     */
    const onSubmit = async (data) => {
        let uploadedCoverUrl = null; // Rastrear la portada subida para cleanup

        try {

            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                showModal({
                    title: 'Usuario no autenticado',
                    message: 'Debes iniciar sesión para crear galerías',
                    type: 'error'
                });
                return;
            }


            // ✅ Validar que siempre tenga tipo de servicio
            if (!data.serviceType) {
                showModal({
                    title: 'Tipo de servicio requerido',
                    message: 'Debes seleccionar un tipo de servicio para crear la galería',
                    type: 'warning'
                });
                return;
            }

            // ✅ OPTIMIZACIÓN: Verificaciones en paralelo
            const [publicGalleryCheck, slugCheck, uploadResult] = await Promise.all([
                // 1. Verificar galería pública (solo si aplica)
                data.isPublic && data.serviceType
                    ? supabase
                        .from('galleries')
                        .select('id, title')
                        .eq('is_public', true)
                        .eq('service_type', data.serviceType)
                        .maybeSingle()
                    : Promise.resolve({ data: null }),

                // 2. Verificar slug duplicado
                supabase
                    .from('galleries')
                    .select('id, title')
                    .eq('slug', data.slug.trim())
                    .maybeSingle(),

                // 3. Subir imagen en paralelo
                uploadCoverImage()
            ]);

            // Manejar galería pública duplicada
            if (publicGalleryCheck.data) {
                showModal({
                    title: 'Ya existe una galería pública para este servicio',
                    message: `La galería "${publicGalleryCheck.data.title}" ya está configurada como pública para este tipo de servicio. Solo puede haber una galería pública por servicio.\n\n¿Qué deseas hacer?`,
                    type: 'warning',
                    confirmText: 'Crear como privada',
                    cancelText: 'Ver galería existente',
                    onConfirm: () => {
                        setValue('isPublic', false);
                        handleSubmit(onSubmit)();
                    },
                    onCancel: () => {
                        router.push(`/dashboard/galerias/${publicGalleryCheck.data.id}`);
                    }
                });
                return;
            }

            // Manejar slug duplicado
            if (slugCheck.data) {
                showModal({
                    title: 'URL duplicada',
                    message: `Ya existe una galería con esta URL (${data.slug}). La galería existente se llama: "${slugCheck.data.title}". Por favor elige otra URL.`,
                    type: 'error'
                });
                return;
            }

            uploadedCoverUrl = uploadResult;

            // Preparar datos
            const galleryData = {
                title: data.title.trim(),
                slug: data.slug.trim(),
                description: data.description?.trim() || null,
                event_date: data.eventDate?.trim() || null,
                cover_image: uploadedCoverUrl,
                is_public: data.isPublic,
                created_by: user.id,
                views_count: 0,
                service_type: data.serviceType || null,
                custom_message: data.customMessage?.trim() || null,
                password: data.password?.trim() || null,
                allow_downloads: data.allowDownloads,
                allow_comments: data.allowComments,
                max_favorites: data.maxFavorites || 150,
                download_pin: data.downloadPin?.trim() || null,
            };

            const { data: gallery, error } = await supabase
                .from('galleries')
                .insert(galleryData)
                .select()
                .single();

            if (error) {

                // Cleanup: eliminar portada subida si falla la creación
                if (uploadedCoverUrl) {
                    try {
                        const publicId = uploadedCoverUrl.match(/\/v\d+\/(.+)\.\w+$/)?.[1];
                        if (publicId) {
                            await fetch('/api/cloudinary/delete', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ publicId })
                            });
                        }
                    } catch (cleanupError) {
                    }
                }

                // Limpiar estado para evitar acumulación
                setCoverImage(null);
                setCoverImagePreview(null);

                if (error.code === '23505') {
                    if (error.message && error.message.includes('unique_public_service_gallery')) {
                        showModal({
                            title: 'Galería duplicada',
                            message: 'Ya existe una galería pública con este tipo de servicio',
                            type: 'error'
                        });
                    } else if (error.message && error.message.includes('slug')) {
                        showModal({
                            title: 'URL duplicada',
                            message: 'Ya existe una galería con esta URL. Elige otra.',
                            type: 'error'
                        });
                    } else {
                        showModal({
                            title: 'Error de duplicado',
                            message: error.message || 'Ya existe una galería con estos datos',
                            type: 'error'
                        });
                    }
                    return;
                }

                // Otros errores
                showModal({
                    title: 'Error al crear galería',
                    message: error.message || error.details || 'Error desconocido. Revisa la consola para más detalles.',
                    type: 'error'
                });
                return;
            }


            // Crear sección por defecto "Galería"
            try {
                const { error: sectionError } = await supabase
                    .from('photo_sections')
                    .insert({
                        gallery_id: gallery.id,
                        name: 'Galería',
                        description: null,
                        display_order: 0,
                    });

                if (sectionError) {
                } else {
                }
            } catch (sectionError) {
            }

            // Enviar notificación de creación de galería
            try {
                const notifResponse = await fetch('/api/galleries/created', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ galleryId: gallery.id }),
                });

                const notifData = await notifResponse.json();
            } catch (notifError) {
                // Error silencioso - no afectar UX
            }

            showModal({
                title: 'Galería creada',
                message: 'La galería se creó correctamente',
                type: 'success',
                onConfirm: () => router.push('/dashboard/galerias')
            });

        } catch (error) {

            // Cleanup: eliminar portada subida si hubo error general
            if (uploadedCoverUrl) {
                try {
                    const publicId = uploadedCoverUrl.match(/\/v\d+\/(.+)\.\w+$/)?.[1];
                    if (publicId) {
                        await fetch('/api/cloudinary/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ publicId })
                        });
                    }
                } catch (cleanupError) {
                }
            }

            // Limpiar estado para evitar acumulación
            setCoverImage(null);
            setCoverImagePreview(null);

            showModal({
                title: 'Error al crear galería',
                message: error.message || 'Ocurrió un error inesperado. Revisa la consola para más detalles.',
                type: 'error'
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-full overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 md:space-y-8 max-w-4xl mx-auto">


                <button
                    type="button"
                    onClick={() => router.push('/dashboard/galerias')}
                    className="flex items-center gap-2 text-black/60 hover:text-black transition-colors font-fira text-sm mb-4"
                >
                    <ArrowLeft size={16} />
                    <span>Volver</span>
                </button>

                {/* Título */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <label className="block font-fira text-sm font-medium text-black mb-2">
                        Título de la galería *
                    </label>
                    <input
                        type="text"
                        {...register('title')}
                        onChange={handleTitleChange}
                        placeholder="Ej: Sesión María y Juan - Casamiento"
                        className={`w-full px-4 py-3 border rounded-lg font-fira text-sm text-black 
                            focus:outline-none focus:ring-2 focus:ring-[#C6A97D]/40 transition-all
                            ${errors.title
                                ? 'border-red-300'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                    />
                    {errors.title && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 font-fira text-sm text-red-600"
                        >
                            {errors.title.message}
                        </motion.p>
                    )}
                </motion.div>

                {/* Slug */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="max-w-full overflow-hidden"
                >
                    <label className="block font-fira text-sm font-medium text-black mb-2">
                        URL de la galería *
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch gap-2 max-w-full">
                        <div className="flex items-center px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg overflow-hidden min-w-0">
                            <span className="font-fira text-[10px] sm:text-xs md:text-sm text-black/60 truncate">
                                {origin ? `${origin.replace('https://', '').replace('http://', '')}/galeria/` : 'tudominio.com/galeria/'}
                            </span>
                        </div>
                        <input
                            type="text"
                            {...register('slug')}
                            placeholder="sesion-maria-juan"
                            className={`flex-1 px-4 py-3 border rounded-lg font-fira text-sm text-black 
                                focus:outline-none focus:ring-2 focus:ring-[#C6A97D]/40 transition-all
                                ${errors.slug
                                    ? 'border-red-300'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                        />
                    </div>
                    <p className="mt-1 font-fira text-xs text-black/50 flex items-center gap-1">
                        <Info size={12} />
                        Se genera automáticamente, pero puedes editarlo
                    </p>
                    {errors.slug && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 font-fira text-sm text-red-600"
                        >
                            {errors.slug.message}
                        </motion.p>
                    )}
                </motion.div>

                {/* Tipo de servicio */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 }}
                >
                    <label className="block font-fira text-sm font-medium text-black mb-3">
                        Tipo de servicio * {watch('isPublic') && <span className="text-[#79502A]">*</span>}
                    </label>
                    <ServiceTypeSelector
                        value={watch('serviceType')}
                        onChange={(slug) => setValue('serviceType', slug)}
                        isPublic={watch('isPublic')}
                        error={errors.serviceType?.message}
                    />
                </motion.div>

                {/* Descripción */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <label className="block font-fira text-sm font-medium text-black mb-2">
                        Descripción
                    </label>
                    <textarea
                        {...register('description')}
                        placeholder="Breve descripción de la sesión..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-fira text-sm text-black
                            focus:outline-none focus:ring-2 focus:ring-[#C6A97D]/40 transition-all resize-y
                            hover:border-gray-400"
                    />
                    {errors.description && (
                        <p className="mt-2 font-fira text-sm text-red-600">{errors.description.message}</p>
                    )}
                </motion.div>

                {/* Mensaje personalizado para el cliente */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.23 }}
                >
                    <label className="block font-fira text-sm font-medium text-black mb-2 flex items-center gap-2">
                        <MessageSquare size={16} className="text-[#79502A]" />
                        Mensaje para el cliente
                    </label>
                    <textarea
                        {...register('customMessage')}
                        placeholder="Ej: ¡Hola María! Acá están tus fotos 💕 Elegí hasta 150 favoritas para tu álbum"
                        rows={3}
                        maxLength={300}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-fira text-sm text-black 
                            focus:outline-none focus:ring-2 focus:ring-[#C6A97D]/40 transition-all resize-y
                            hover:border-gray-400"
                    />
                    <div className="flex items-center justify-between mt-1">
                        <p className="font-fira text-xs text-black/50">
                            Este mensaje aparecerá al inicio de la galería
                        </p>
                        <p className="font-fira text-xs text-black/40">
                            {watch('customMessage')?.length || 0}/300
                        </p>
                    </div>
                    {errors.customMessage && (
                        <p className="mt-2 font-fira text-sm text-red-600">{errors.customMessage.message}</p>
                    )}
                </motion.div>

                {/* Fecha del evento y Email en grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
                >
                    {/* Fecha */}
                    <div>
                        <label className="block font-fira text-sm font-medium text-black mb-2 flex items-center gap-2">
                            <Calendar size={16} className="text-[#79502A]" />
                            Fecha del evento
                        </label>
                        <input
                            type="date"
                            {...register('eventDate')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg font-fira text-sm text-black 
                                focus:outline-none focus:ring-2 focus:ring-[#C6A97D]/40 transition-all
                                hover:border-gray-400"
                        />
                    </div>

                </motion.div>

                {/* Imagen de portada */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <label className="block font-fira text-sm font-medium text-black mb-2 flex items-center gap-2">
                        <ImageIcon size={16} className="text-[#79502A]" />
                        Imagen de portada
                    </label>

                    <AnimatePresence mode="wait">
                        {coverImagePreview ? (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full aspect-video bg-gray-50 rounded-lg overflow-hidden shadow-sm"
                            >
                                <Image
                                    src={coverImagePreview}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    onClick={() => {
                                        setCoverImage(null);
                                        setCoverImagePreview(null);
                                    }}
                                    disabled={isUploading}
                                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full 
                                        transition-colors shadow-lg disabled:opacity-50"
                                >
                                    <X size={20} className="text-black" />
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.label
                                key="upload"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`block w-full aspect-video border-2 border-dashed rounded-lg transition-all
                                    ${isUploading
                                        ? 'border-[#C6A97D] bg-gray-50'
                                        : 'border-gray-300 hover:border-[#79502A] hover:bg-gray-50/50 cursor-pointer'
                                    }`}
                            >
                                <div className="flex flex-col items-center justify-center h-full px-4">
                                    {isUploading ? (
                                        <>
                                            <Loader2 size={48} className="text-[#79502A] animate-spin mb-4" strokeWidth={1.5} />
                                            <p className="font-fira text-sm text-black/60 text-center">
                                                Optimizando imagen...
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={48} className="text-black/30 mb-4" strokeWidth={1} />
                                            <p className="font-fira text-sm text-black/60 text-center">
                                                Click para subir imagen
                                            </p>
                                            <p className="font-fira text-xs text-black/40 mt-1 text-center">
                                                JPG, PNG o WebP (máx. 10MB)
                                            </p>
                                            <p className="font-fira text-xs text-[#79502A] mt-2 text-center">
                                                Se optimizará automáticamente
                                            </p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleImageSelect}
                                    disabled={isUploading}
                                    className="hidden"
                                />
                            </motion.label>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Opciones básicas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-3 sm:space-y-4"
                >
                    {/* Galería pública */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-300">
                            <input
                                type="checkbox"
                                id="isPublic"
                                {...register('isPublic')}
                                className="mt-1 w-5 h-5 accent-[#79502A] cursor-pointer flex-shrink-0"
                            />
                            <label htmlFor="isPublic" className="flex-1 cursor-pointer">
                                <p className="font-fira text-sm font-medium text-black">
                                    Galería pública
                                </p>
                                <p className="font-fira text-xs text-black/60 mt-1">
                                    Aparecerá en tu portafolio público
                                </p>
                            </label>
                        </div>

                        {/* Mensaje de advertencia cuando es pública */}
                        {watch('isPublic') && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg"
                            >
                                <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-fira text-sm font-medium text-amber-900 mb-1">
                                        Recomendación de seguridad
                                    </p>
                                    <p className="font-fira text-xs text-amber-800 leading-relaxed">
                                        Se recomienda establecer una contraseña para esta galería. De esta forma, solo usuarios con el enlace directo desde tu portafolio podrán ver las fotos, pero no podrán acceder a funciones como descargas o favoritos sin la contraseña.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Permitir descargas */}
                    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-300">
                        <input
                            type="checkbox"
                            id="allowDownloads"
                            {...register('allowDownloads')}
                            className="mt-1 w-5 h-5 accent-[#79502A] cursor-pointer flex-shrink-0"
                        />
                        <label htmlFor="allowDownloads" className="flex-1 cursor-pointer">
                            <p className="font-fira text-sm font-medium text-black">
                                Permitir descargas
                            </p>
                            <p className="font-fira text-xs text-black/60 mt-1">
                                Los clientes podrán descargar las fotos
                            </p>
                        </label>
                    </div>

                    {/* PIN de descarga (solo si descargas están habilitadas) */}
                    {watch('allowDownloads') && (
                        <div className="ml-8 -mt-2">
                            <label className="block font-fira text-sm font-medium text-black mb-2">
                                PIN de descarga (opcional)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    {...register('downloadPin')}
                                    placeholder="Ej: 1234"
                                    maxLength={6}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-fira text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#79502A] focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const pin = Math.floor(1000 + Math.random() * 9000).toString();
                                        setValue('downloadPin', pin);
                                    }}
                                    className="px-4 py-2 bg-[#79502A] hover:bg-[#8B5A2F] text-white rounded-lg font-fira text-xs font-medium transition-colors whitespace-nowrap"
                                >
                                    Generar
                                </button>
                            </div>
                            <p className="font-fira text-xs text-gray-500 mt-2">
                                {watch('downloadPin')
                                    ? 'Los clientes necesitarán este PIN para descargar fotos.'
                                    : 'Deja vacío para no requerir PIN.'}
                            </p>
                        </div>
                    )}

                    {/* Permitir comentarios */}
                    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-300">
                        <input
                            type="checkbox"
                            id="allowComments"
                            {...register('allowComments')}
                            className="mt-1 w-5 h-5 accent-[#79502A] cursor-pointer flex-shrink-0"
                        />
                        <label htmlFor="allowComments" className="flex-1 cursor-pointer">
                            <p className="font-fira text-sm font-medium text-black">
                                Permitir comentarios
                            </p>
                            <p className="font-fira text-xs text-black/60 mt-1">
                                Los clientes podrán comentar cada foto
                            </p>
                        </label>
                    </div>
                </motion.div>

                {/* Opciones avanzadas (colapsables) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-[#79502A] hover:text-[#79502A]/80 transition-colors font-fira text-sm font-medium"
                    >
                        <motion.div
                            animate={{ rotate: showAdvanced ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            ▶
                        </motion.div>
                        Opciones avanzadas
                    </button>

                    <AnimatePresence>
                        {showAdvanced && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 space-y-6 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-300">

                                    {/* Contraseña */}
                                    <div>
                                        <label className="block font-fira text-sm font-medium text-black mb-2 flex items-center gap-2">
                                            <Lock size={16} className="text-[#79502A]" />
                                            Proteger con contraseña
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                {...register('password')}
                                                placeholder="Dejar vacío para sin contraseña"
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg font-fira text-sm text-black 
                                                    focus:outline-none focus:ring-2 focus:ring-[#C6A97D]/40 transition-all
                                                    hover:border-gray-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="mt-2 font-fira text-sm text-red-600">{errors.password.message}</p>
                                        )}
                                    </div>

                                    {/* Límite de favoritos */}
                                    <div>
                                        <label className="block font-fira text-sm font-medium text-black mb-2">
                                            Límite de favoritos
                                        </label>
                                        <input
                                            type="number"
                                            {...register('maxFavorites', { valueAsNumber: true })}
                                            min="0"
                                            max="500"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg font-fira text-sm text-black 
                                                focus:outline-none focus:ring-2 focus:ring-[#C6A97D]/40 transition-all
                                                hover:border-gray-400"
                                        />
                                        <p className="mt-1 font-fira text-xs text-black/50">
                                            Máximo de fotos que el cliente puede marcar como favoritas
                                        </p>
                                        {errors.maxFavorites && (
                                            <p className="mt-2 font-fira text-sm text-red-600">{errors.maxFavorites.message}</p>
                                        )}
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Botones de acción */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-6 border-t border-gray-300"
                >
                    {/* Botón Cancelar */}
                    <motion.button
                        type="button"
                        onClick={() => router.back()}
                        disabled={isSubmitting || isUploading}
                        whileHover={{ scale: 1.02, x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 border-2 border-gray-400 text-black font-fira text-sm font-medium
                            rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                            hover:border-black hover:bg-black/5 active:bg-black/10
                            flex items-center justify-center gap-2"
                    >
                        <X size={18} strokeWidth={2} />
                        <span>Cancelar</span>
                    </motion.button>

                    {/* Botón Crear */}
                    <motion.button
                        type="submit"
                        disabled={isSubmitting || isUploading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 sm:flex-[2] px-6 py-3 bg-[#79502A] font-fira text-sm font-medium
                            rounded-lg transition-all shadow-sm
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400
                            hover:bg-[#8B5A2F] hover:shadow-md
                            active:bg-[#6A4522] active:shadow-sm
                            flex items-center justify-center gap-2 relative overflow-hidden group"
                    >
                        {/* Efecto de brillo al hover */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.6 }}
                        />

                        {/* Contenido del botón - ✅ SIEMPRE BLANCO */}
                        <div className="relative z-10 flex items-center gap-2 text-white">
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />
                                    <span className="font-medium">Creando galería...</span>
                                </>
                            ) : isUploading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />
                                    <span className="font-medium">Procesando imagen...</span>
                                </>
                            ) : (
                                <>
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 3
                                        }}
                                    >
                                        <Check size={18} strokeWidth={2.5} />
                                    </motion.div>
                                    <span className="font-medium">Crear galería</span>
                                </>
                            )}
                        </div>
                    </motion.button>
                </motion.div>
            </form>

            {/* Modal */}
            <Modal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                onConfirm={modalState.onConfirm}
                onCancel={modalState.onCancel}
            />
        </motion.div>
    );
}