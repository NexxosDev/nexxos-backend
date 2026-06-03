import api from './api';

const BASE_URL = process.env.EXPO_PUBLIC_CUSTOM_API_URL || process.env.EXPO_PUBLIC_API_URL || '';

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

/** Verify identity via LLM (public endpoint) */
export async function verifyIdentity(data: {
  documentImageUrl: string;
  selfieNeutralUrl: string;
  selfieSmileUrl: string;
  selfieTurnUrl: string;
}): Promise<{
  match: boolean;
  liveness: boolean;
  confidence: string;
  reason: string;
}> {
  const res = await api.post('/identity/verify', data);
  return res?.data ?? { match: false, liveness: false, confidence: 'n/a', reason: 'Error' };
}
