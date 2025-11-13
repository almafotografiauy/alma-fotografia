'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { iconMap, defaultServiceTypes, generateSlug } from '@/lib/validations/gallery';
import Modal from '@/components/ui/Modal';
import { useModal } from '@/hooks/useModal';
import { useRouter } from 'next/navigation';

/**
 * Iconos disponibles para seleccionar
 */
const availableIcons = [
  { name: 'Heart', label: 'Corazón' },
  { name: 'Cake', label: 'Torta' },
  { name: 'Briefcase', label: 'Maletín' },
  { name: 'Users', label: 'Familia' },
  { name: 'User', label: 'Persona' },
  { name: 'Camera', label: 'Cámara' },
  { name: 'Baby', label: 'Bebé' },
  { name: 'Dog', label: 'Mascota' },
  { name: 'Sparkles', label: 'XV Años' },
  { name: 'GraduationCap', label: 'Graduación' },
  { name: 'Gift', label: 'Regalo' },
  { name: 'Palmtree', label: 'Playa' },
  { name: 'Mountain', label: 'Outdoor' },
  { name: 'Building', label: 'Inmueble' },
  { name: 'Utensils', label: 'Food' },
  { name: 'Zap', label: 'Especial' },
];

/**
 * ServiceEditor - Editor visual profesional de servicios
 */
export default function ServiceEditor() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', icon: 'Camera', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { modalState, showModal, closeModal } = useModal();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;

      setServices(data || defaultServiceTypes);
    } catch (error) {
      console.error('Error loading services:', error);
      setServices(defaultServiceTypes);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      icon: service.icon_name,
      description: service.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setShowCreateForm(false);
    setFormData({ name: '', icon: 'Camera', description: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showModal({
        title: 'Nombre requerido',
        message: 'Debes ingresar un nombre para el servicio',
        type: 'warning'
      });
      return;
    }

    setSaving(true);
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      if (editingService) {
        // Editar existente
        const { error } = await supabase
          .from('service_types')
          .update({
            name: formData.name.trim(),
            icon_name: formData.icon,
            description: formData.description.trim() || null,
          })
          .eq('id', editingService.id);

        if (error) throw error;

        setServices(prev =>
          prev.map(s =>
            s.id === editingService.id
              ? {
                  ...s,
                  name: formData.name.trim(),
                  icon_name: formData.icon,
                  description: formData.description.trim() || null
                }
              : s
          )
        );

        showModal({
          title: 'Servicio actualizado',
          message: 'El servicio se actualizó correctamente',
          type: 'success'
        });
      } else {
        // Crear nuevo
        const slug = generateSlug(formData.name);

        const { data, error } = await supabase
          .from('service_types')
          .insert({
            name: formData.name.trim(),
            slug,
            icon_name: formData.icon,
            description: formData.description.trim() || null,
            is_default: false,
            created_by: user.id
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            showModal({
              title: 'Servicio duplicado',
              message: 'Ya existe un servicio con ese nombre',
              type: 'error'
            });
            return;
          }
          throw error;
        }

        setServices(prev => [...prev, data]);

        showModal({
          title: 'Servicio creado',
          message: 'El nuevo servicio se creó correctamente',
          type: 'success'
        });
      }

      setEditingService(null);
      setShowCreateForm(false);
      setFormData({ name: '', icon: 'Camera', description: '' });
    } catch (error) {
      console.error('Error saving service:', error);
      showModal({
        title: 'Error al guardar',
        message: 'Ocurrió un error al guardar el servicio',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service) => {
    setDeleting(service.id);

    try {
      const supabase = await createClient();

      // ✅ Verificar si tiene galerías asociadas
      const { data: galleries, error: galleriesError } = await supabase
        .from('galleries')
        .select('id, title, slug')
        .eq('service_type', service.slug);

      if (galleriesError) {
        console.error('Error al verificar galerías:', galleriesError);
        throw galleriesError;
      }

      // ✅ Si tiene galerías, mostrar modal con opciones
      if (galleries && galleries.length > 0) {
        showModal({
          title: 'No se puede eliminar',
          message: `Este servicio está siendo usado por ${galleries.length} ${galleries.length === 1 ? 'galería' : 'galerías'}. Debes cambiar el tipo de servicio de ${galleries.length === 1 ? 'esta galería' : 'estas galerías'} antes de eliminarlo.`,
          type: 'warning',
          confirmText: 'Ver galerías',
          cancelText: 'Cancelar',
          onConfirm: () => {
            // Redirigir a la página de galerías
            router.push('/dashboard/galerias');
          }
        });
        setDeleting(null);
        return;
      }

      // ✅ Si no tiene galerías, pedir confirmación
      showModal({
        title: '¿Eliminar servicio?',
        message: `¿Estás seguro de eliminar "${service.name}"? Esta acción no se puede deshacer.`,
        type: 'warning',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        onConfirm: () => confirmDelete(service)
      });

    } catch (error) {
      console.error('Error al verificar servicio:', error);
      showModal({
        title: 'Error',
        message: 'Ocurrió un error al verificar el servicio',
        type: 'error'
      });
      setDeleting(null);
    }
  };

  const confirmDelete = async (service) => {
    setDeleting(service.id);

    try {
      const supabase = await createClient();

      console.log('Eliminando servicio:', service.id);

      const { error, data } = await supabase
        .from('service_types')
        .delete()
        .eq('id', service.id)
        .select();

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }

      console.log('Servicio eliminado exitosamente:', data);

      // ✅ Actualizar estado local
      setServices(prev => prev.filter(s => s.id !== service.id));

      showModal({
        title: 'Servicio eliminado',
        message: 'El servicio se eliminó correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      showModal({
        title: 'Error al eliminar',
        message: `No se pudo eliminar el servicio: ${error.message}`,
        type: 'error'
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-[#79502A] animate-spin" />
      </div>
    );
  }

  const isEditing = editingService || showCreateForm;

  return (
    <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto">
      {/* Header con botón crear */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="font-fira text-sm text-black/60 max-w-2xl">
            Los tipos de servicio te permiten categorizar tus galerías y mostrar tu portafolio
            organizado por especialidad en tu página principal.
          </p>
        </div>
        {!isEditing && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-[#79502A] !text-white rounded-lg font-fira text-sm font-medium
              flex items-center justify-center gap-2 whitespace-nowrap hover:bg-[#8B5A2F] shadow-sm"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>Crear servicio</span>
          </motion.button>
        )}
      </div>

      {/* Form de creación/edición */}
      <AnimatePresence mode="wait">
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-white border-2 border-[#79502A] rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-fira text-lg font-semibold text-black flex items-center gap-2">
                {editingService ? (
                  <>
                    <Pencil size={20} className="text-[#79502A]" />
                    Editar servicio
                  </>
                ) : (
                  <>
                    <Plus size={20} className="text-[#79502A]" />
                    Nuevo servicio
                  </>
                )}
              </h3>
            </div>

            <div className="space-y-6">
              {/* Nombre */}
              <div>
                <label className="block font-fira text-sm font-medium text-black mb-2">
                  Nombre del servicio *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Sesión de Mascotas"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-fira text-sm
                    focus:outline-none focus:ring-2 focus:ring-[#C6A97D]/40 transition-all !text-black"
                  disabled={saving}
                  autoFocus
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block font-fira text-sm font-medium text-black mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej: Fotografía y video para tu día más especial"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-fira text-sm
                    focus:outline-none focus:ring-2 focus:ring-[#C6A97D]/40 transition-all !text-black"
                  disabled={saving}
                  maxLength={150}
                />
                <p className="font-fira text-xs text-black/40 mt-1">
                  Breve descripción que aparecerá en las cards de selección
                </p>
              </div>

              {/* Selector de icono */}
              <div>
                <label className="block font-fira text-sm font-medium text-black mb-3">
                  Icono del servicio *
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {availableIcons.map((icon) => {
                    const IconComponent = iconMap[icon.name];
                    const isSelected = formData.icon === icon.name;

                    return (
                      <motion.button
                        key={icon.name}
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFormData(prev => ({ ...prev, icon: icon.name }))}
                        className={`relative flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all
                          ${isSelected
                            ? 'border-[#79502A] bg-white shadow-md'
                            : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                          }`}
                      >
                        <IconComponent
                          size={28}
                          className={isSelected ? 'text-[#79502A]' : 'text-black/60'}
                          strokeWidth={1.5}
                        />
                        <span className="font-fira text-[10px] text-black/60 text-center leading-tight">
                          {icon.label}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-[#79502A] rounded-full 
                              flex items-center justify-center shadow-md"
                          >
                            <Check size={14} className="text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving || !formData.name.trim()}
                  className="flex-1 px-6 py-3 bg-[#79502A] !text-white rounded-lg font-fira text-sm font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                    hover:bg-[#8B5A2F] shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} strokeWidth={2.5} />
                      <span>{editingService ? 'Guardar cambios' : 'Crear servicio'}</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-6 py-3 border-2 border-gray-300 text-black rounded-lg font-fira text-sm font-medium
                    hover:border-gray-400 hover:bg-gray-50 transition-all
                    flex items-center justify-center gap-2"
                >
                  <X size={18} strokeWidth={2.5} />
                  <span>Cancelar</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de servicios - Compacto */}
      {!isEditing && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {services.map((service, index) => {
              const IconComponent = iconMap[service.icon_name] || iconMap['Camera'];
              const isDeleting = deleting === service.id;

              return (
                <motion.div
                  key={service.id || service.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group bg-white border-2 border-gray-200 rounded-lg
                    p-4 hover:border-[#79502A] hover:shadow-md transition-all"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg
                    bg-[#79502A]/10
                    flex items-center justify-center mb-3
                    group-hover:scale-105 group-hover:bg-[#79502A]/15
                    transition-all">
                    <IconComponent
                      size={22}
                      className="text-[#79502A]"
                      strokeWidth={1.8}
                    />
                  </div>

                  {/* Info */}
                  <div className="mb-3">
                    <h4 className="font-fira text-sm font-semibold text-black mb-1.5 leading-tight">
                      {service.name}
                    </h4>
                    {service.description ? (
                      <p className="font-fira text-xs text-black/60 leading-snug line-clamp-2">
                        {service.description}
                      </p>
                    ) : (
                      <p className="font-fira text-[10px] text-black/40 italic">
                        {service.is_default ? 'Predeterminado' : 'Personalizado'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEdit(service)}
                      className="flex-1 px-3 py-2 bg-[#79502A] text-white
                        rounded-lg font-fira text-xs font-semibold
                        hover:bg-[#8B5A2F] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Pencil size={14} />
                      <span>Editar</span>
                    </motion.button>
                    {!service.is_default && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDelete(service)}
                        disabled={isDeleting}
                        className="px-3 py-2 bg-red-500 text-white
                          rounded-lg font-fira text-xs font-semibold
                          hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center justify-center"
                      >
                        {isDeleting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Estado vacío */}
      {services.length === 0 && !isEditing && (
        <div className="text-center py-20">
          <AlertCircle size={48} className="text-black/20 mx-auto mb-4" />
          <p className="font-fira text-base text-black/40 mb-6">
            No hay servicios creados todavía
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-[#79502A] !text-white rounded-lg font-fira text-sm font-medium
              inline-flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Crear primer servicio</span>
          </motion.button>
        </div>
      )}

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
    </div>
  );
}