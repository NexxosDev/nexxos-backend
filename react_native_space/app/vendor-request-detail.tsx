import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, RefreshControl, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendorRequestDetail, respondToRequest, declineRequest } from '../src/services/vendor';
import { getErrorMessage } from '../src/services/api';
import { dismissNotificationsForContext } from '../src/services/pushNotifications';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { Spacing, BorderRadius } from '../src/theme/colors';
import type { ThemeColors } from '../src/theme/colors';
import Badge from '../src/components/Badge';
import Button from '../src/components/Button';
import LoadingSpinner from '../src/components/LoadingSpinner';
import QuickReplyPicker from '../src/components/QuickReplyPicker';
import BrandLogo from '../src/components/BrandLogo';
import type { VendorRequestDetailType } from '../src/types';

export default function VendorRequestDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const iStyles = useMemo(() => createInfoStyles(colors), [colors]);
  const { matchId = '' } = useLocalSearchParams<{ matchId: string }>();
  const [detail, setDetail] = useState<VendorRequestDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondModal, setRespondModal] = useState(false);
  const [message, setMessage] = useState('');
  const [responding, setResponding] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!matchId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getVendorRequestDetail(matchId);
      setDetail(data ?? null);
      if (data?.request?.id) dismissNotificationsForContext({ requestId: data.request.id });
    } catch { }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [matchId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleRespondClick = () => {
    const skipEmailVerification = process.env.EXPO_PUBLIC_SKIP_EMAIL_VERIFICATION === 'true';
    if (!skipEmailVerification && !user?.emailVerified) {
      Alert.alert('Email No Verificado', 'Debes verificar tu correo electrónico antes de responder a solicitudes. ¿Quieres ir a la pantalla de verificación?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Verificar Email', onPress: () => router.push('/verify-email') },
      ]);
      return;
    }
    setRespondModal(true);
  };

  const handleRespond = async () => {
    if ((message?.trim?.()?.length ?? 0) < 10) { setError('El mensaje debe tener al menos 10 caracteres'); return; }
    setError(''); setResponding(true);
    try {
      const result = await respondToRequest(matchId, message?.trim?.() ?? '');
      setRespondModal(false);
      router.push(`/chat?chatId=${result?.chatId ?? ''}`);
    } catch (err) { setError(getErrorMessage(err)); } finally { setResponding(false); }
  };

  const handleDecline = () => {
    Alert.alert('Declinar Solicitud', '¿Estás seguro de declinar esta solicitud?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Declinar', style: 'destructive', onPress: async () => {
          setDeclining(true);
          try { await declineRequest(matchId); fetchData(true); } catch { }
          setDeclining(false);
        }
      },
    ]);
  };

  const formatDate = (d: string) => {
    try { return new Date(d)?.toLocaleDateString?.('es-VE', { day: '2-digit', month: 'long', year: 'numeric' }) ?? ''; }
    catch { return ''; }
  };

  if (loading) return <LoadingSpinner />;
  if (!detail) return <View style={styles.safe}><Text style={styles.errorMsg}>Solicitud no encontrada</Text></View>;

  const req = detail?.request;

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
        <View style={styles.clientInfo}>
          <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          <Text style={styles.clientName}>{`${req?.clientFirstName ?? ''} ${req?.clientLastName ?? ''}`.trim() || 'Cliente'}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={iStyles.row}>
            <BrandLogo brandName={req?.vehicleBrand ?? ''} size={20} />
            <View style={iStyles.col}>
              <Text style={iStyles.label}>Vehículo</Text>
              <Text style={iStyles.value}>{`${req?.vehicleBrand ?? ''} ${req?.vehicleModel ?? ''}${req?.vehicleYear ? ` ${req.vehicleYear}` : ''}`}</Text>
            </View>
          </View>
          <InfoRow icon="construct-outline" label="Repuesto" value={`${req?.partCategory ?? ''}${req?.partSubcategory ? ` - ${req.partSubcategory}` : ''}`} c={colors} />
          <InfoRow icon="document-text-outline" label="Descripción" value={req?.freeDescription ?? ''} c={colors} />
          {(req?.searchRadiusKm ?? 0) > 0 ? (
            <InfoRow icon="navigate-outline" label="Área de búsqueda" value={
              req?.originalRadiusKm && req?.searchRadiusKm && req.searchRadiusKm > req.originalRadiusKm
                ? `${req.searchRadiusKm} km a la redonda (ampliado desde ${req.originalRadiusKm} km)`
                : `${req?.searchRadiusKm} km a la redonda`
            } c={colors} />
          ) : (
            <>
              {(req?.municipality || req?.state) ? (
                <InfoRow icon="location-outline" label="Ubicación" value={[req?.municipality, req?.state].filter(Boolean).join(', ')} c={colors} />
              ) : null}
              <InfoRow icon="search-outline" label="Búsqueda en" value={
                req?.parish
                  ? `${req.parish}, ${req?.municipality ?? ''}`
                  : req?.municipality
                    ? `Municipio ${req.municipality}`
                    : req?.state
                      ? `Todo el estado ${req.state}`
                      : 'No especificada'
              } c={colors} />
            </>
          )}
          <InfoRow icon="calendar-outline" label="Fecha" value={formatDate(req?.createdAt ?? '')} c={colors} />
        </View>

        {detail?.status === 'CERRADA' ? (
          <View style={styles.closedSection}>
            <Text style={styles.declinedText}>Esta solicitud ha sido cerrada por el cliente</Text>
            {detail?.chatId ? (
              <Button title="Ver Chat (solo lectura)" variant="secondary" onPress={() => router.push(`/chat?chatId=${detail?.chatId ?? ''}&readOnly=1`)} />
            ) : null}
          </View>
        ) : detail?.status === 'PENDING' ? (
          <View style={styles.actions}>
            <Button title="Responder" onPress={handleRespondClick} />
            <Button title="Declinar" variant="ghost" onPress={handleDecline} loading={declining} />
          </View>
        ) : detail?.status === 'RESPONDED' && detail?.chatId ? (
          <Button title="Abrir Chat" variant="secondary" onPress={() => router.push(`/chat?chatId=${detail?.chatId ?? ''}`)} />
        ) : detail?.status === 'DECLINED' ? (
          <Text style={styles.declinedText}>Has declinado esta solicitud</Text>
        ) : null}
      </ScrollView>

      <Modal visible={respondModal} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.topSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Tu respuesta</Text>
              <Pressable onPress={() => setRespondModal(false)} hitSlop={12}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </Pressable>
            </View>
            {error ? <Text style={styles.errorBox}>{error}</Text> : null}
            <View style={styles.inputWithQuick}>
              <TextInput
                style={[styles.messageInput, { flex: 1 }]}
                value={message}
                onChangeText={setMessage}
                placeholder="Escribe un mensaje para el cliente..."
                placeholderTextColor={colors.textSecondary}
                multiline numberOfLines={4} textAlignVertical="top" autoFocus
              />
              <QuickReplyPicker
                onSelect={(text) => setMessage((prev) => (prev ? prev + ' ' + text : text))}
                style={{ position: 'absolute', right: 8, top: 8 }}
              />
            </View>
            <Button title="Enviar Respuesta" onPress={handleRespond} loading={responding} />
          </View>
          <Pressable style={styles.overlayBottom} onPress={() => setRespondModal(false)} />
        </KeyboardAvoidingView>
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
  clientInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  clientName: { fontSize: 16, fontWeight: '600', color: c.textPrimary },
  infoCard: { backgroundColor: c.cardBg, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: c.border, marginBottom: Spacing.lg },
  actions: { gap: Spacing.sm },
  closedSection: { gap: Spacing.sm, alignItems: 'center' },
  declinedText: { fontSize: 15, color: c.textSecondary, textAlign: 'center', paddingVertical: Spacing.lg },
  errorMsg: { padding: Spacing.lg, textAlign: 'center', color: c.textSecondary, fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: c.overlay },
  topSheet: { backgroundColor: c.surface, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, padding: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary },
  overlayBottom: { flex: 1 },
  errorBox: { backgroundColor: c.errorBg, color: c.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
  inputWithQuick: {
    position: 'relative' as const,
    marginBottom: Spacing.md,
  },
  messageInput: {
    borderWidth: 1, borderColor: c.border, borderRadius: BorderRadius.md,
    padding: Spacing.md, paddingRight: 48, fontSize: 15, color: c.textPrimary, minHeight: 100, backgroundColor: c.inputBg,
  },
});
