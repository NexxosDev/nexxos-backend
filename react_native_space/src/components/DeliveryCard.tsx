import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import type { DeliveryOrder } from '../types';

interface Props {
  order: DeliveryOrder;
  isVendor: boolean;
  busy?: boolean;
  onAdvance: (status: 'IN_TRANSIT' | 'DELIVERED') => void;
  onCancel: () => void;
}

const STEPS = [
  { key: 'CONFIRMED', label: 'Confirmado', icon: 'checkmark-circle' as const },
  { key: 'IN_TRANSIT', label: 'En camino', icon: 'bicycle' as const },
  { key: 'DELIVERED', label: 'Entregado', icon: 'cube' as const },
];

function stepIndex(status: string): number {
  if (status === 'CONFIRMED') return 0;
  if (status === 'IN_TRANSIT') return 1;
  if (status === 'DELIVERED') return 2;
  return -1;
}

export default function DeliveryCard({ order, isVendor, busy, onAdvance, onCancel }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const status = order?.status ?? '';
  const canceled = status === 'CANCELED';
  const delivered = status === 'DELIVERED';
  const idx = stepIndex(status);
  const currency = order?.currency ?? 'USD';
  const costLabel = order?.isFree ? 'Envío gratis' : `${currency} ${(order?.cost ?? 0).toFixed(2)}`;

  return (
    <View style={[styles.card, canceled && styles.cardCanceled]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {canceled ? (
            <Ionicons name="close-circle" size={18} color="#E53935" />
          ) : (
            <MaterialCommunityIcons name="motorbike" size={18} color={colors.primary} />
          )}
          <Text style={styles.title}>{canceled ? 'Envío cancelado' : 'Envío'}</Text>
        </View>
        <Text style={[styles.cost, order?.isFree && { color: '#1B8A3A' }]}>{costLabel}</Text>
      </View>

      {canceled ? (
        <Text style={styles.canceledText}>
          Cancelado por {order?.canceledBy === 'CLIENT' ? 'el cliente' : 'el vendedor'}.
        </Text>
      ) : (
        <View style={styles.timeline}>
          {STEPS.map((s, i) => {
            const done = idx >= i;
            const isLast = i === STEPS.length - 1;
            return (
              <React.Fragment key={s.key}>
                <View style={styles.stepCol}>
                  <View style={[styles.stepCircle, done && styles.stepCircleDone]}>
                    {s.key === 'IN_TRANSIT' ? (
                      <MaterialCommunityIcons name="motorbike" size={14} color={done ? colors.accent : colors.textSecondary} />
                    ) : (
                      <Ionicons name={s.icon} size={14} color={done ? colors.accent : colors.textSecondary} />
                    )}
                  </View>
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{s.label}</Text>
                </View>
                {!isLast ? <View style={[styles.stepLine, idx > i && styles.stepLineDone]} /> : null}
              </React.Fragment>
            );
          })}
        </View>
      )}

      {order?.dropoffAddress || (order?.dropoffLat != null && order?.dropoffLng != null) ? (
        <Pressable
          style={styles.addrRow}
          onPress={order?.dropoffLat != null && order?.dropoffLng != null ? () => {
            const url = `https://www.google.com/maps/search/?api=1&query=${order.dropoffLat},${order.dropoffLng}`;
            Linking.openURL(url).catch(() => {});
          } : undefined}
          disabled={order?.dropoffLat == null || order?.dropoffLng == null}
        >
          <Ionicons name="location-outline" size={13} color={colors.primary} />
          <Text style={styles.addrText} numberOfLines={2}>{order?.dropoffAddress || 'Ubicación GPS de entrega'}</Text>
          {order?.dropoffLat != null && order?.dropoffLng != null ? (
            <Ionicons name="open-outline" size={13} color={colors.primary} />
          ) : null}
        </Pressable>
      ) : null}

      {order?.notes ? (
        <View style={styles.addrRow}>
          <Ionicons name="reader-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.addrText} numberOfLines={2}>Ref: {order.notes}</Text>
        </View>
      ) : null}

      {!canceled && !delivered ? (
        <View style={styles.actions}>
          {isVendor && status === 'CONFIRMED' ? (
            <Pressable style={styles.primaryBtn} onPress={() => onAdvance('IN_TRANSIT')} disabled={busy}>
              {busy ? <ActivityIndicator size="small" color={colors.accent} /> : <Text style={styles.primaryBtnText}>Marcar en camino</Text>}
            </Pressable>
          ) : null}
          {isVendor && status === 'IN_TRANSIT' ? (
            <Pressable style={styles.primaryBtn} onPress={() => onAdvance('DELIVERED')} disabled={busy}>
              {busy ? <ActivityIndicator size="small" color={colors.accent} /> : <Text style={styles.primaryBtnText}>Marcar entregado</Text>}
            </Pressable>
          ) : null}
          <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={busy}>
            <Text style={styles.cancelBtnText}>Cancelar envío</Text>
          </Pressable>
        </View>
      ) : null}

      {delivered ? (
        <View style={styles.deliveredBanner}>
          <Ionicons name="checkmark-done" size={15} color="#1B8A3A" />
          <Text style={styles.deliveredText}>Envío entregado</Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: { backgroundColor: c.cardBg, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: c.primary, padding: Spacing.md, marginHorizontal: Spacing.sm, marginBottom: Spacing.sm },
  cardCanceled: { borderColor: c.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  cost: { fontSize: 14, fontWeight: '700', color: c.textPrimary },
  canceledText: { fontSize: 13, color: c.textSecondary, marginBottom: 4 },
  timeline: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  stepCol: { alignItems: 'center', width: 74 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.backgroundSection, borderWidth: 1, borderColor: c.border, justifyContent: 'center', alignItems: 'center' },
  stepCircleDone: { backgroundColor: c.primary, borderColor: c.primary },
  stepLabel: { fontSize: 11, color: c.textSecondary, marginTop: 4, textAlign: 'center' },
  stepLabelDone: { color: c.textPrimary, fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: c.border, marginBottom: 18 },
  stepLineDone: { backgroundColor: c.primary },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: Spacing.sm },
  addrText: { fontSize: 12, color: c.textSecondary, flex: 1 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  primaryBtn: { flex: 1, backgroundColor: c.primary, borderRadius: BorderRadius.sm, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 13, fontWeight: '700', color: c.accent },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#E53935', borderRadius: BorderRadius.sm, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#E53935' },
  deliveredBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  deliveredText: { fontSize: 13, fontWeight: '700', color: '#1B8A3A' },
});
