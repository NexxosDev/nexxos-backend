import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../theme/colors';

const BRAND_KEY_MAP: Record<string, string> = {
  hyundai: 'hyundai', chevrolet: 'chevrolet', toyota: 'toyota', nissan: 'nissan', ford: 'ford',
  honda: 'honda', volkswagen: 'volkswagen', kia: 'kia', mazda: 'mazda', renault: 'renault',
  suzuki: 'suzuki', fiat: 'fiat', jeep: 'jeep', mitsubishi: 'mitsubishi', dodge: 'dodge',
  bmw: 'bmw', 'mercedes-benz': 'mercedes-benz', 'mercedes benz': 'mercedes-benz', mercedes: 'mercedes-benz',
  audi: 'audi', peugeot: 'peugeot', subaru: 'subaru', volvo: 'volvo', lexus: 'lexus', porsche: 'porsche',
  'land rover': 'land-rover', jaguar: 'jaguar', tesla: 'tesla',
  chery: 'chery', changan: 'changan', geely: 'geely', haval: 'haval', mg: 'mg', 'great wall': 'great-wall',
  ram: 'ram', isuzu: 'isuzu', iveco: 'iveco',
};

const CDN_BASE = 'https://vl.imgix.net/img/';

function getBrandLogoUrl(brandName: string): string | null {
  const key = BRAND_KEY_MAP[brandName?.toLowerCase?.()?.trim?.() ?? ''];
  if (!key) return null;
  return `${CDN_BASE}${key}-logo.png?w=120&h=90&fit=fill&fill=solid&fill-color=00000000&auto=format`;
}

interface BrandLogoProps { brandName: string; logoUrl?: string | null; size?: number; }

export default function BrandLogo({ brandName, logoUrl: dbLogoUrl, size = 28 }: BrandLogoProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [failed, setFailed] = useState(false);
  // Prefer DB logoUrl, fallback to CDN map
  const logoUrl = dbLogoUrl || getBrandLogoUrl(brandName ?? '');

  if (!logoUrl || failed) {
    return (
      <View style={[styles.fallback, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 }]}>
        <Ionicons name="car-sport-outline" size={size * 0.7} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 }]}>
      <Image source={{ uri: logoUrl }} style={{ width: size, height: size }} contentFit="contain" transition={150} cachePolicy="none" onError={() => setFailed(true)} />
    </View>
  );
}

const createStyles = (c: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E8E8E8',
    // Always white bg so logos with dark text/elements remain visible in both modes
  },
  fallback: { backgroundColor: c.backgroundSection, justifyContent: 'center', alignItems: 'center' },
});
