import api from './api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://nexxos-api.abacusai.app/';

/** Upload a file using the public registration endpoints (no auth needed) */
export async function uploadRegistrationFile(
  uri: string,
  fileName: string,
  contentType: string,
): Promise<{ url: string; storagePath: string }> {
  // Get presigned URL (public endpoint)
  const presignedRes = await api.post('/upload/registration/presigned', {
    fileName,
    contentType,
    isPublic: true,
  });
  const uploadUrl = presignedRes?.data?.uploadUrl ?? '';
  const storagePath = presignedRes?.data?.cloud_storage_path ?? '';

  // Upload to S3
  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();

  const headers: Record<string, string> = { 'Content-Type': contentType };
  try {
    const signedHeaders = new URL(uploadUrl).searchParams?.get?.('X-Amz-SignedHeaders') ?? '';
    if (signedHeaders?.includes?.('content-disposition')) {
      headers['Content-Disposition'] = 'attachment';
    }
  } catch { }

  await fetch(uploadUrl, { method: 'PUT', body: blob, headers });

  // Complete upload (public endpoint)
  const completeRes = await api.post('/upload/registration/complete', {
    cloud_storage_path: storagePath,
    fileName,
    contentType,
  });

  return {
    url: completeRes?.data?.url ?? '',
    storagePath,
  };
}

/** Verify identity via LLM (public endpoint). Images sent as base64. */
export async function verifyIdentity(data: {
  documentImageBase64: string;
  selfieNeutralBase64: string;
  selfieSmileBase64: string;
  selfieTurnBase64: string;
}): Promise<{
  match: boolean;
  liveness: boolean;
  confidence: string;
  reason: string;
}> {
  const res = await api.post('/identity/verify', data);
  return res?.data ?? { match: false, liveness: false, confidence: 'n/a', reason: 'Error' };
}

/** Convert a local file URI to a base64 data URL */
export async function fileToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file as base64'));
    reader.readAsDataURL(blob);
  });
}
