import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getRequests } from '../../src/services/requests';
import { Spacing, BorderRadius } from '../../src/theme/colors';
import type { ThemeColors } from '../../src/theme/colors';
import RequestCard from '../../src/components/RequestCard';
import EmptyState from '../../src/components/EmptyState';
import LoadingSpinner from '../../src/components/LoadingSpinner';
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

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getRequests({ limit: 5 });
      setRequests(data?.items ?? []);
    } catch { }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

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
      <View style={styles.banner}>
        <Ionicons name="megaphone-outline" size={28} color={colors.accent} />
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
            partCategory={item?.partCategory ?? ''}
            status={item?.status ?? ''}
            responseCount={item?.responseCount ?? 0}
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
