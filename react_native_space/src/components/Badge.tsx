import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';

interface BadgeProps {
  status: string;
  size?: 'small' | 'normal';
  emphasizePending?: boolean;
}

function getStatusConfig(c: ThemeColors): Record<string, { bg: string; text: string; label: string }> {
  return {
    ABIERTA: { bg: c.statusOpen, text: c.white, label: 'Abierta' },
    EN_PROCESO: { bg: c.statusInProgress, text: c.accent, label: 'En Proceso' },
    CERRADA: { bg: c.statusClosed, text: c.textSecondary, label: 'Cerrada' },
    PENDING: { bg: c.statusPending, text: c.white, label: 'Pendiente' },
    RESPONDED: { bg: c.statusResponded, text: c.white, label: 'Respondida' },
    DECLINED: { bg: c.statusDeclined, text: c.white, label: 'Declinada' },
  };
}

export default function Badge({ status, size = 'normal', emphasizePending }: BadgeProps) {
  const { colors } = useTheme();
  const configMap = useMemo(() => getStatusConfig(colors), [colors]);
  const config = configMap?.[status] ?? { bg: colors.border, text: colors.textSecondary, label: status ?? '' };
  const pulse = useRef(new Animated.Value(1)).current;
  const isPendingEmphasis = (emphasizePending === true) && (status === 'PENDING');

  useEffect(() => {
    if (!isPendingEmphasis) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isPendingEmphasis, pulse]);

  if (isPendingEmphasis) {
    return (
      <Animated.View
        style={[
          styles.badge,
          styles.pendingBadge,
          { backgroundColor: config.bg, shadowColor: colors.statusPending },
          size === 'small' && styles.small,
          { transform: [{ scale: pulse }] },
        ]}
      >
        <Ionicons name="time" size={size === 'small' ? 12 : 14} color={config.text} />
        <Text style={[styles.text, { color: config.text }, size === 'small' && styles.smallText]}>
          {config.label}
        </Text>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, size === 'small' && styles.small]}>
      <Text style={[styles.text, { color: config.text }, size === 'small' && styles.smallText]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 5 },
      android: { elevation: 4 },
      default: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 5 },
    }),
  },
  small: { paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: '600' },
  smallText: { fontSize: 10 },
});
