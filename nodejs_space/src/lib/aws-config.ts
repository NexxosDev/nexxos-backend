import { S3Client } from '@aws-sdk/client-s3';
import { getConfig } from './config-helper';
import { Logger } from '@nestjs/common';
import { readFileSync } from 'fs';

const logger = new Logger('AwsConfig');

/**
 * Reads fresh STS credentials from all available sources in priority order:
 * 1. ABACUS_AWS_* environment variables (set by Abacus infrastructure)
 * 2. Hosted storage credential JSON files
 * 3. Standard AWS_* environment variables
 */
function readFreshCredentials(): {
  accessKeyId: string; secretAccessKey: string; sessionToken: string; source: string; expiration?: string;
} | null {
  // Source 1: Credential JSON files (hosted_storage profile — has S3 bucket access)
  const paths = [
    '/aws_credentials/.aws/hosted_storage_credential_json',
    '/aws_credentials/.aws/credential_json',
  ];
  for (const p of paths) {
    try {
      const raw = readFileSync(p, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed?.AccessKeyId && parsed?.SecretAccessKey) {
        return {
          accessKeyId: parsed.AccessKeyId,
          secretAccessKey: parsed.SecretAccessKey,
          sessionToken: parsed.SessionToken ?? '',
          source: `file:${p}`,
          expiration: parsed.Expiration ?? undefined,
        };
      }
    } catch {
      // File doesn't exist or invalid — try next
    }
  }

  // Source 2: Standard AWS_* env vars
  const stdKey = process.env.AWS_ACCESS_KEY_ID;
  const stdSecret = process.env.AWS_SECRET_ACCESS_KEY;
  const stdToken = process.env.AWS_SESSION_TOKEN;
  if (stdKey && stdSecret) {
    return {
      accessKeyId: stdKey,
      secretAccessKey: stdSecret,
      sessionToken: stdToken ?? '',
      source: 'AWS env vars',
    };
  }

  // Source 3: ABACUS_AWS_* env vars (may have limited permissions)
  const abacusKey = process.env.ABACUS_AWS_ACCESS_KEY_ID;
  const abacusSecret = process.env.ABACUS_AWS_SECRET_ACCESS_KEY;
  const abacusToken = process.env.ABACUS_AWS_SESSION_TOKEN;
  if (abacusKey && abacusSecret) {
    return {
      accessKeyId: abacusKey,
      secretAccessKey: abacusSecret,
      sessionToken: abacusToken ?? '',
      source: 'ABACUS_AWS env vars',
      expiration: process.env.ABACUS_AWS_EXPIRATION,
    };
  }

  return null;
}

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

  // No explicit keys → try reading fresh STS credentials from credential files
  // The default SDK provider chain can cache stale STS tokens, so we read directly.
  _cachedClient = null;
  _credentialHash = '';

  const freshCreds = readFreshCredentials();
  if (freshCreds) {
    logger.log(`Using credentials from ${freshCreds.source} (key: ${freshCreds.accessKeyId.substring(0, 8)}..., expires: ${freshCreds.expiration ?? 'unknown'})`);
    return new S3Client({
      ...(region ? { region } : {}),
      credentials: {
        accessKeyId: freshCreds.accessKeyId,
        secretAccessKey: freshCreds.secretAccessKey,
        sessionToken: freshCreds.sessionToken || undefined,
      },
    });
  }

  // Fallback: log everything we know for debugging
  logger.warn('readFreshCredentials returned null — dumping env diagnostic');
  logger.warn(`  AWS_SHARED_CREDENTIALS_FILE=${process.env.AWS_SHARED_CREDENTIALS_FILE ?? 'unset'}`);
  logger.warn(`  AWS_PROFILE=${process.env.AWS_PROFILE ?? 'unset'}`);
  logger.warn(`  AWS_REGION=${process.env.AWS_REGION ?? 'unset'}`);
  logger.warn(`  AWS_ACCESS_KEY_ID=${(process.env.AWS_ACCESS_KEY_ID ?? 'unset').substring(0, 8)}...`);
  logger.warn(`  ABACUS_AWS_ACCESS_KEY_ID=${(process.env.ABACUS_AWS_ACCESS_KEY_ID ?? 'unset').substring(0, 8)}...`);
  // Check if credential files exist
  const credPaths = ['/aws_credentials/.aws/hosted_storage_credential_json', '/aws_credentials/.aws/credential_json'];
  for (const cp of credPaths) {
    try { readFileSync(cp, 'utf-8'); logger.warn(`  ${cp} EXISTS`); } catch { logger.warn(`  ${cp} NOT FOUND`); }
  }
  // Also try the credential_process file
  try {
    const credFile = process.env.AWS_SHARED_CREDENTIALS_FILE ?? '';
    if (credFile) {
      const content = readFileSync(credFile, 'utf-8');
      logger.warn(`  Shared creds file content: ${content.substring(0, 200)}`);
    }
  } catch (e: any) { logger.warn(`  Could not read shared creds file: ${e?.message}`); }

  return new S3Client({
    ...(region ? { region } : {}),
  });
}