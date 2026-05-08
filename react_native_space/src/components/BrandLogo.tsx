import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const BRAND_KEY_MAP: Record<string, string> = {
  hyundai: 'hyundai',
  chevrolet: 'chevrolet',
  toyota: 'toyota',
  nissan: 'nissan',
  ford: 'ford',
  honda: 'honda',
  volkswagen: 'volkswagen',
  kia: 'kia',
  mazda: 'mazda',
  renault: 'renault',
  fiat: 'fiat',
  jeep: 'jeep',
  suzuki: 'suzuki',
  mitsubishi: 'mitsubishi',
  bmw: 'bmw',
  'mercedes-benz': 'mercedes-benz',
  'mercedes benz': 'mercedes-benz',
  mercedes: 'mercedes-benz',
  dodge: 'dodge',
  peugeot: 'peugeot',
  subaru: 'subaru',
  volvo: 'volvo',
  audi: 'audi',
  lexus: 'lexus',
  porsche: 'porsche',
  'land rover': 'land-rover',
  jaguar: 'jaguar',
  tesla: 'tesla',
  chery: 'chery',
  changan: 'changan',
  geely: 'geely',
  haval: 'haval',
  mg: 'mg',
};

const CDN_BASE = 'https://vl.imgix.net/img/';

function getBrandLogoUrl(brandName: string): string | null {
  const key = BRAND_KEY_MAP[brandName?.toLowerCase?.()?.trim?.() ?? ''];
  if (!key) return null;
  return CDN_BASE + key + '-logo.png?w=120&h=90&fit=fill&fill=solid&fill-color=00000000';
}

interface BrandLogoProps {
  brandName: string;
  size?: number;
}

export default function BrandLogo({ brandName, size = 28 }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const logoUrl = getBrandLogoUrl(brandName ?? '');

  if (!logoUrl || failed) {
    return (
      <View style={[styles.fallback, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 }]}>
        <Ionicons name="car-sport-outline" size={size * 0.7} color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 }]}>
      <Image
        source={{ uri: logoUrl }}
        style={{ width: size, height: size }}
        contentFit="contain"
        transition={150}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  fallback: {
    backgroundColor: Colors.backgroundSection,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
