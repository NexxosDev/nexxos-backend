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
    personalDocPath?: string;
    selfiePath?: string;
    identityVerified?: boolean;
  };
}): Promise<AuthResponse> {
  const res = await api.post('/signup', data);
  return res?.data;
}

export async function getMeApi(): Promise<{ user: User }> {
  const res = await api.get('/auth/me');
  return res?.data;
}

export async function forgotPasswordApi(email: string): Promise<{ success: boolean; expiresIn: number; message: string }> {
  const res = await api.post('/auth/forgot-password', { email });
  return res?.data;
}

export async function verifyResetCodeApi(email: string, code: string): Promise<{ success: boolean; verified: boolean }> {
  const res = await api.post('/auth/verify-reset-code', { email, code });
  return res?.data;
}

export async function verifyEmailApi(token: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(new URL(`auth/verify-email?token=${encodeURIComponent(token)}`, process.env.EXPO_PUBLIC_CUSTOM_API_URL || process.env.EXPO_PUBLIC_API_URL).toString(), {
    method: 'GET',
  });
  if (!response?.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de verificación' }));
    throw new Error(error?.message || 'Error al verificar email');
  }
  return response.json();
}

export async function resendVerificationEmailApi(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(new URL('auth/resend-verification', process.env.EXPO_PUBLIC_CUSTOM_API_URL || process.env.EXPO_PUBLIC_API_URL).toString(), {
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

export async function upgradeToVendorApi(data: {
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
  personalDocPath?: string;
  selfiePath?: string;
  identityVerified?: boolean;
}): Promise<{ success: boolean; user: User }> {
  const res = await api.post('/auth/upgrade-to-vendor', data);
  return res?.data;
}

export async function resetPasswordApi(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post('/auth/reset-password', { email, code, newPassword });
  return res?.data;
}

export async function deleteAccountApi(): Promise<{ success: boolean; message: string }> {
  const res = await api.delete('/auth/account');
  return res?.data;
}
