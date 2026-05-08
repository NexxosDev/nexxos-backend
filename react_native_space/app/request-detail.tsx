import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getRequestDetail, getRequestResponses, closeRequest } from '../src/services/requests';
import { getErrorMessage } from '../src/services/api';
import { Colors, Spacing, BorderRadius } from '../src/theme/colors';
import Badge from '../src/components/Badge';
import ResponseCard from '../src/components/ResponseCard';
import Button from '../src/components/Button';
import StarRating from '../src/components/StarRating';
import LoadingSpinner from '../src/components/LoadingSpinner';
import BrandLogo from '../src/components/BrandLogo';
import type { RequestDetail, RequestResponseItem } from '../src/types';

export default function RequestDetailScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [responses, setResponses] = useState<RequestResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [resolved, setResolved] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [d, r] = await Promise.all([getRequestDetail(id), getRequestResponses(id)]);
      setDetail(d ?? null);
      setResponses(r?.items ?? []);
    } catch { }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleClose = async () => {
    setCloseError('');
    if (resolved && !selectedVendorId) {
      setCloseError('Selecciona el vendedor que te ayudó');
      return;
    }
    if (resolved && rating < 1) {
      setCloseError('Debes seleccionar una calificación');
      return;
    }
    setClosing(true);
    try {
      const body: Parameters<typeof closeRequest>[1] = { resolved };
      if (resolved) {
        body.vendorId = selectedVendorId;
        body.rating = rating;
        if (comment?.trim?.()) body.comment = comment.trim();
      }
      await closeRequest(id, body);
      setCloseModal(false);
      fetchData(true);
    } catch (err) {
      setCloseError(getErrorMessage(err));
    } finally {
      setClosing(false);
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d)?.toLocaleDateString?.('es-VE', { day: '2-digit', month: 'long', year: 'numeric' }) ?? ''; }
    catch { return ''; }
  };

  if (loading) return <LoadingSpinner />;
  if (!detail) return <View style={styles.safe}><Text style={styles.errorMsg}>Solicitud no encontrada</Text></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Detalle de Solicitud</Text>
        <Badge status={detail?.status ?? ''} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.primary} />}>
        <View style={styles.infoCard}>
          <InfoRow icon="location-outline" label="Ubicación" value={[detail?.municipality?.name, detail?.state?.name].filter(Boolean).join(', ') || 'No especificada'} />
          <InfoRow icon="navigate-outline" label="Distancia de Búsqueda" value={`${detail?.searchRadiusKm ?? 0} km`} />
          <View style={infoStyles.row}>
            <BrandLogo brandName={detail?.vehicleBrand?.name ?? ''} size={20} />
            <View style={infoStyles.col}>
              <Text style={infoStyles.label}>Vehículo</Text>
              <Text style={infoStyles.value}>{`${detail?.vehicleBrand?.name ?? ''} ${detail?.vehicleModel?.name ?? ''}`}</Text>
            </View>
          </View>
          <InfoRow icon="construct-outline" label="Repuesto" value={`${detail?.partCategory?.name ?? ''}${detail?.partSubcategory?.name ? ` - ${detail.partSubcategory.name}` : ''}`} />
          <InfoRow icon="document-text-outline" label="Descripción" value={detail?.freeDescription ?? ''} />
          <InfoRow icon="calendar-outline" label="Fecha" value={formatDate(detail?.createdAt ?? '')} />
        </View>

        <Text style={styles.sectionTitle}>Respuestas ({responses?.length ?? 0})</Text>
        {(responses?.length ?? 0) > 0 ? (
          (responses ?? []).map((resp) => (
            <ResponseCard
              key={resp?.id}
              businessName={resp?.vendor?.businessName ?? ''}
              avgRating={resp?.vendor?.avgRating}
              initialMessage={resp?.initialMessage ?? ''}
              distanceKm={resp?.distanceKm}
              vendorLatitude={resp?.vendor?.latitude}
              vendorLongitude={resp?.vendor?.longitude}
              onOpenChat={detail?.status !== 'CERRADA' ? () => router.push(`/chat?chatId=${resp?.chatId ?? ''}`) : undefined}
            />
          ))
        ) : (
          <Text style={styles.noResponses}>Aún no hay respuestas. Los vendedores están revisando tu solicitud.</Text>
        )}

        {detail?.status !== 'CERRADA' ? (
          <Button title="Cerrar Solicitud" variant="destructive" onPress={() => setCloseModal(true)} style={styles.closeBtn} />
        ) : null}
      </ScrollView>

      <Modal visible={closeModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setCloseModal(false)} />
        <View style={styles.bottomSheet}>
          <Text style={styles.sheetTitle}>Cerrar Solicitud</Text>
          {closeError ? <Text style={styles.error}>{closeError}</Text> : null}

          <Text style={styles.sheetLabel}>¿Se resolvió tu solicitud?</Text>
          <View style={styles.radioRow}>
            <Pressable style={[styles.radio, resolved && styles.radioActive]} onPress={() => setResolved(true)}>
              <Text style={[styles.radioText, resolved && styles.radioTextActive]}>Sí</Text>
            </Pressable>
            <Pressable style={[styles.radio, !resolved && styles.radioActive]} onPress={() => setResolved(false)}>
              <Text style={[styles.radioText, !resolved && styles.radioTextActive]}>No</Text>
            </Pressable>
          </View>

          {resolved ? (
            <View>
              <Text style={styles.sheetLabel}>¿Quién te ayudó?</Text>
              {(responses ?? []).map((resp) => (
                <Pressable key={resp?.id} style={[styles.vendorOption, selectedVendorId === resp?.vendor?.id && styles.vendorOptionActive]} onPress={() => setSelectedVendorId(resp?.vendor?.id ?? '')}>
                  <Text style={styles.vendorName}>{resp?.vendor?.businessName ?? ''}</Text>
                  {selectedVendorId === resp?.vendor?.id ? <Ionicons name="checkmark-circle" size={20} color={Colors.primary} /> : null}
                </Pressable>
              ))}
              <Text style={styles.sheetLabel}>Calificación</Text>
              <StarRating rating={rating} onChange={setRating} />
              <TextInput
                style={styles.commentInput}
                placeholder="Comentario (opcional)"
                placeholderTextColor={Colors.textSecondary}
                value={comment}
                onChangeText={setComment}
                multiline
              />
            </View>
          ) : null}

          <Button title="Confirmar Cierre" onPress={handleClose} loading={closing} style={styles.confirmBtn} />
          <Pressable onPress={() => setCloseModal(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon} size={18} color={Colors.textSecondary} />
      <View style={infoStyles.col}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, gap: Spacing.sm },
  col: { flex: 1 },
  label: { fontSize: 11, color: Colors.textSecondary },
  value: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', marginTop: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { padding: Spacing.md, paddingBottom: 40 },
  infoCard: { backgroundColor: Colors.cardBg, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  noResponses: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl, lineHeight: 20 },
  closeBtn: { marginTop: Spacing.lg },
  errorMsg: { padding: Spacing.lg, textAlign: 'center', color: Colors.textSecondary, fontSize: 16 },
  overlay: { flex: 1, backgroundColor: Colors.overlay },
  bottomSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, paddingBottom: 40 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  sheetLabel: { fontSize: 14, fontWeight: '500', color: Colors.textSubtitle, marginBottom: Spacing.sm, marginTop: Spacing.md },
  radioRow: { flexDirection: 'row', gap: Spacing.sm },
  radio: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  radioActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}15` },
  radioText: { fontSize: 14, color: Colors.textSubtitle },
  radioTextActive: { color: Colors.primary, fontWeight: '600' },
  vendorOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.backgroundSection, marginBottom: 4 },
  vendorOptionActive: { backgroundColor: `${Colors.primary}15` },
  vendorName: { fontSize: 14, color: Colors.textPrimary },
  commentInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.sm, fontSize: 14, color: Colors.textPrimary, minHeight: 60 },
  confirmBtn: { marginTop: Spacing.lg },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  cancelText: { fontSize: 15, color: Colors.textSecondary },
  error: { backgroundColor: '#FEE2E2', color: Colors.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
});
