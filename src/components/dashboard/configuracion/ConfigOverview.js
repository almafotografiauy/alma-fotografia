'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  User,
  Bell,
  Palette,
  Shield,
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const quickActions = [
  {
    icon: Briefcase,
    title: 'Tipos de Servicio',
    description: 'Gestiona los servicios que ofreces',
    href: '/dashboard/configuracion/servicios',
    gradient: 'from-amber-50 to-orange-50',
    iconBg: 'bg-gradient-to-br from-[#79502A] to-[#8B5A2F]',
    iconColor: 'text-white',
    accentColor: 'text-[#79502A]',
    disabled: false
  },
  {
    icon: User,
    title: 'Perfil',
    description: 'Información personal y contacto',
    href: '/dashboard/configuracion/perfil',
    gradient: 'from-stone-50 to-stone-100',
    iconBg: 'bg-gradient-to-br from-[#A67C52] to-[#B8956A]',
    iconColor: 'text-white',
    accentColor: 'text-[#8B5A2F]',
    disabled: true
  },
  {
    icon: Bell,
    title: 'Notificaciones',
    description: 'Preferencias de alertas',
    href: '/dashboard/configuracion/notificaciones',
    gradient: 'from-orange-50 to-amber-50',
    iconBg: 'bg-gradient-to-br from-[#8B5A2F] to-[#A0713E]',
    iconColor: 'text-white',
    accentColor: 'text-[#79502A]',
    disabled: true
  },
  {
    icon: Palette,
    title: 'Apariencia',
    description: 'Personaliza tu marca',
    href: '/dashboard/configuracion/apariencia',
    gradient: 'from-neutral-50 to-stone-50',
    iconBg: 'bg-gradient-to-br from-[#6B4423] to-[#79502A]',
    iconColor: 'text-white',
    accentColor: 'text-[#6B4423]',
    disabled: true
  },
  {
    icon: Shield,
    title: 'Seguridad',
    description: 'Contraseña y sesiones',
    href: '/dashboard/configuracion/seguridad',
    gradient: 'from-amber-50 to-orange-50',
    iconBg: 'bg-gradient-to-br from-[#79502A] to-[#A67C52]',
    iconColor: 'text-white',
    accentColor: 'text-[#79502A]',
    disabled: true
  },
  {
    icon: Database,
    title: 'Almacenamiento',
    description: 'Uso de espacio',
    href: '/dashboard/configuracion/almacenamiento',
    gradient: 'from-stone-50 to-amber-50',
    iconBg: 'bg-gradient-to-br from-[#B8956A] to-[#C4A576]',
    iconColor: 'text-white',
    accentColor: 'text-[#8B5A2F]',
    disabled: true
  },
];

export default function ConfigOverview() {
  const router = useRouter();

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Grid responsive con animaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;

          return (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.08,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              whileHover={{
                scale: action.disabled ? 1 : 1.03,
                y: action.disabled ? 0 : -5
              }}
              whileTap={{ scale: action.disabled ? 1 : 0.97 }}
              onClick={() => !action.disabled && router.push(action.href)}
              disabled={action.disabled}
              className={`relative overflow-hidden rounded-2xl transition-all text-left group
                ${action.disabled
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer shadow-lg hover:shadow-2xl'
                }`}
            >
              {/* Background con gradiente */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} transition-opacity
                ${!action.disabled && 'group-hover:opacity-80'}`} />

              {/* Patrón decorativo */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Contenido */}
              <div className="relative p-5 sm:p-6 flex flex-col min-h-[160px]">
                {/* Icon con gradiente */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl ${action.iconBg}
                  flex items-center justify-center mb-4 shadow-lg
                  transition-all duration-300
                  ${!action.disabled && 'group-hover:scale-110 group-hover:rotate-3'}`}>
                  <IconComponent
                    size={24}
                    className={action.iconColor}
                    strokeWidth={2}
                  />
                </div>

                {/* Texto */}
                <div className="flex-1">
                  <h3 className={`font-fira text-base sm:text-lg font-bold mb-2
                    ${action.disabled ? 'text-black/70' : action.accentColor}
                    transition-all`}>
                    {action.title}
                  </h3>
                  <p className="font-fira text-xs sm:text-sm text-black/60 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                {/* Badge o Arrow */}
                <div className="mt-4 flex items-center justify-between">
                  {!action.disabled ? (
                    <div className={`flex items-center gap-2 ${action.accentColor} font-fira text-sm font-semibold
                      group-hover:gap-3 transition-all`}>
                      <span>Configurar</span>
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                        strokeWidth={2.5}
                      />
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 bg-black/5 backdrop-blur-sm rounded-lg">
                      <span className="text-[10px] sm:text-xs font-fira font-semibold text-black/40 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        Próximamente
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shimmer effect on hover */}
              {!action.disabled && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
