/**
 * Venezuelan Cédula normalizer for backend.
 * Ensures all documentId values are stored as V-XXXXXXXX.
 */
export function formatCedula(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/[\s.,]/g, '');
  cleaned = cleaned.replace(/^[Vv]-?/, '');
  const digits = cleaned.replace(/[^0-9]/g, '').slice(0, 8);
  if (!digits) return raw; // return original if no digits found
  return `V-${digits}`;
}
