import api from './api';
import { getToken } from './token';
import { BACKEND_URL } from '../config/backend';

const BASE_URL = BACKEND_URL;

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

/**
 * Upload file directly through the backend (proxy upload).
 * The backend uploads to S3 using fresh credentials, avoiding presigned URL expiry issues.
 */
export async function directUpload(
  uri: string,
  fileName: string,
  contentType: string,
  isPublic = true,
): Promise<{ id: string; cloud_storage_path: string; url: string }> {
  const token = await getToken();
  const formData = new FormData();

  // React Native FormData expects this shape for file uploads
  formData.append('file', {
    uri,
    name: fileName,
    type: contentType,
  } as any);
  formData.append('isPublic', isPublic ? 'true' : 'false');

  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  const response = await fetch(`${baseUrl}api/upload/direct`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token ?? ''}`,
      // Do NOT set Content-Type — fetch sets it automatically with the correct boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Upload failed: ${response.status} ${errText.substring(0, 200)}`);
  }

  return response.json();
}

export async function getFileViewUrl(fileId: string): Promise<string> {
  const token = await getToken();
  const url = new URL(`/api/files/${encodeURIComponent(fileId)}/url`, BASE_URL).toString();
  const res = await fetch(`${url}?mode=view`, { headers: { Authorization: `Bearer ${token ?? ''}` } });
  const data = await res.json();
  return data?.url ?? '';
}
