import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../theme/colors';
import Button from './Button';

interface ResponseCardProps {
  businessName: string;
  avgRating?: number | null;
  initialMessage: string;
  onOpenChat?: () => void;
}

export default function ResponseCard({ businessName, avgRating, initialMessage, onOpenChat }: ResponseCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{businessName ?? ''}</Text>
          {typeof avgRating === 'number' ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={Colors.primary} />
              <Text style={styles.rating}>{avgRating?.toFixed?.(1) ?? '0'}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.message} numberOfLines={2}>{initialMessage ?? ''}</Text>
      {onOpenChat ? <Button title="Abrir Chat" variant="secondary" onPress={onOpenChat} style={styles.chatBtn} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.backgroundSection,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.sm,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  rating: { fontSize: 12, color: Colors.textSecondary },
  message: { fontSize: 13, color: Colors.textSubtitle, marginBottom: Spacing.sm, lineHeight: 18 },
  chatBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: Spacing.md },
});
