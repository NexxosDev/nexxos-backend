import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import type { DeliveryOptionsResponse, DeliveryOption } from '../types';

interface Props {
  visible: boolean;
  data: DeliveryOptionsResponse | null;
  busy?: boolean;
  onConfirm: (option: DeliveryOption, dropoffAddress: string) => void;
  onClose: () => void;
}

export default function DeliveryOptionsSheet({ visible, data, busy, onConfirm, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState<number>(0);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (visible) {
      setSelected(0);
      setAddress(data?.dropoffAddress ?? '');
    }
  }, [visible, data?.dropoffAddress]);

  const options = data?.options ?? [];
  const currency = data?.currency ?? 'USD';
  const chosen = options?.[selected] ?? null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Ionicons name="bicycle-outline" size={22} color={colors.primary} />
            <Text style={styles.title}>Opciones de envío</Text>
          </View>
          {typeof data?.distanceKm === 'number' ? (
            <Text style={styles.distance}>Distancia aprox: {data.distanceKm} km</Text>
          ) : null}

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {options.length === 0 ? (
              <Text style={styles.empty}>Este vendedor no tiene opciones de envío disponibles en este momento.</Text>
            ) : (
              options.map((opt, idx) => {
                const active = idx === selected;
                return (
                  <Pressable key={`${opt?.provider}-${idx}`} style={[styles.option, active && styles.optionActive]} onPress={() => setSelected(idx)}>
                    <View style={styles.radioOuter}>
                      {active ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optLabel}>{opt?.label ?? 'Envío'}</Text>
                      <Text style={styles.optDesc}>{opt?.description ?? ''}</Text>
                    </View>
                    <Text style={[styles.optCost, opt?.isFree && { color: '#1B8A3A' }]}>
                      {opt?.isFree ? 'Gratis' : `${currency} ${(opt?.cost ?? 0).toFixed(2)}`}
                    </Text>
                  </Pressable>
                );
              })
            )}

            {options.length > 0 ? (
              <View style={styles.addrBlock}>
                <Text style={styles.addrLabel}>Dirección de entrega</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Escribe tu dirección de entrega"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.addrInput}
                  multiline
                />
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={busy}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            {options.length > 0 ? (
              <Pressable
                style={[styles.confirmBtn, (busy || !chosen) && { opacity: 0.6 }]}
                onPress={() => chosen && onConfirm(chosen, address.trim())}
                disabled={busy || !chosen}
              >
                {busy ? <ActivityIndicator size="small" color={colors.accent} /> : <Text style={styles.confirmText}>Confirmar envío</Text>}
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: c.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg } as any,
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  distance: { fontSize: 13, color: c.textSecondary, marginBottom: Spacing.sm },
  empty: { fontSize: 14, color: c.textSecondary, paddingVertical: Spacing.lg, textAlign: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: c.border, marginBottom: Spacing.sm },
  optionActive: { borderColor: c.primary, backgroundColor: c.backgroundSection },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.primary, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },
  optLabel: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  optDesc: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  optCost: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  addrBlock: { marginTop: Spacing.sm },
  addrLabel: { fontSize: 13, color: c.textSecondary, marginBottom: 6 },
  addrInput: { borderWidth: 1, borderColor: c.border, borderRadius: BorderRadius.sm, padding: 12, color: c.textPrimary, backgroundColor: c.backgroundSection, minHeight: 60, textAlignVertical: 'top', fontSize: 15 },
  footer: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: BorderRadius.md, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: c.accent },
});
