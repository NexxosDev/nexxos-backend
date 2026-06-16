import { S3Client } from '@aws-sdk/client-s3';
import { getConfig } from './config-helper';
import { Logger } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const logger = new Logger('AwsConfig');

/**
 * Reads fresh STS credentials. Uses multiple strategies:
 * 1. Execute credential_process from AWS shared credentials file (freshest)
 * 2. Read hosted_storage JSON files directly
 * 3. AWS env vars / ABACUS env vars
 */
function readFreshCredentials(): {
  accessKeyId: string; secretAccessKey: string; sessionToken: string; source: string;
} | null {
  // Strategy 1: Execute credential_process directly (like the SDK would, but fresh each time)
  try {
    const sharedCredsFile = process.env.AWS_SHARED_CREDENTIALS_FILE;
    const profile = process.env.AWS_PROFILE || 'hosted_storage';
    if (sharedCredsFile && existsSync(sharedCredsFile)) {
      const content = readFileSync(sharedCredsFile, 'utf-8');
      // Parse INI to find credential_process for our profile
      const profileSection = content.split(/\[/).find(s => s.startsWith(`${profile}]`));
      const match = profileSection?.match(/credential_process\s*=\s*(.+)/);
      if (match) {
        const cmd = match[1].trim();
        const output = execSync(cmd, { timeout: 5000, encoding: 'utf-8' });
        const parsed = JSON.parse(output);
        if (parsed?.AccessKeyId && parsed?.SecretAccessKey) {
          logger.log(`Credentials from credential_process (profile: ${profile}, key: ${parsed.AccessKeyId.substring(0, 8)}...)`);
          return {
            accessKeyId: parsed.AccessKeyId,
            secretAccessKey: parsed.SecretAccessKey,
            sessionToken: parsed.SessionToken ?? '',
            source: `credential_process:${profile}`,
          };
        }
      }
    }
  } catch (e: any) {
    logger.warn(`credential_process failed: ${e?.message}`);
  }

  // Strategy 2: Read JSON files directly
  const paths = [
    '/aws_credentials/.aws/hosted_storage_credential_json',
    '/aws_credentials/.aws/credential_json',
  ];
  for (const p of paths) {
    try {
      const raw = readFileSync(p, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed?.AccessKeyId && parsed?.SecretAccessKey) {
        logger.log(`Credentials from file ${p} (key: ${parsed.AccessKeyId.substring(0, 8)}...)`);
        return {
          accessKeyId: parsed.AccessKeyId,
          secretAccessKey: parsed.SecretAccessKey,
          sessionToken: parsed.SessionToken ?? '',
          source: `file:${p}`,
        };
      }
    } catch { /* skip */ }
  }

  // Strategy 3: Env vars
  for (const [prefix, src] of [['AWS_', 'AWS env'], ['ABACUS_AWS_', 'ABACUS env']] as const) {
    const k = process.env[`${prefix}ACCESS_KEY_ID`];
    const s = process.env[`${prefix}SECRET_ACCESS_KEY`];
    const t = process.env[`${prefix}SESSION_TOKEN`];
    if (k && s) {
      logger.log(`Credentials from ${src} (key: ${k.substring(0, 8)}...)`);
      return { accessKeyId: k, secretAccessKey: s, sessionToken: t ?? '', source: src };
    }
  }

  logger.error('NO credentials found from any source!');
  logger.error(`  AWS_SHARED_CREDENTIALS_FILE=${process.env.AWS_SHARED_CREDENTIALS_FILE ?? 'unset'}`);
  logger.error(`  AWS_PROFILE=${process.env.AWS_PROFILE ?? 'unset'}`);
  logger.error(`  /aws_credentials exists: ${existsSync('/aws_credentials')}`);
  logger.error(`  /opt/hostedapp/configs_credentials exists: ${existsSync('/opt/hostedapp/configs_credentials')}`);
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
    logger.log(`Using credentials from ${freshCreds.source} (key: ${freshCreds.accessKeyId.substring(0, 8)}...)`);
    return new S3Client({
      ...(region ? { region } : {}),
      credentials: {
        accessKeyId: freshCreds.accessKeyId,
        secretAccessKey: freshCreds.secretAccessKey,
        sessionToken: freshCreds.sessionToken || undefined,
      },
    });
  }

  // No credentials found — last resort: bare SDK default chain
  logger.warn('readFreshCredentials returned null, falling back to bare S3Client()');
  return new S3Client({
    ...(region ? { region } : {}),
  });
}