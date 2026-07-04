import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Image, Easing } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../theme/colors';

const logoYellow = require('../../assets/images/nexxos-logo-yellow.png');

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

/* ── Single bouncing dot ── */
function BouncingDot({ delay, color }: { delay: number; color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, t]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(t.value, [0, 1], [0, -10]) }],
    opacity: interpolate(t.value, [0, 1], [0.4, 1]),
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

/* ── Inline: three bouncing dots ── */
function DotsLoader({ color }: { color: string }) {
  return (
    <View style={styles.dotsRow}>
      <BouncingDot delay={0} color={color} />
      <BouncingDot delay={150} color={color} />
      <BouncingDot delay={300} color={color} />
    </View>
  );
}

/* ── Full screen: pulsing brand logo ── */
function LogoPulse() {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.55, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Image source={logoYellow} style={styles.logo} resizeMode="contain" />
    </Animated.View>
  );
}

export default function LoadingSpinner({ fullScreen = true }: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const containerStyle = useMemo(
    () => (fullScreen ? [styles.fullScreen, { backgroundColor: colors.background }] : styles.inline),
    [fullScreen, colors.background],
  );

  return (
    <View style={containerStyle}>
      {fullScreen ? (
        <>
          <LogoPulse />
          <View style={{ height: 20 }} />
          <DotsLoader color={colors.primary} />
        </>
      ) : (
        <DotsLoader color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inline: { padding: 24, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 120, height: 90 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
