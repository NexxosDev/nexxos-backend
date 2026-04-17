import api from './api';
import type { AuthResponse, User } from '../types';

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post('/auth/login', { email, password });
  return res?.data;
}

export async function signupApi(data: {
  email: string;
  password: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  documentId: string;
  role: string;
  vendor?: {
    businessName: string;
    rif: string;
    country?: string;
    city?: string;
    state?: string;
    municipality?: string;
    parish?: string;
    street?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    fullAddress?: string;
    referencePoint?: string;
    vehicleModelIds: string[];
    partSubcategoryIds: string[];
    documentImagePath?: string;
    logoPath?: string;
  };
}): Promise<AuthResponse> {
  const res = await api.post('/signup', data);
  return res?.data;
}

export async function getMeApi(): Promise<{ user: User }> {
  const res = await api.get('/auth/me');
  return res?.data;
}

export async function forgotPasswordApi(email: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post('/auth/forgot-password', { email });
  return res?.data;
}

export async function verifyEmailApi(token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(new URL(`auth/verify-email?token=${encodeURIComponent(token)}`, process.env.EXPO_PUBLIC_API_URL).toString(), {
    method: 'GET',
  });
  if (!response?.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de verificación' }));
    throw new Error(error?.message || 'Error al verificar email');
  }
  return response.json();
}

export async function resendVerificationEmailApi(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(new URL('auth/resend-verification', process.env.EXPO_PUBLIC_API_URL).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response?.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al reenviar email' }));
    throw new Error(error?.message || 'Error al reenviar email de verificación');
  }
  return response.json();
}

export async function resetPasswordApi(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(new URL('auth/reset-password', process.env.EXPO_PUBLIC_API_URL).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!response?.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al restablecer contraseña' }));
    throw new Error(error?.message || 'Error al restablecer contraseña');
  }
  return response.json();
}
