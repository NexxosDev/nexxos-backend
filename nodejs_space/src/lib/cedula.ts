/**
 * Venezuelan Cédula normalizer for backend.
 * Stores documentId values as V-XXXXXXXX (Venezolano) or E-XXXXXXXX (Extranjero).
 */
export function formatCedula(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/[\s.,]/g, '');
  const match = cleaned.match(/^([VvEe])-?/);
  const prefix = (match?.[1]?.toUpperCase?.() as 'V' | 'E') ?? 'V';
  cleaned = cleaned.replace(/^([VvEe])-?/, '');
  const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 8);
  if (!digits) return raw; // return original if no digits found
  return `${prefix}-${digits}`;
}
