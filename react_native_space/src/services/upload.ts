import api from './api';
import { getToken } from './token';

const BASE_URL = process.env.EXPO_PUBLIC_CUSTOM_API_URL || process.env.EXPO_PUBLIC_API_URL || 'https://fad9d6698.na102.preview.abacusai.app/';

export async function getPresignedUrl(fileName: string, contentType: string, isPublic: boolean): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  const res = await api.post('/upload/presigned', { fileName, contentType, isPublic });
  return res?.data;
}

export async function completeUpload(cloud_storage_path: string, fileName: string, contentType: string): Promise<{ id: string; cloud_storage_path: string; url: string }> {
  const res = await api.post('/upload/complete', { cloud_storage_path, fileName, contentType });
  return res?.data;
}

export async function uploadFile(uri: string, fileName: string, contentType: string, isPublic: boolean = false): Promise<string> {
  const presigned = await getPresignedUrl(fileName, contentType, isPublic);
  const uploadUrl = presigned?.uploadUrl ?? '';
  const storagePath = presigned?.cloud_storage_path ?? '';

  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();

  const headers: Record<string, string> = { 'Content-Type': contentType };
  const signedHeaders = new URL(uploadUrl).searchParams?.get?.('X-Amz-SignedHeaders') ?? '';
  if (signedHeaders?.includes?.('content-disposition')) {
    headers['Content-Disposition'] = 'attachment';
  }

  await fetch(uploadUrl, { method: 'PUT', body: blob, headers });
  await completeUpload(storagePath, fileName, contentType);
  return storagePath;
}

export async function getFileViewUrl(fileId: string): Promise<string> {
  const token = await getToken();
  const url = new URL(`/api/files/${encodeURIComponent(fileId)}/url`, BASE_URL).toString();
  const res = await fetch(`${url}?mode=view`, { headers: { Authorization: `Bearer ${token ?? ''}` } });
  const data = await res.json();
  return data?.url ?? '';
}
