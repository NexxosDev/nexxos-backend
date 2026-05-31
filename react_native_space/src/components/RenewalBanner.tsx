import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, Spacing } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import type { VendorPlanInfo } from '../types';

interface Props {
  planInfo: VendorPlanInfo | null;
}

export default function RenewalBanner({ planInfo }: Props) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const showWarning = planInfo?.subscription?.showRenewalWarning === true;
  if (!showWarning) return null;

  const daysRemaining = planInfo?.subscription?.daysRemaining ?? 0;
  const planName = planInfo?.plan?.name ?? 'Tu plan';
  const planSlug = planInfo?.plan?.slug ?? '';
  const precioMensual = planInfo?.plan?.precioMensual ?? 0;
  const precioAnual = planInfo?.plan?.precioAnual ?? 0;

  const isUrgent = daysRemaining <= 2;
  const bannerColor = isUrgent ? '#DC2626' : '#F59E0B';
  const emoji = isUrgent ? '🚨' : '⚠️';
  const dayText = daysRemaining === 0
    ? 'hoy'
    : daysRemaining === 1
      ? 'mañana'
      : `en ${daysRemaining} días`;

  const handleRenew = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light)?.catch?.(() => {});
    }
    router.push({
      pathname: '/payment-info',
      params: {
        planId: planInfo?.plan?.id ?? '',
        planName,
        planSlug,
        precioMensual: String(precioMensual),
        precioAnual: String(precioAnual),
      },
    });
  };

  return (
    <View style={[styles.banner, { borderColor: bannerColor, backgroundColor: bannerColor + '10' }]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerEmoji}>{emoji}</Text>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerTitle}>
            Tu Plan {planName} vence {dayText}
          </Text>
          <Text style={styles.bannerSubtitle}>
            ¡Renueva ahora para no perder tus beneficios!
          </Text>
        </View>
      </View>
      <Pressable
        onPress={handleRenew}
        style={({ pressed }) => [
          styles.renewBtn,
          { backgroundColor: pressed ? bannerColor + 'CC' : bannerColor },
        ]}
      >
        <Ionicons name="refresh-outline" size={16} color="#FFF" />
        <Text style={styles.renewBtnText}>Renovar Plan</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (c: ThemeColors, _isDark: boolean) =>
  StyleSheet.create({
    banner: {
      borderWidth: 1.5,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    bannerContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 12,
    },
    bannerEmoji: {
      fontSize: 22,
      marginTop: 1,
    },
    bannerTextCol: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: c.textPrimary,
    },
    bannerSubtitle: {
      fontSize: 13,
      color: c.textSecondary,
      marginTop: 2,
    },
    renewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: BorderRadius.sm ?? 8,
      gap: 6,
    },
    renewBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFF',
    },
  });
