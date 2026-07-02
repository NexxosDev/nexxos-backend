/**
 * Venezuelan Cédula (ID) formatter & validator.
 * Supported formats: V-12345678 (Venezolano) or E-12345678 (Extranjero).
 */

export type CedulaPrefix = 'V' | 'E';

/**
 * Auto-formats raw user input into "<PREFIX>-XXXXXXXX".
 * - Detects a leading V/v or E/e prefix; if none is present, uses `defaultPrefix`.
 * - Strips everything except digits (max 8).
 */
export function formatCedula(raw: string, defaultPrefix: CedulaPrefix = 'V'): string {
  if (!raw) return '';

  // Remove spaces, dots, commas
  let cleaned = raw.replace(/[\s.,]/g, '');

  // Detect and strip a leading "V"/"E" (with or without dash)
  const match = cleaned.match(/^([VvEe])-?/);
  const prefix: CedulaPrefix = (match?.[1]?.toUpperCase?.() as CedulaPrefix) ?? defaultPrefix;
  cleaned = cleaned.replace(/^([VvEe])-?/, '');

  // Keep only digits, max 8
  const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 8);

  if (!digits) return '';

  return `${prefix}-${digits}`;
}

/**
 * Returns an error message if the formatted cédula is invalid, or '' if valid.
 */
export function validateCedula(formatted: string): string {
  if (!formatted) return 'Requerido';
  if (!/^[VE]-\d+$/.test(formatted)) return 'Formato inválido. Debe ser V-12345678 o E-12345678';
  const digits = formatted.replace(/^[VE]-/, '');
  if (digits.length < 6) return 'Mínimo 6 dígitos';
  if (digits.length > 8) return 'Máximo 8 dígitos';
  return '';
}
