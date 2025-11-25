'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Mail, Phone, MapPin, X, ChevronRight } from 'lucide-react';

/**
 * Footer - Footer profesional con políticas legales
 * Diseño elegante con protección legal completa
 */
export default function Footer({ profile }) {
  const currentYear = new Date().getFullYear();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCopyright, setShowCopyright] = useState(false);

  return (
    <>
      <footer className="bg-[#2d2d2d] pt-12 sm:pt-16 pb-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Grid principal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10 sm:mb-12">
            {/* Logo y descripción */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-block mb-4">
                <div className="relative w-28 h-10">
                  <Image
                    src="/img/logos/logo_BN_SF.png"
                    alt="Alma Fotografía"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
              <p className="font-fira text-sm text-gray-400 leading-relaxed mb-4">
                Capturamos pedacitos de vida para que puedas recordarlos siempre.
              </p>
              {/* Redes sociales */}
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/almafotografiauy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#8B5E3C] flex items-center justify-center text-gray-400 hover:!text-white transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="mailto:contacto@almafotografia.com"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#8B5E3C] flex items-center justify-center text-gray-400 hover:!text-white transition-all duration-300"
                  aria-label="Email"
                >
                  <Mail size={18} />
                </a>
                <a
                  href="https://wa.me/59892021392"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#8B5E3C] flex items-center justify-center text-gray-400 hover:!text-white transition-all duration-300"
                  aria-label="WhatsApp"
                >
                  <Phone size={18} />
                </a>
              </div>
            </div>

            {/* Navegación */}
            <div>
              <h4 className="font-fira text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Navegación
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#servicios" className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors flex items-center gap-1 group">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    Portafolio
                  </a>
                </li>
                <li>
                  <a href="#testimonios" className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors flex items-center gap-1 group">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    Testimonios
                  </a>
                </li>
                <li>
                  <a href="#reservas" className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors flex items-center gap-1 group">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    Reservas
                  </a>
                </li>
                <li>
                  <a href="#contacto" className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors flex items-center gap-1 group">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    Contacto
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-fira text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    onClick={() => setShowTerms(true)}
                    className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors flex items-center gap-1 group"
                  >
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    Términos y Condiciones
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowPrivacy(true)}
                    className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors flex items-center gap-1 group"
                  >
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    Política de Privacidad
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowCopyright(true)}
                    className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors flex items-center gap-1 group"
                  >
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    Derechos de Autor
                  </button>
                </li>
                <li>
                  <Link
                    href="/auth/login"
                    className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors flex items-center gap-1 group"
                  >
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    Acceso de administrador
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="font-fira text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Contacto
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#8B5E3C] flex-shrink-0 mt-0.5" />
                  <span className="font-fira text-sm text-gray-400">
                    Montevideo, Uruguay
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone size={16} className="text-[#8B5E3C] flex-shrink-0 mt-0.5" />
                  <a href="https://wa.me/59892021392" className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors">
                    +598 92 021 392
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Mail size={16} className="text-[#8B5E3C] flex-shrink-0 mt-0.5" />
                  <a href="mailto:contacto@almafotografia.com" className="font-fira text-sm text-gray-400 hover:text-[#B89968] transition-colors">
                    contacto@almafotografia.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Línea decorativa */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

          {/* Aviso de copyright y derechos */}
          <div className="text-center space-y-3">
            <p className="font-fira text-xs text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Todas las imágenes, fotografías y contenido visual de este sitio web están protegidos por derechos de autor.
              Queda estrictamente prohibida su reproducción, distribución o uso sin autorización expresa por escrito.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500 font-fira">
              <span>&copy; {currentYear} Alma Fotografía</span>
              <span className="hidden sm:inline">•</span>
              <span>Todos los derechos reservados</span>
              <span className="hidden sm:inline">•</span>
              <span>Montevideo, Uruguay</span>
            </div>

            {/* Créditos de desarrollo */}
            <p className="mt-4 font-fira text-[10px] text-gray-600">
              Desarrollado por{' '}
              <a
                href="https://codegza.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-[#B89968] transition-colors"
              >
                CodeGZA
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Modal: Términos y Condiciones */}
      <LegalModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        title="Términos y Condiciones"
      >
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p className="font-medium text-gray-800">Última actualización: {currentYear}</p>

          <h3 className="font-semibold text-gray-800 mt-6">1. Aceptación de los Términos</h3>
          <p>Al acceder y utilizar este sitio web y los servicios de Alma Fotografía, usted acepta cumplir con estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, le solicitamos que no utilice nuestros servicios.</p>

          <h3 className="font-semibold text-gray-800 mt-6">2. Servicios Fotográficos</h3>
          <p>Alma Fotografía ofrece servicios de fotografía profesional. Los detalles específicos de cada servicio, incluyendo precios, duración y entregables, serán acordados previamente con cada cliente de forma individual.</p>

          <h3 className="font-semibold text-gray-800 mt-6">3. Reservas y Pagos</h3>
          <p>Las reservas realizadas a través de este sitio web son solicitudes que requieren confirmación. La reserva se considera confirmada únicamente después de recibir confirmación por escrito y, cuando corresponda, el pago de la seña acordada.</p>
          <p>Los pagos deben realizarse según las condiciones acordadas. En caso de cancelación, se aplicarán las políticas de cancelación vigentes que serán informadas al momento de la reserva.</p>

          <h3 className="font-semibold text-gray-800 mt-6">4. Propiedad Intelectual</h3>
          <p>Todas las fotografías tomadas por Alma Fotografía son propiedad intelectual de la fotógrafa. El cliente recibe una licencia de uso personal y no comercial de las imágenes entregadas, salvo acuerdo por escrito que indique lo contrario.</p>

          <h3 className="font-semibold text-gray-800 mt-6">5. Uso de Imágenes</h3>
          <p>Alma Fotografía se reserva el derecho de utilizar las fotografías realizadas para su portafolio, redes sociales y material promocional, salvo que el cliente indique expresamente lo contrario por escrito antes de la sesión.</p>

          <h3 className="font-semibold text-gray-800 mt-6">6. Limitación de Responsabilidad</h3>
          <p>Alma Fotografía no será responsable por daños indirectos, incidentales o consecuentes que surjan del uso de nuestros servicios. Nuestra responsabilidad máxima se limita al monto pagado por el servicio contratado.</p>

          <h3 className="font-semibold text-gray-800 mt-6">7. Modificaciones</h3>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor desde su publicación en este sitio web.</p>

          <h3 className="font-semibold text-gray-800 mt-6">8. Legislación Aplicable</h3>
          <p>Estos términos se rigen por las leyes de la República Oriental del Uruguay. Cualquier disputa será sometida a la jurisdicción de los tribunales competentes de Montevideo.</p>

          <h3 className="font-semibold text-gray-800 mt-6">9. Contacto</h3>
          <p>Para consultas sobre estos términos, puede contactarnos a través de WhatsApp al +598 92 021 392 o por correo electrónico.</p>
        </div>
      </LegalModal>

      {/* Modal: Política de Privacidad */}
      <LegalModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Política de Privacidad"
      >
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p className="font-medium text-gray-800">Última actualización: {currentYear}</p>

          <h3 className="font-semibold text-gray-800 mt-6">1. Información que Recopilamos</h3>
          <p>Recopilamos información personal que usted nos proporciona voluntariamente al utilizar nuestros servicios, incluyendo:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Nombre completo</li>
            <li>Dirección de correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Información relacionada con las reservas y sesiones fotográficas</li>
          </ul>

          <h3 className="font-semibold text-gray-800 mt-6">2. Uso de la Información</h3>
          <p>Utilizamos su información personal para:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Gestionar y confirmar reservas</li>
            <li>Comunicarnos con usted sobre nuestros servicios</li>
            <li>Enviar las fotografías y materiales contratados</li>
            <li>Mejorar nuestros servicios</li>
          </ul>

          <h3 className="font-semibold text-gray-800 mt-6">3. Protección de Datos</h3>
          <p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.</p>

          <h3 className="font-semibold text-gray-800 mt-6">4. Compartir Información</h3>
          <p>No vendemos, comercializamos ni transferimos su información personal a terceros sin su consentimiento, excepto cuando sea necesario para proporcionar nuestros servicios o cuando la ley lo requiera.</p>

          <h3 className="font-semibold text-gray-800 mt-6">5. Cookies</h3>
          <p>Este sitio web puede utilizar cookies para mejorar la experiencia del usuario. Puede configurar su navegador para rechazar cookies, aunque esto podría afectar algunas funcionalidades del sitio.</p>

          <h3 className="font-semibold text-gray-800 mt-6">6. Sus Derechos</h3>
          <p>Usted tiene derecho a acceder, rectificar, actualizar o solicitar la eliminación de su información personal. Para ejercer estos derechos, contáctenos a través de los medios indicados.</p>

          <h3 className="font-semibold text-gray-800 mt-6">7. Retención de Datos</h3>
          <p>Conservamos su información personal durante el tiempo necesario para cumplir con los fines descritos en esta política, a menos que la ley exija o permita un período de retención más largo.</p>

          <h3 className="font-semibold text-gray-800 mt-6">8. Cambios en la Política</h3>
          <p>Podemos actualizar esta política periódicamente. Le notificaremos sobre cambios significativos publicando la nueva política en este sitio web.</p>

          <h3 className="font-semibold text-gray-800 mt-6">9. Contacto</h3>
          <p>Si tiene preguntas sobre esta política de privacidad, puede contactarnos al +598 92 021 392 o por correo electrónico.</p>
        </div>
      </LegalModal>

      {/* Modal: Derechos de Autor */}
      <LegalModal
        isOpen={showCopyright}
        onClose={() => setShowCopyright(false)}
        title="Derechos de Autor"
      >
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p className="font-medium text-gray-800">Aviso Legal de Derechos de Autor</p>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-800 font-medium">ADVERTENCIA IMPORTANTE</p>
            <p className="text-red-700 mt-2">
              Todas las fotografías, imágenes y contenido visual publicado en este sitio web están protegidos por las leyes de propiedad intelectual y derechos de autor de la República Oriental del Uruguay y tratados internacionales aplicables.
            </p>
          </div>

          <h3 className="font-semibold text-gray-800 mt-6">Propiedad de las Imágenes</h3>
          <p>Todas las fotografías mostradas en este sitio web son propiedad exclusiva de Alma Fotografía y su titular, quedando protegidas por la Ley N° 9.739 de Derechos de Autor y la legislación aplicable.</p>

          <h3 className="font-semibold text-gray-800 mt-6">Prohibiciones</h3>
          <p>Queda expresamente prohibido sin autorización previa por escrito:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Copiar, reproducir o duplicar las imágenes</li>
            <li>Distribuir, publicar o compartir las fotografías</li>
            <li>Modificar, alterar o crear obras derivadas</li>
            <li>Usar las imágenes con fines comerciales o publicitarios</li>
            <li>Descargar, guardar o almacenar las fotografías</li>
            <li>Eliminar o alterar marcas de agua o información de autoría</li>
          </ul>

          <h3 className="font-semibold text-gray-800 mt-6">Consecuencias Legales</h3>
          <p className="font-medium text-gray-800">El uso no autorizado de cualquier imagen de este sitio web constituye una violación de los derechos de autor y puede resultar en:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Acciones legales civiles por daños y perjuicios</li>
            <li>Denuncias penales según corresponda</li>
            <li>Reclamación de indemnización económica</li>
            <li>Costos legales y honorarios profesionales</li>
          </ul>

          <h3 className="font-semibold text-gray-800 mt-6">Licencia para Clientes</h3>
          <p>Los clientes que contratan servicios de Alma Fotografía reciben una licencia de uso personal y no comercial de las fotografías entregadas, según los términos acordados en cada contrato de servicio. Esta licencia no incluye la transferencia de derechos de autor.</p>

          <h3 className="font-semibold text-gray-800 mt-6">Solicitud de Autorización</h3>
          <p>Si desea utilizar alguna imagen de este sitio web, debe solicitar autorización por escrito contactándonos al +598 92 021 392. Cada solicitud será evaluada individualmente y, de ser aprobada, se establecerán los términos específicos de uso.</p>

          <h3 className="font-semibold text-gray-800 mt-6">Reporte de Infracciones</h3>
          <p>Si detecta uso no autorizado de nuestras imágenes en cualquier medio, le agradecemos que nos lo comunique para poder tomar las acciones correspondientes.</p>

          <div className="bg-gray-100 p-4 rounded-lg mt-6">
            <p className="text-gray-700 text-xs">
              © {currentYear} Alma Fotografía. Todos los derechos reservados. Las fotografías de este sitio están registradas y protegidas. El incumplimiento de estos términos será perseguido legalmente.
            </p>
          </div>
        </div>
      </LegalModal>
    </>
  );
}

/**
 * Modal para contenido legal
 */
function LegalModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-[#faf8f5]">
            <h2 className="font-voga text-xl sm:text-2xl text-[#2d2d2d]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-[#faf8f5]">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#8B5E3C] hover:bg-[#6d4a2f] !text-white font-fira text-sm font-medium uppercase tracking-wider transition-colors"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
