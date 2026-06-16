import axios from 'axios';
import { getToken, removeToken } from './token';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://nexxos-api.abacusai.app/';

const api = axios.create({
  baseURL: new URL('/api', BASE_URL).toString(),
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  transformRequest: [
    (data: unknown, headers: Record<string, string> | undefined) => {
      if (data && typeof data === 'object' && !(data instanceof FormData) && !(data instanceof Blob)) {
        return JSON.stringify(data);
      }
      return data;
    },
  ],
});

api.interceptors.request.use(async (config) => {
  try {
    // No enviar token en rutas públicas (signup, login, forgot-password, reset-password, verify-email)
    const publicRoutes = ['/signup', '/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/auth/send-code', '/auth/verify-code'];
    const isPublicRoute = publicRoutes.some((route) => config?.url?.includes?.(route));
    
    if (!isPublicRoute) {
      const token = await getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {}
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await removeToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error?.response?.data?.message;
    if (Array.isArray(msg)) return msg?.[0] ?? 'Error desconocido';
    if (typeof msg === 'string') return msg;
    return error?.message ?? 'Error de red';
  }
  if (error instanceof Error) return error?.message ?? 'Error desconocido';
  return 'Error desconocido';
}
