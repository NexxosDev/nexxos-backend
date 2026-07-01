import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Pressable,
  Linking,
  Platform,
  View,
  ScrollView,
  useWindowDimensions,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, Spacing } from '../theme/colors';
import type { BannerSlide } from '../services/vendor';

interface PromoCarouselProps {
  slides: BannerSlide[] | null | undefined;
  /** Horizontal padding applied by the parent screen, used to compute slide width. */
  horizontalPadding?: number;
}

const AUTO_ADVANCE_MS = 4500;

export default function PromoCarousel({ slides, horizontalPadding = 0 }: PromoCarouselProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const data = (slides ?? []).filter((s) => !!s?.imageUrl);
  const count = data.length;
  const isCarousel = count > 1;

  // Measure the container so slide width matches available space on any device.
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e?.nativeEvent?.layout?.width ?? 0;
    if (w > 0) setContainerWidth(w);
  }, []);

  const slideWidth = containerWidth > 0 ? containerWidth : Math.max(windowWidth - horizontalPadding, 1);

  // Auto-advance for multiple slides.
  useEffect(() => {
    if (!isCarousel || slideWidth <= 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % count;
        scrollRef.current?.scrollTo?.({ x: next * slideWidth, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [isCarousel, count, slideWidth]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      if (slideWidth <= 0) return;
      const idx = Math.round(x / slideWidth);
      setActiveIndex(Math.max(0, Math.min(idx, count - 1)));
    },
    [slideWidth, count]
  );

  const handlePress = useCallback((linkUrl?: string) => {
    if (linkUrl) {
      Linking.openURL(linkUrl).catch(() => {});
    }
  }, []);

  if (count === 0) return null;

  const renderImage = (slide: BannerSlide) => (
    <Image
      source={{ uri: slide.imageUrl }}
      style={styles.image}
      contentFit="cover"
      transition={250}
      accessibilityLabel={slide?.altText ?? 'Banner publicitario'}
    />
  );

  const renderSlide = (slide: BannerSlide, index: number) => {
    const key = `${slide.imageUrl}-${index}`;
    const width = slideWidth;
    if (slide?.linkUrl) {
      return (
        <Pressable
          key={key}
          onPress={() => handlePress(slide.linkUrl)}
          style={({ pressed }) => [
            { width },
            pressed && { opacity: 0.9 },
          ]}
          accessibilityRole="link"
          accessibilityLabel={slide?.altText ?? 'Banner publicitario'}
        >
          {renderImage(slide)}
        </Pressable>
      );
    }
    return (
      <View key={key} style={{ width }}>
        {renderImage(slide)}
      </View>
    );
  };

  // Single image: no scrollview, no dots.
  if (!isCarousel) {
    const slide = data[0];
    return (
      <View style={styles.wrapper}>
        <View style={[styles.container, styles.containerNoDots, { borderColor: colors.border }]} onLayout={onLayout}>
          {slide?.linkUrl ? (
            <Pressable
              onPress={() => handlePress(slide.linkUrl)}
              style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
              accessibilityRole="link"
              accessibilityLabel={slide?.altText ?? 'Banner publicitario'}
            >
              {renderImage(slide)}
            </Pressable>
          ) : (
            renderImage(slide)
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { borderColor: colors.border }]} onLayout={onLayout}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
        >
          {data.map(renderSlide)}
        </ScrollView>
      </View>
      <View style={styles.dotsRow}>
        {data.map((_, i) => (
          <View
            key={`dot-${i}`}
            style={[
              styles.dot,
              {
                backgroundColor: i === activeIndex ? colors.primary : colors.border,
                width: i === activeIndex ? 18 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  containerNoDots: {
    marginBottom: 0,
  },
  image: {
    width: '100%',
    aspectRatio: 2, // 800x400 = 2:1
    backgroundColor: '#E0E0E0',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
