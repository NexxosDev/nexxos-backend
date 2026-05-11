import api from './api';
import type { RequestListItem, RequestDetail, RequestResponseItem } from '../types';

export async function createRequest(data: {
  stateId?: string;
  municipalityId?: string;
  parishId?: string;
  searchRadiusKm?: number;
  latitude?: number;
  longitude?: number;
  vehicleBrandId: string;
  vehicleModelId: string;
  partCategoryId: string;
  partSubcategoryId?: string;
  freeDescription: string;
}): Promise<{ id: string; status: string; matchedVendorsCount: number; createdAt: string }> {
  const res = await api.post('/requests', data);
  return res?.data;
}

export async function getRequests(params?: {
  status?: string;
  hasResponses?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ items: RequestListItem[]; total: number }> {
  const res = await api.get('/requests', { params });
  return { items: res?.data?.items ?? [], total: res?.data?.total ?? 0 };
}

export async function getRequestDetail(id: string): Promise<RequestDetail> {
  const res = await api.get(`/requests/${encodeURIComponent(id)}`);
  return res?.data;
}

export async function getRequestResponses(id: string): Promise<{ items: RequestResponseItem[] }> {
  const res = await api.get(`/requests/${encodeURIComponent(id)}/responses`);
  return { items: res?.data?.items ?? [] };
}

export async function closeRequest(id: string, data: {
  resolved: boolean;
  vendorId?: string;
  rating?: number;
  comment?: string;
}): Promise<{ id: string; status: string; closedAt: string }> {
  const res = await api.patch(`/requests/${encodeURIComponent(id)}/close`, data);
  return res?.data;
}
