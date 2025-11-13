import { z } from 'zod';
import {
    Heart,
    Cake,
    Briefcase,
    Users,
    User,
    Camera,
    Baby,
    Dog,
    Zap,
    Sparkles,
    GraduationCap,
    Gift,
    Palmtree,
    Mountain,
    Building,
    Utensils
} from 'lucide-react';

/**
 * Schema de validación para crear/editar galerías
 */
export const gallerySchema = z.object({
    title: z
        .string()
        .min(3, 'El título debe tener al menos 3 caracteres')
        .max(100, 'El título no puede superar los 100 caracteres')
        .trim(),

    slug: z
        .string()
        .min(3, 'El slug debe tener al menos 3 caracteres')
        .max(100, 'El slug no puede superar los 100 caracteres')
        .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones')
        .trim(),

    description: z
        .string()
        .max(500, 'La descripción no puede superar los 500 caracteres')
        .optional()
        .or(z.literal('')),

    eventDate: z
        .string()
        .optional()
        .or(z.literal('')),

    clientEmail: z
        .string()
        .email('Email inválido')
        .optional()
        .or(z.literal('')),

    isPublic: z.boolean(),

    // Nuevo: Tipo de servicio
    serviceType: z
        .string()
        .min(1, 'Selecciona un tipo de servicio')
        .optional()
        .or(z.literal('')),

    // Nuevo: Mensaje personalizado
    customMessage: z
        .string()
        .max(300, 'El mensaje no puede superar los 300 caracteres')
        .optional()
        .or(z.literal('')),

    // Nuevo: Notificaciones
    notifyOnView: z.boolean(),
    notifyOnFavorites: z.boolean(),

    password: z
        .string()
        .min(4, 'La contraseña debe tener al menos 4 caracteres')
        .max(50, 'La contraseña no puede superar los 50 caracteres')
        .optional()
        .or(z.literal('')),

    allowDownloads: z.boolean(),
    allowComments: z.boolean(),

    maxFavorites: z
        .number()
        .int()
        .min(0, 'Debe ser un número positivo')
        .max(500, 'Máximo 500 favoritos')
        .optional(),
});

/**
 * Mapeo de icons de Lucide
 */
export const iconMap = {
    'Heart': Heart,
    'Cake': Cake,
    'Briefcase': Briefcase,
    'Users': Users,
    'User': User,
    'Camera': Camera,
    'Baby': Baby,
    'Dog': Dog,
    'Sparkles': Sparkles,
    'GraduationCap': GraduationCap,
    'Gift': Gift,
    'Palmtree': Palmtree,
    'Mountain': Mountain,
    'Building': Building,
    'Utensils': Utensils,
    'Zap': Zap,
};

/**
 * Genera slug desde título
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Servicios por defecto (fallback si no hay conexión)
 */
export const defaultServiceTypes = [
  { slug: 'boda', name: 'Boda', icon_name: 'Heart', is_default: true },
  { slug: 'cumpleanos', name: 'Cumpleaños', icon_name: 'Cake', is_default: true },
  { slug: 'evento-corporativo', name: 'Evento Corporativo', icon_name: 'Briefcase', is_default: true },
  { slug: 'sesion-familia', name: 'Sesión Familiar', icon_name: 'Users', is_default: true },
  { slug: 'sesion-individual', name: 'Sesión Individual', icon_name: 'User', is_default: true },
];