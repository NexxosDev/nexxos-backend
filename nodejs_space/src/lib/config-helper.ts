import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const logger = new Logger('ConfigHelper');

// ── Cache ──
interface CacheEntry {
  value: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Mapping: app_config key → .env fallback key ──
const ENV_FALLBACK: Record<string, string> = {
  API_GOOGLE_MAPS_KEY: 'GOOGLE_MAPS_KEY',
  API_PUSH_SERVER_KEY: 'PUSH_SERVER_KEY',
  API_PUSH_SENDER_ID: 'PUSH_SENDER_ID',
  API_EMAIL_HOST: 'EMAIL_HOST',
  API_EMAIL_PORT: 'EMAIL_PORT',
  API_EMAIL_USER: 'EMAIL_USER',
  API_EMAIL_PASS: 'EMAIL_PASSWORD',
  API_EMAIL_FROM: 'EMAIL_FROM',
  API_RESEND_KEY: 'RESEND_API_KEY',
  // AWS S3
  API_AWS_REGION: 'AWS_REGION',
  API_AWS_BUCKET_NAME: 'AWS_BUCKET_NAME',
  API_AWS_FOLDER_PREFIX: 'AWS_FOLDER_PREFIX',
  API_AWS_ACCESS_KEY_ID: 'AWS_ACCESS_KEY_ID',
  API_AWS_SECRET_ACCESS_KEY: 'AWS_SECRET_ACCESS_KEY',
  // LLM
  API_LLM_KEY: 'ABACUSAI_API_KEY',
};

/**
 * Decrypt a value encrypted with AES-256-GCM.
 * Format: "iv_hex:tag_hex:ciphertext_hex"
 */
function decrypt(encryptedValue: string): string {
  const encKey = process.env.CONFIG_ENCRYPTION_KEY;
  if (!encKey) {
    logger.warn('CONFIG_ENCRYPTION_KEY not set, cannot decrypt');
    return '';
  }

  try {
    const parts = encryptedValue.split(':');
    if (parts.length !== 3) {
      // Not encrypted — return as-is
      return encryptedValue;
    }

    const [ivHex, tagHex, ciphertextHex] = parts;
    const key = Buffer.from(encKey, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    logger.error(`Failed to decrypt config value: ${(err as Error)?.message}`);
    return '';
  }
}

/**
 * Get a configuration value.
 * Priority: cache → app_config (DB, decrypted) → .env fallback
 *
 * @param key - The app_config key (e.g. 'API_EMAIL_HOST')
 * @param prisma - PrismaService instance
 * @returns The config value or empty string
 */
export async function getConfig(key: string, prisma: any): Promise<string> {
  // 1. Check cache
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // 2. Query DB
  let value = '';
  try {
    const row = await prisma.appConfig.findUnique({ where: { key } });
    if (row?.value) {
      value = decrypt(row.value);
    }
  } catch (err) {
    logger.error(`Failed to query app_config for key '${key}': ${(err as Error)?.message}`);
  }

  // 3. Fallback to .env
  if (!value) {
    const envKey = ENV_FALLBACK[key] ?? key;
    value = process.env[envKey] ?? '';
  }

  // 4. Cache result
  if (value) {
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  return value;
}

/** Clear the config cache (useful when admin updates a value) */
export function clearConfigCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
  logger.log(key ? `Config cache cleared for key: ${key}` : 'Config cache cleared entirely');
}
