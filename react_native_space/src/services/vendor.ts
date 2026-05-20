import api from './api';
import type { VendorProfile, VendorDashboard, VendorRequestListItem, VendorRequestDetailType, VendorResponseMetrics, VendorPlanInfo } from '../types';

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
