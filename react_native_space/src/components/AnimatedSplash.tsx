import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform, Image as RNImage, ImageBackground } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const LOGO_SIZE = Math.min(SCREEN_W * 0.3, 130);

const textureDark = require('../../assets/images/texture-automotive-dark.png');
const textureLight = require('../../assets/images/texture-automotive-light.png');
const logoYellow = require('../../assets/images/nexxos-logo-yellow.png');

interface AnimatedSplashProps {
  onFinish: () => void;
  fontLoaded: boolean;
}

export default function AnimatedSplash({ onFinish, fontLoaded }: AnimatedSplashProps) {
  const { isDark } = useTheme();

  // ── Shared values ──
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(-8); // start rotated -8 degrees
  const logoBrightness = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const wholeOpacity = useSharedValue(1);

  const finishSplash = useCallback(() => {
    onFinish?.();
  }, [onFinish]);

  useEffect(() => {
    if (!fontLoaded) return;

    // ── STEP 1: Logo rotation + fade-in + scale (0ms → 900ms) ──
    // Logo rotates from -8° to 0° while fading in
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoRotation.value = withSpring(0, { damping: 12, stiffness: 80, mass: 0.9 });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 100, mass: 0.8 });

    // ── STEP 2: Glow pulse — logo "comes alive" (700ms → 2200ms) ──
    // Scale pulses subtly 1.0 → 1.06 → 1.0 twice
    logoBrightness.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 500, easing: Easing.inOut(Easing.sin) }),
        ),
        2, // repeat twice
        false,
      ),
    );

    // ── STEP 3: Text "NEXXOS" fade-in + slide up (600ms → 1200ms) ──
    textOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    textTranslateY.value = withDelay(
      600,
      withSpring(0, { damping: 16, stiffness: 120, mass: 0.7 }),
    );

    // ── STEP 4: Whole splash fades out (3000ms → 3600ms) ──
    wholeOpacity.value = withDelay(
      3000,
      withTiming(0, { duration: 600, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(finishSplash)();
        }
      }),
    );
  }, [fontLoaded]);

  // ── Animated styles ──
  const containerStyle = useAnimatedStyle(() => ({
    opacity: wholeOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * logoBrightness.value },
      { rotate: `${logoRotation.value}deg` },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const bgColor = isDark ? '#0A0A0A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#121212';

  return (
    <Animated.View style={[styles.container, containerStyle, { backgroundColor: bgColor }]}>
      {/* Tileable automotive texture — 6% opacity */}
      <ImageBackground
        source={isDark ? textureDark : textureLight}
        resizeMode="repeat"
        imageStyle={{ opacity: 0.06 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Center content */}
      <View style={styles.content}>
        {/* Logo icon — yellow with rotation + pulse animation */}
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <RNImage
            source={logoYellow}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* NEXXOS text */}
        <Animated.Text
          style={[
            styles.brandText,
            textStyle,
            {
              color: textColor,
              fontFamily: Platform.select({
                ios: 'Montserrat-Black',
                android: 'Montserrat-Black',
                web: 'Montserrat-Black',
                default: 'System',
              }),
            },
          ]}
        >
          NEXXOS
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  brandText: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
