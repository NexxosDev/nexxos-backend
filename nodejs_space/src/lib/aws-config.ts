import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getConfig } from './config-helper';
import { Logger } from '@nestjs/common';

const logger = new Logger('AwsConfig');

/**
 * Returns bucket name and folder prefix.
 * Priority: env vars (always available) → DB config (if prisma provided).
 */
export async function getBucketConfig(prisma?: any): Promise<{ bucketName: string; folderPrefix: string }> {
  // 1. Check env vars first (works in ALL environments)
  const envBucket = process.env.AWS_BUCKET_NAME;
  const envPrefix = process.env.AWS_FOLDER_PREFIX;
  if (envBucket) {
    return { bucketName: envBucket, folderPrefix: envPrefix ?? '' };
  }

  // 2. Fallback to DB config
  if (prisma) {
    const [bucketName, folderPrefix] = await Promise.all([
      getConfig('API_AWS_BUCKET_NAME', prisma),
      getConfig('API_AWS_FOLDER_PREFIX', prisma),
    ]);
    return { bucketName, folderPrefix };
  }

  return { bucketName: '', folderPrefix: '' };
}

// ── Cached S3 client ──
let _cachedClient: S3Client | null = null;
let _cachedKeyHash = '';

/**
 * Invalidate cached credentials and force a fresh client on next call.
 * Called when an S3 operation fails with InvalidAccessKeyId.
 */
export function invalidateCachedCredentials() {
  logger.warn('Invalidating cached S3 client (will recreate on next call)');
  _cachedClient = null;
  _cachedKeyHash = '';
}

// ── STS credential support (Abacus environment only) ──
interface CachedCreds {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiresAt: number;
}

let _cachedSts: CachedCreds | null = null;
const EXPIRY_MARGIN_MS = 10 * 60 * 1000;

function readLocalCredentialFile(): CachedCreds | null {
  try {
    const fs = require('fs');
    const raw = fs.readFileSync('/aws_credentials/.aws/hosted_storage_credential_json', 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed?.AccessKeyId || !parsed?.SecretAccessKey) return null;
    return {
      accessKeyId: parsed.AccessKeyId,
      secretAccessKey: parsed.SecretAccessKey,
      sessionToken: parsed.SessionToken ?? undefined,
      expiresAt: parsed.Expiration ? new Date(parsed.Expiration).getTime() : 0,
    };
  } catch { return null; }
}

async function fetchFreshCredentials(): Promise<CachedCreds | null> {
  const refreshLocation = process.env.ABACUS_AWS_REFRESH_LOCATION;
  const abacusKeyId = process.env.ABACUS_AWS_ACCESS_KEY_ID;
  const abacusSecret = process.env.ABACUS_AWS_SECRET_ACCESS_KEY;
  const abacusToken = process.env.ABACUS_AWS_SESSION_TOKEN;
  if (!refreshLocation || !abacusKeyId || !abacusSecret) return null;

  try {
    const match = refreshLocation.match(/^s3:\/\/([^/]+)\/(.+)$/);
    if (!match) return null;
    const [, bucket, key] = match;
    const bootstrapClient = new S3Client({
      region: 'us-west-2',
      credentials: {
        accessKeyId: abacusKeyId,
        secretAccessKey: abacusSecret,
        ...(abacusToken ? { sessionToken: abacusToken } : {}),
      },
    });
    const resp = await bootstrapClient.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = await resp.Body?.transformToString();
    if (!body) return null;
    const hostedCreds = JSON.parse(body)?.HostedStorageCredentials;
    if (!hostedCreds?.AccessKeyId || !hostedCreds?.SecretAccessKey) return null;
    logger.log(`Fetched fresh STS credentials (${hostedCreds.AccessKeyId.substring(0, 8)}...)`);
    return {
      accessKeyId: hostedCreds.AccessKeyId,
      secretAccessKey: hostedCreds.SecretAccessKey,
      sessionToken: hostedCreds.SessionToken ?? undefined,
      expiresAt: hostedCreds.Expiration ? new Date(hostedCreds.Expiration).getTime() : 0,
    };
  } catch (err: any) {
    logger.error(`Failed to fetch STS credentials: ${err?.message}`);
    return null;
  }
}

async function getHostedStorageCredentials(forceRefresh = false): Promise<CachedCreds | null> {
  const now = Date.now();
  if (!forceRefresh && _cachedSts && _cachedSts.expiresAt > now + EXPIRY_MARGIN_MS) return _cachedSts;
  const fresh = await fetchFreshCredentials();
  if (fresh && fresh.expiresAt > now + EXPIRY_MARGIN_MS) { _cachedSts = fresh; return fresh; }
  const local = readLocalCredentialFile();
  if (local && local.expiresAt > now + EXPIRY_MARGIN_MS) { _cachedSts = local; return local; }
  if (local) { _cachedSts = local; return local; }
  return null;
}

/**
 * Returns an S3Client configured with credentials.
 * Priority:
 *  1. Env vars with permanent AKIA keys (works in ALL environments)
 *  2. DB config AKIA keys (if prisma provided)
 *  3. Hosted storage STS credentials (Abacus dev only, auto-refreshed)
 *  4. Bare SDK (last resort)
 */
export async function createS3Client(prisma?: any): Promise<S3Client> {
  // ── 1. Check env vars for permanent AKIA keys (no prisma needed) ──
  // NOTE: We use S3_ACCESS_KEY_ID instead of AWS_ACCESS_KEY_ID because
  // the Abacus platform injects its own AWS_ACCESS_KEY_ID (ASIA* STS keys)
  // that override .env values and don't have access to our bucket.
  const envKeyId = process.env.S3_ACCESS_KEY_ID;
  const envSecret = process.env.S3_SECRET_ACCESS_KEY;
  const envRegion = process.env.AWS_REGION ?? 'us-east-1';

  if (envKeyId && envSecret && envKeyId.startsWith('AKIA')) {
    const hash = `env|${envRegion}|${envKeyId}`;
    if (_cachedClient && hash === _cachedKeyHash) return _cachedClient;
    logger.log(`Creating S3Client with env AKIA keys (${envKeyId.substring(0, 8)}...)`);
    const client = new S3Client({ region: envRegion, credentials: { accessKeyId: envKeyId, secretAccessKey: envSecret } });
    _cachedClient = client;
    _cachedKeyHash = hash;
    return client;
  }

  // ── 2. DB config AKIA keys ──
  if (prisma) {
    const [region, accessKeyId, secretAccessKey] = await Promise.all([
      getConfig('API_AWS_REGION', prisma),
      getConfig('API_AWS_ACCESS_KEY_ID', prisma),
      getConfig('API_AWS_SECRET_ACCESS_KEY', prisma),
    ]);
    if (accessKeyId && secretAccessKey && accessKeyId.startsWith('AKIA')) {
      const hash = `db|${region}|${accessKeyId}`;
      if (_cachedClient && hash === _cachedKeyHash) return _cachedClient;
      logger.log(`Creating S3Client with DB AKIA keys (${accessKeyId.substring(0, 8)}...)`);
      const client = new S3Client({ ...(region ? { region } : {}), credentials: { accessKeyId, secretAccessKey } });
      _cachedClient = client;
      _cachedKeyHash = hash;
      return client;
    }
  }

  // ── 3. Hosted storage STS credentials (Abacus dev environment) ──
  const stsCreds = await getHostedStorageCredentials();
  if (stsCreds) {
    const region = process.env.AWS_REGION ?? 'us-west-2';
    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: stsCreds.accessKeyId,
        secretAccessKey: stsCreds.secretAccessKey,
        ...(stsCreds.sessionToken ? { sessionToken: stsCreds.sessionToken } : {}),
      },
    });
    _cachedClient = client;
    _cachedKeyHash = '';
    return client;
  }

  // ── 4. Bare SDK (last resort) ──
  logger.warn('No credentials found, creating bare S3Client');
  return new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
}