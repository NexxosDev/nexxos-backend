import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getRequestDetail, getRequestResponses, closeRequest, updateResponseTags } from '../src/services/requests';
import { getErrorMessage } from '../src/services/api';
import { dismissNotificationsForContext } from '../src/services/pushNotifications';
import { useUnread } from '../src/contexts/UnreadContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { Spacing, BorderRadius } from '../src/theme/colors';
import type { ThemeColors } from '../src/theme/colors';
import Badge from '../src/components/Badge';
import ResponseCard from '../src/components/ResponseCard';
import Button from '../src/components/Button';
import StarRating from '../src/components/StarRating';
import LoadingSpinner from '../src/components/LoadingSpinner';
import BrandLogo from '../src/components/BrandLogo';
import TagSelectorSheet from '../src/components/TagSelectorSheet';
import { TAG_DEFINITIONS } from '../src/utils/responseTags';
import type { RequestDetail, RequestResponseItem, ResponseTagValue } from '../src/types';

type TagFilter = 'ALL' | ResponseTagValue;

export default function RequestDetailScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { byChatId } = useUnread();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const iStyles = useMemo(() => createInfoStyles(colors), [colors]);
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

  // Tag state
  const [tagFilter, setTagFilter] = useState<TagFilter>('ALL');
  const [tagSheetVisible, setTagSheetVisible] = useState(false);
  const [tagSheetResponseId, setTagSheetResponseId] = useState('');
  const [tagSheetVendorName, setTagSheetVendorName] = useState('');
  const [tagSheetCurrentTags, setTagSheetCurrentTags] = useState<ResponseTagValue[]>([]);

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

  useFocusEffect(useCallback(() => {
    fetchData();
    if (id) dismissNotificationsForContext({ requestId: id });
  }, [fetchData, id]));

  const handleClose = async () => {
    setCloseError('');
    if (resolved && !selectedVendorId) { setCloseError('Selecciona el vendedor que te ayudó'); return; }
    if (resolved && rating < 1) { setCloseError('Debes seleccionar una calificación'); return; }
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
    } catch (err) { setCloseError(getErrorMessage(err)); } finally { setClosing(false); }
  };

  const handleOpenTagSheet = useCallback((resp: RequestResponseItem) => {
    setTagSheetResponseId(resp?.id ?? '');
    setTagSheetVendorName(resp?.vendor?.businessName ?? '');
    setTagSheetCurrentTags(resp?.tags ?? []);
    setTagSheetVisible(true);
  }, []);

  const handleSaveTags = useCallback(async (tags: ResponseTagValue[]) => {
    if (!tagSheetResponseId) return;
    // Optimistic update
    setResponses((prev) =>
      (prev ?? []).map((r) => r?.id === tagSheetResponseId ? { ...r, tags } : r),
    );
    try {
      await updateResponseTags(tagSheetResponseId, tags);
    } catch {
      // Revert on error — refetch
      fetchData(true);
    }
  }, [tagSheetResponseId, fetchData]);

  const formatDate = (d: string) => {
    try { return new Date(d)?.toLocaleDateString?.('es-VE', { day: '2-digit', month: 'long', year: 'numeric' }) ?? ''; }
    catch { return ''; }
  };

  // Filter responses by selected tag
  const filteredResponses = useMemo(() => {
    if (tagFilter === 'ALL') return responses ?? [];
    return (responses ?? []).filter((r) => (r?.tags ?? []).includes(tagFilter));
  }, [responses, tagFilter]);

  // Check if any response has tags (to show filter row)
  const anyTagged = useMemo(() => (responses ?? []).some((r) => (r?.tags ?? []).length > 0), [responses]);

  if (loading) return <LoadingSpinner />;
  if (!detail) return <View style={styles.safe}><Text style={styles.errorMsg}>Solicitud no encontrada</Text></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Detalle de Solicitud</Text>
        <Badge status={detail?.status ?? ''} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} />}>
        <View style={styles.infoCard}>
          <InfoRow icon="location-outline" label="Ubicación" value={[detail?.municipality?.name, detail?.state?.name].filter(Boolean).join(', ') || 'No especificada'} c={colors} />
          <InfoRow icon="navigate-outline" label="Distancia de Búsqueda" value={`${detail?.searchRadiusKm ?? 0} km`} c={colors} />
          <View style={iStyles.row}>
            <BrandLogo brandName={detail?.vehicleBrand?.name ?? ''} size={20} />
            <View style={iStyles.col}>
              <Text style={iStyles.label}>Vehículo</Text>
              <Text style={iStyles.value}>{`${detail?.vehicleBrand?.name ?? ''} ${detail?.vehicleModel?.name ?? ''}`}</Text>
            </View>
          </View>
          <InfoRow icon="construct-outline" label="Repuesto" value={`${detail?.partCategory?.name ?? ''}${detail?.partSubcategory?.name ? ` - ${detail.partSubcategory.name}` : ''}`} c={colors} />
          <InfoRow icon="document-text-outline" label="Descripción" value={detail?.freeDescription ?? ''} c={colors} />
          <InfoRow icon="calendar-outline" label="Fecha" value={formatDate(detail?.createdAt ?? '')} c={colors} />
        </View>

        <Text style={styles.sectionTitle}>Respuestas ({responses?.length ?? 0})</Text>

        {anyTagged && (responses?.length ?? 0) > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
            <Pressable style={[styles.filterChip, tagFilter === 'ALL' && styles.filterChipActive]} onPress={() => setTagFilter('ALL')}>
              <Text style={[styles.filterChipText, tagFilter === 'ALL' && styles.filterChipTextActive]}>Todas</Text>
            </Pressable>
            {(TAG_DEFINITIONS ?? []).map((def) => {
              const count = (responses ?? []).filter((r) => (r?.tags ?? []).includes(def?.key)).length;
              if (count === 0) return null;
              return (
                <Pressable
                  key={def?.key}
                  style={[styles.filterChip, tagFilter === def?.key && { backgroundColor: def?.bgColor, borderColor: def?.color }]}
                  onPress={() => setTagFilter(tagFilter === def?.key ? 'ALL' : def?.key)}
                >
                  <Text style={styles.filterEmoji}>{def?.emoji}</Text>
                  <Text style={[styles.filterChipText, tagFilter === def?.key && { color: def?.color, fontWeight: '600' }]}>{def?.label}</Text>
                  <Text style={[styles.filterCount, tagFilter === def?.key && { color: def?.color }]}>{count}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {(filteredResponses?.length ?? 0) > 0 ? (
          (filteredResponses ?? []).map((resp) => (
            <ResponseCard
              key={resp?.id}
              businessName={resp?.vendor?.businessName ?? ''}
              logoUrl={resp?.vendor?.logoUrl}
              avgRating={resp?.vendor?.avgRating}
              initialMessage={resp?.initialMessage ?? ''}
              distanceKm={resp?.distanceKm}
              vendorLatitude={resp?.vendor?.latitude}
              vendorLongitude={resp?.vendor?.longitude}
              tags={resp?.tags}
              onTagPress={() => handleOpenTagSheet(resp)}
              onOpenChat={() => {
                const base = `/chat?chatId=${resp?.chatId ?? ''}`;
                router.push(detail?.status === 'CERRADA' ? `${base}&readOnly=1` : base);
              }}
              unreadCount={byChatId?.[resp?.chatId ?? ''] ?? 0}
            />
          ))
        ) : tagFilter !== 'ALL' ? (
          <Text style={styles.noResponses}>No hay respuestas con esta etiqueta.</Text>
        ) : (
          <Text style={styles.noResponses}>Aún no hay respuestas. Los vendedores están revisando tu solicitud.</Text>
        )}

        {detail?.status !== 'CERRADA' ? (
          <Button title="Cerrar Solicitud" variant="destructive" onPress={() => setCloseModal(true)} style={styles.closeBtn} />
        ) : null}
      </ScrollView>

      <TagSelectorSheet
        visible={tagSheetVisible}
        selectedTags={tagSheetCurrentTags}
        vendorName={tagSheetVendorName}
        onSave={handleSaveTags}
        onClose={() => setTagSheetVisible(false)}
      />

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
                  {selectedVendorId === resp?.vendor?.id ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                </Pressable>
              ))}
              <Text style={styles.sheetLabel}>Calificación</Text>
              <StarRating rating={rating} onChange={setRating} />
              <TextInput
                style={styles.commentInput}
                placeholder="Comentario (opcional)"
                placeholderTextColor={colors.textSecondary}
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

function InfoRow({ icon, label, value, c }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; c: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, gap: Spacing.sm }}>
      <Ionicons name={icon} size={18} color={c.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: c.textSecondary }}>{label}</Text>
        <Text style={{ fontSize: 14, color: c.textPrimary, fontWeight: '500', marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

const createInfoStyles = (c: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, gap: Spacing.sm },
  col: { flex: 1 },
  label: { fontSize: 11, color: c.textSecondary },
  value: { fontSize: 14, color: c.textPrimary, fontWeight: '500', marginTop: 1 },
});

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: c.textPrimary },
  scroll: { padding: Spacing.md, paddingBottom: 40 },
  infoCard: { backgroundColor: c.cardBg, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: c.border, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: c.textPrimary, marginBottom: Spacing.md },
  filterScroll: { marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: c.border, backgroundColor: c.chipBg },
  filterChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  filterChipText: { fontSize: 12, color: c.textSubtitle },
  filterChipTextActive: { color: c.accent, fontWeight: '600' },
  filterEmoji: { fontSize: 12 },
  filterCount: { fontSize: 11, color: c.textSecondary, fontWeight: '600' },
  noResponses: { fontSize: 14, color: c.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl, lineHeight: 20 },
  closeBtn: { marginTop: Spacing.lg },
  errorMsg: { padding: Spacing.lg, textAlign: 'center', color: c.textSecondary, fontSize: 16 },
  overlay: { flex: 1, backgroundColor: c.overlay },
  bottomSheet: { backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, paddingBottom: 40 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: Spacing.md },
  sheetLabel: { fontSize: 14, fontWeight: '500', color: c.textSubtitle, marginBottom: Spacing.sm, marginTop: Spacing.md },
  radioRow: { flexDirection: 'row', gap: Spacing.sm },
  radio: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: c.border },
  radioActive: { borderColor: c.primary, backgroundColor: `${c.primary}15` },
  radioText: { fontSize: 14, color: c.textSubtitle },
  radioTextActive: { color: c.primary, fontWeight: '600' },
  vendorOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: c.backgroundSection, marginBottom: 4 },
  vendorOptionActive: { backgroundColor: `${c.primary}15` },
  vendorName: { fontSize: 14, color: c.textPrimary },
  commentInput: { borderWidth: 1, borderColor: c.border, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.sm, fontSize: 14, color: c.textPrimary, minHeight: 60, backgroundColor: c.inputBg },
  confirmBtn: { marginTop: Spacing.lg },
  cancelBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  cancelText: { fontSize: 15, color: c.textSecondary },
  error: { backgroundColor: c.errorBg, color: c.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
});
