import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Switch, Pressable, RefreshControl, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendorDashboard, updateVendorAvailability, getVendorResponseMetrics, getVendorPlan } from '../../src/services/vendor';
import { useReactiveList } from '../../src/hooks/useReactiveList';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing, BorderRadius } from '../../src/theme/colors';
import type { ThemeColors } from '../../src/theme/colors';
import MetricCard from '../../src/components/MetricCard';
import RequestCard from '../../src/components/RequestCard';
import StarRating from '../../src/components/StarRating';
import EmptyState from '../../src/components/EmptyState';
import LoadingSpinner from '../../src/components/LoadingSpinner';
import UnreadBell from '../../src/components/UnreadBell';
import { useUnread } from '../../src/contexts/UnreadContext';
import type { VendorDashboard, VendorResponseMetrics, VendorPlanInfo } from '../../src/types';

function formatDuration(ms: number): string {
  if (ms < 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const totalMin = Math.floor(totalSec / 60);
  if (totalMin < 60) return `${totalMin}min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
}

export default function VendorHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { byRequestId } = useUnread();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [dashboard, setDashboard] = useState<VendorDashboard | null>(null);
  const [responseMetrics, setResponseMetrics] = useState<VendorResponseMetrics | null>(null);
  const [planInfo, setPlanInfo] = useState<VendorPlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [focused, setFocused] = useState(false);

  const getTimeInfo = useCallback((item: VendorDashboard['recentRequests'][number]): { label: string; color: string } => {
    const delivered = item?.deliveredAt ? new Date(item.deliveredAt).getTime() : 0;
    const now = Date.now();
    switch (item?.status) {
      case 'PENDING': {
        if (!delivered) return { label: 'Pendiente', color: '#F57C00' };
        const elapsed = now - delivered;
        return { label: `⏳ Sin responder · ${formatDuration(elapsed)}`, color: '#F57C00' };
      }
      case 'RESPONDED': {
        const responded = item?.respondedAt ? new Date(item.respondedAt).getTime() : 0;
        if (!delivered || !responded) return { label: '✅ Respondida', color: colors.success };
        const delta = responded - delivered;
        return { label: `✅ Respondida en ${formatDuration(delta)}`, color: colors.success };
      }
      case 'DECLINED': {
        const declined = item?.declinedAt ? new Date(item.declinedAt).getTime() : 0;
        if (!delivered || !declined) return { label: '✖ Declinada', color: colors.error };
        const delta = declined - delivered;
        return { label: `✖ Declinada en ${formatDuration(delta)}`, color: colors.error };
      }
      case 'CERRADA': {
        if (item?.responded && item?.respondedAt && delivered) {
          const delta = new Date(item.respondedAt).getTime() - delivered;
          return { label: `🔒 Cerrada · Respondida en ${formatDuration(delta)}`, color: colors.textSecondary };
        }
        if (item?.declined && item?.declinedAt && delivered) {
          const delta = new Date(item.declinedAt).getTime() - delivered;
          return { label: `🔒 Cerrada · Declinada en ${formatDuration(delta)}`, color: colors.textSecondary };
        }
        return { label: '🔒 Cerrada · No respondida', color: colors.textSecondary };
      }
      default:
        return { label: '', color: colors.textSecondary };
    }
  }, [colors]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [dashData, metricsData, planData] = await Promise.all([
        getVendorDashboard(),
        getVendorResponseMetrics().catch(() => null),
        getVendorPlan().catch(() => null),
      ]);
      setDashboard(dashData ?? null);
      setResponseMetrics(metricsData ?? null);
      setPlanInfo(planData ?? null);
    } catch { }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    setFocused(true);
    fetchData();
    return () => setFocused(false);
  }, [fetchData]));

  useReactiveList({
    onRefresh: () => fetchData(true),
    pollingInterval: 30000,
    notificationTypes: ['NEW_REQUEST', 'REQUEST_CLOSED'],
    enabled: focused,
  });

  // Re-fetch when unread counts change (new message → order may shift)
  const prevUnreadRef = useRef<string>('');
  useEffect(() => {
    const key = JSON.stringify(byRequestId ?? {});
    if (prevUnreadRef.current && prevUnreadRef.current !== key) {
      fetchData(true);
    }
    prevUnreadRef.current = key;
  }, [byRequestId]);

  const handleToggle = async (val: boolean) => {
    setToggling(true);
    try {
      await updateVendorAvailability(val);
      setDashboard((prev) => prev ? { ...prev, isAvailable: val } : prev);
    } catch { }
    setToggling(false);
  };

  const reqs = dashboard?.recentRequests ?? [];

  const renderFooter = useCallback(() => {
    if ((reqs?.length ?? 0) === 0) return null;
    return (
      <Pressable style={styles.loadMoreBtn} onPress={() => router.push('/vendor/requests')}>
        <Ionicons name="chevron-down-circle-outline" size={20} color={colors.textPrimary} />
        <Text style={styles.loadMoreText}>Ver más solicitudes</Text>
      </Pressable>
    );
  }, [reqs?.length, styles, colors, router]);

  if (loading) return <LoadingSpinner />;

  const metrics = dashboard?.metrics;

  const renderHeader = () => (
    <View>
      <View style={styles.topBar}>
        <Text style={styles.logo}>NEXXOS</Text>
        <View style={styles.topBarRight}>
          <UnreadBell />
          <Pressable onPress={() => router.replace('/role-selection')} hitSlop={8}>
            <Ionicons name="swap-horizontal-outline" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {!user?.emailVerified && (
        <Pressable style={styles.verifyBanner} onPress={() => router.push('/verify-email')}>
          <Ionicons name="warning-outline" size={20} color={colors.warningBoxText} />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.verifyBannerTitle}>Verifica tu correo electrónico</Text>
            <Text style={styles.verifyBannerText}>No podrás responder solicitudes hasta que verifiques tu correo.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.warningBoxText} />
        </Pressable>
      )}

      {/* Plan expiration warning banner (≤15 days) */}
      {planInfo?.plan?.slug === 'beta' && (planInfo?.subscription?.daysRemaining ?? 999) <= 15 && (planInfo?.subscription?.daysRemaining ?? 0) > 0 ? (
        <View style={styles.planBanner}>
          <Text style={styles.planBannerText}>
            ⏳ Tu Plan Beta vence en {planInfo?.subscription?.daysRemaining ?? 0} {(planInfo?.subscription?.daysRemaining ?? 0) === 1 ? 'día' : 'días'}. Pronto te informaremos sobre los planes disponibles.
          </Text>
        </View>
      ) : null}

      {/* Plan expired banner */}
      {planInfo?.subscription?.estado === 'GRACE_PERIOD' ? (
        <View style={[styles.planBanner, { borderLeftColor: colors.error, backgroundColor: colors.errorBg }]}>
          <Text style={[styles.planBannerText, { color: colors.error }]}>
            ⚠️ Tu Plan Beta ha expirado. Estás en período de gracia. Pronto te informaremos sobre los planes disponibles.
          </Text>
        </View>
      ) : null}

      {/* Monthly limit reached banner */}
      {planInfo?.monthlyRequests && (planInfo?.monthlyRequests?.limit ?? -1) !== -1 && (planInfo?.monthlyRequests?.count ?? 0) >= (planInfo?.monthlyRequests?.limit ?? 0) && (planInfo?.monthlyRequests?.limit ?? 0) > 0 ? (
        <View style={[styles.planBanner, { borderLeftColor: colors.error, backgroundColor: colors.errorBg }]}>
          <Text style={[styles.planBannerText, { color: colors.error }]}>
            🚫 Has alcanzado el límite de {planInfo?.monthlyRequests?.limit ?? 0} solicitudes mensuales. No recibirás nuevas solicitudes hasta el próximo mes.
          </Text>
        </View>
      ) : null}

      <Text style={styles.greeting}>¡Hola, {dashboard?.businessName ?? 'Vendedor'}!</Text>

      <View style={styles.availRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.availLabel}>Disponible para recibir solicitudes</Text>
        </View>
        <Switch
          value={dashboard?.isAvailable ?? false}
          onValueChange={handleToggle}
          disabled={toggling}
          trackColor={{ false: colors.border, true: colors.success }}
          thumbColor={colors.white}
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard label="Recibidas" value={metrics?.totalRequestsReceived ?? 0} icon="mail-outline" />
        <View style={{ width: Spacing.sm }} />
        <MetricCard label="Respondidas" value={metrics?.totalRequestsAnswered ?? 0} icon="checkmark-circle-outline" color={colors.success} />
      </View>

      {typeof metrics?.avgRating === 'number' ? (
        <View style={styles.ratingContainer}>
          <StarRating rating={Math.round(metrics.avgRating)} readonly size={20} />
          <Text style={styles.ratingText}>{metrics?.avgRating?.toFixed?.(1) ?? '0'} ({metrics?.totalRatings ?? 0} calificaciones)</Text>
        </View>
      ) : null}

      {responseMetrics ? (
        <View style={styles.responseMetricsCard}>
          <View style={styles.rmHeader}>
            <Ionicons name="speedometer-outline" size={18} color={colors.primary} />
            <Text style={styles.rmTitle}>Tiempos de Respuesta</Text>
          </View>
          <View style={styles.rmGrid}>
            <View style={styles.rmItem}>
              <Text style={styles.rmValue}>{responseMetrics?.avgResponseTimeMs != null ? formatDuration(responseMetrics.avgResponseTimeMs) : '—'}</Text>
              <Text style={styles.rmLabel}>Promedio</Text>
            </View>
            <View style={styles.rmDivider} />
            <View style={styles.rmItem}>
              <Text style={styles.rmValue}>{responseMetrics?.medianResponseTimeMs != null ? formatDuration(responseMetrics.medianResponseTimeMs) : '—'}</Text>
              <Text style={styles.rmLabel}>Mediana</Text>
            </View>
            <View style={styles.rmDivider} />
            <View style={styles.rmItem}>
              <Text style={styles.rmValue}>{responseMetrics?.fastestResponseTimeMs != null ? formatDuration(responseMetrics.fastestResponseTimeMs) : '—'}</Text>
              <Text style={styles.rmLabel}>Más rápida</Text>
            </View>
          </View>
          <View style={styles.rmFooter}>
            <View style={styles.rmFooterItem}>
              <Ionicons name="trending-up-outline" size={14} color={colors.success} />
              <Text style={styles.rmFooterText}>
                Tasa de respuesta: <Text style={{ fontWeight: '700', color: colors.success }}>{responseMetrics?.responseRate ?? 0}%</Text>
              </Text>
            </View>
            <Text style={styles.rmFooterSub}>{responseMetrics?.totalResponded ?? 0} de {responseMetrics?.totalReceived ?? 0} solicitudes</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Solicitudes Recientes</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={reqs}
        keyExtractor={(item) => item?.matchId ?? ''}
        renderItem={({ item }) => {
          const timeInfo = getTimeInfo(item);
          return (
            <RequestCard
              vehicleBrand={item?.request?.vehicleBrand ?? ''}
              vehicleModel={item?.request?.vehicleModel ?? ''}
              partCategory={item?.request?.partCategory ?? ''}
              status={item?.status ?? ''}
              municipality={item?.request?.municipality}
              state={item?.request?.state}
              createdAt={item?.request?.createdAt ?? ''}
              unreadCount={byRequestId?.[item?.request?.id ?? ''] ?? 0}
              timeLabel={timeInfo?.label}
              timeLabelColor={timeInfo?.color}
              onPress={() => router.push(`/vendor-request-detail?matchId=${item?.matchId ?? ''}`)}
            />
          );
        }}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={<EmptyState icon="mail-outline" title="Sin solicitudes" message="Aún no has recibido solicitudes" />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} />}
      />
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  list: { padding: Spacing.md, paddingBottom: 100 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontSize: 22, fontWeight: '800', color: c.primary, letterSpacing: 2 },
  verifyBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: c.warningBg,
    borderLeftWidth: 4, borderLeftColor: c.warning, borderRadius: BorderRadius.sm,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  verifyBannerTitle: { fontSize: 14, fontWeight: '600', color: c.warningBoxText, marginBottom: 2 },
  verifyBannerText: { fontSize: 13, color: c.warningBoxText },
  greeting: { fontSize: 22, fontWeight: '700', color: c.textPrimary, marginBottom: Spacing.md },
  availRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: c.border,
  },
  availLabel: { fontSize: 14, color: c.textPrimary, fontWeight: '500' },
  metricsRow: { flexDirection: 'row', marginBottom: Spacing.md },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  ratingText: { fontSize: 14, color: c.textSecondary },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: c.textPrimary, marginBottom: Spacing.md },
  responseMetricsCard: {
    backgroundColor: c.cardBg, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: c.border, marginBottom: Spacing.md, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  rmHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  rmTitle: { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginLeft: Spacing.sm },
  rmGrid: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  rmItem: { flex: 1, alignItems: 'center' },
  rmDivider: { width: 1, backgroundColor: c.border, marginVertical: 2 },
  rmValue: { fontSize: 18, fontWeight: '700', color: c.textPrimary, marginBottom: 2 },
  rmLabel: { fontSize: 11, color: c.textSecondary },
  rmFooter: {
    borderTopWidth: 1, borderTopColor: c.border, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, backgroundColor: c.backgroundSection,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  rmFooterItem: { flexDirection: 'row', alignItems: 'center' },
  rmFooterText: { fontSize: 13, color: c.textPrimary, marginLeft: 4 },
  rmFooterSub: { fontSize: 11, color: c.textSecondary },
  loadMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, marginTop: 4, borderRadius: BorderRadius.md, backgroundColor: c.surface },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  planBanner: {
    backgroundColor: c.warningBg,
    borderLeftWidth: 4,
    borderLeftColor: c.warning,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  planBannerText: {
    fontSize: 13,
    color: c.warningBoxText,
    lineHeight: 19,
  },
});
