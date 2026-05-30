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
