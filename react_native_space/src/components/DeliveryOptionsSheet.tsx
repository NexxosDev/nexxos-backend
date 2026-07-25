import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput, ActivityIndicator, Platform, Alert, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import type { DeliveryOptionsResponse, DeliveryOption } from '../types';
import { quoteDelivery } from '../services/delivery';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = undefined;
if (Platform.OS !== 'web') {
  try { const Maps = require('react-native-maps'); MapView = Maps.default; Marker = Maps.Marker; PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE; } catch (e) { console.warn('react-native-maps not available'); }
}

interface Prediction { label: string; lat: number; lng: number; }

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

const ownCostOf = (opts?: DeliveryOption[] | null): number | null => {
  const o = opts?.find?.((x) => x?.provider === 'OWN_VENDOR');
  return o ? (o?.cost ?? 0) : null;
};

export default function DeliveryOptionsSheet({ visible, data, busy, onConfirm, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activeData, setActiveData] = useState<DeliveryOptionsResponse | null>(data);
  const [selected, setSelected] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [searchText, setSearchText] = useState('');
  const [locating, setLocating] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [usedGps, setUsedGps] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searching, setSearching] = useState(false);
  const skipNextSearch = useRef(false);

  // Alerta de variación de costo (Req B)
  const [variation, setVariation] = useState(false);
  const [needsAccept, setNeedsAccept] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setActiveData(data);
      setSelected(0);
      setNotes('');
      setSearchText('');
      setAddress('');
      setLocating(false);
      setQuoting(false);
      setUsedGps(false);
      setPredictions([]);
      setSearching(false);
      setVariation(false);
      setNeedsAccept(false);
      setAccepted(false);
      bannerOpacity.setValue(0);
      const dLat = data?.dropoffLat;
      const dLng = data?.dropoffLng;
      setCoords(dLat != null && dLng != null ? { lat: dLat, lng: dLng } : null);
    }
  }, [visible, data, bannerOpacity]);

  useEffect(() => {
    if (variation) {
      Animated.timing(bannerOpacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    }
  }, [variation, bannerOpacity]);

  const options = activeData?.options ?? [];
  const currency = activeData?.currency ?? 'USD';
  const distanceKm = activeData?.distanceKm ?? null;
  const chosen = options?.[selected] ?? null;
  const hasLocation = coords != null;
  const chatId = activeData?.chatId ?? data?.chatId ?? '';

  const applyQuote = useCallback((resp: DeliveryOptionsResponse | null) => {
    if (!resp) return;
    const oldCost = ownCostOf(activeData?.options);
    const newCost = ownCostOf(resp?.options);
    setActiveData(resp);
    if (resp?.dropoffLat != null && resp?.dropoffLng != null) {
      setCoords({ lat: resp.dropoffLat, lng: resp.dropoffLng });
    }
    if (oldCost != null && newCost != null && Math.abs(newCost - oldCost) >= 0.005) {
      setVariation(true);
      const considerable = (newCost - oldCost) >= 1.0 || newCost >= oldCost * 1.5;
      if (considerable) {
        setNeedsAccept(true);
        setAccepted(false);
      } else {
        setNeedsAccept(false);
        setAccepted(true);
      }
    }
  }, [activeData]);

  const runQuote = useCallback(async (body: { dropoffLat?: number; dropoffLng?: number; mapUrl?: string }) => {
    if (!chatId) return;
    setQuoting(true);
    try {
      const resp = await quoteDelivery(chatId, body);
      applyQuote(resp);
    } catch (e) {
      const msg = (e as any)?.response?.data?.message ?? 'No pudimos recalcular el costo con esa ubicación. Intenta de nuevo.';
      Alert.alert('Ubicación de entrega', typeof msg === 'string' ? msg : 'No pudimos recalcular el costo.');
    } finally {
      setQuoting(false);
    }
  }, [chatId, applyQuote]);

  // Geocodificación inversa gratuita (OpenStreetMap / Nominatim) para mostrar una dirección amigable.
  const reverseGeocodeOSM = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'NEXXOS-App/1.0' } });
      if (!res?.ok) return '';
      const d = await res.json();
      const a = d?.address ?? {};
      const parts = [a?.road ?? a?.neighbourhood ?? a?.suburb, a?.city ?? a?.town ?? a?.village, a?.state]
        .filter((x: any) => !!x)
        .filter((x: string, i: number, arr: string[]) => arr.indexOf(x) === i);
      return parts.join(', ') || (typeof d?.display_name === 'string' ? d.display_name : '');
    } catch {
      return '';
    }
  }, []);

  // Buscador con predicciones (OpenStreetMap / Nominatim) — gratis, sin Google Places.
  useEffect(() => {
    const val = searchText?.trim?.() ?? '';
    if (skipNextSearch.current) { skipNextSearch.current = false; return; }
    if (!val || val.length < 3 || /https?:\/\//i.test(val)) { setPredictions([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=ve&q=${encodeURIComponent(val)}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'NEXXOS-App/1.0' } });
        const data = res?.ok ? await res.json() : [];
        if (cancelled) return;
        const preds: Prediction[] = (Array.isArray(data) ? data : [])
          .map((d: any) => ({ label: typeof d?.display_name === 'string' ? d.display_name : '', lat: parseFloat(d?.lat), lng: parseFloat(d?.lon) }))
          .filter((p: Prediction) => !!p.label && isFinite(p.lat) && isFinite(p.lng));
        setPredictions(preds);
      } catch {
        if (!cancelled) setPredictions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 550);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchText]);

  const pickPrediction = useCallback(async (p: Prediction) => {
    skipNextSearch.current = true;
    setSearchText(p.label.length > 48 ? p.label.slice(0, 48) + '…' : p.label);
    setPredictions([]);
    setAddress(p.label);
    setUsedGps(false);
    setCoords({ lat: p.lat, lng: p.lng });
    await runQuote({ dropoffLat: p.lat, dropoffLng: p.lng });
  }, [runQuote]);

  const handlePinDrag = useCallback(async (e: any) => {
    const c = e?.nativeEvent?.coordinate;
    if (!c || typeof c.latitude !== 'number' || typeof c.longitude !== 'number') return;
    setUsedGps(false);
    setCoords({ lat: c.latitude, lng: c.longitude });
    const readable = await reverseGeocodeOSM(c.latitude, c.longitude);
    setAddress(readable);
    await runQuote({ dropoffLat: c.latitude, dropoffLng: c.longitude });
  }, [runQuote, reverseGeocodeOSM]);

  const handleSearchSubmit = useCallback(async () => {
    const val = searchText?.trim?.() ?? '';
    if (!val || quoting || locating) return;
    if (/https?:\/\//i.test(val)) {
      // Es un enlace de Google Maps / WhatsApp → extraer coordenadas en el servidor
      setUsedGps(false);
      await runQuote({ mapUrl: val });
      return;
    }
    // Texto libre → geocodificar (no disponible en web)
    if (Platform.OS === 'web') {
      Alert.alert('Búsqueda', 'La búsqueda por texto no está disponible en la versión web. Pega un enlace de Google Maps o usa el GPS.');
      return;
    }
    setQuoting(true);
    let found: { latitude: number; longitude: number } | null = null;
    try {
      const results = await Location.geocodeAsync(val);
      const first = results?.[0];
      if (first?.latitude != null && first?.longitude != null) {
        found = { latitude: first.latitude, longitude: first.longitude };
      }
    } catch {
      // geocodificación no disponible
    }
    setQuoting(false);
    if (!found) {
      Alert.alert('Búsqueda', 'No encontramos esa dirección. Intenta pegar un enlace de Google Maps.');
      return;
    }
    setAddress(val);
    setUsedGps(false);
    await runQuote({ dropoffLat: found.latitude, dropoffLng: found.longitude });
  }, [searchText, quoting, locating, runQuote]);

  const captureLocation = useCallback(async () => {
    if (locating || quoting) return;
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
        // Geocodificación inversa no disponible (p. ej. web)
      }
      setAddress(readable || '');
      setUsedGps(true);
      setSearchText('');
      setLocating(false);
      await runQuote({ dropoffLat: lat, dropoffLng: lng });
    } catch {
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación. Verifica que el GPS esté activo.');
      setLocating(false);
    }
  }, [locating, quoting, runQuote]);

  const openInMaps = useCallback(() => {
    if (!coords) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    Linking.openURL(url).catch(() => {});
  }, [coords]);

  const blockConfirm = needsAccept && !accepted;

  const handleConfirm = useCallback(() => {
    if (!chosen) return;
    if (!coords) {
      Alert.alert('Ubicación de entrega', 'Por favor indica tu ubicación de entrega antes de confirmar el envío.');
      return;
    }
    if (blockConfirm) {
      Alert.alert('Nueva tarifa', 'La tarifa de envío cambió. Toca "Aceptar nueva tarifa" para continuar.');
      return;
    }
    onConfirm(chosen, {
      dropoffLat: coords.lat,
      dropoffLng: coords.lng,
      dropoffAddress: address?.trim?.() ?? '',
      notes: notes?.trim?.() ?? '',
    });
  }, [chosen, coords, address, notes, blockConfirm, onConfirm]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Ionicons name="bicycle-outline" size={22} color={colors.primary} />
            <Text style={styles.title}>Opciones de envío</Text>
          </View>
          {typeof distanceKm === 'number' ? (
            <Text style={styles.distance}>Distancia aprox: {distanceKm} km</Text>
          ) : null}

          {variation ? (
            <Animated.View style={[styles.variationBanner, { opacity: bannerOpacity }]}>
              <Ionicons name="alert-circle" size={18} color="#8A6D00" />
              <Text style={styles.variationText}>El costo de envío ha variado debido a la modificación de la ubicación de entrega.</Text>
            </Animated.View>
          ) : null}

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                {/* Buscador inteligente de ubicación (Req A) */}
                <View style={styles.addrBlock}>
                  <Text style={styles.addrLabel}>Ubicación de entrega</Text>
                  <View style={styles.searchRow}>
                    <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginLeft: 10 }} />
                    <TextInput
                      value={searchText}
                      onChangeText={setSearchText}
                      onSubmitEditing={handleSearchSubmit}
                      placeholder="Buscar dirección o pegar enlace de mapa"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.searchInput}
                      returnKeyType="search"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!quoting && !locating}
                    />
                    {searchText?.length > 0 ? (
                      <Pressable onPress={handleSearchSubmit} hitSlop={8} style={styles.searchGoBtn} disabled={quoting || locating}>
                        <Ionicons name="arrow-forward-circle" size={24} color={colors.primary} />
                      </Pressable>
                    ) : null}
                    <Pressable onPress={captureLocation} hitSlop={8} style={styles.gpsIconBtn} disabled={quoting || locating}>
                      {locating ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Ionicons name="navigate" size={20} color={colors.primary} />
                      )}
                    </Pressable>
                  </View>
                  <Text style={styles.searchHint}>Escribe una dirección y elige de la lista, pega un enlace de mapa, o usa el ícono de GPS.</Text>

                  {searching ? (
                    <View style={styles.searchingRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.quotingText}>Buscando direcciones...</Text>
                    </View>
                  ) : null}

                  {predictions.length > 0 ? (
                    <View style={styles.predictionsBox}>
                      {predictions.map((p, i) => (
                        <Pressable
                          key={`${p.lat}-${p.lng}-${i}`}
                          style={[styles.predictionRow, i < predictions.length - 1 && styles.predictionDivider]}
                          onPress={() => pickPrediction(p)}
                        >
                          <Ionicons name="location-outline" size={16} color={colors.textSecondary} style={{ marginTop: 1 }} />
                          <Text style={styles.predictionText} numberOfLines={2}>{p.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  {quoting ? (
                    <View style={styles.quotingRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.quotingText}>Recalculando distancia y costo...</Text>
                    </View>
                  ) : null}

                  {hasLocation ? (
                    <View style={styles.locCard}>
                      <Ionicons name="location" size={18} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.locAddr} numberOfLines={2}>
                          {usedGps ? 'Mi ubicación actual' : (address || 'Ubicación seleccionada')}
                        </Text>
                        <Pressable onPress={openInMaps} hitSlop={6}>
                          <Text style={styles.locMapLink}>Ver en Google Maps</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {hasLocation && MapView && Marker && Platform.OS !== 'web' && coords ? (
                    <View style={styles.mapWrap}>
                      <MapView
                        style={styles.map}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        region={{ latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
                      >
                        <Marker
                          coordinate={{ latitude: coords.lat, longitude: coords.lng }}
                          draggable
                          onDragEnd={handlePinDrag}
                        />
                      </MapView>
                      <Text style={styles.mapHint}>Arrastra el pin para ajustar el punto exacto de entrega.</Text>
                    </View>
                  ) : null}
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

                {/* Confirmación de nueva tarifa (Req B) */}
                {needsAccept && !accepted ? (
                  <Pressable style={styles.acceptBtn} onPress={() => setAccepted(true)}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                    <Text style={styles.acceptText}>Aceptar nueva tarifa</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={busy}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            {options.length > 0 ? (
              <Pressable
                style={[styles.confirmBtn, (busy || !chosen || !hasLocation || quoting || blockConfirm) && { opacity: 0.6 }]}
                onPress={handleConfirm}
                disabled={busy || !chosen || !hasLocation || quoting || blockConfirm}
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
  variationBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: BorderRadius.md, backgroundColor: '#FFF4CC', borderWidth: 1, borderColor: '#F0D26E', marginBottom: Spacing.sm },
  variationText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: '#8A6D00', lineHeight: 17 },
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
  searchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.border, borderRadius: BorderRadius.md, backgroundColor: c.backgroundSection },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: c.textPrimary, fontSize: 15 },
  searchGoBtn: { paddingHorizontal: 4, paddingVertical: 8 },
  gpsIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: c.border },
  searchHint: { fontSize: 11.5, color: c.textSecondary, marginTop: 6 },
  quotingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  searchingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  quotingText: { fontSize: 13, color: c.textSecondary },
  predictionsBox: { marginTop: 8, borderWidth: 1, borderColor: c.border, borderRadius: BorderRadius.md, backgroundColor: c.backgroundSection, overflow: 'hidden' },
  predictionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 11, paddingHorizontal: 12 },
  predictionDivider: { borderBottomWidth: 1, borderBottomColor: c.border },
  predictionText: { flex: 1, fontSize: 13.5, color: c.textPrimary, lineHeight: 18 },
  mapWrap: { marginTop: 12 },
  map: { width: '100%', height: 200, borderRadius: BorderRadius.md },
  mapHint: { fontSize: 11.5, color: c.textSecondary, marginTop: 6, textAlign: 'center' },
  locCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: c.primary, backgroundColor: c.backgroundSection, marginTop: 10 },
  locAddr: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  locMapLink: { fontSize: 12, fontWeight: '600', color: c.primary, marginTop: 3 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: Spacing.md, paddingVertical: 13, borderRadius: BorderRadius.md, backgroundColor: c.primary },
  acceptText: { fontSize: 15, fontWeight: '700', color: c.accent },
  footer: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: BorderRadius.md, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: c.accent },
});
