'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { iconMap, defaultServiceTypes, generateSlug } from '@/lib/validations/gallery';
import { useToast } from '@/components/ui/Toast';

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

export default function ServiceTypeSelector({ value, onChange, isPublic, error }) {
  const [services, setServices] = useState(defaultServiceTypes);
  const [loading, setLoading] = useState(true);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Camera');
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

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

      if (data && data.length > 0) {
        setServices(data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!newServiceName.trim()) return;

    setCreating(true);
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const slug = generateSlug(newServiceName);

      const { data, error } = await supabase
        .from('service_types')
        .insert({
          name: newServiceName.trim(),
          slug,
          icon_name: selectedIcon,
          is_default: false,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          showToast({ message: 'Ya existe un servicio con ese nombre', type: 'error' });
        } else {
          throw error;
        }
        return;
      }

      setServices(prev => [...prev, data]);
      onChange(data.slug);
      setNewServiceName('');
      setSelectedIcon('Camera');
      setShowAddNew(false);
    } catch (error) {
      showToast({ message: 'Error al crear el servicio', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#79502A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Grid de servicios - Compacto y profesional */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {services.map((service) => {
          const IconComponent = iconMap[service.icon_name] || iconMap['Camera'];
          const isSelected = value === service.slug;

          return (
            <motion.label
              key={service.slug}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex flex-col p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all group
                    ${isSelected
                  ? 'border-[#79502A] bg-[#79502A]/5 shadow-md'
                  : 'border-gray-200 bg-white hover:border-[#79502A]/30 hover:shadow-sm'
                }`}
            >
              <input
                type="radio"
                value={service.slug}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
              />

              {/* Icon */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-2.5 flex items-center justify-center transition-all
                ${isSelected
                  ? 'bg-[#79502A]'
                  : 'bg-gray-100 group-hover:bg-[#79502A]/10'
                }`}>
                <IconComponent
                  size={20}
                  className={isSelected ? 'text-white' : 'text-[#79502A]/70 group-hover:text-[#79502A]'}
                  strokeWidth={1.8}
                />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h4 className={`font-fira text-xs sm:text-sm font-semibold mb-1 leading-tight transition-colors
                  ${isSelected ? 'text-[#79502A]' : 'text-black group-hover:text-[#79502A]'}`}>
                  {service.name}
                </h4>
                {service.description && (
                  <p className="font-fira text-[10px] sm:text-xs text-black/50 leading-snug line-clamp-2">
                    {service.description}
                  </p>
                )}
              </div>

              {/* Check mark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 bg-[#79502A] rounded-full flex items-center justify-center shadow-md"
                >
                  <Check size={12} className="text-white" strokeWidth={3} />
                </motion.div>
              )}
            </motion.label>
          );
        })}

        {/* Botón agregar nuevo - Compacto */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddNew(true)}
          className="flex flex-col items-center justify-center p-3 sm:p-4 border-2 border-dashed border-gray-300
            rounded-lg cursor-pointer transition-all hover:border-[#79502A] hover:bg-[#79502A]/5 group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-2 flex items-center justify-center
            bg-gray-100 group-hover:bg-[#79502A]/10 transition-all">
            <Plus size={20} className="text-black/40 group-hover:text-[#79502A] transition-colors" strokeWidth={2} />
          </div>
          <span className="font-fira text-xs sm:text-sm font-semibold text-black/60 group-hover:text-[#79502A] transition-colors text-center leading-tight">
            Nuevo servicio
          </span>
        </motion.button>
      </div>

      {/* Form para crear servicio nuevo - Rediseñado */}
      <AnimatePresence>
        {showAddNew && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-[#79502A]/20 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="font-fira text-base font-semibold text-[#79502A] flex items-center gap-2">
                  <Plus size={18} />
                  Crear nuevo servicio
                </h3>
                <button
                  onClick={() => {
                    setShowAddNew(false);
                    setNewServiceName('');
                    setSelectedIcon('Camera');
                  }}
                  className="text-black/40 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nombre del servicio */}
              <div>
                <label className="block font-fira text-sm font-semibold text-black mb-2">
                  Nombre del servicio
                </label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateService();
                    }
                    if (e.key === 'Escape') {
                      setShowAddNew(false);
                      setNewServiceName('');
                    }
                  }}
                  placeholder="Ej: Sesión de Mascotas"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg font-fira text-sm
                    focus:outline-none focus:border-[#79502A] focus:ring-2 focus:ring-[#79502A]/10 text-black
                    transition-all"
                  disabled={creating}
                  autoFocus
                />
              </div>

              {/* Selector de icono - Compacto */}
              <div>
                <label className="block font-fira text-sm font-semibold text-black mb-2">
                  Icono
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {availableIcons.map((icon) => {
                    const IconComponent = iconMap[icon.name];
                    const isIconSelected = selectedIcon === icon.name;

                    return (
                      <motion.button
                        key={icon.name}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedIcon(icon.name)}
                        className={`relative p-2.5 border-2 rounded-lg transition-all
                          ${isIconSelected
                            ? 'border-[#79502A] bg-[#79502A]/5'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        title={icon.label}
                      >
                        <IconComponent
                          size={20}
                          className={isIconSelected ? 'text-[#79502A]' : 'text-black/60'}
                          strokeWidth={1.8}
                        />
                        {isIconSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#79502A] rounded-full flex items-center justify-center">
                            <Check size={10} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleCreateService}
                  disabled={creating || !newServiceName.trim()}
                  className="flex-1 px-4 py-2.5 bg-[#79502A] text-white rounded-lg font-fira text-sm font-semibold
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                    hover:bg-[#8B5A2F] transition-colors shadow-sm"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} strokeWidth={2.5} />
                      <span>Crear servicio</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setShowAddNew(false);
                    setNewServiceName('');
                    setSelectedIcon('Camera');
                  }}
                  className="px-4 py-2.5 border-2 border-gray-200 text-black rounded-lg hover:bg-gray-50
                    transition-colors font-fira text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <X size={16} strokeWidth={2.5} />
                  <span>Cancelar</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ayuda contextual */}
      {isPublic && (
        <p className="font-fira text-xs text-[#79502A] flex items-center gap-1">
          <Check size={12} />
          Solo puede haber una galería pública por tipo de servicio
        </p>
      )}

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-fira text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}