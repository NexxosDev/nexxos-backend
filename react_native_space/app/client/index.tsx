import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getRequests, getPendingRatings } from '../../src/services/requests';
import { getClientBanner } from '../../src/services/vendor';
import type { BannerSlide } from '../../src/services/vendor';
import { Spacing, BorderRadius } from '../../src/theme/colors';
import type { ThemeColors } from '../../src/theme/colors';
import RequestCard from '../../src/components/RequestCard';
import EmptyState from '../../src/components/EmptyState';
import LoadingSpinner from '../../src/components/LoadingSpinner';
import PromoCarousel from '../../src/components/PromoCarousel';
import UnreadBell from '../../src/components/UnreadBell';
import { useUnread } from '../../src/contexts/UnreadContext';
import type { RequestListItem } from '../../src/types';

export default function ClientHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { byRequestId } = useUnread();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRatingsCount, setPendingRatingsCount] = useState(0);
  const [banners, setBanners] = useState<BannerSlide[]>([]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [data, pendingData, bannerData] = await Promise.all([
        getRequests({ limit: 5 }),
        getPendingRatings().catch(() => ({ items: [], total: 0 })),
        getClientBanner().catch(() => []),
      ]);
      setRequests(data?.items ?? []);
      setPendingRatingsCount(pendingData?.total ?? 0);
      setBanners(bannerData ?? []);
    } catch { }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // Re-fetch when unread counts change (new message → order may shift)
  const prevUnreadRef = useRef<string>('');
  useEffect(() => {
    const key = JSON.stringify(byRequestId ?? {});
    if (prevUnreadRef.current && prevUnreadRef.current !== key) {
      fetchData(true);
    }
    prevUnreadRef.current = key;
  }, [byRequestId]);

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
      <Text style={styles.greeting}>¡Hola, {user?.firstName ?? 'Usuario'}!</Text>
      <Text style={styles.subtitle}>¿Qué necesitas hoy?</Text>
      <PromoCarousel slides={banners} horizontalPadding={Spacing.lg * 2} />
      {pendingRatingsCount > 0 ? (
        <Pressable style={styles.ratingBanner} onPress={() => router.push('/client/requests?status=CERRADA')}>
          <Ionicons name="star-outline" size={22} color={colors.primary} />
          <View style={styles.bannerContent}>
            <Text style={styles.ratingBannerTitle}>
              {pendingRatingsCount === 1 ? 'Tienes 1 calificación pendiente' : `Tienes ${pendingRatingsCount} calificaciones pendientes`}
            </Text>
            <Text style={styles.ratingBannerText}>¡Califica y gana puntos! ⭐</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      ) : null}
      <View style={styles.banner}>
        <Ionicons name="megaphone-outline" size={28} color={colors.textPrimary} />
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Encuentra repuestos rápido</Text>
          <Text style={styles.bannerText}>Crea una solicitud y recibe ofertas de vendedores cercanos</Text>
        </View>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mis Solicitudes Recientes</Text>
        {(requests?.length ?? 0) > 0 ? (
          <Pressable onPress={() => router.push('/client/requests')}>
            <Text style={styles.seeAll}>Ver todas ➡️</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={requests ?? []}
        keyExtractor={(item) => item?.id ?? ''}
        renderItem={({ item }) => (
          <RequestCard
            vehicleBrand={item?.vehicleBrand ?? ''}
            vehicleModel={item?.vehicleModel ?? ''}
            vehicleYear={item?.vehicleYear}
            partCategory={item?.partCategory ?? ''}
            status={item?.status ?? ''}
            responseCount={item?.responseCount ?? 0}
            hasRating={item?.hasRating ?? null}
            createdAt={item?.createdAt ?? ''}
            unreadCount={byRequestId?.[item?.id ?? ''] ?? 0}
            onPress={() => router.push(`/request-detail?id=${item?.id ?? ''}`)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Aún no tienes solicitudes"
            message="Crea tu primera solicitud para encontrar repuestos"
            actionLabel="Crear Solicitud"
            onAction={() => router.push('/create-request')}
          />
        }
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} />}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/create-request')} accessibilityLabel="Crear solicitud">
        <Ionicons name="add" size={28} color={colors.accent} />
      </Pressable>
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  list: { padding: Spacing.md, paddingBottom: 100 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontSize: 22, fontWeight: '800', color: c.primary, letterSpacing: 2 },
  greeting: { fontSize: 22, fontWeight: '700', color: c.textPrimary },
  subtitle: { fontSize: 15, color: c.textSecondary, marginTop: 2, marginBottom: Spacing.md },
  ratingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: `${c.primary}12`, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: `${c.primary}30`,
  },
  ratingBannerTitle: { fontSize: 14, fontWeight: '600', color: c.primary },
  ratingBannerText: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
  banner: {
    flexDirection: 'row', backgroundColor: c.backgroundSection, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.lg, alignItems: 'center', gap: Spacing.md,
    borderLeftWidth: 3, borderLeftColor: c.primary,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  bannerText: { fontSize: 13, color: c.textSubtitle, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: c.textPrimary },
  seeAll: { fontSize: 13, color: c.primary, fontWeight: '500' },
  fab: {
    position: 'absolute', bottom: 80, right: Spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 5,
  },
});
