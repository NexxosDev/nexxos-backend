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

// ── Cached S3 client — rebuilt when credentials change ──
let _cachedClient: S3Client | null = null;
let _credentialHash = '';

function makeHash(region: string, accessKey: string, secretKey: string): string {
  return `${region}|${accessKey}|${secretKey}`;
}

/**
 * Returns an S3Client configured with credentials from DB config (or .env fallback).
 * The client is cached and only rebuilt when the credentials change.
 */
export async function createS3Client(prisma: any): Promise<S3Client> {
  const [region, accessKeyId, secretAccessKey] = await Promise.all([
    getConfig('API_AWS_REGION', prisma),
    getConfig('API_AWS_ACCESS_KEY_ID', prisma),
    getConfig('API_AWS_SECRET_ACCESS_KEY', prisma),
  ]);

  const hash = makeHash(region, accessKeyId, secretAccessKey);

  if (_cachedClient && hash === _credentialHash) {
    return _cachedClient;
  }

  // Build new client — if keys are present use explicit credentials, otherwise
  // fall back to the default credential chain (env vars, IAM role, etc.)
  const clientConfig: ConstructorParameters<typeof S3Client>[0] = {};

  if (region) clientConfig.region = region;

  if (accessKeyId && secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId,
      secretAccessKey,
    };
  }

  _cachedClient = new S3Client(clientConfig);
  _credentialHash = hash;
  return _cachedClient;
}