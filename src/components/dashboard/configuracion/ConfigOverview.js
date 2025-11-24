'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  User,
  Bell,
  Shield,
  Database,
  Calendar,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const quickActions = [
  {
    icon: Briefcase,
    title: 'Tipos de Servicio',
    description: 'Gestiona los servicios que ofreces',
    href: '/dashboard/configuracion/servicios',
    disabled: false
  },
  {
    icon: Calendar,
    title: 'Agenda',
    description: 'Horarios, bloqueos y tipos de reunión',
    href: '/dashboard/configuracion/agenda',
    disabled: false
  },
  {
    icon: User,
    title: 'Perfil',
    description: 'Información personal y contacto',
    href: '/dashboard/configuracion/perfil',
    disabled: false
  },
  {
    icon: Bell,
    title: 'Notificaciones',
    description: 'Preferencias de alertas',
    href: '/dashboard/configuracion/notificaciones',
    disabled: false
  },
  {
    icon: Shield,
    title: 'Seguridad',
    description: 'Contraseña y sesiones',
    href: '/dashboard/configuracion/seguridad',
    disabled: false
  },
  {
    icon: Database,
    title: 'Almacenamiento',
    description: 'Gestiona tu espacio en la nube',
    href: '/dashboard/configuracion/almacenamiento',
    disabled: false
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
                scale: action.disabled ? 1 : 1.02,
                y: action.disabled ? 0 : -2
              }}
              whileTap={{ scale: action.disabled ? 1 : 0.98 }}
              onClick={() => !action.disabled && router.push(action.href)}
              disabled={action.disabled}
              className={`relative overflow-hidden rounded-xl transition-all duration-200 text-left group
                ${action.disabled
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-xl'
                }`}
            >
              {/* Background principal */}
              <div className="absolute inset-0 bg-white" />

              {/* Borde con color de marca */}
              <div className={`absolute inset-0 border ${action.disabled ? 'border-gray-100' : 'border-gray-200'} rounded-xl`} />

              {/* Contenido */}
              <div className="relative p-5 sm:p-6 flex flex-col min-h-[160px]">
                {/* Icon */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-50
                  flex items-center justify-center mb-4
                  transition-all duration-300
                  ${!action.disabled && 'group-hover:bg-gray-100 group-hover:scale-105'}`}>
                  <IconComponent
                    size={24}
                    className="text-[#8B5E3C]"
                    strokeWidth={2}
                  />
                </div>

                {/* Texto */}
                <div className="flex-1">
                  <h3 className="font-fira text-base sm:text-lg font-bold mb-2 text-gray-900 transition-all">
                    {action.title}
                  </h3>
                  <p className="font-fira text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                {/* Badge o Arrow */}
                <div className="mt-4 flex items-center justify-between">
                  {!action.disabled ? (
                    <div className="flex items-center gap-2 text-gray-600 group-hover:text-[#8B5E3C] font-fira text-sm font-semibold group-hover:gap-3 transition-all">
                      <span>Configurar</span>
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                        strokeWidth={2.5}
                      />
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
                      <span className="text-[10px] sm:text-xs font-fira font-semibold text-gray-500 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        Próximamente
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
