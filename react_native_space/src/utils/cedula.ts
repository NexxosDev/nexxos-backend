/**
 * Venezuelan Cédula (ID) formatter & validator.
 * Target format: V-12345678
 */

/**
 * Auto-formats raw user input into "V-XXXXXXXX".
 * - Strips everything except digits and leading V/v.
 * - Prepends "V-" if missing.
 */
export function formatCedula(raw: string): string {
  if (!raw) return '';

  // Remove spaces, dots, commas
  let cleaned = raw.replace(/[\s.,]/g, '');

  // Strip a leading "V" or "v" (with or without dash)
  cleaned = cleaned.replace(/^[Vv]-?/, '');

  // Keep only digits, max 8
  const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 8);

  if (!digits) return '';

  return `V-${digits}`;
}

/**
 * Returns an error message if the formatted cédula is invalid, or '' if valid.
 */
export function validateCedula(formatted: string): string {
  if (!formatted) return 'Requerido';
  if (!/^V-\d+$/.test(formatted)) return 'Formato inválido. Debe ser V-12345678';
  const digits = formatted.replace('V-', '');
  if (digits.length < 6) return 'Mínimo 6 dígitos';
  if (digits.length > 8) return 'Máximo 8 dígitos';
  return '';
}
