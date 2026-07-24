import api from './api';
import type { DeliveryOptionsResponse, DeliveryOrder } from '../types';

export async function getDeliveryOptions(chatId: string): Promise<DeliveryOptionsResponse> {
  const res = await api.get('/delivery/options', { params: { chatId } });
  return res?.data;
}

export async function offerDelivery(chatId: string): Promise<unknown> {
  const res = await api.post('/delivery/offer', { chatId });
  return res?.data;
}

export interface ConfirmDeliveryPayload {
  chatId: string;
  provider: string;
  cost: number;
  isFree: boolean;
  dropoffAddress?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  notes?: string;
}

export async function confirmDelivery(payload: ConfirmDeliveryPayload): Promise<DeliveryOrder> {
  const res = await api.post('/delivery/confirm', payload);
  return res?.data;
}

export interface QuoteDeliveryBody {
  dropoffLat?: number;
  dropoffLng?: number;
  mapUrl?: string;
}

export async function quoteDelivery(chatId: string, body: QuoteDeliveryBody): Promise<DeliveryOptionsResponse> {
  const res = await api.post(`/delivery/${encodeURIComponent(chatId)}/quote`, body);
  return res?.data;
}

export async function getDeliveryByChat(chatId: string): Promise<DeliveryOrder | null> {
  const res = await api.get(`/delivery/chat/${encodeURIComponent(chatId)}`);
  return res?.data ?? null;
}

export async function updateDeliveryStatus(orderId: string, status: 'IN_TRANSIT' | 'DELIVERED'): Promise<DeliveryOrder> {
  const res = await api.patch(`/delivery/${encodeURIComponent(orderId)}/status`, { status });
  return res?.data;
}

export async function cancelDelivery(orderId: string): Promise<DeliveryOrder> {
  const res = await api.post(`/delivery/${encodeURIComponent(orderId)}/cancel`);
  return res?.data;
}
