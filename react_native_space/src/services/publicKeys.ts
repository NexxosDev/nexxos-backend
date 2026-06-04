import api from './api';

let cachedKeys: { googleMapsKey: string } | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getPublicKeys(): Promise<{ googleMapsKey: string }> {
  if (cachedKeys && Date.now() < cacheExpiry) {
    return cachedKeys;
  }

  try {
    const res = await api.get('/config/public-keys');
    cachedKeys = {
      googleMapsKey: res?.data?.googleMapsKey ?? '',
    };
    cacheExpiry = Date.now() + CACHE_TTL;
    return cachedKeys;
  } catch {
    return cachedKeys ?? { googleMapsKey: '' };
  }
}

export async function getGoogleMapsKey(): Promise<string> {
  const keys = await getPublicKeys();
  return keys?.googleMapsKey ?? '';
}
