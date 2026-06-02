import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export default function MetricCard({ label, value, icon, color }: MetricCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const c = color ?? colors.primary;

  return (
    <View style={styles.card}>
      <View style={[styles.iconBg, { backgroundColor: `${c}20` }]}>
        <Ionicons name={icon} size={20} color={c} />
      </View>
      <Text style={styles.value}>{value ?? 0}</Text>
      <Text style={styles.label} numberOfLines={2}>{label ?? ''}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  iconBg: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: 1 },
  label: { fontSize: 11, color: c.textSecondary, textAlign: 'center' },
});
