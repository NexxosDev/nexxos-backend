import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput, ActivityIndicator, Platform, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import type { DeliveryOptionsResponse, DeliveryOption } from '../types';

export interface DeliveryConfirmData {
  dropoffLat: number | null;
  dropoffLng: number | null;
  dropoffAddress: string;
  notes: string;
}

interface Props {
  visible: boolean;
  data: DeliveryOptionsResponse | null;
  busy?: boolean;
  onConfirm: (option: DeliveryOption, payload: DeliveryConfirmData) => void;
  onClose: () => void;
}

export default function DeliveryOptionsSheet({ visible, data, busy, onConfirm, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelected(0);
      setNotes('');
      setCoords(null);
      setAddress('');
      setLocating(false);
    }
  }, [visible]);

  const options = data?.options ?? [];
  const currency = data?.currency ?? 'USD';
  const chosen = options?.[selected] ?? null;
  const hasLocation = coords != null;

  const captureLocation = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ubicación', 'Necesitamos permiso de ubicación para registrar tu punto de entrega.');
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = loc?.coords?.latitude;
      const lng = loc?.coords?.longitude;
      if (lat == null || lng == null) {
        Alert.alert('Ubicación', 'No se pudo obtener tu ubicación. Intenta de nuevo.');
        setLocating(false);
        return;
      }
      setCoords({ lat, lng });
      // Intentar geocodificación inversa para mostrar una dirección legible
      let readable = '';
      try {
        const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const p = places?.[0];
        if (p) {
          readable = [p.street, p.name, p.district, p.city, p.region]
            .filter((x) => !!x)
            .filter((x, i, arr) => arr.indexOf(x) === i)
            .join(', ');
        }
      } catch {
        // Geocodificación no disponible (p. ej. web): usar coordenadas
      }
      setAddress(readable || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación. Verifica que el GPS esté activo.');
    } finally {
      setLocating(false);
    }
  }, [locating]);

  const openInMaps = useCallback(() => {
    if (!coords) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    Linking.openURL(url).catch(() => {});
  }, [coords]);

  const handleConfirm = useCallback(() => {
    if (!chosen) return;
    if (!coords) {
      Alert.alert('Ubicación de entrega', 'Por favor comparte tu ubicación GPS antes de confirmar el envío.');
      return;
    }
    onConfirm(chosen, {
      dropoffLat: coords.lat,
      dropoffLng: coords.lng,
      dropoffAddress: address?.trim?.() ?? '',
      notes: notes?.trim?.() ?? '',
    });
  }, [chosen, coords, address, notes, onConfirm]);

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

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
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
              <>
                {/* Ubicación de entrega por GPS */}
                <View style={styles.addrBlock}>
                  <Text style={styles.addrLabel}>Ubicación de entrega (GPS)</Text>
                  {hasLocation ? (
                    <View style={styles.locCard}>
                      <Ionicons name="location" size={20} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.locAddr} numberOfLines={2}>{address}</Text>
                        <Pressable onPress={openInMaps} hitSlop={6}>
                          <Text style={styles.locMapLink}>Ver en Google Maps</Text>
                        </Pressable>
                      </View>
                      <Pressable onPress={captureLocation} hitSlop={8} disabled={locating}>
                        {locating ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Ionicons name="refresh" size={20} color={colors.textSecondary} />
                        )}
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.gpsBtn} onPress={captureLocation} disabled={locating}>
                      {locating ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Ionicons name="navigate" size={18} color={colors.primary} />
                      )}
                      <Text style={styles.gpsBtnText}>{locating ? 'Obteniendo ubicación...' : 'Usar mi ubicación (GPS)'}</Text>
                    </Pressable>
                  )}
                </View>

                {/* Puntos de referencia */}
                <View style={styles.addrBlock}>
                  <Text style={styles.addrLabel}>Puntos de referencia (opcional)</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Ej: casa portón azul, al lado de la panadería, piso 3..."
                    placeholderTextColor={colors.textSecondary}
                    style={styles.addrInput}
                    multiline
                  />
                </View>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={busy}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            {options.length > 0 ? (
              <Pressable
                style={[styles.confirmBtn, (busy || !chosen || !hasLocation) && { opacity: 0.6 }]}
                onPress={handleConfirm}
                disabled={busy || !chosen || !hasLocation}
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
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: c.primary, backgroundColor: c.backgroundSection },
  gpsBtnText: { fontSize: 15, fontWeight: '700', color: c.primary },
  locCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: c.primary, backgroundColor: c.backgroundSection },
  locAddr: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  locMapLink: { fontSize: 12, fontWeight: '600', color: c.primary, marginTop: 3 },
  footer: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: BorderRadius.md, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: c.accent },
});
