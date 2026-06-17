import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getConfig } from './config-helper';
import { Logger } from '@nestjs/common';

const logger = new Logger('AwsConfig');

/**
 * Returns bucket name and folder prefix from DB config (or .env fallback).
 */
export async function getBucketConfig(prisma?: any): Promise<{ bucketName: string; folderPrefix: string }> {
  if (prisma) {
    const [bucketName, folderPrefix] = await Promise.all([
      getConfig('API_AWS_BUCKET_NAME', prisma),
      getConfig('API_AWS_FOLDER_PREFIX', prisma),
    ]);
    return { bucketName, folderPrefix };
  }
  return {
    bucketName: process.env.AWS_BUCKET_NAME ?? '',
    folderPrefix: process.env.AWS_FOLDER_PREFIX ?? '',
  };
}

// ── Cached credentials ──
interface CachedCreds {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiresAt: number; // epoch ms
}

let _cachedCreds: CachedCreds | null = null;
let _cachedClient: S3Client | null = null;
let _explicitKeyHash = '';

/** Margin before expiration to trigger refresh (10 minutes) */
const EXPIRY_MARGIN_MS = 10 * 60 * 1000;

/**
 * Read the hosted_storage credential JSON file directly.
 * Returns parsed credentials or null.
 */
function readLocalCredentialFile(): CachedCreds | null {
  try {
    const fs = require('fs');
    const filePath = '/aws_credentials/.aws/hosted_storage_credential_json';
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed?.AccessKeyId || !parsed?.SecretAccessKey) return null;
    const expiresAt = parsed.Expiration ? new Date(parsed.Expiration).getTime() : 0;
    return {
      accessKeyId: parsed.AccessKeyId,
      secretAccessKey: parsed.SecretAccessKey,
      sessionToken: parsed.SessionToken ?? undefined,
      expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch fresh hosted_storage credentials from the S3 refresh location.
 * Uses ABACUS_AWS_* env vars (always fresh when container starts) as bootstrap credentials.
 */
async function fetchFreshCredentials(): Promise<CachedCreds | null> {
  const refreshLocation = process.env.ABACUS_AWS_REFRESH_LOCATION;
  const abacusKeyId = process.env.ABACUS_AWS_ACCESS_KEY_ID;
  const abacusSecret = process.env.ABACUS_AWS_SECRET_ACCESS_KEY;
  const abacusToken = process.env.ABACUS_AWS_SESSION_TOKEN;

  if (!refreshLocation || !abacusKeyId || !abacusSecret) {
    logger.warn('ABACUS_AWS env vars not available for credential refresh');
    return null;
  }

  try {
    // Parse s3://bucket/key from ABACUS_AWS_REFRESH_LOCATION
    const match = refreshLocation.match(/^s3:\/\/([^/]+)\/(.+)$/);
    if (!match) {
      logger.warn(`Invalid ABACUS_AWS_REFRESH_LOCATION format: ${refreshLocation}`);
      return null;
    }
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

    const parsed = JSON.parse(body);
    const hostedCreds = parsed?.HostedStorageCredentials;
    if (!hostedCreds?.AccessKeyId || !hostedCreds?.SecretAccessKey) {
      logger.warn('HostedStorageCredentials missing in refresh response');
      return null;
    }

    const expiresAt = hostedCreds.Expiration ? new Date(hostedCreds.Expiration).getTime() : 0;
    logger.log(`Fetched fresh hosted_storage credentials (${hostedCreds.AccessKeyId.substring(0, 8)}... expires ${hostedCreds.Expiration})`);
    return {
      accessKeyId: hostedCreds.AccessKeyId,
      secretAccessKey: hostedCreds.SecretAccessKey,
      sessionToken: hostedCreds.SessionToken ?? undefined,
      expiresAt,
    };
  } catch (err: any) {
    logger.error(`Failed to fetch fresh credentials from refresh location: ${err?.message}`);
    return null;
  }
}

/**
 * Get valid hosted_storage STS credentials.
 * Priority:
 *  1. Cached credentials (if not expired)
 *  2. Local credential file (if not expired)
 *  3. Fresh credentials from S3 refresh location
 */
async function getHostedStorageCredentials(): Promise<CachedCreds | null> {
  const now = Date.now();

  // 1. Return cached if still valid
  if (_cachedCreds && _cachedCreds.expiresAt > now + EXPIRY_MARGIN_MS) {
    return _cachedCreds;
  }

  // 2. Try local file
  const local = readLocalCredentialFile();
  if (local && local.expiresAt > now + EXPIRY_MARGIN_MS) {
    logger.log(`Using local credential file (${local.accessKeyId.substring(0, 8)}... expires in ${Math.round((local.expiresAt - now) / 60000)}min)`);
    _cachedCreds = local;
    _cachedClient = null; // invalidate client so it gets recreated
    return local;
  }

  // 3. Fetch fresh from S3 refresh location
  logger.log('Local credentials expired or missing, fetching fresh from S3...');
  const fresh = await fetchFreshCredentials();
  if (fresh) {
    _cachedCreds = fresh;
    _cachedClient = null;
    return fresh;
  }

  // 4. Last resort: use local even if expired (might still work briefly)
  if (local) {
    logger.warn(`Using possibly-expired local credentials as last resort (expired ${Math.round((now - local.expiresAt) / 60000)}min ago)`);
    _cachedCreds = local;
    _cachedClient = null;
    return local;
  }

  return null;
}

/**
 * Returns an S3Client configured with credentials.
 * Priority:
 *  1. Explicit IAM keys from DB config (permanent, cached)
 *  2. Hosted storage STS credentials (refreshed automatically)
 */
export async function createS3Client(prisma?: any): Promise<S3Client> {
  // ── 1. Explicit long-lived keys from DB ──
  if (prisma) {
    const [region, accessKeyId, secretAccessKey] = await Promise.all([
      getConfig('API_AWS_REGION', prisma),
      getConfig('API_AWS_ACCESS_KEY_ID', prisma),
      getConfig('API_AWS_SECRET_ACCESS_KEY', prisma),
    ]);

    if (accessKeyId && secretAccessKey) {
      const hash = `${region}|${accessKeyId}|${secretAccessKey}`;
      if (_cachedClient && hash === _explicitKeyHash) {
        return _cachedClient;
      }
      logger.log(`Creating S3Client with explicit keys (${accessKeyId.substring(0, 8)}...)`);
      const client = new S3Client({
        ...(region ? { region } : {}),
        credentials: { accessKeyId, secretAccessKey },
      });
      _cachedClient = client;
      _explicitKeyHash = hash;
      return client;
    }
  }

  // ── 2. Hosted storage STS credentials (auto-refreshed) ──
  const stsCreds = await getHostedStorageCredentials();
  if (stsCreds) {
    // Re-use cached client if creds haven't changed
    if (_cachedClient && _cachedCreds === stsCreds && _explicitKeyHash === '') {
      return _cachedClient;
    }
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
    _explicitKeyHash = '';
    return client;
  }

  // ── 3. Bare SDK (last resort) ──
  logger.warn('No credentials found, creating bare S3Client (will use default chain)');
  return new S3Client({ region: process.env.AWS_REGION ?? 'us-west-2' });
}