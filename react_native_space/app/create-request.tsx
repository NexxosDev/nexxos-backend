import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCatalog } from '../src/contexts/CatalogContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { createRequest } from '../src/services/requests';
import { getErrorMessage } from '../src/services/api';
import { Spacing, BorderRadius } from '../src/theme/colors';
import type { ThemeColors } from '../src/theme/colors';
import Button from '../src/components/Button';
import StepIndicator from '../src/components/StepIndicator';
import SelectInput from '../src/components/SelectInput';
import RequestLocationMap from '../src/components/RequestLocationMap';
import PartSearchInput from '../src/components/PartSearchInput';
import BrandLogo from '../src/components/BrandLogo';
import { getCategoryIcon } from '../src/utils/categoryIcons';
import { decodeVin } from '../src/services/catalog';
import type { PartSearchResult, VinDecodeResult } from '../src/services/catalog';
import type { CatalogItem } from '../src/types';

const TOTAL_STEPS = 4;

export default function CreateRequestScreen() {
  const router = useRouter();
  const catalog = useCatalog();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sStyles = useMemo(() => createSummaryStyles(colors), [colors]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successModal, setSuccessModal] = useState<{ count: number } | null>(null);

  const [locationData, setLocationData] = useState<{
    filterType: 'radius' | 'state' | 'municipality' | 'parish';
    stateId?: string; municipalityId?: string; parishId?: string; radiusKm?: number;
    latitude?: number; longitude?: number;
  } | null>(null);
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleYear, setVehicleYear] = useState<number | undefined>(undefined);
  const [vinInput, setVinInput] = useState('');
  const [vinLoading, setVinLoading] = useState(false);
  const [vinResult, setVinResult] = useState<VinDecodeResult | null>(null);
  const [municipalities, setMunicipalities] = useState<CatalogItem[]>([]);
  const [parishes, setParishes] = useState<CatalogItem[]>([]);
  const [models, setModels] = useState<CatalogItem[]>([]);
  const [subcategories, setSubcategories] = useState<CatalogItem[]>([]);

  useEffect(() => { catalog?.loadStates?.(); catalog?.loadBrands?.(); catalog?.loadCategories?.(); }, []);
  useEffect(() => {
    if (brandId) { catalog?.loadModels?.(brandId)?.then?.((items) => setModels(items ?? [])); }
    else { setModels([]); setModelId(''); }
  }, [brandId]);
  useEffect(() => {
    if (categoryId) { catalog?.loadSubcategories?.(categoryId)?.then?.((items) => setSubcategories(items ?? [])); }
    else { setSubcategories([]); setSubcategoryId(''); }
  }, [categoryId]);

  const yearOptions = useMemo(() => {
    const maxYear = new Date().getFullYear() + 1;
    const items: CatalogItem[] = [];
    for (let y = maxYear; y >= 1980; y--) {
      items.push({ id: String(y), name: String(y) });
    }
    return items;
  }, []);

  const renderBrandIcon = useCallback((item: CatalogItem) => (
    <BrandLogo brandName={item?.name ?? ''} size={24} />
  ), []);

  const renderCategoryIcon = useCallback((item: CatalogItem) => (
    <Ionicons name={getCategoryIcon(item?.name ?? '') as any} size={20} color={colors.primary} />
  ), [colors.primary]);

  const handlePartSearchSelect = useCallback(async (result: PartSearchResult) => {
    setCategoryId(result?.categoryId ?? '');
    setSubcategoryId(result?.subcategoryId ?? '');
    // Load subcategories for the selected category so the dropdown is populated
    if (result?.categoryId) {
      const items = await catalog?.loadSubcategories?.(result.categoryId) ?? [];
      setSubcategories(items ?? []);
    }
  }, [catalog]);

  const handleDecodeVin = useCallback(async () => {
    const clean = (vinInput ?? '').trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, '');
    if (clean.length !== 17) return;
    setVinLoading(true);
    setVinResult(null);
    try {
      const result = await decodeVin(clean);
      setVinResult(result);
      if (result?.matched?.brandId) {
        setBrandId(result.matched.brandId);
        const loadedModels = await catalog?.loadModels?.(result.matched.brandId) ?? [];
        setModels(loadedModels);
        if (result?.matched?.modelId) {
          setModelId(result.matched.modelId);
        }
      }
      // Auto-set year from VIN decode
      if (result?.nhtsa?.year) {
        const yr = Number(result.nhtsa.year);
        if (yr >= 1980 && yr <= new Date().getFullYear() + 1) setVehicleYear(yr);
      }
    } catch (err) {
      setVinResult({
        success: false, vin: clean, message: 'Error al decodificar VIN. Intenta de nuevo.',
        nhtsa: { make: null, model: null, year: null, engineModel: null, engineCylinders: null, displacementL: null, fuelType: null, bodyClass: null },
        matched: { brandId: null, brandName: null, modelId: null, modelName: null },
      });
    } finally { setVinLoading(false); }
  }, [vinInput, catalog]);

  const canNext = (): boolean => {
    if (step === 1) {
      if (!locationData) return false;
      if (locationData.filterType === 'radius') return !!(locationData.latitude && locationData.longitude);
      if (locationData.filterType === 'state') return !!locationData.stateId;
      if (locationData.filterType === 'municipality') return !!(locationData.stateId && locationData.municipalityId);
      if (locationData.filterType === 'parish') return !!(locationData.stateId && locationData.municipalityId && locationData.parishId);
      return false;
    }
    if (step === 2) return !!(brandId && modelId);
    if (step === 3) return !!(categoryId && description?.trim?.());
    return true;
  };

  const getLocationSummary = () => {
    if (!locationData) return '';
    if (locationData.filterType === 'radius') return `Radio de ${locationData.radiusKm ?? 5} km`;
    if (locationData.filterType === 'state') {
      const stateName = (catalog?.states ?? []).find((s) => s?.id === locationData.stateId)?.name ?? '';
      return `Estado: ${stateName}`;
    }
    if (locationData.filterType === 'municipality') {
      const stateName = (catalog?.states ?? []).find((s) => s?.id === locationData.stateId)?.name ?? '';
      const muniName = (municipalities ?? []).find((m) => m?.id === locationData.municipalityId)?.name ?? '';
      return `${muniName}, ${stateName}`;
    }
    if (locationData.filterType === 'parish') {
      const stateName = (catalog?.states ?? []).find((s) => s?.id === locationData.stateId)?.name ?? '';
      const muniName = (municipalities ?? []).find((m) => m?.id === locationData.municipalityId)?.name ?? '';
      const parishName = (parishes ?? []).find((p) => p?.id === locationData.parishId)?.name ?? '';
      return `${parishName}, ${muniName}, ${stateName}`;
    }
    return '';
  };
  const getBrandName = () => (catalog?.brands ?? []).find((b) => b?.id === brandId)?.name ?? '';
  const getModelName = () => (models ?? []).find((m) => m?.id === modelId)?.name ?? '';
  const getCatName = () => (catalog?.categories ?? []).find((c2) => c2?.id === categoryId)?.name ?? '';
  const getSubName = () => (subcategories ?? []).find((s) => s?.id === subcategoryId)?.name ?? '';

  const handleSubmit = async () => {
    if (!locationData) return;
    setError(''); setLoading(true);
    try {
      const result = await createRequest({
        stateId: locationData.filterType === 'radius' ? undefined : (locationData.stateId ?? undefined),
        municipalityId: locationData.filterType === 'radius' ? undefined : (locationData.municipalityId ?? undefined),
        parishId: locationData.filterType === 'parish' ? (locationData.parishId ?? undefined) : undefined,
        searchRadiusKm: locationData.filterType === 'radius' ? (locationData.radiusKm ?? undefined) : undefined,
        latitude: locationData.latitude ?? undefined,
        longitude: locationData.longitude ?? undefined,
        vehicleBrandId: brandId,
        vehicleModelId: modelId,
        vehicleYear: vehicleYear ?? undefined,
        partCategoryId: categoryId,
        partSubcategoryId: subcategoryId || undefined,
        freeDescription: description?.trim?.() ?? '',
      });
      setSuccessModal({ count: result?.matchedVendorsCount ?? 0 });
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };

  const handleMunicipalitiesNeeded = (stateId: string) => {
    catalog?.loadMunicipalities?.(stateId)?.then?.((items) => setMunicipalities(items ?? []));
  };
  const handleParishesNeeded = (municipalityId: string) => {
    catalog?.loadParishes?.(municipalityId)?.then?.((items) => setParishes(items ?? []));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <RequestLocationMap states={catalog?.states ?? []} municipalities={municipalities} parishes={parishes} onLocationChange={setLocationData} onMunicipalitiesNeeded={handleMunicipalitiesNeeded} onParishesNeeded={handleParishesNeeded} />;
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>¿Para qué vehículo?</Text>

            {/* VIN Input */}
            <Text style={styles.fieldLabel}>Código VIN (opcional)</Text>
            <View style={styles.vinRow}>
              <TextInput
                style={styles.vinInput}
                value={vinInput}
                onChangeText={(t) => { setVinInput((t ?? '').toUpperCase()); setVinResult(null); }}
                placeholder="Ej: 8XXXXXXXXXXX12345"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                maxLength={17}
                editable={!vinLoading}
              />
              <Pressable
                style={[styles.vinBtn, ((vinInput ?? '').trim().length !== 17 || vinLoading) && styles.vinBtnDisabled]}
                onPress={handleDecodeVin}
                disabled={(vinInput ?? '').trim().length !== 17 || vinLoading}
              >
                {vinLoading
                  ? <ActivityIndicator size="small" color={colors.accent} />
                  : <Ionicons name="search" size={20} color={(vinInput ?? '').trim().length === 17 ? colors.accent : colors.textSecondary} />
                }
              </Pressable>
            </View>
            <Text style={styles.vinHint}>17 caracteres — lo encuentras en el tablero o la puerta del conductor</Text>

            {/* VIN Result Feedback */}
            {vinResult ? (
              <View style={[styles.vinFeedback, vinResult.success ? styles.vinFeedbackSuccess : styles.vinFeedbackWarn]}>
                <Ionicons
                  name={vinResult.success ? 'checkmark-circle' : 'information-circle'}
                  size={18}
                  color={vinResult.success ? colors.success : colors.warning}
                />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.vinFeedbackText, { color: vinResult.success ? colors.success : colors.warning }]}>
                    {vinResult.message}
                  </Text>
                  {vinResult.nhtsa?.year || vinResult.nhtsa?.engineCylinders || vinResult.nhtsa?.fuelType ? (
                    <Text style={styles.vinMeta}>
                      {[vinResult.nhtsa.year ? `Año: ${vinResult.nhtsa.year}` : null, vinResult.nhtsa.displacementL ? `Motor: ${vinResult.nhtsa.displacementL}L` : null, vinResult.nhtsa.fuelType ?? null].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o selecciona manualmente</Text>
              <View style={styles.dividerLine} />
            </View>

            <SelectInput label="Marca" items={catalog?.brands ?? []} selectedId={brandId} onSelect={(i) => { setBrandId(i?.id ?? ''); setModelId(''); setVinResult(null); }} searchable renderItemIcon={renderBrandIcon} />
            <SelectInput label="Modelo" items={models} selectedId={modelId} onSelect={(i) => { setModelId(i?.id ?? ''); }} searchable />
            <SelectInput label="Año (opcional)" items={yearOptions} selectedId={vehicleYear ? String(vehicleYear) : ''} onSelect={(i) => { setVehicleYear(i?.id ? Number(i.id) : undefined); }} searchable placeholder="Selecciona el año" />
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>¿Qué repuesto necesitas?</Text>
            <PartSearchInput onSelect={handlePartSearchSelect} onClear={() => { setCategoryId(''); setSubcategoryId(''); setSubcategories([]); }} />
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o selecciona manualmente</Text>
              <View style={styles.dividerLine} />
            </View>
            <SelectInput label="Categoría" items={catalog?.categories ?? []} selectedId={categoryId} onSelect={(i) => { setCategoryId(i?.id ?? ''); setSubcategoryId(''); }} searchable renderItemIcon={renderCategoryIcon} />
            {(subcategories?.length ?? 0) > 0 ? (
              <SelectInput label="Subcategoría (opcional)" items={subcategories} selectedId={subcategoryId} onSelect={(i) => setSubcategoryId(i?.id ?? '')} searchable renderItemIcon={renderCategoryIcon} />
            ) : null}
            <Text style={styles.fieldLabel}>Descripción</Text>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe con detalle lo que necesitas..."
              placeholderTextColor={colors.textSecondary}
              multiline numberOfLines={4} maxLength={500} textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description?.length ?? 0}/500</Text>
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>Confirma tu solicitud</Text>
            <View style={styles.summaryCard}>
              <SummaryRow label="Ubicación" value={getLocationSummary()} onEdit={() => setStep(1)} c={colors} />
              <SummaryRow label="Vehículo" value={`${getBrandName()} ${getModelName()}${vehicleYear ? ` ${vehicleYear}` : ''}`} onEdit={() => setStep(2)} c={colors} />
              <SummaryRow label="Repuesto" value={`${getCatName()}${getSubName() ? ` - ${getSubName()}` : ''}`} onEdit={() => setStep(3)} c={colors} />
              <SummaryRow label="Descripción" value={description ?? ''} onEdit={() => setStep(3)} c={colors} />
            </View>
          </View>
        );
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.topBar}>
          <Pressable onPress={() => step > 1 ? setStep((s) => s - 1) : router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Nueva Solicitud</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          {step < TOTAL_STEPS ? (
            <Button title="Siguiente" onPress={() => setStep((s) => s + 1)} disabled={!canNext()} />
          ) : (
            <Button title="Enviar Solicitud" onPress={handleSubmit} loading={loading} />
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!successModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            </View>
            <Text style={styles.modalTitle}>¡Solicitud enviada!</Text>
            <Text style={styles.modalText}>Estamos buscando vendedores para ti.{'\n'}Te notificaremos cuando respondan</Text>
            <Button title="Ir al Inicio" onPress={() => { setSuccessModal(null); router.back(); }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, onEdit, c }: { label: string; value: string; onEdit: () => void; c: ThemeColors }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}>
      <View style={{ flex: 1, marginRight: Spacing.sm }}>
        <Text style={{ fontSize: 12, color: c.textSecondary }}>{label}</Text>
        <Text style={{ fontSize: 14, color: c.textPrimary, fontWeight: '500', marginTop: 2 }} numberOfLines={2}>{value}</Text>
      </View>
      <Pressable onPress={onEdit} hitSlop={8}>
        <Ionicons name="pencil-outline" size={18} color={c.info} />
      </Pressable>
    </View>
  );
}

const createSummaryStyles = (c: ThemeColors) => StyleSheet.create({});

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: c.textPrimary },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface },
  error: { backgroundColor: c.errorBg, color: c.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
  stepTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: Spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: c.textSubtitle, marginBottom: 6, marginTop: Spacing.sm },
  textarea: {
    borderWidth: 1, borderColor: c.border, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: 15, color: c.textPrimary, minHeight: 100, backgroundColor: c.inputBg,
  },
  charCount: { fontSize: 12, color: c.textSecondary, textAlign: 'right', marginTop: 4 },
  vinRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vinInput: {
    flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: 15, color: c.textPrimary, backgroundColor: c.inputBg,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    letterSpacing: 1,
  },
  vinBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: c.primary,
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  vinBtnDisabled: { backgroundColor: c.backgroundSection, opacity: 0.6 },
  vinHint: { fontSize: 11, color: c.textSecondary, marginTop: 4, marginBottom: Spacing.sm },
  vinFeedback: {
    flexDirection: 'row' as const, alignItems: 'flex-start' as const,
    padding: Spacing.sm, borderRadius: BorderRadius.sm, marginBottom: Spacing.md,
  },
  vinFeedbackSuccess: { backgroundColor: 'rgba(16,185,129,0.12)' },
  vinFeedbackWarn: { backgroundColor: 'rgba(245,158,11,0.12)' },
  vinFeedbackText: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  vinMeta: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
  dividerText: { fontSize: 12, color: c.textSecondary, marginHorizontal: Spacing.sm },
  summaryCard: { backgroundColor: c.backgroundSection, borderRadius: BorderRadius.md, padding: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: c.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: c.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', width: '100%', maxWidth: 340 },
  successIcon: { marginBottom: Spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '700', color: c.textPrimary, marginBottom: Spacing.sm },
  modalText: { fontSize: 15, color: c.textSecondary, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 22 },
});
