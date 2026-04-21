import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, RefreshControl, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVendorRequestDetail, respondToRequest, declineRequest } from '../src/services/vendor';
import { getErrorMessage } from '../src/services/api';
import { useAuth } from '../src/contexts/AuthContext';
import { Colors, Spacing, BorderRadius } from '../src/theme/colors';
import Badge from '../src/components/Badge';
import Button from '../src/components/Button';
import LoadingSpinner from '../src/components/LoadingSpinner';
import type { VendorRequestDetailType } from '../src/types';

export default function VendorRequestDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
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
    } catch { }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [matchId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleRespondClick = () => {
    // Modo de desarrollo: saltar validación de email si EXPO_PUBLIC_SKIP_EMAIL_VERIFICATION=true
    const skipEmailVerification = process.env.EXPO_PUBLIC_SKIP_EMAIL_VERIFICATION === 'true';
    
    if (!skipEmailVerification && !user?.emailVerified) {
      Alert.alert(
        'Email No Verificado',
        'Debes verificar tu correo electrónico antes de responder a solicitudes. ¿Quieres ir a la pantalla de verificación?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Verificar Email', onPress: () => router.push('/verify-email') },
        ]
      );
      return;
    }
    setRespondModal(true);
  };

  const handleRespond = async () => {
    if ((message?.trim?.()?.length ?? 0) < 10) { setError('El mensaje debe tener al menos 10 caracteres'); return; }
    setError('');
    setResponding(true);
    try {
      const result = await respondToRequest(matchId, message?.trim?.() ?? '');
      setRespondModal(false);
      router.push(`/chat?chatId=${result?.chatId ?? ''}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = () => {
    Alert.alert('Declinar Solicitud', '¿Estás seguro de declinar esta solicitud?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Declinar', style: 'destructive', onPress: async () => {
          setDeclining(true);
          try {
            await declineRequest(matchId);
            fetchData(true);
          } catch { }
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
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Detalle de Solicitud</Text>
        <Badge status={detail?.status ?? ''} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.primary} />}>
        <View style={styles.clientInfo}>
          <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
          <Text style={styles.clientName}>{req?.clientFirstName ?? 'Cliente'} de {req?.municipality ?? ''}, {req?.state ?? ''}</Text>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="car-outline" label="Vehículo" value={`${req?.vehicleBrand ?? ''} ${req?.vehicleModel ?? ''}`} />
          <InfoRow icon="construct-outline" label="Repuesto" value={`${req?.partCategory ?? ''}${req?.partSubcategory ? ` - ${req.partSubcategory}` : ''}`} />
          <InfoRow icon="document-text-outline" label="Descripción" value={req?.freeDescription ?? ''} />
          <InfoRow icon="location-outline" label="Radio" value={`${req?.searchRadiusKm ?? 0} km`} />
          <InfoRow icon="calendar-outline" label="Fecha" value={formatDate(req?.createdAt ?? '')} />
        </View>

        {detail?.status === 'PENDING' ? (
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
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Tu respuesta</Text>
              <Pressable onPress={() => setRespondModal(false)} hitSlop={12}>
                <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
              </Pressable>
            </View>
            {error ? <Text style={styles.errorBox}>{error}</Text> : null}
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Escribe un mensaje para el cliente..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
            <Button title="Enviar Respuesta" onPress={handleRespond} loading={responding} />
          </View>
          <Pressable style={styles.overlayBottom} onPress={() => setRespondModal(false)} />
        </KeyboardAvoidingView>
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
  clientInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  clientName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  infoCard: { backgroundColor: Colors.cardBg, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  actions: { gap: Spacing.sm },
  declinedText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.lg },
  errorMsg: { padding: Spacing.lg, textAlign: 'center', color: Colors.textSecondary, fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: Colors.overlay },
  topSheet: { backgroundColor: Colors.white, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, padding: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  overlayBottom: { flex: 1 },
  errorBox: { backgroundColor: '#FEE2E2', color: Colors.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
  messageInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: 15, color: Colors.textPrimary, minHeight: 100, marginBottom: Spacing.md,
  },
});
