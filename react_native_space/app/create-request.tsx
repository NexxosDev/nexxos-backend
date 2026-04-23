import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCatalog } from '../src/contexts/CatalogContext';
import { createRequest } from '../src/services/requests';
import { getErrorMessage } from '../src/services/api';
import { Colors, Spacing, BorderRadius } from '../src/theme/colors';
import Button from '../src/components/Button';
import StepIndicator from '../src/components/StepIndicator';
import SelectInput from '../src/components/SelectInput';
import RequestLocationMap from '../src/components/RequestLocationMap';
import type { CatalogItem } from '../src/types';

const TOTAL_STEPS = 4;

export default function CreateRequestScreen() {
  const router = useRouter();
  const catalog = useCatalog();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successModal, setSuccessModal] = useState<{ count: number } | null>(null);

  // Paso 1: Ubicaci\u00f3n
  const [locationData, setLocationData] = useState<{
    filterType: 'radius' | 'state' | 'municipality';
    stateId?: string;
    municipalityId?: string;
    radiusKm?: number;
    latitude?: number;
    longitude?: number;
  } | null>(null);

  // Paso 2: Veh\u00edculo
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');

  // Paso 3: Repuesto
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [description, setDescription] = useState('');

  const [municipalities, setMunicipalities] = useState<CatalogItem[]>([]);
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

  const canNext = (): boolean => {
    if (step === 1) {
      if (!locationData) return false;
      // Si est\u00e1 en modo Radio (default), se habilita cuando tenga ubicaci\u00f3n
      if (locationData.filterType === 'radius') {
        return !!(locationData.latitude && locationData.longitude);
      }
      // Si est\u00e1 en modo Estado, debe seleccionar un estado
      if (locationData.filterType === 'state') {
        return !!locationData.stateId;
      }
      // Si est\u00e1 en modo Municipio, debe seleccionar estado Y municipio
      if (locationData.filterType === 'municipality') {
        return !!(locationData.stateId && locationData.municipalityId);
      }
      return false;
    }
    if (step === 2) return !!(brandId && modelId);
    if (step === 3) return !!(categoryId && description?.trim?.());
    return true;
  };

  const getLocationSummary = () => {
    if (!locationData) return '';
    if (locationData.filterType === 'radius') {
      return `Radio de ${locationData.radiusKm ?? 5} km`;
    }
    if (locationData.filterType === 'state') {
      const stateName = (catalog?.states ?? []).find((s) => s?.id === locationData.stateId)?.name ?? '';
      return `Estado: ${stateName}`;
    }
    if (locationData.filterType === 'municipality') {
      const stateName = (catalog?.states ?? []).find((s) => s?.id === locationData.stateId)?.name ?? '';
      const muniName = (municipalities ?? []).find((m) => m?.id === locationData.municipalityId)?.name ?? '';
      return `${muniName}, ${stateName}`;
    }
    return '';
  };
  const getBrandName = () => (catalog?.brands ?? []).find((b) => b?.id === brandId)?.name ?? '';
  const getModelName = () => (models ?? []).find((m) => m?.id === modelId)?.name ?? '';
  const getCatName = () => (catalog?.categories ?? []).find((c) => c?.id === categoryId)?.name ?? '';
  const getSubName = () => (subcategories ?? []).find((s) => s?.id === subcategoryId)?.name ?? '';

  const handleSubmit = async () => {
    if (!locationData) return;
    setError('');
    setLoading(true);
    try {
      const result = await createRequest({
        stateId: locationData.filterType === 'radius' ? undefined : (locationData.stateId ?? undefined),
        municipalityId: locationData.filterType === 'radius' ? undefined : (locationData.municipalityId ?? undefined),
        searchRadiusKm: locationData.filterType === 'radius' ? (locationData.radiusKm ?? undefined) : undefined,
        latitude: locationData.filterType === 'radius' ? (locationData.latitude ?? undefined) : undefined,
        longitude: locationData.filterType === 'radius' ? (locationData.longitude ?? undefined) : undefined,
        vehicleBrandId: brandId,
        vehicleModelId: modelId,
        partCategoryId: categoryId,
        partSubcategoryId: subcategoryId || undefined,
        freeDescription: description?.trim?.() ?? '',
      });
      setSuccessModal({ count: result?.matchedVendorsCount ?? 0 });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMunicipalitiesNeeded = (stateId: string) => {
    catalog?.loadMunicipalities?.(stateId)?.then?.((items) => setMunicipalities(items ?? []));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <RequestLocationMap
            states={catalog?.states ?? []}
            municipalities={municipalities}
            onLocationChange={setLocationData}
            onMunicipalitiesNeeded={handleMunicipalitiesNeeded}
          />
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>¿Para qué vehículo?</Text>
            <SelectInput label="Marca" items={catalog?.brands ?? []} selectedId={brandId} onSelect={(i) => { setBrandId(i?.id ?? ''); setModelId(''); }} searchable />
            <SelectInput label="Modelo" items={models} selectedId={modelId} onSelect={(i) => setModelId(i?.id ?? '')} searchable />
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>¿Qué repuesto necesitas?</Text>
            <SelectInput label="Categoría" items={catalog?.categories ?? []} selectedId={categoryId} onSelect={(i) => { setCategoryId(i?.id ?? ''); setSubcategoryId(''); }} searchable />
            {(subcategories?.length ?? 0) > 0 ? (
              <SelectInput label="Subcategoría (opcional)" items={subcategories} selectedId={subcategoryId} onSelect={(i) => setSubcategoryId(i?.id ?? '')} />
            ) : null}
            <Text style={styles.fieldLabel}>Descripción</Text>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe con detalle lo que necesitas..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description?.length ?? 0}/500</Text>
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>Confirma tu solicitud</Text>
            <View style={styles.summaryCard}>
              <SummaryRow label="Ubicación" value={getLocationSummary()} onEdit={() => setStep(1)} />
              <SummaryRow label="Vehículo" value={`${getBrandName()} ${getModelName()}`} onEdit={() => setStep(2)} />
              <SummaryRow label="Repuesto" value={`${getCatName()}${getSubName() ? ` - ${getSubName()}` : ''}`} onEdit={() => setStep(3)} />
              <SummaryRow label="Descripción" value={description ?? ''} onEdit={() => setStep(3)} />
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
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Nueva Solicitud</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
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
              <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
            </View>
            <Text style={styles.modalTitle}>¡Solicitud enviada!</Text>
            <Text style={styles.modalText}>
              Se ha enviado a {successModal?.count ?? 0} vendedores compatibles
            </Text>
            <Button title="Ir al Inicio" onPress={() => { setSuccessModal(null); router.back(); }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <View style={summaryStyles.row}>
      <View style={summaryStyles.info}>
        <Text style={summaryStyles.label}>{label}</Text>
        <Text style={summaryStyles.value} numberOfLines={2}>{value}</Text>
      </View>
      <Pressable onPress={onEdit} hitSlop={8}>
        <Ionicons name="pencil-outline" size={18} color={Colors.info} />
      </Pressable>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  info: { flex: 1, marginRight: Spacing.sm },
  label: { fontSize: 12, color: Colors.textSecondary },
  value: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  error: { backgroundColor: '#FEE2E2', color: Colors.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
  stepTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSubtitle, marginBottom: 6, marginTop: Spacing.sm },
  textarea: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: 15, color: Colors.textPrimary, minHeight: 100,
    backgroundColor: Colors.white,
  },
  charCount: { fontSize: 12, color: Colors.textSecondary, textAlign: 'right', marginTop: 4 },
  summaryCard: { backgroundColor: Colors.backgroundSection, borderRadius: BorderRadius.md, padding: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', width: '100%', maxWidth: 340 },
  successIcon: { marginBottom: Spacing.md },
  modalTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  modalText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 22 },
});
