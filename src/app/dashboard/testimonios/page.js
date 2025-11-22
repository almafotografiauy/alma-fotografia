'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Edit3,
  Trash2,
  MessageSquare,
  Calendar,
  User,
  Mail,
  ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Search,
  X
} from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PageTransition from '@/components/dashboard/PageTransition';
import AnimatedSection from '@/components/dashboard/AnimatedSection';
import { useToast } from '@/components/ui/Toast';
import {
  getAllTestimonials,
  toggleFeaturedTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '@/app/actions/testimonial-actions';

export default function TestimoniosPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [deletingTestimonial, setDeletingTestimonial] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  // Cargar testimonios al montar
  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    setLoading(true);
    const result = await getAllTestimonials();
    if (result.success) {
      setTestimonials(result.testimonials);
    } else {
      showToast({ message: 'Error al cargar testimonios', type: 'error' });
    }
    setLoading(false);
  };

  // Toggle destacado
  const handleToggleFeatured = async (testimonial) => {
    setProcessingId(testimonial.id);
    const result = await toggleFeaturedTestimonial(
      testimonial.id,
      !testimonial.is_featured
    );

    if (result.success) {
      showToast({
        message: testimonial.is_featured
          ? 'Testimonio desmarcado'
          : 'Testimonio destacado',
        type: 'success',
      });
      loadTestimonials();
    } else {
      showToast({ message: result.error, type: 'error' });
    }
    setProcessingId(null);
  };

  // Eliminar
  const handleDelete = async () => {
    if (!deletingTestimonial) return;

    const result = await deleteTestimonial(deletingTestimonial.id);
    if (result.success) {
      showToast({ message: 'Testimonio eliminado', type: 'success' });
      setDeletingTestimonial(null);
      loadTestimonials();
    } else {
      showToast({ message: result.error, type: 'error' });
    }
  };

  const featuredCount = testimonials.filter((t) => t.is_featured).length;

  // Filtrar testimonios por búsqueda
  const filteredTestimonials = testimonials.filter((testimonial) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const galleryTitle = testimonial.gallery?.title?.toLowerCase() || '';
    const clientName = testimonial.client_name?.toLowerCase() || '';
    const message = testimonial.message?.toLowerCase() || '';

    return (
      galleryTitle.includes(query) ||
      clientName.includes(query) ||
      message.includes(query)
    );
  });

  if (loading) {
    return (
      <PageTransition>
        <DashboardHeader title="Testimonios" subtitle="Gestión de testimonios de clientes" />
        <AnimatedSection>
          <div className="flex items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-[#8B5E3C]" />
          </div>
        </AnimatedSection>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <DashboardHeader title="Testimonios" subtitle="Gestión de testimonios de clientes" />

      {/* Stats */}
      <AnimatedSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-2">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <MessageSquare size={24} className="text-[#8B5E3C]" />
              </div>
              <div>
                <p className="font-fira text-sm text-gray-600">Total</p>
                <p className="font-voga text-2xl text-gray-900">{testimonials.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Sparkles size={24} className="text-[#8B5E3C]" />
              </div>
              <div>
                <p className="font-fira text-sm text-gray-600">Destacados</p>
                <p className="font-voga text-2xl text-gray-900">
                  {featuredCount}/10
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Star size={24} className="text-[#8B5E3C] fill-[#8B5E3C]" />
              </div>
              <div>
                <p className="font-fira text-sm text-gray-600">Promedio</p>
                <p className="font-voga text-2xl text-gray-900">
                  {testimonials.length > 0
                    ? (
                        testimonials.reduce((sum, t) => sum + (t.rating || 0), 0) /
                        testimonials.length
                      ).toFixed(1)
                    : '0.0'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Buscador */}
      <AnimatedSection delay={0.1}>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-6">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por galería, cliente o mensaje..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 font-fira text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 font-fira text-xs text-gray-500">
              {filteredTestimonials.length === 0
                ? 'No se encontraron testimonios'
                : `${filteredTestimonials.length} testimonio${filteredTestimonials.length !== 1 ? 's' : ''} encontrado${filteredTestimonials.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
      </AnimatedSection>

      {/* Lista de testimonios */}
      <AnimatedSection delay={0.2}>
        {testimonials.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center">
            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
              <MessageSquare size={32} className="text-gray-400" />
            </div>
            <h3 className="font-voga text-xl text-gray-900 mb-2">No hay testimonios</h3>
            <p className="font-fira text-sm text-gray-600">
              Los clientes pueden dejar testimonios desde las galerías compartidas
            </p>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-sm text-center">
            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <p className="font-voga text-xl text-gray-900 mb-2">
              No se encontraron resultados
            </p>
            <p className="font-fira text-sm text-gray-600">
              Intentá con otro término de búsqueda
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                onToggleFeatured={() => handleToggleFeatured(testimonial)}
                onEdit={() => setEditingTestimonial(testimonial)}
                onDelete={() => setDeletingTestimonial(testimonial)}
                processing={processingId === testimonial.id}
                maxFeatured={featuredCount >= 10 && !testimonial.is_featured}
              />
            ))}
          </div>
        )}
      </AnimatedSection>

      {/* Modal de edición */}
      <AnimatePresence>
        {editingTestimonial && (
          <EditTestimonialModal
            testimonial={editingTestimonial}
            onClose={() => {
              setEditingTestimonial(null);
              loadTestimonials();
            }}
            onSuccess={() => {
              setEditingTestimonial(null);
              loadTestimonials();
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal de confirmación eliminar */}
      <AnimatePresence>
        {deletingTestimonial && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
              onClick={() => {
                setDeletingTestimonial(null);
                loadTestimonials();
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-xl z-50"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={24} className="text-red-600" />
                </div>
                <h3 className="font-voga text-xl text-gray-900 text-center mb-2">
                  ¿Eliminar testimonio?
                </h3>
                <p className="font-fira text-sm text-gray-600 text-center mb-6">
                  Esta acción no se puede deshacer
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDeletingTestimonial(null);
                      loadTestimonials();
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-fira text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 font-fira text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

// Componente para cada card de testimonio
function TestimonialCard({ testimonial, onToggleFeatured, onEdit, onDelete, processing, maxFeatured }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 hover:shadow-xl transition-all duration-200"
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
              <User size={18} className="text-[#8B5E3C]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-fira text-base font-semibold text-gray-900 truncate">
                {testimonial.client_name}
              </h3>
              <p className="font-fira text-xs text-gray-600 flex items-center gap-1.5 truncate">
                <Mail size={12} />
                {testimonial.client_email}
              </p>
            </div>
          </div>

          {/* Toggle destacado */}
          <button
            onClick={onToggleFeatured}
            disabled={processing || (maxFeatured && !testimonial.is_featured)}
            title={maxFeatured ? 'Máximo 10 testimonios destacados' : testimonial.is_featured ? 'Desmarcar como destacado' : 'Marcar como destacado'}
            className={`flex-shrink-0 p-2.5 rounded-lg transition-all duration-200 ${
              testimonial.is_featured
                ? 'bg-amber-100 text-[#8B5E3C] hover:bg-amber-200'
                : maxFeatured
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-[#8B5E3C] hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {processing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} className={testimonial.is_featured ? 'fill-[#8B5E3C]' : ''} />
            )}
          </button>
        </div>

        {/* Rating */}
        {testimonial.rating && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={`${
                  star <= testimonial.rating
                    ? 'fill-[#8B5E3C] text-[#8B5E3C]'
                    : 'fill-gray-200 text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 font-fira text-xs text-gray-600">
              {testimonial.rating}/5
            </span>
          </div>
        )}

        {/* Mensaje */}
        <p className="font-fira text-sm text-gray-700 leading-relaxed">
          {testimonial.message}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {testimonial.gallery && (
              <span className="font-fira text-xs text-gray-600 flex items-center gap-1.5 truncate">
                <ImageIcon size={12} className="flex-shrink-0" />
                {testimonial.gallery.title}
              </span>
            )}
            <span className="font-fira text-xs text-gray-500 flex items-center gap-1.5">
              <Calendar size={12} className="flex-shrink-0" />
              {new Date(testimonial.created_at).toLocaleDateString('es-UY')}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-2.5 hover:bg-gray-100 text-[#8B5E3C] rounded-lg transition-all duration-200"
              title="Editar"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-2.5 hover:bg-red-100 text-red-600 rounded-lg transition-all duration-200"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Modal de edición
function EditTestimonialModal({ testimonial, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    client_name: testimonial.client_name,
    message: testimonial.message,
    rating: testimonial.rating || 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await updateTestimonial(testimonial.id, formData);
    if (result.success) {
      showToast({ message: 'Testimonio actualizado', type: 'success' });
      onSuccess();
    } else {
      showToast({ message: result.error, type: 'error' });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-2xl z-50 max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-voga text-2xl text-gray-900">Editar Testimonio</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="block font-fira text-sm font-medium text-gray-700 mb-2">
                Nombre del cliente
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#79502A]/20 focus:border-[#79502A] transition-all"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block font-fira text-sm font-medium text-gray-700 mb-2">
                Calificación
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`${
                        star <= formData.rating
                          ? 'fill-[#8B5E3C] text-[#8B5E3C]'
                          : 'fill-gray-200 text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block font-fira text-sm font-medium text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg font-fira text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/20 focus:border-[#8B5E3C] transition-all resize-none"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-fira text-sm font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] text-white rounded-lg transition-all duration-200 font-fira text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Guardar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
