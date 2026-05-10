import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import Badge from './Badge';
import BrandLogo from './BrandLogo';

interface RequestCardProps {
  vehicleBrand: string;
  vehicleModel: string;
  partCategory: string;
  status: string;
  responseCount?: number;
  municipality?: string;
  state?: string;
  createdAt: string;
  timeLabel?: string;
  timeLabelColor?: string;
  unreadCount?: number;
  onPress?: () => void;
}

export default function RequestCard({
  vehicleBrand, vehicleModel, partCategory, status,
  responseCount, municipality, state, createdAt, timeLabel, timeLabelColor, unreadCount, onPress,
}: RequestCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;

  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      return date?.toLocaleDateString?.('es-VE', { day: '2-digit', month: 'short' }) ?? '';
    } catch { return ''; }
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        style={styles.card}
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
            <Text style={styles.title} numberOfLines={1}>{vehicleBrand ?? ''} {vehicleModel ?? ''}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{partCategory ?? ''}</Text>
            {(municipality || state) ? (
              <Text style={styles.location} numberOfLines={1}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                {' '}{municipality ?? ''}{state ? `, ${state}` : ''}
              </Text>
            ) : null}
          </View>
          <View style={styles.right}>
            <Badge status={status ?? ''} size="small" />
            {typeof responseCount === 'number' ? (
              <Text style={styles.responses}>{responseCount} resp.</Text>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  subtitle: { fontSize: 13, color: c.textSubtitle, marginTop: 2 },
  location: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  responses: { fontSize: 11, color: c.textSecondary },
  date: { fontSize: 11, color: c.textSecondary },
  unreadBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#E53935', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 2,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.border },
  timeText: { fontSize: 12, marginLeft: 4, flex: 1 },
});
