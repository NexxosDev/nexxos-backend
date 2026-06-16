import { S3Client } from '@aws-sdk/client-s3';
import { fromProcess } from '@aws-sdk/credential-provider-process';
import { getConfig } from './config-helper';
import { Logger } from '@nestjs/common';

const logger = new Logger('AwsConfig');

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
// When relying on credential_process (STS tokens), we use fromProcess() which
// re-executes the credential command on each call, always getting fresh tokens.
let _cachedClient: S3Client | null = null;
let _credentialHash = '';

/**
 * Returns an S3Client configured with credentials.
 * - If explicit keys are in DB config, uses them (cached).
 * - Otherwise uses fromProcess({ profile }) which executes the credential_process
 *   command from the AWS shared credentials file, getting fresh STS tokens each time.
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
    logger.log(`Creating S3Client with explicit keys (${accessKeyId.substring(0, 8)}...)`);
    const client = new S3Client({
      ...(region ? { region } : {}),
      credentials: { accessKeyId, secretAccessKey },
    });
    _cachedClient = client;
    _credentialHash = hash;
    return client;
  }

  // No explicit keys → use fromProcess() to execute credential_process
  // This gets FRESH STS tokens each time (no caching of stale tokens)
  const profile = process.env.AWS_PROFILE || 'hosted_storage';
  logger.log(`Creating S3Client with fromProcess (profile: ${profile})`);
  return new S3Client({
    ...(region ? { region } : {}),
    credentials: fromProcess({ profile }),
  });
}