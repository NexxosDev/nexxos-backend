/**
 * Venezuelan RIF (Registro de Información Fiscal) formatter & validator.
 * Target format: J-12345678
 */

/**
 * Auto-formats raw user input into "J-XXXXXXXX".
 * - Strips everything except digits and leading J/j.
 * - Prepends "J-" if missing.
 */
export function formatRif(raw: string): string {
  if (!raw) return '';

  // Remove spaces, dots, commas
  let cleaned = raw.replace(/[\s.,]/g, '');

  // Strip a leading "J" or "j" (with or without dash)
  cleaned = cleaned.replace(/^[Jj]-?/, '');

  // Keep only digits, max 10
  const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 10);

  if (!digits) return '';

  return `J-${digits}`;
}

/**
 * Returns an error message if the formatted RIF is invalid, or '' if valid.
 */
export function validateRif(formatted: string): string {
  if (!formatted) return 'Requerido';
  if (!/^J-\d+$/.test(formatted)) return 'Formato inválido. Usa J-12345678';
  const digits = formatted.replace('J-', '');
  if (digits.length < 6) return 'Mínimo 6 dígitos';
  if (digits.length > 10) return 'Máximo 10 dígitos';
  return '';
}
