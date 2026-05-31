import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/contexts/ThemeContext';
import { Spacing, BorderRadius } from '../src/theme/colors';
import type { ThemeColors } from '../src/theme/colors';
import { getVisiblePlans, getVendorPlan } from '../src/services/vendor';
import type { PlanListItem } from '../src/services/vendor';
import type { VendorPlanInfo } from '../src/types';

const PLAN_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  gratuito: 'leaf-outline',
  beta: 'flash-outline',
  pro: 'rocket-outline',
  premium: 'diamond-outline',
};

const PLAN_COLORS: Record<string, string> = {
  gratuito: '#4CAF50',
  beta: '#FFC107',
  pro: '#2196F3',
  premium: '#7C3AED',
};

/** Parse beneficios JSON string from API, fallback to description */
function parseBeneficios(plan: PlanListItem): string[] {
  if (plan?.beneficios) {
    try {
      const parsed = JSON.parse(plan.beneficios);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fallback */ }
  }
  // Fallback: show description if no beneficios set
  return plan?.description ? [plan.description] : [];
}

export default function PlansScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [currentPlan, setCurrentPlan] = useState<VendorPlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          const [plansList, myPlan] = await Promise.all([
            getVisiblePlans().catch(() => []),
            getVendorPlan().catch(() => null),
          ]);
          if (!cancelled) {
            setPlans(plansList ?? []);
            setCurrentPlan(myPlan ?? null);
          }
        } catch { /* handled */ }
        if (!cancelled) setLoading(false);
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const currentSlug = currentPlan?.plan?.slug ?? '';

  const handleSelectPlan = (plan: PlanListItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light)?.catch?.(() => {});
    }
    router.push({
      pathname: '/payment-info',
      params: {
        planId: plan?.id ?? '',
        planName: plan?.name ?? '',
        planSlug: plan?.slug ?? '',
        precioMensual: String(plan?.precioMensual ?? 0),
        precioAnual: String(plan?.precioAnual ?? 0),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Planes Disponibles</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : plans?.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="pricetag-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No hay planes disponibles en este momento</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Check if vendor already has the best plan (only their current plan is shown) */}
          {plans?.length === 1 && currentSlug && plans[0]?.slug === currentSlug ? (
            <View style={styles.bestPlanCard}>
              <Ionicons name="trophy" size={36} color="#F59E0B" />
              <Text style={styles.bestPlanTitle}>¡Ya tienes el mejor plan!</Text>
              <Text style={styles.bestPlanSubtitle}>
                No hay planes superiores disponibles. Disfruta de todos los beneficios de tu Plan {plans[0]?.name ?? ''}.
              </Text>
            </View>
          ) : (
            <Text style={styles.subtitle}>
              Elige el plan que mejor se adapte a tu negocio
            </Text>
          )}

          {(plans ?? []).map((plan) => {
            const slug = plan?.slug ?? '';
            const isCurrent = slug === currentSlug;
            const isPaid = (plan?.precioMensual ?? 0) > 0 || (plan?.precioAnual ?? 0) > 0;
            const isUnlimited = (plan?.solicitudesMensuales ?? 0) === -1;
            const color = PLAN_COLORS[slug] ?? colors.primary;
            const icon = PLAN_ICONS[slug] ?? 'pricetag-outline';
            const features = parseBeneficios(plan);

            return (
              <View
                key={plan?.id ?? slug}
                style={[
                  styles.planCard,
                  isCurrent && { borderColor: color, borderWidth: 2 },
                ]}
              >
                {/* Popular badge for Pro */}
                {slug === 'pro' ? (
                  <View style={[styles.popularBadge, { backgroundColor: color }]}>
                    <Text style={styles.popularText}>Más Popular</Text>
                  </View>
                ) : null}

                {/* Plan header */}
                <View style={styles.planHeader}>
                  <View style={[styles.planIconCircle, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={24} color={color} />
                  </View>
                  <View style={styles.planNameCol}>
                    <Text style={styles.planName}>{plan?.name ?? ''}</Text>
                    <Text style={styles.planDesc}>{plan?.description ?? ''}</Text>
                  </View>
                </View>

                {/* Price */}
                <View style={styles.priceRow}>
                  {isPaid ? (
                    <>
                      <Text style={styles.priceAmount}>
                        ${(plan?.precioMensual ?? 0).toFixed?.(2) ?? '0.00'}
                      </Text>
                      <Text style={styles.pricePeriod}>/mes</Text>
                      {(plan?.precioAnual ?? 0) > 0 ? (
                        <Text style={styles.annualPrice}>
                          (${(plan?.precioAnual ?? 0).toFixed?.(2) ?? '0.00'}/año)
                        </Text>
                      ) : null}
                    </>
                  ) : (
                    <Text style={styles.priceAmount}>Gratis</Text>
                  )}
                </View>

                {/* Features */}
                <View style={styles.featuresList}>
                  {(features ?? []).map((feat, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={18} color={color} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                  {isUnlimited ? (
                    <View style={styles.featureRow}>
                      <Ionicons name="infinite" size={18} color={color} />
                      <Text style={styles.featureText}>Solicitudes ilimitadas</Text>
                    </View>
                  ) : null}
                </View>

                {/* Action button */}
                {isCurrent ? (
                  <View style={[styles.currentBadge, { backgroundColor: color + '15' }]}>
                    <Ionicons name="checkmark-circle" size={18} color={color} />
                    <Text style={[styles.currentText, { color }]}>Plan Actual</Text>
                  </View>
                ) : isPaid ? (
                  <Pressable
                    onPress={() => handleSelectPlan(plan)}
                    style={({ pressed }) => [
                      styles.selectBtn,
                      { backgroundColor: pressed ? color + 'CC' : color },
                    ]}
                  >
                    <Text style={styles.selectBtnText}>Seleccionar Plan</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </Pressable>
                ) : (
                  <View style={[styles.currentBadge, { backgroundColor: colors.border + '30' }]}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                    <Text style={[styles.currentText, { color: colors.textSecondary }]}>Asignado automáticamente</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
    textAlign: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 15, color: c.textSecondary, textAlign: 'center', marginTop: 12 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  subtitle: {
    fontSize: 15,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  bestPlanCard: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#F59E0B40',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  bestPlanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
    marginTop: 10,
  },
  bestPlanSubtitle: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  popularText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  planNameCol: { flex: 1 },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
  },
  planDesc: {
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: c.textPrimary,
  },
  pricePeriod: {
    fontSize: 15,
    color: c.textSecondary,
    marginLeft: 4,
  },
  annualPrice: {
    fontSize: 13,
    color: c.textSecondary,
    marginLeft: 8,
  },
  featuresList: { marginBottom: 16 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: c.textPrimary,
    flex: 1,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  selectBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  currentText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
