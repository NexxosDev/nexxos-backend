import React from 'react';
import { StyleSheet, Pressable, Linking, Platform, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, Spacing } from '../theme/colors';
import type { MarketingBanner } from '../services/vendor';

interface PromoBannerProps {
  banner: MarketingBanner | null;
}

export default function PromoBanner({ banner }: PromoBannerProps) {
  if (!banner?.visible || !banner?.imageUrl) return null;

  const { colors } = useTheme();

  const handlePress = () => {
    const url = banner?.linkUrl;
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  const content = (
    <Image
      source={{ uri: banner.imageUrl }}
      style={styles.image}
      contentFit="cover"
      transition={250}
      accessibilityLabel={banner?.altText ?? 'Banner publicitario'}
    />
  );

  if (banner?.linkUrl) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          { borderColor: colors.border },
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
        accessibilityRole="link"
        accessibilityLabel={banner?.altText ?? 'Banner publicitario'}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  image: {
    width: '100%',
    aspectRatio: 4, // 800x200 = 4:1
    backgroundColor: '#E0E0E0',
  },
});
