import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, Linking, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { Spacing, BorderRadius } from '../src/theme/colors';
import type { ThemeColors } from '../src/theme/colors';
import { getPaymentInfo } from '../src/services/vendor';
import type { PaymentInfo } from '../src/services/vendor';

export default function PaymentInfoScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const params = useLocalSearchParams();
  const planName = (params?.planName as string) ?? '';
  const planSlug = (params?.planSlug as string) ?? '';
  const precioMensual = parseFloat((params?.precioMensual as string) ?? '0') || 0;
  const precioAnual = parseFloat((params?.precioAnual as string) ?? '0') || 0;

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          const info = await getPaymentInfo();
          if (!cancelled) setPaymentInfo(info ?? null);
        } catch { /* handled */ }
        if (!cancelled) setLoading(false);
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const copyToClipboard = async (text: string, field: string) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light)?.catch?.(() => {});
      }
      await Clipboard.setStringAsync?.(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { /* ignore */ }
  };

  const concepto = (paymentInfo?.concepto ?? '')
    .replace('{planName}', planName)
    .replace('{vendorName}', user?.name ?? '');

  const openWhatsApp = () => {
    const phone = paymentInfo?.contactoWhatsApp ?? '';
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const msg = encodeURIComponent(
      `Hola, soy ${user?.name ?? 'un vendedor'} y quiero contratar el Plan ${planName}. Adjunto mi comprobante de pago.`
    );
    const url = `https://wa.me/${cleanPhone.replace('+', '')}?text=${msg}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    });
  };

  const openEmail = () => {
    const email = paymentInfo?.contactoEmail ?? '';
    if (!email) return;
    const subject = encodeURIComponent(`Comprobante de Pago - Plan ${planName}`);
    const body = encodeURIComponent(
      `Hola,\n\nSoy ${user?.name ?? 'un vendedor'} y he realizado la transferencia para el Plan ${planName}.\n\nAdjunto el comprobante de pago.\n\nSaludos.`
    );
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el correo');
    });
  };

  const planColor = planSlug === 'pro' ? '#2196F3' : planSlug === 'premium' ? '#7C3AED' : colors.primary;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Información de Pago</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !paymentInfo ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Información de pago no disponible. Contacta al soporte.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Plan summary card */}
          <View style={[styles.summaryCard, { borderColor: planColor }]}>
            <Text style={[styles.summaryLabel, { color: planColor }]}>Plan seleccionado</Text>
            <Text style={styles.summaryPlan}>{planName}</Text>
            <View style={styles.summaryPriceRow}>
              <Text style={styles.summaryPrice}>${precioMensual.toFixed?.(2) ?? '0.00'}/mes</Text>
              {precioAnual > 0 ? (
                <Text style={styles.summaryAnnual}> o ${precioAnual.toFixed?.(2) ?? '0.00'}/año</Text>
              ) : null}
            </View>
          </View>

          {/* Bank info */}
          <Text style={styles.sectionTitle}>Datos Bancarios</Text>
          <View style={styles.bankCard}>
            <BankRow
              label="Banco"
              value={paymentInfo?.banco ?? ''}
              onCopy={() => copyToClipboard(paymentInfo?.banco ?? '', 'banco')}
              copied={copiedField === 'banco'}
              styles={styles}
              colors={colors}
            />
            <BankRow
              label="Tipo de Cuenta"
              value={paymentInfo?.tipoCuenta ?? ''}
              onCopy={() => copyToClipboard(paymentInfo?.tipoCuenta ?? '', 'tipo')}
              copied={copiedField === 'tipo'}
              styles={styles}
              colors={colors}
            />
            <BankRow
              label="Número de Cuenta"
              value={paymentInfo?.numeroCuenta ?? ''}
              onCopy={() => copyToClipboard(paymentInfo?.numeroCuenta ?? '', 'cuenta')}
              copied={copiedField === 'cuenta'}
              styles={styles}
              colors={colors}
            />
            <BankRow
              label="Titular"
              value={paymentInfo?.titular ?? ''}
              onCopy={() => copyToClipboard(paymentInfo?.titular ?? '', 'titular')}
              copied={copiedField === 'titular'}
              styles={styles}
              colors={colors}
            />
            <BankRow
              label="RIF"
              value={paymentInfo?.rif ?? ''}
              onCopy={() => copyToClipboard(paymentInfo?.rif ?? '', 'rif')}
              copied={copiedField === 'rif'}
              styles={styles}
              colors={colors}
              isLast
            />
          </View>

          {/* Concepto */}
          <Text style={styles.sectionTitle}>Concepto</Text>
          <Pressable
            onPress={() => copyToClipboard(concepto, 'concepto')}
            style={styles.conceptCard}
          >
            <Text style={styles.conceptText}>{concepto}</Text>
            <View style={styles.copyHint}>
              <Ionicons
                name={copiedField === 'concepto' ? 'checkmark-circle' : 'copy-outline'}
                size={16}
                color={copiedField === 'concepto' ? colors.success : colors.textSecondary}
              />
              <Text style={[styles.copyHintText, copiedField === 'concepto' && { color: colors.success }]}>
                {copiedField === 'concepto' ? 'Copiado' : 'Toca para copiar'}
              </Text>
            </View>
          </Pressable>

          {/* Instructions */}
          <Text style={styles.sectionTitle}>Instrucciones</Text>
          <View style={styles.instructionsCard}>
            {(paymentInfo?.instrucciones ?? '').split('\n').filter(Boolean).map((line, i) => (
              <View key={i} style={styles.instructionRow}>
                <View style={[styles.stepCircle, { backgroundColor: planColor }]}>
                  <Text style={styles.stepNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{line.replace(/^\d+\.\s*/, '')}</Text>
              </View>
            ))}
          </View>

          {/* Contact buttons */}
          <Text style={styles.sectionTitle}>Enviar Comprobante</Text>
          <View style={styles.contactRow}>
            <Pressable
              onPress={openWhatsApp}
              style={({ pressed }) => [
                styles.contactBtn,
                { backgroundColor: pressed ? '#20A34D' : '#25D366' },
              ]}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#FFF" />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </Pressable>

            <Pressable
              onPress={openEmail}
              style={({ pressed }) => [
                styles.contactBtn,
                { backgroundColor: pressed ? planColor + 'CC' : planColor },
              ]}
            >
              <Ionicons name="mail-outline" size={22} color="#FFF" />
              <Text style={styles.contactBtnText}>Correo</Text>
            </Pressable>
          </View>

          <Text style={styles.disclaimer}>
            Tu plan será activado dentro de las siguientes 24 horas hábiles después de verificar el pago.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function BankRow({ label, value, onCopy, copied, styles, colors, isLast = false }: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  styles: any;
  colors: ThemeColors;
  isLast?: boolean;
}) {
  return (
    <Pressable onPress={onCopy} style={[styles.bankRow, !isLast && styles.bankRowBorder]}>
      <View style={styles.bankRowLeft}>
        <Text style={styles.bankLabel}>{label}</Text>
        <Text style={styles.bankValue}>{value}</Text>
      </View>
      <Ionicons
        name={copied ? 'checkmark-circle' : 'copy-outline'}
        size={20}
        color={copied ? colors.success : colors.textSecondary}
      />
    </Pressable>
  );
}

const createStyles = (c: ThemeColors, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
    textAlign: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 15, color: c.textSecondary, textAlign: 'center', marginTop: 12 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  // Summary card
  summaryCard: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  summaryPlan: { fontSize: 24, fontWeight: '800', color: c.textPrimary, marginTop: 4 },
  summaryPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  summaryPrice: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  summaryAnnual: { fontSize: 13, color: c.textSecondary },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 10,
    marginTop: 4,
  },

  // Bank card
  bankCard: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  bankRowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  bankRowLeft: { flex: 1, marginRight: 12 },
  bankLabel: { fontSize: 11, color: c.textSecondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  bankValue: { fontSize: 15, color: c.textPrimary, fontWeight: '600', marginTop: 2 },

  // Concept
  conceptCard: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  conceptText: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  copyHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  copyHintText: { fontSize: 12, color: c.textSecondary },

  // Instructions
  instructionsCard: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumber: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  instructionText: { fontSize: 14, color: c.textPrimary, flex: 1, lineHeight: 20 },

  // Contact buttons
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  contactBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Disclaimer
  disclaimer: {
    fontSize: 12,
    color: c.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 20,
  },
});
