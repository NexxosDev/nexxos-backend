import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getRequests } from '../../src/services/requests';
import { Spacing, BorderRadius } from '../../src/theme/colors';
import type { ThemeColors } from '../../src/theme/colors';
import RequestCard from '../../src/components/RequestCard';
import EmptyState from '../../src/components/EmptyState';
import LoadingSpinner from '../../src/components/LoadingSpinner';
import { useUnread } from '../../src/contexts/UnreadContext';
import type { RequestListItem } from '../../src/types';

type FilterType = 'all' | 'no_response' | 'has_response' | 'closed';

export default function ClientRequests() {
  const router = useRouter();
  const { colors } = useTheme();
  const { byRequestId } = useUnread();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filter === 'closed') params.status = 'CERRADA';
      if (filter === 'no_response') params.hasResponses = false;
      if (filter === 'has_response') params.hasResponses = true;
      const data = await getRequests(params as Parameters<typeof getRequests>[0]);
      setRequests(data?.items ?? []);
    } catch { }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [filter]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'no_response', label: 'Sin Respuesta' },
    { key: 'has_response', label: 'Con Respuestas' },
    { key: 'closed', label: 'Cerradas' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Mis Solicitudes</Text>
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
          data={requests ?? []}
          keyExtractor={(item) => item?.id ?? ''}
          renderItem={({ item }) => (
            <RequestCard
              vehicleBrand={item?.vehicleBrand ?? ''}
              vehicleModel={item?.vehicleModel ?? ''}
              partCategory={item?.partCategory ?? ''}
              status={item?.status ?? ''}
              responseCount={item?.responseCount ?? 0}
              createdAt={item?.createdAt ?? ''}
              unreadCount={byRequestId?.[item?.id ?? ''] ?? 0}
              onPress={() => router.push(`/request-detail?id=${item?.id ?? ''}`)}
            />
          )}
          ListEmptyComponent={<EmptyState icon="mail-outline" title="Sin solicitudes" message="No se encontraron solicitudes con este filtro" />}
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
});
