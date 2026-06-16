import { S3Client } from '@aws-sdk/client-s3';
import { getConfig } from './config-helper';

/**
 * Returns bucket name and folder prefix from DB config (or .env fallback).
 */
export async function getBucketConfig(prisma: any): Promise<{ bucketName: string; folderPrefix: string }> {
  const [bucketName, folderPrefix] = await Promise.all([
    getConfig('API_AWS_BUCKET_NAME', prisma),
    getConfig('API_AWS_FOLDER_PREFIX', prisma),
  ]);
  return { bucketName, folderPrefix };
}

// ── S3 client factory ──
// When explicit IAM keys are configured (long-lived), we cache the client.
// When relying on the default credential chain (STS / AWS_PROFILE), we create
// a fresh client every time so the SDK's credential provider fetches fresh
// temporary tokens automatically — caching would hold stale STS credentials.
let _cachedClient: S3Client | null = null;
let _credentialHash = '';

/**
 * Returns an S3Client configured with credentials from DB config (or .env fallback).
 * Only caches when explicit long-lived credentials are provided.
 */
export async function createS3Client(prisma: any): Promise<S3Client> {
  const [region, accessKeyId, secretAccessKey] = await Promise.all([
    getConfig('API_AWS_REGION', prisma),
    getConfig('API_AWS_ACCESS_KEY_ID', prisma),
    getConfig('API_AWS_SECRET_ACCESS_KEY', prisma),
  ]);

  const hasExplicitKeys = !!(accessKeyId && secretAccessKey);

  // With explicit keys we can safely cache (they don't expire)
  if (hasExplicitKeys) {
    const hash = `${region}|${accessKeyId}|${secretAccessKey}`;
    if (_cachedClient && hash === _credentialHash) {
      return _cachedClient;
    }
    const client = new S3Client({
      ...(region ? { region } : {}),
      credentials: { accessKeyId, secretAccessKey },
    });
    _cachedClient = client;
    _credentialHash = hash;
    return client;
  }

  // No explicit keys → default credential chain (STS tokens, AWS_PROFILE, etc.)
  // NEVER cache — STS tokens expire and the SDK must resolve fresh ones each time.
  _cachedClient = null;
  _credentialHash = '';
  return new S3Client({
    ...(region ? { region } : {}),
  });
}