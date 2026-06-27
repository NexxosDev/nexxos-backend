/**
 * Maps vehicle brand names to their region of origin.
 * Used for visual grouping only — no DB changes.
 */

export interface BrandRegion {
  key: string;
  flag: string;
  label: string;
}

export const BRAND_REGIONS: BrandRegion[] = [
  { key: 'american', flag: '\ud83c\uddfa\ud83c\uddf8', label: 'AMERICANAS' },
  { key: 'japanese', flag: '\ud83c\uddef\ud83c\uddf5', label: 'JAPONESAS' },
  { key: 'korean', flag: '\ud83c\uddf0\ud83c\uddf7', label: 'COREANAS' },
  { key: 'european', flag: '\ud83c\uddea\ud83c\uddfa', label: 'EUROPEAS' },
  { key: 'chinese', flag: '\ud83c\udde8\ud83c\uddf3', label: 'CHINAS' },
  { key: 'other', flag: '\ud83c\udf0d', label: 'OTRAS' },
];

const ORIGIN_MAP: Record<string, string> = {
  // American
  'Chevrolet': 'american',
  'Ford': 'american',
  'Dodge': 'american',
  'Jeep': 'american',
  'Tesla': 'american',
  'RAM': 'american',

  // Japanese
  'Toyota': 'japanese',
  'Honda': 'japanese',
  'Nissan': 'japanese',
  'Mazda': 'japanese',
  'Suzuki': 'japanese',
  'Mitsubishi': 'japanese',
  'Subaru': 'japanese',
  'Lexus': 'japanese',
  'Isuzu': 'japanese',

  // Korean
  'Hyundai': 'korean',
  'Kia': 'korean',

  // European
  'Volkswagen': 'european',
  'BMW': 'european',
  'Mercedes-Benz': 'european',
  'Audi': 'european',
  'Peugeot': 'european',
  'Citroën': 'european',
  'Renault': 'european',
  'Fiat': 'european',
  'Volvo': 'european',
  'Porsche': 'european',
  'Land Rover': 'european',
  'Jaguar': 'european',
  'Iveco': 'european',

  // Chinese
  'Chery': 'chinese',
  'Great Wall': 'chinese',
  'JAC': 'chinese',
  'Changan': 'chinese',
  'DFSK': 'chinese',
  'Zotye': 'chinese',
  'Haval': 'chinese',
  'MG': 'chinese',
  'Geely': 'chinese',
  'GWM': 'chinese',
};

/**
 * Returns the region key for a brand.
 * Prefers the `origin` field from DB if provided, falls back to hardcoded map.
 */
export function getBrandRegionKey(brandName: string, dbOrigin?: string | null): string {
  if (dbOrigin) return dbOrigin;
  return ORIGIN_MAP[brandName] ?? 'other';
}

export interface GroupedBrand<T> {
  region: BrandRegion;
  brands: T[];
}

/**
 * Groups an array of brand items by origin region.
 * T must have a `name` property (string).
 */
export function groupBrandsByOrigin<T extends { name?: string; origin?: string | null }>(
  brands: T[],
): GroupedBrand<T>[] {
  const grouped: Record<string, T[]> = {};

  for (const brand of brands ?? []) {
    const regionKey = getBrandRegionKey(brand?.name ?? '', brand?.origin);
    if (!grouped[regionKey]) grouped[regionKey] = [];
    grouped[regionKey].push(brand);
  }

  // Return in the order defined by BRAND_REGIONS, skip empty groups
  return BRAND_REGIONS
    .filter((r) => (grouped[r.key]?.length ?? 0) > 0)
    .map((r) => ({
      region: r,
      brands: (grouped[r.key] ?? []).sort((a, b) =>
        (a?.name ?? '').localeCompare(b?.name ?? '')
      ),
    }));
}
