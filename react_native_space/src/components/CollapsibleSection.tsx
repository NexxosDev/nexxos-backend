import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../theme/colors';
import { Spacing, BorderRadius } from '../theme/colors';

interface CollapsibleSectionProps {
  icon: string;
  iconFamily?: 'ionicons' | 'material';
  iconColor?: string;
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function CollapsibleSection({
  icon, iconFamily = 'ionicons', iconColor, title, badge, defaultOpen = false, children, style,
}: CollapsibleSectionProps) {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useSharedValue(defaultOpen ? 180 : 0);

  const toggle = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !open;
    setOpen(next);
    rotation.value = withTiming(next ? 180 : 0, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, [open, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[s.container, style]}>
      <Pressable onPress={toggle} style={s.header}>
        <View style={s.headerLeft}>
          {iconFamily === 'material' ? (
            <MaterialCommunityIcons name={icon as any} size={20} color={iconColor ?? colors.primary} />
          ) : (
            <Ionicons name={icon as any} size={20} color={iconColor ?? colors.primary} />
          )}
          <Text style={s.headerTitle}>{title}</Text>
        </View>
        <View style={s.headerRight}>
          {badge ? <Text style={s.badge}>{badge}</Text> : null}
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </Animated.View>
        </View>
      </Pressable>
      {open ? (
        <View style={s.content}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
    backgroundColor: c.chipBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
});
