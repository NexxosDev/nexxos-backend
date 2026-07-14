import api from './api';
import { getDeviceId } from '../utils/deviceId';

export type PromoPopupData = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  ctaText: string | null;
  actionUrl: string | null;
};

// El "sujeto" del capping: userId si está logueado, si no el deviceId.
async function subjectHeaders(
  userId?: string | null,
): Promise<Record<string, string>> {
  let subject = typeof userId === 'string' && userId ? userId : '';
  if (!subject) {
    subject = await getDeviceId();
  }
  return { 'x-subject-id': subject };
}

// Obtiene el popup activo a mostrar (o null si no hay / ya se vio hoy).
export async function fetchActivePopup(
  userId?: string | null,
): Promise<PromoPopupData | null> {
  try {
    const headers = await subjectHeaders(userId);
    const res = await api.get('/promo-popup/active', { headers });
    const popup = res?.data?.popup ?? null;
    if (!popup || typeof popup?.id !== 'string') return null;
    return popup as PromoPopupData;
  } catch {
    // Silencioso: un fallo del popup nunca debe afectar el arranque de la app.
    return null;
  }
}

// Marca el popup como visto hoy (capping 1/día por sujeto).
export async function markPopupSeen(
  id: string,
  userId?: string | null,
): Promise<void> {
  try {
    if (!id) return;
    const headers = await subjectHeaders(userId);
    await api.post(`/promo-popup/${id}/seen`, {}, { headers });
  } catch {
    // best-effort
  }
}
