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
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { Spacing, BorderRadius } from '../src/theme/colors';
import type { ThemeColors } from '../src/theme/colors';
import { getPaymentInfo, getVendorProfile, getExchangeRateLatest } from '../src/services/vendor';
import type { PaymentMethod, ExchangeRateInfo } from '../src/services/vendor';

/** Format number in Venezuelan style: 1.427,10 */
function formatBs(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0,00';
  const fixed = n.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withDots = (intPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots},${decPart ?? '00'}`;
}

/* Human-readable labels for field keys */
const FIELD_LABELS: Record<string, string> = {
  banco: 'Banco',
  tipoCuenta: 'Tipo de Cuenta',
  numeroCuenta: 'Número de Cuenta',
  titular: 'Titular',
  rif: 'Cédula / RIF',
  telefono: 'Teléfono',
  email: 'Email Zelle',
};

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

  // Bs conversion data from plans screen
  const tasaBcv = parseFloat((params?.tasaBcv as string) ?? '') || 0;
  const fechaTasa = (params?.fechaTasa as string) ?? '';
  const ivaRate = parseFloat((params?.ivaRate as string) ?? '') || 0;
  const subtotalBsMensual = parseFloat((params?.subtotalBsMensual as string) ?? '') || 0;
  const ivaBsMensual = parseFloat((params?.ivaBsMensual as string) ?? '') || 0;
  const totalBsMensual = parseFloat((params?.totalBsMensual as string) ?? '') || 0;
  const hasBsConversion = tasaBcv > 0 && totalBsMensual > 0;

  const [methods, setMethods] = useState<Record<string, PaymentMethod>>({});
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          const [payData, vendorData] = await Promise.all([
            getPaymentInfo().catch(() => ({ methods: {} })),
            getVendorProfile().catch(() => null),
          ]);
          if (!cancelled) {
            const m = payData?.methods ?? {};
            setMethods(m);
            setBusinessName(vendorData?.businessName ?? user?.name ?? '');
            // Auto-expand if only 1 method
            const keys = Object.keys(m);
            if (keys?.length === 1) {
              setExpandedMethod(keys[0] ?? null);
            }
          }
        } catch { /* handled */ }
        if (!cancelled) setLoading(false);
      })();
      return () => { cancelled = true; };
    }, [user?.name])
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

  const toggleMethod = (key: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light)?.catch?.(() => {});
    }
    setCopiedField(null);
    setExpandedMethod(prev => prev === key ? null : key);
  };

  const resolveConcepto = (method: PaymentMethod) => {
    return (method?.concepto ?? '')
      .replace('{planName}', planName)
      .replace('{businessName}', businessName || user?.name || '')
      .replace('{storeName}', businessName || user?.name || '');
  };

  const openWhatsApp = (method: PaymentMethod, metodoLabel: string) => {
    const phone = method?.contactoWhatsApp ?? '';
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const msg = encodeURIComponent(
      `Hola, soy ${businessName || user?.name || 'un vendedor'} y quiero contratar el Plan ${planName}. Realicé el pago por ${metodoLabel}. Adjunto mi comprobante.`
    );
    Linking.openURL(`https://wa.me/${cleanPhone.replace('+', '')}?text=${msg}`).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    });
  };

  const openEmail = (method: PaymentMethod, metodoLabel: string) => {
    const email = method?.contactoEmail ?? '';
    if (!email) return;
    const subject = encodeURIComponent(`Comprobante de Pago - Plan ${planName}`);
    const body = encodeURIComponent(
      `Hola,\n\nSoy ${businessName || user?.name || 'un vendedor'} y he realizado el pago por ${metodoLabel} para el Plan ${planName}.\n\nAdjunto el comprobante de pago.\n\nSaludos.`
    );
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el correo');
    });
  };

  const planColor = planSlug === 'pro' ? '#2196F3' : planSlug === 'premium' ? '#7C3AED' : colors.primary;
  const methodKeys = Object.keys(methods ?? {});

  const METHOD_COLORS: Record<string, string> = {
    transferencia: '#0D47A1',
    pagoMovil: '#E65100',
    zelle: '#6C1CD1',
  };

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
      ) : methodKeys?.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No hay métodos de pago activos. Contacta al soporte.</Text>
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

          {/* Bs Desglose card */}
          {hasBsConversion ? (
            <View style={[styles.desgloseCard, { borderColor: planColor + '40' }]}>
              <View style={styles.desgloseHeader}>
                <Ionicons name="calculator-outline" size={18} color={planColor} />
                <Text style={[styles.desgloseTitleText, { color: planColor }]}>Desglose en Bolívares</Text>
              </View>
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseLabel}>Precio USD</Text>
                <Text style={styles.desgloseValue}>${precioMensual?.toFixed?.(2) ?? '0.00'}</Text>
              </View>
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseLabel}>Subtotal Bs</Text>
                <Text style={styles.desgloseValue}>Bs {formatBs(subtotalBsMensual)}</Text>
              </View>
              <View style={styles.desgloseRow}>
                <Text style={styles.desgloseLabel}>IVA ({ivaRate}%)</Text>
                <Text style={styles.desgloseValue}>Bs {formatBs(ivaBsMensual)}</Text>
              </View>
              <View style={[styles.desgloseRow, styles.desgloseTotalRow]}>
                <Text style={[styles.desgloseLabel, styles.desgloseTotalLabel]}>Total a pagar</Text>
                <Text style={[styles.desgloseValue, styles.desgloseTotalValue, { color: planColor }]}>Bs {formatBs(totalBsMensual)}</Text>
              </View>
              <Text style={styles.desgloseTasa}>Tasa BCV: Bs {formatBs(tasaBcv)}/$ • {fechaTasa}</Text>
            </View>
          ) : null}

          {/* Method selector label */}
          <Text style={styles.sectionTitle}>
            {methodKeys?.length > 1 ? 'Selecciona un método de pago' : 'Método de pago'}
          </Text>

          {/* Method buttons */}
          {methodKeys.map((key) => {
            const method = methods?.[key];
            if (!method) return null;
            const isExpanded = expandedMethod === key;
            const methodColor = METHOD_COLORS[key] ?? planColor;
            const iconName = (method?.icon ?? 'cash-outline') as keyof typeof Ionicons.glyphMap;

            return (
              <View key={key} style={styles.methodContainer}>
                {/* Method button */}
                <Pressable
                  onPress={() => toggleMethod(key)}
                  style={({ pressed }) => [
                    styles.methodButton,
                    isExpanded
                      ? { backgroundColor: methodColor, borderColor: methodColor }
                      : { backgroundColor: colors.cardBg, borderColor: colors.border },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View style={[
                    styles.methodIconCircle,
                    { backgroundColor: isExpanded ? 'rgba(255,255,255,0.2)' : methodColor + '15' },
                  ]}>
                    <Ionicons name={iconName} size={22} color={isExpanded ? '#FFF' : methodColor} />
                  </View>
                  <Text style={[
                    styles.methodButtonText,
                    { color: isExpanded ? '#FFF' : colors.textPrimary },
                  ]}>
                    {method?.label ?? key}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isExpanded ? '#FFF' : colors.textSecondary}
                  />
                </Pressable>

                {/* Expanded details */}
                {isExpanded && (
                  <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
                    {/* Fields card */}
                    <View style={styles.bankCard}>
                      {Object.entries(method?.fields ?? {}).map(([fKey, fValue], idx, arr) => (
                        <FieldRow
                          key={fKey}
                          label={FIELD_LABELS[fKey] ?? fKey}
                          value={String(fValue ?? '')}
                          fieldKey={`${key}-${fKey}`}
                          copiedField={copiedField}
                          onCopy={copyToClipboard}
                          styles={styles}
                          colors={colors}
                          isLast={idx === (arr?.length ?? 0) - 1}
                        />
                      ))}
                    </View>

                    {/* Concepto */}
                    <Text style={styles.subSectionTitle}>Concepto</Text>
                    <Pressable
                      onPress={() => copyToClipboard(resolveConcepto(method), `concepto-${key}`)}
                      style={styles.conceptCard}
                    >
                      <Text style={styles.conceptText}>{resolveConcepto(method)}</Text>
                      <View style={styles.copyHint}>
                        <Ionicons
                          name={copiedField === `concepto-${key}` ? 'checkmark-circle' : 'copy-outline'}
                          size={16}
                          color={copiedField === `concepto-${key}` ? colors.success : colors.textSecondary}
                        />
                        <Text style={[styles.copyHintText, copiedField === `concepto-${key}` && { color: colors.success }]}>
                          {copiedField === `concepto-${key}` ? 'Copiado' : 'Toca para copiar'}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Instructions */}
                    <Text style={styles.subSectionTitle}>Instrucciones</Text>
                    <View style={styles.instructionsCard}>
                      {(method?.instrucciones ?? '').split('\n').filter(Boolean).map((line, i) => (
                        <View key={`${key}-inst-${i}`} style={styles.instructionRow}>
                          <View style={[styles.stepCircle, { backgroundColor: methodColor }]}>
                            <Text style={styles.stepNumber}>{i + 1}</Text>
                          </View>
                          <Text style={styles.instructionText}>{line.replace(/^\d+\.\s*/, '')}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Contact buttons */}
                    <View style={styles.contactRow}>
                      <Pressable
                        onPress={() => openWhatsApp(method, method?.label ?? '')}
                        style={({ pressed }) => [
                          styles.contactBtn,
                          { backgroundColor: pressed ? '#20A34D' : '#25D366' },
                        ]}
                      >
                        <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                        <Text style={styles.contactBtnText}>WhatsApp</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => openEmail(method, method?.label ?? '')}
                        style={({ pressed }) => [
                          styles.contactBtn,
                          { backgroundColor: pressed ? methodColor + 'CC' : methodColor },
                        ]}
                      >
                        <Ionicons name="mail-outline" size={20} color="#FFF" />
                        <Text style={styles.contactBtnText}>Correo</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                )}
              </View>
            );
          })}

          <Text style={styles.disclaimer}>
            Tu plan será activado dentro de las siguientes 24 horas hábiles después de verificar el pago.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function FieldRow({ label, value, fieldKey, copiedField, onCopy, styles, colors, isLast = false }: {
  label: string;
  value: string;
  fieldKey: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  styles: any;
  colors: ThemeColors;
  isLast?: boolean;
}) {
  const copied = copiedField === fieldKey;
  return (
    <Pressable onPress={() => onCopy(value, fieldKey)} style={[styles.bankRow, !isLast && styles.bankRowBorder]}>
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

  // Bs Desglose
  desgloseCard: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  desgloseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  desgloseTitleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  desgloseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  desgloseLabel: {
    fontSize: 14,
    color: c.textSecondary,
  },
  desgloseValue: {
    fontSize: 14,
    color: c.textPrimary,
    fontWeight: '500',
  },
  desgloseTotalRow: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    marginTop: 6,
    paddingTop: 8,
  },
  desgloseTotalLabel: {
    fontWeight: '700',
    fontSize: 15,
    color: c.textPrimary,
  },
  desgloseTotalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  desgloseTasa: {
    fontSize: 11,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },

  // Method buttons
  methodContainer: {
    marginBottom: 12,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: 12,
  },
  methodIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },

  // Bank card (fields)
  bankCard: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.border,
    marginTop: 12,
    marginBottom: 12,
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
    marginBottom: 12,
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
    marginBottom: 12,
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
    marginBottom: 8,
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
  contactBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Disclaimer
  disclaimer: {
    fontSize: 12,
    color: c.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
    marginBottom: 20,
  },
});