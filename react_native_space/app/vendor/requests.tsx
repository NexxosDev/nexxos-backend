import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVendorRequests } from '../../src/services/vendor';
import { useReactiveList } from '../../src/hooks/useReactiveList';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing, BorderRadius } from '../../src/theme/colors';
import type { ThemeColors } from '../../src/theme/colors';
import RequestCard from '../../src/components/RequestCard';
import EmptyState from '../../src/components/EmptyState';
import LoadingSpinner from '../../src/components/LoadingSpinner';
import { useUnread } from '../../src/contexts/UnreadContext';
import type { VendorRequestListItem } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

const PAGE_SIZE = 20;

type VFilter = 'all' | 'PENDING' | 'RESPONDED' | 'DECLINED';

export default function VendorRequests() {
  const router = useRouter();
  const { colors } = useTheme();
  const { byRequestId } = useUnread();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [items, setItems] = useState<VendorRequestListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<VFilter>('all');
  const [focused, setFocused] = useState(false);

  const hasMore = (items?.length ?? 0) < total;

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else if (!items?.length) setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: PAGE_SIZE, offset: 0 };
      if (filter !== 'all') params.status = filter;
      const data = await getVendorRequests(params as Parameters<typeof getVendorRequests>[0]);
      setItems(data?.items ?? []);
      setTotal(data?.total ?? 0);
    } catch { }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [filter]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params: Record<string, unknown> = { limit: PAGE_SIZE, offset: items?.length ?? 0 };
      if (filter !== 'all') params.status = filter;
      const data = await getVendorRequests(params as Parameters<typeof getVendorRequests>[0]);
      setItems(prev => [...(prev ?? []), ...(data?.items ?? [])]);
      setTotal(data?.total ?? 0);
    } catch { }
    setLoadingMore(false);
  }, [loadingMore, hasMore, filter, items?.length]);

  useFocusEffect(useCallback(() => {
    setFocused(true);
    fetchData();
    return () => setFocused(false);
  }, [fetchData]));

  useReactiveList({
    onRefresh: () => fetchData(false),
    pollingInterval: 30000,
    notificationTypes: ['NEW_REQUEST', 'REQUEST_CLOSED'],
    enabled: focused,
  });

  // Re-fetch list when unread counts change (new message → order may shift)
  const prevUnreadRef = useRef<string>('');
  useEffect(() => {
    const key = JSON.stringify(byRequestId ?? {});
    if (prevUnreadRef.current && prevUnreadRef.current !== key) {
      fetchData(true);
    }
    prevUnreadRef.current = key;
  }, [byRequestId]);

  const filters: { key: VFilter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'PENDING', label: 'Pendientes' },
    { key: 'RESPONDED', label: 'Respondidas' },
    { key: 'DECLINED', label: 'Declinadas' },
  ];

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerText}>Cargando más...</Text>
        </View>
      );
    }
    return (
      <Pressable style={styles.loadMoreBtn} onPress={loadMore}>
        <Ionicons name="chevron-down-circle-outline" size={20} color={colors.textPrimary} />
        <Text style={styles.loadMoreText}>Ver más solicitudes</Text>
      </Pressable>
    );
  }, [hasMore, loadingMore, loadMore, styles, colors]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Solicitudes</Text>
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((f) => (
            <Pressable key={f.key} style={[styles.filterChip, filter === f.key && styles.filterChipActive]} onPress={() => setFilter(f.key)}>
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {loading ? <LoadingSpinner /> : (
        <FlatList
          data={items ?? []}
          keyExtractor={(item) => item?.matchId ?? ''}
          renderItem={({ item }) => (
            <RequestCard
              vehicleBrand={item?.request?.vehicleBrand ?? ''}
              vehicleModel={item?.request?.vehicleModel ?? ''}
              partCategory={item?.request?.partCategory ?? ''}
              status={item?.status ?? ''}
              municipality={item?.request?.municipality}
              state={item?.request?.state}
              createdAt={item?.request?.createdAt ?? ''}
              unreadCount={byRequestId?.[item?.request?.id ?? ''] ?? 0}
              onPress={() => router.push(`/vendor-request-detail?matchId=${item?.matchId ?? ''}`)}
            />
          )}
          ListEmptyComponent={<EmptyState icon="mail-outline" title="Sin solicitudes" message="No hay solicitudes con este filtro" />}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  title: { fontSize: 22, fontWeight: '700', color: c.textPrimary, paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  filterContainer: { flexShrink: 0 },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: c.chipBg, marginRight: 8 },
  filterChipActive: { backgroundColor: c.primary },
  filterText: { fontSize: 13, color: c.textSubtitle },
  filterTextActive: { color: c.accent, fontWeight: '600' },
  list: { padding: Spacing.md, paddingBottom: 100 },
  footerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: 8 },
  footerText: { fontSize: 13, color: c.textSubtitle },
  loadMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, marginTop: 4, borderRadius: BorderRadius.md, backgroundColor: c.surface },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
});
