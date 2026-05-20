import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import type { VendorPlanInfo } from '../types';

interface Props {
  planInfo: VendorPlanInfo | null;
}

function formatRemainingTime(days: number | null | undefined): string {
  if (days == null || days < 0) return '';
  if (days === 0) return 'Vence hoy';
  if (days > 30) {
    const months = Math.floor(days / 30);
    const remainDays = days % 30;
    if (remainDays === 0) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    return `${months} ${months === 1 ? 'mes' : 'meses'} y ${remainDays} ${remainDays === 1 ? 'día' : 'días'}`;
  }
  return `${days} ${days === 1 ? 'día' : 'días'}`;
}

export default function VendorPlanCard({ planInfo }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!planInfo?.plan || !planInfo?.subscription) return null;

  const { plan, subscription, monthlyRequests } = planInfo;
  const slug = plan?.slug ?? '';
  const daysRemaining = subscription?.daysRemaining;
  const isUnlimited = (monthlyRequests?.limit ?? 0) === -1;
  const usageCount = monthlyRequests?.count ?? 0;
  const usageLimit = monthlyRequests?.limit ?? 0;

  // Progress bar for limited plans
  const usagePercent = isUnlimited ? 0 : usageLimit > 0 ? Math.min(1, usageCount / usageLimit) : 0;
  const isLimitReached = !isUnlimited && usageLimit > 0 && usageCount >= usageLimit;

  // Badge color based on plan
  const badgeColor = slug === 'beta' ? '#FFC107' : slug === 'pro' ? '#4CAF50' : slug === 'premium' ? '#7C3AED' : colors.textSecondary;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Ionicons name="shield-checkmark" size={14} color="#121212" />
          <Text style={styles.badgeText}>Plan {plan?.name ?? ''}</Text>
        </View>
        {subscription?.estado === 'GRACE_PERIOD' ? (
          <View style={[styles.statusChip, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.statusChipText, { color: colors.error }]}>Período de gracia</Text>
          </View>
        ) : null}
      </View>

      {/* Remaining time */}
      {daysRemaining != null ? (
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            {daysRemaining === 0 ? 'Tu plan vence hoy' : `Vence en ${formatRemainingTime(daysRemaining)}`}
          </Text>
        </View>
      ) : null}

      {/* Monthly requests usage */}
      <View style={styles.usageSection}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageLabel}>Solicitudes este mes</Text>
          <Text style={styles.usageValue}>
            {isUnlimited ? `${usageCount} / ∞` : `${usageCount} / ${usageLimit}`}
          </Text>
        </View>
        {!isUnlimited ? (
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(usagePercent * 100)}%` as any,
                  backgroundColor: isLimitReached ? colors.error : usagePercent > 0.8 ? colors.warning : colors.success,
                },
              ]}
            />
          </View>
        ) : null}
        {isLimitReached ? (
          <Text style={[styles.limitText, { color: colors.error }]}>Has alcanzado el límite mensual de solicitudes</Text>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 13,
    color: c.textSecondary,
  },
  usageSection: {
    marginTop: 4,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  usageLabel: {
    fontSize: 13,
    color: c.textSecondary,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '700',
    color: c.textPrimary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: c.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  limitText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
});
