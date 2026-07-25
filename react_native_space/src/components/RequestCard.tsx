import React, { useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import Badge from './Badge';
import BrandLogo from './BrandLogo';
import ClientLevelBadge from './ClientLevelBadge';
import type { ClientLevel } from '../types';

interface RequestCardProps {
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear?: number | null;
  partCategory: string;
  status: string;
  responseCount?: number;
  hasRating?: boolean | null;
  municipality?: string;
  state?: string;
  createdAt: string;
  timeLabel?: string;
  timeLabelColor?: string;
  unreadCount?: number;
  clientName?: string;
  clientLevel?: ClientLevel;
  emphasizePending?: boolean;
  delivery?: { confirmed: boolean; isFree: boolean } | null;
  onPress?: () => void;
}

export default function RequestCard({
  vehicleBrand, vehicleModel, vehicleYear, partCategory, status,
  responseCount, hasRating, municipality, state, createdAt, timeLabel, timeLabelColor, unreadCount, clientName, clientLevel, emphasizePending, delivery, onPress,
}: RequestCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const isPendingEmphasis = (emphasizePending === true) && (status === 'PENDING');

  useEffect(() => {
    if (!isPendingEmphasis) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isPendingEmphasis, pulse]);

  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      return date?.toLocaleDateString?.('es-VE', { day: '2-digit', month: 'short' }) ?? '';
    } catch { return ''; }
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        style={[styles.card, isPendingEmphasis && styles.cardPending]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 3 }).start()}
        accessibilityRole="button"
      >
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <BrandLogo brandName={vehicleBrand ?? ''} size={28} />
          </View>
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>{vehicleBrand ?? ''} {vehicleModel ?? ''}{vehicleYear ? ` ${vehicleYear}` : ''}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{partCategory ?? ''}</Text>
            {(municipality || state) ? (
              <Text style={styles.location} numberOfLines={1}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                {' '}{municipality ?? ''}{state ? `, ${state}` : ''}
              </Text>
            ) : null}
            {clientName ? (
              <View style={styles.clientRow}>
                <Ionicons name="person-outline" size={11} color={colors.textSecondary} />
                <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
                {clientLevel ? <ClientLevelBadge level={clientLevel.level} emoji={clientLevel.emoji} label={clientLevel.label} size="small" /> : null}
              </View>
            ) : null}
          </View>
          <View style={styles.right}>
            {isPendingEmphasis ? (
              <Animated.View style={[styles.pendingBadge, { transform: [{ scale: pulse }] }]}>
                <Ionicons name="time" size={12} color={colors.white} />
                <Text style={styles.pendingBadgeText}>Pendiente</Text>
              </Animated.View>
            ) : (
              <Badge status={status ?? ''} size="small" />
            )}
            {hasRating === true ? (
              <View style={styles.ratingBadgeGreen}>
                <Ionicons name="checkmark-circle" size={11} color="#16A34A" />
                <Text style={styles.ratingBadgeGreenText}>Calificada</Text>
              </View>
            ) : hasRating === false ? (
              <View style={styles.ratingBadgeOrange}>
                <Ionicons name="star" size={11} color="#EA580C" />
                <Text style={styles.ratingBadgeOrangeText}>Sin calificar</Text>
              </View>
            ) : null}
            {typeof responseCount === 'number' ? (
              <Text style={styles.responses}>{responseCount} resp.</Text>
            ) : null}
            {delivery?.confirmed ? (
              <View style={[styles.motoBadge, { backgroundColor: delivery?.isFree ? 'rgba(27, 138, 58, 0.12)' : 'rgba(124, 58, 237, 0.12)' }]}>
                <MaterialCommunityIcons name="motorbike" size={16} color={delivery?.isFree ? '#1B8A3A' : '#7C3AED'} />
              </View>
            ) : null}
            <Text style={styles.date}>{formatDate(createdAt ?? '')}</Text>
            {(unreadCount ?? 0) > 0 ? (
              <View style={styles.unreadBadge}>
                <Ionicons name="chatbubble" size={12} color="#fff" />
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {timeLabel ? (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={13} color={timeLabelColor ?? colors.textSecondary} />
            <Text style={[styles.timeText, { color: timeLabelColor ?? colors.textSecondary }]} numberOfLines={1}>
              {timeLabel}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
    }),
  },
  cardPending: {
    borderColor: c.statusPending,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: { shadowColor: c.statusPending, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 7 },
      android: { elevation: 5 },
      default: { shadowColor: c.statusPending, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 7 },
    }),
  },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: c.statusPending, borderRadius: BorderRadius.full,
    paddingHorizontal: 9, paddingVertical: 3,
    ...Platform.select({
      ios: { shadowColor: c.statusPending, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 5 },
      android: { elevation: 4 },
      default: { shadowColor: c.statusPending, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 5 },
    }),
  },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: c.white },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  subtitle: { fontSize: 13, color: c.textSubtitle, marginTop: 2 },
  location: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  clientName: { fontSize: 11, color: c.textSecondary },
  right: { alignItems: 'flex-end', gap: 4 },
  responses: { fontSize: 11, color: c.textSecondary },
  motoBadge: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  date: { fontSize: 11, color: c.textSecondary },
  unreadBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#E53935', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 2,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  ratingBadgeGreen: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(22, 163, 74, 0.12)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  ratingBadgeGreenText: { fontSize: 10, fontWeight: '600', color: '#16A34A' },
  ratingBadgeOrange: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(234, 88, 12, 0.12)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  ratingBadgeOrangeText: { fontSize: 10, fontWeight: '600', color: '#EA580C' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.border },
  timeText: { fontSize: 12, marginLeft: 4, flex: 1 },
});
