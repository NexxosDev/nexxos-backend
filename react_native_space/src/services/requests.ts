import api from './api';
import type { RequestListItem, RequestDetail, RequestResponseItem, ResponseTagValue } from '../types';

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
  vehicleYear?: number;
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

export async function updateResponseTags(responseId: string, tags: ResponseTagValue[]): Promise<{ responseId: string; tags: string[] }> {
  const res = await api.put(`/requests/responses/${encodeURIComponent(responseId)}/tags`, { tags });
  return res?.data;
}

export async function rateVendorOnRequest(
  requestId: string,
  data: { vendorId: string; rating: number; comment?: string },
): Promise<{ success: boolean; pointsAwarded: number; bonusFirstRating: boolean }> {
  const res = await api.post(`/requests/${encodeURIComponent(requestId)}/rate`, data);
  return res?.data;
}

export async function getPendingRatings(): Promise<{ items: import('../types').PendingRatingItem[]; total: number }> {
  const res = await api.get('/requests/pending-ratings');
  return res?.data;
}

export async function getClientPoints(): Promise<import('../types').ClientPointsSummary> {
  const res = await api.get('/client/points');
  return res?.data;
}
