import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform, Image as RNImage } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LOGO_SIZE = Math.min(SCREEN_W * 0.28, 120);

interface AnimatedSplashProps {
  onFinish: () => void;
  fontLoaded: boolean;
}

export default function AnimatedSplash({ onFinish, fontLoaded }: AnimatedSplashProps) {
  // ── Shared values ──
  const bgOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(24);
  const wholeOpacity = useSharedValue(1);

  const finishSplash = useCallback(() => {
    onFinish?.();
  }, [onFinish]);

  useEffect(() => {
    if (!fontLoaded) return;

    // Step 1: Logo fade-in + scale (0ms → 800ms)
    logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 100, mass: 0.8 });

    // Step 2: Glow appears (300ms → 900ms)
    glowOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(0.7, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(0.35, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
    );

    // Step 3: Text "NEXXOS" fade-in + slide up (600ms → 1300ms)
    textOpacity.value = withDelay(600, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    textTranslateY.value = withDelay(
      600,
      withSpring(0, { damping: 16, stiffness: 120, mass: 0.7 }),
    );

    // Step 4: Whole splash fades out (2600ms → 3200ms)
    wholeOpacity.value = withDelay(
      2600,
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
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0D0D0D', '#141414', '#1A1A1A', '#141414', '#0A0A0A']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle radial vignette effect using overlapping gradients */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Dot texture overlay */}
      <View style={styles.textureOverlay} />

      {/* Center content */}
      <View style={styles.content}>
        {/* Glow behind logo — subtle amber halo */}
        <Animated.View style={[styles.glowContainer, glowStyle]}>
          <LinearGradient
            colors={['rgba(255,193,7,0.06)', 'rgba(255,193,7,0.03)', 'transparent']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={styles.glowGradient}
          />
          <LinearGradient
            colors={['rgba(255,193,7,0.05)', 'rgba(255,193,7,0.02)', 'transparent']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0, y: 0 }}
            style={styles.glowGradient}
          />
        </Animated.View>

        {/* Logo icon */}
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <RNImage
            source={require('../../assets/images/nexxos-logo-white.png')}
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
              fontFamily: Platform.select({
                ios: 'Montserrat-ExtraBold',
                android: 'Montserrat-ExtraBold',
                web: 'Montserrat-ExtraBold',
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
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: '#FFFFFF',
    // Subtle noise effect via background pattern
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: LOGO_SIZE * 3,
    height: LOGO_SIZE * 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: LOGO_SIZE * 1.5,
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  brandText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 6,
    textShadowColor: 'rgba(255, 193, 7, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
