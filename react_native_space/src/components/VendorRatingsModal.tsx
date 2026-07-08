import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import StarRating from './StarRating';
import { getVendorRatings } from '../services/vendor';
import type { VendorRatingItem } from '../services/vendor';
import { getErrorMessage } from '../services/api';

interface VendorRatingsModalProps {
  visible: boolean;
  onClose: () => void;
}

function formatRatingDate(d: string): string {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date?.toLocaleDateString?.('es-VE', { day: '2-digit', month: 'short' }) ?? '';
  } catch {
    return '';
  }
}

export default function VendorRatingsModal({ visible, onClose }: VendorRatingsModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.bottom), [colors, insets.bottom]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState<VendorRatingItem[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getVendorRatings(5);
      setRatings(res?.ratings ?? []);
      setAvgRating(typeof res?.avgRating === 'number' ? res.avgRating : null);
      setTotalRatings(res?.totalRatings ?? 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      load();
    }
  }, [visible, load]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.title}>Calificaciones</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {typeof avgRating === 'number' ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryAvg}>{avgRating?.toFixed?.(1) ?? '0'}</Text>
            <View style={{ marginLeft: 6 }}>
              <StarRating rating={Math.round(avgRating)} readonly size={16} />
              <Text style={styles.summaryCount}>{totalRatings} calificaci{totalRatings === 1 ? 'ón' : 'ones'}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Últimas calificaciones</Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable onPress={load} style={styles.retryBtn}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (ratings?.length ?? 0) === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="star-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Aún no tienes calificaciones</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {(ratings ?? []).map((r) => (
              <View key={r?.id} style={styles.ratingItem}>
                <View style={styles.ratingItemHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{r?.clientName?.[0]?.toUpperCase?.() ?? '?'}</Text>
                  </View>
                  <View style={styles.ratingItemInfo}>
                    <Text style={styles.clientName} numberOfLines={1}>{r?.clientName ?? 'Cliente'}</Text>
                    <StarRating rating={r?.rating ?? 0} readonly size={14} />
                  </View>
                  <Text style={styles.date}>{formatRatingDate(r?.createdAt ?? '')}</Text>
                </View>
                {r?.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (c: ThemeColors, bottomInset: number) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: c.overlay },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Math.max(bottomInset, 16) + 12,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: c.textPrimary,
  },
  closeBtn: {
    padding: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: c.backgroundSection,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  summaryAvg: {
    fontSize: 34,
    fontWeight: '800',
    color: c.textPrimary,
  },
  summaryCount: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSubtitle,
    marginBottom: Spacing.sm,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: `${c.primary}15`,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.primary,
  },
  list: {
    marginBottom: Spacing.sm,
  },
  ratingItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  ratingItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${c.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: c.primary,
  },
  ratingItemInfo: {
    flex: 1,
    gap: 3,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textPrimary,
  },
  date: {
    fontSize: 12,
    color: c.textSecondary,
  },
  comment: {
    fontSize: 14,
    color: c.textPrimary,
    lineHeight: 20,
    marginTop: Spacing.sm,
    marginLeft: 38 + Spacing.sm,
  },
});
