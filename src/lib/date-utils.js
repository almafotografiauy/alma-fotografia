/**
 * Utilidades para manejo de fechas sin problemas de zona horaria
 *
 * El problema: cuando usamos new Date('2024-12-11'), JavaScript lo interpreta como
 * medianoche UTC, y en Uruguay (UTC-3) se muestra como el día anterior.
 *
 * La solución: tratar las fechas como strings en formato YYYY-MM-DD o parsearlas
 * agregando el timezone local explícitamente.
 */

/**
 * Formatea una fecha en formato YYYY-MM-DD a texto localizado
 * sin conversión de zona horaria
 *
 * @param {string} dateString - Fecha en formato 'YYYY-MM-DD'
 * @param {Object} options - Opciones de formato (Intl.DateTimeFormat)
 * @returns {string} - Fecha formateada
 */
export function formatDateWithoutTimezone(dateString, options = {}) {
  if (!dateString) return null;

  // Parsear la fecha agregando la hora local para evitar conversión UTC
  // En lugar de '2024-12-11' -> usamos '2024-12-11T00:00:00' en hora local
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return date.toLocaleDateString('es-ES', defaultOptions);
}

/**
 * Convierte una fecha Date a formato YYYY-MM-DD sin conversión de zona horaria
 *
 * @param {Date} date - Objeto Date
 * @returns {string} - Fecha en formato 'YYYY-MM-DD'
 */
export function dateToLocalDateString(date) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
