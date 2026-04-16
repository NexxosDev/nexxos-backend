import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCatalog } from '../../src/contexts/CatalogContext';
import { getErrorMessage } from '../../src/services/api';
import { uploadFile } from '../../src/services/upload';
import { Colors, Spacing, BorderRadius } from '../../src/theme/colors';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import StepIndicator from '../../src/components/StepIndicator';
import SelectInput from '../../src/components/SelectInput';
import MapLocationPicker from '../../src/components/MapLocationPicker';
import type { CatalogItem } from '../../src/types';

const TOTAL_STEPS = 6;

export default function RegisterVendorScreen() {
  const router = useRouter();
  const { signup, user } = useAuth();
  const catalog = useCatalog();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [personal, setPersonal] = useState({ firstName: '', lastName: '', phone: '', documentId: '', email: '', password: '', confirmPassword: '' });
  const [business, setBusiness] = useState({ businessName: '', rif: '', docImageUri: '', docImagePath: '', logoUri: '', logoPath: '' });
  const [location, setLocation] = useState({
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    country: '',
    city: '',
    state: '',
    municipality: '',
    parish: '',
    street: '',
    postalCode: '',
    referencePoint: '',
    fullAddress: '',
  });
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  const [modelsMap, setModelsMap] = useState<Record<string, CatalogItem[]>>({});
  const [subcategoriesMap, setSubcategoriesMap] = useState<Record<string, CatalogItem[]>>({});

  useEffect(() => {
    if (user) router.replace('/role-selection');
  }, [user]);

  useEffect(() => { catalog?.loadBrands?.(); catalog?.loadCategories?.(); }, []);

  const loadModelsForBrand = useCallback(async (brandId: string) => {
    if (!modelsMap?.[brandId]) {
      const items = await catalog?.loadModels?.(brandId) ?? [];
      setModelsMap((prev) => ({ ...(prev ?? {}), [brandId]: items }));
    }
  }, [modelsMap, catalog]);

  const loadSubsForCategory = useCallback(async (catId: string) => {
    if (!subcategoriesMap?.[catId]) {
      const items = await catalog?.loadSubcategories?.(catId) ?? [];
      setSubcategoriesMap((prev) => ({ ...(prev ?? {}), [catId]: items }));
    }
  }, [subcategoriesMap, catalog]);

  const pickImage = async (type: 'doc' | 'logo') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result?.canceled && result?.assets?.[0]?.uri) {
        if (type === 'doc') setBusiness((p) => ({ ...(p ?? {}), docImageUri: result.assets[0].uri }));
        else setBusiness((p) => ({ ...(p ?? {}), logoUri: result.assets[0].uri }));
      }
    } catch { }
  };

  const toggleBrand = (brandId: string) => {
    setSelectedBrands((prev) => {
      const arr = prev ?? [];
      if (arr.includes(brandId)) {
        setSelectedModels((m) => (m ?? []).filter((mid) => !(modelsMap?.[brandId] ?? []).some((model) => model?.id === mid)));
        return arr.filter((id) => id !== brandId);
      }
      loadModelsForBrand(brandId);
      return [...arr, brandId];
    });
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      const arr = prev ?? [];
      return arr.includes(modelId) ? arr.filter((id) => id !== modelId) : [...arr, modelId];
    });
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) => {
      const arr = prev ?? [];
      if (arr.includes(catId)) {
        setSelectedSubcategories((s) => (s ?? []).filter((sid) => !(subcategoriesMap?.[catId] ?? []).some((sub) => sub?.id === sid)));
        return arr.filter((id) => id !== catId);
      }
      loadSubsForCategory(catId);
      return [...arr, catId];
    });
  };

  const toggleSubcategory = (subId: string) => {
    setSelectedSubcategories((prev) => {
      const arr = prev ?? [];
      return arr.includes(subId) ? arr.filter((id) => id !== subId) : [...arr, subId];
    });
  };

    const canNext = (): boolean => {
    if (step === 1) return !!(personal?.firstName?.trim?.() && personal?.lastName?.trim?.() && personal?.phone?.trim?.() && personal?.documentId?.trim?.() && personal?.email?.trim?.() && personal?.password && personal?.password === personal?.confirmPassword && (personal?.password?.length ?? 0) >= 6);
    if (step === 2) return !!(business?.businessName?.trim?.() && business?.rif?.trim?.());
    if (step === 3) return !!(location?.latitude && location?.longitude && location?.fullAddress?.trim?.());
    if (step === 4) return (selectedModels?.length ?? 0) > 0;
    if (step === 5) return (selectedSubcategories?.length ?? 0) > 0 || (selectedCategories?.length ?? 0) > 0;
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      let docPath = business?.docImagePath ?? '';
      let logoPathVal = business?.logoPath ?? '';

      if (business?.docImageUri && !docPath) {
        docPath = await uploadFile(business.docImageUri, 'doc_id.jpg', 'image/jpeg', false);
      }
      if (business?.logoUri && !logoPathVal) {
        logoPathVal = await uploadFile(business.logoUri, 'logo.jpg', 'image/jpeg', true);
      }

      const subcatIds = (selectedSubcategories?.length ?? 0) > 0 ? selectedSubcategories : [];

      await signup({
        email: personal?.email?.trim?.() ?? '',
        password: personal?.password ?? '',
        name: `${personal?.firstName?.trim?.() ?? ''} ${personal?.lastName?.trim?.() ?? ''}`,
        firstName: personal?.firstName?.trim?.() ?? '',
        lastName: personal?.lastName?.trim?.() ?? '',
        phone: personal?.phone?.trim?.() ?? '',
        documentId: personal?.documentId?.trim?.() ?? '',
        role: 'VENDEDOR',
        vendor: {
          businessName: business?.businessName?.trim?.() ?? '',
          rif: business?.rif?.trim?.() ?? '',
          country: location?.country ?? '',
          city: location?.city ?? '',
          state: location?.state ?? '',
          municipality: location?.municipality ?? '',
          parish: location?.parish ?? '',
          street: location?.street ?? '',
          postalCode: location?.postalCode ?? '',
          latitude: location?.latitude,
          longitude: location?.longitude,
          referencePoint: location?.referencePoint ?? '',
          fullAddress: location?.fullAddress ?? '',
          vehicleModelIds: selectedModels ?? [],
          partSubcategoryIds: subcatIds ?? [],
          documentImagePath: docPath || undefined,
          logoPath: logoPathVal || undefined,
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Datos Personales</Text>
            <Input label="Nombre" value={personal.firstName} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), firstName: v }))} />
            <Input label="Apellido" value={personal.lastName} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), lastName: v }))} />
            <Input label="Cédula" value={personal.documentId} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), documentId: v }))} keyboardType="numeric" />
            <Input label="Teléfono" value={personal.phone} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), phone: v }))} keyboardType="phone-pad" />
            <Input label="Email" value={personal.email} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), email: v }))} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Contraseña" value={personal.password} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), password: v }))} secureTextEntry />
            <Input label="Confirmar Contraseña" value={personal.confirmPassword} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), confirmPassword: v }))} secureTextEntry />
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Datos del Negocio</Text>
            <Input label="Razón Social" value={business.businessName} onChangeText={(v) => setBusiness((p) => ({ ...(p ?? {}), businessName: v }))} />
            <Input label="RIF" value={business.rif} onChangeText={(v) => setBusiness((p) => ({ ...(p ?? {}), rif: v }))} />
            <Text style={styles.fieldLabel}>Documento de Identidad</Text>
            <Pressable style={styles.imagePicker} onPress={() => pickImage('doc')}>
              {business?.docImageUri ? <Image source={{ uri: business.docImageUri }} style={styles.imagePreview} /> : <Ionicons name="camera-outline" size={32} color={Colors.textSecondary} />}
              <Text style={styles.imagePickerText}>{business?.docImageUri ? 'Cambiar foto' : 'Seleccionar foto'}</Text>
            </Pressable>
            <Text style={styles.fieldLabel}>Logo (opcional)</Text>
            <Pressable style={styles.imagePicker} onPress={() => pickImage('logo')}>
              {business?.logoUri ? <Image source={{ uri: business.logoUri }} style={styles.imagePreview} /> : <Ionicons name="image-outline" size={32} color={Colors.textSecondary} />}
              <Text style={styles.imagePickerText}>{business?.logoUri ? 'Cambiar logo' : 'Seleccionar logo'}</Text>
            </Pressable>
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>Ubicación</Text>
            <Text style={styles.stepDesc}>
              Selecciona tu ubicación exacta en el mapa. Arrastra el marcador para ajustar y presiona el botón para actualizar la dirección.
            </Text>
            <MapLocationPicker
              onLocationUpdate={(loc) => setLocation((p) => ({ ...(p ?? {}), ...loc }))}
              initialLocation={location?.latitude && location?.longitude ? { latitude: location.latitude, longitude: location.longitude } : undefined}
            />
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>¿Qué vehículos manejas?</Text>
            <Text style={styles.stepDesc}>Selecciona marcas y luego modelos</Text>
            <View style={styles.chipContainer}>
              {(catalog?.brands ?? []).map((b) => (
                <Pressable key={b?.id} style={[styles.chip, (selectedBrands ?? []).includes(b?.id ?? '') && styles.chipSelected]} onPress={() => toggleBrand(b?.id ?? '')}>
                  <Text style={[styles.chipText, (selectedBrands ?? []).includes(b?.id ?? '') && styles.chipTextSelected]}>{b?.name ?? ''}</Text>
                </Pressable>
              ))}
            </View>
            {(selectedBrands ?? []).map((brandId) => {
              const brand = (catalog?.brands ?? []).find((b) => b?.id === brandId);
              const models = modelsMap?.[brandId] ?? [];
              return (
                <View key={brandId} style={styles.modelSection}>
                  <Text style={styles.modelBrand}>{brand?.name ?? ''}</Text>
                  <View style={styles.chipContainer}>
                    {(models ?? []).map((m) => (
                      <Pressable key={m?.id} style={[styles.chip, styles.chipSmall, (selectedModels ?? []).includes(m?.id ?? '') && styles.chipSelected]} onPress={() => toggleModel(m?.id ?? '')}>
                        <Text style={[styles.chipTextSmall, (selectedModels ?? []).includes(m?.id ?? '') && styles.chipTextSelected]}>{m?.name ?? ''}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        );
      case 5:
        return (
          <View>
            <Text style={styles.stepTitle}>¿Qué repuestos ofreces?</Text>
            <Text style={styles.stepDesc}>Selecciona categorías y subcategorías</Text>
            {(catalog?.categories ?? []).map((cat) => {
              const isSelected = (selectedCategories ?? []).includes(cat?.id ?? '');
              const subs = subcategoriesMap?.[cat?.id ?? ''] ?? [];
              return (
                <View key={cat?.id}>
                  <Pressable style={[styles.categoryRow, isSelected && styles.categoryRowSelected]} onPress={() => toggleCategory(cat?.id ?? '')}>
                    <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>{cat?.name ?? ''}</Text>
                    <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? Colors.primary : Colors.border} />
                  </Pressable>
                  {isSelected && (subs?.length ?? 0) > 0 ? (
                    <View style={styles.chipContainer}>
                      {(subs ?? []).map((sub) => (
                        <Pressable key={sub?.id} style={[styles.chip, styles.chipSmall, (selectedSubcategories ?? []).includes(sub?.id ?? '') && styles.chipSelected]} onPress={() => toggleSubcategory(sub?.id ?? '')}>
                          <Text style={[styles.chipTextSmall, (selectedSubcategories ?? []).includes(sub?.id ?? '') && styles.chipTextSelected]}>{sub?.name ?? ''}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        );
      case 6:
        return (
          <View>
            <Text style={styles.stepTitle}>Confirmación</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Nombre</Text>
              <Text style={styles.summaryValue}>{personal?.firstName ?? ''} {personal?.lastName ?? ''}</Text>
              <Text style={styles.summaryLabel}>Negocio</Text>
              <Text style={styles.summaryValue}>{business?.businessName ?? ''} - {business?.rif ?? ''}</Text>
              <Text style={styles.summaryLabel}>Email</Text>
              <Text style={styles.summaryValue}>{personal?.email ?? ''}</Text>
              <Text style={styles.summaryLabel}>Modelos seleccionados</Text>
              <Text style={styles.summaryValue}>{selectedModels?.length ?? 0} modelos</Text>
              <Text style={styles.summaryLabel}>Categorías seleccionadas</Text>
              <Text style={styles.summaryValue}>{selectedCategories?.length ?? 0} categorías</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.topBar}>
          <Pressable onPress={() => step > 1 ? setStep((s) => s - 1) : router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Registro de Vendedor</Text>
          <View style={{ width: 44 }} />
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
            <Button title="Crear Cuenta" onPress={handleSubmit} loading={loading} disabled={!canNext()} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  error: { backgroundColor: '#FEE2E2', color: Colors.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
  stepTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  stepDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSubtitle, marginBottom: 6, marginTop: Spacing.sm },
  imagePicker: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, borderStyle: 'dashed',
    padding: Spacing.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  imagePreview: { width: 100, height: 100, borderRadius: 8, marginBottom: Spacing.sm },
  imagePickerText: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.chipBg },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 6 },
  chipSelected: { backgroundColor: Colors.chipSelectedBg },
  chipText: { fontSize: 14, color: Colors.textSubtitle },
  chipTextSmall: { fontSize: 12, color: Colors.textSubtitle },
  chipTextSelected: { color: Colors.accent, fontWeight: '600' },
  modelSection: { marginBottom: Spacing.md },
  modelBrand: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  categoryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm,
    marginBottom: 4, backgroundColor: Colors.backgroundSection,
  },
  categoryRowSelected: { backgroundColor: `${Colors.primary}15` },
  categoryText: { fontSize: 15, color: Colors.textPrimary },
  categoryTextSelected: { fontWeight: '600', color: Colors.primary },
  summaryCard: { backgroundColor: Colors.backgroundSection, borderRadius: BorderRadius.md, padding: Spacing.md },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.sm },
  summaryValue: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
});
