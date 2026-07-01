import api from './api';
import type { VendorProfile, VendorDashboard, VendorRequestListItem, VendorRequestDetailType, VendorResponseMetrics, VendorPlanInfo, QuickReply } from '../types';

export async function getVendorProfile(): Promise<VendorProfile> {
  const res = await api.get('/vendor/profile');
  return res?.data;
}

export async function updateVendorProfile(data: Record<string, unknown>): Promise<unknown> {
  const res = await api.patch('/vendor/profile', data);
  return res?.data;
}

export async function updateVendorAvailability(isAvailable: boolean): Promise<{ isAvailable: boolean }> {
  const res = await api.patch('/vendor/availability', { isAvailable });
  return res?.data;
}

export async function getVendorDashboard(): Promise<VendorDashboard> {
  const res = await api.get('/vendor/dashboard');
  return res?.data;
}

export async function getVendorRequests(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: VendorRequestListItem[]; total: number }> {
  const res = await api.get('/vendor/requests', { params });
  return { items: res?.data?.items ?? [], total: res?.data?.total ?? 0 };
}

export async function getVendorRequestDetail(matchId: string): Promise<VendorRequestDetailType> {
  const res = await api.get(`/vendor/requests/${encodeURIComponent(matchId)}`);
  return res?.data;
}

export async function respondToRequest(matchId: string, message: string): Promise<{ responseId: string; chatId: string; createdAt: string }> {
  const res = await api.post(`/vendor/requests/${encodeURIComponent(matchId)}/respond`, { message });
  return res?.data;
}

export async function declineRequest(matchId: string): Promise<{ success: boolean }> {
  const res = await api.post(`/vendor/requests/${encodeURIComponent(matchId)}/decline`);
  return res?.data;
}

export async function getVendorResponseMetrics(): Promise<VendorResponseMetrics> {
  const res = await api.get('/vendor/response-metrics');
  return res?.data;
}

export interface MetricsBreakdown {
  totalReceived: number;
  accepted: number;
  declined: number;
  unanswered: number;
  acceptanceRate: number;
}

export async function getMetricsBreakdown(): Promise<MetricsBreakdown> {
  const res = await api.get('/vendor/metrics/breakdown');
  return res?.data ?? { totalReceived: 0, accepted: 0, declined: 0, unanswered: 0, acceptanceRate: 0 };
}

export async function getVendorPlan(): Promise<VendorPlanInfo> {
  const res = await api.get('/vendors/my-plan');
  return res?.data;
}

// ── Quick Replies ──────────────────────────────────────

export async function getQuickReplies(): Promise<QuickReply[]> {
  const res = await api.get('/vendor/quick-replies');
  return res?.data ?? [];
}

export async function createQuickReply(messageText: string): Promise<QuickReply> {
  const res = await api.post('/vendor/quick-replies', { messageText });
  return res?.data;
}

export async function updateQuickReply(id: string, messageText: string): Promise<QuickReply> {
  const res = await api.put(`/vendor/quick-replies/${encodeURIComponent(id)}`, { messageText });
  return res?.data;
}

export async function deleteQuickReply(id: string): Promise<{ success: boolean }> {
  const res = await api.delete(`/vendor/quick-replies/${encodeURIComponent(id)}`);
  return res?.data;
}

export async function reorderQuickReplies(items: { id: string; order: number }[]): Promise<QuickReply[]> {
  const res = await api.put('/vendor/quick-replies/reorder', { items });
  return res?.data ?? [];
}

// ── Plans ──────────────────────────────────────────────

export interface PlanConversionDetail {
  subtotalBs: number;
  ivaBs: number;
  totalBs: number;
}

export interface PlanConversion {
  tasaBcv: number;
  fechaTasa: string;
  source: string;
  ivaRate: number;
  mensual: PlanConversionDetail | null;
  anual: PlanConversionDetail | null;
}

export interface PlanListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  solicitudesMensuales: number;
  prioridad: number;
  precioMensual: number;
  precioAnual: number;
  comisionPorcentaje: number;
  visibleEnApp: boolean;
  isActive: boolean;
  beneficios: string | null;
  conversion?: PlanConversion | null;
}

export interface ExchangeRateInfo {
  available: boolean;
  rate?: number;
  date?: string;
  source?: string;
  ivaRate?: number;
}

export interface PaymentMethodField {
  label: string;
  value: string;
}

export interface PaymentMethod {
  isActive: boolean;
  label: string;
  icon: string;
  fields: Record<string, string>;
  concepto: string;
  contactoWhatsApp: string;
  contactoEmail: string;
  instrucciones: string;
}

export interface PaymentMethodsResponse {
  methods: Record<string, PaymentMethod>;
}

export async function getVisiblePlans(): Promise<PlanListItem[]> {
  const res = await api.get('/plans');
  return res?.data ?? [];
}

export async function getPaymentInfo(): Promise<PaymentMethodsResponse> {
  const res = await api.get('/config/payment-info');
  return res?.data ?? { methods: {} };
}

export async function getExchangeRateLatest(): Promise<ExchangeRateInfo> {
  const res = await api.get('/exchange-rates/latest');
  return res?.data ?? { available: false };
}

// ── Marketing Banner ──────────────────────────────────

export interface BannerSlide {
  imageUrl: string;
  linkUrl?: string;
  altText?: string;
}

/**
 * Normalizes any banner response shape into an ordered array of slides.
 * Handles (in priority order):
 *   1. res.banners  -> new client-banner carousel array
 *   2. res.slides   -> raw vendor JSON carousel array
 *   3. res.banner   -> single legacy client object
 *   4. top-level { imageUrl, linkUrl, altText } -> legacy vendor single image
 * Respects visible === false / activo === false (returns []).
 */
function normalizeSlides(res: any): BannerSlide[] {
  const data = res ?? {};

  // Explicit "off" flags -> nothing to show
  if (data?.visible === false || data?.activo === false) return [];

  const toSlide = (s: any): BannerSlide | null => {
    const imageUrl = s?.imageUrl;
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    return {
      imageUrl,
      linkUrl: s?.linkUrl ?? undefined,
      altText: s?.altText ?? undefined,
    };
  };

  // 1 & 2: array forms
  const arr = Array.isArray(data?.banners)
    ? data.banners
    : Array.isArray(data?.slides)
    ? data.slides
    : null;
  if (arr) {
    return (arr.map(toSlide).filter(Boolean) as BannerSlide[]).slice(0, 4);
  }

  // 3: single legacy client object
  if (data?.banner && typeof data.banner === 'object') {
    const s = toSlide(data.banner);
    return s ? [s] : [];
  }

  // 4: legacy vendor top-level single image
  const single = toSlide(data);
  return single ? [single] : [];
}

export async function getMarketingBanner(): Promise<BannerSlide[]> {
  try {
    const res = await api.get('/marketing/banner');
    return normalizeSlides(res?.data);
  } catch {
    return [];
  }
}

export async function getClientBanner(): Promise<BannerSlide[]> {
  try {
    const res = await api.get('/marketing/client-banner');
    return normalizeSlides(res?.data);
  } catch {
    return [];
  }
}
