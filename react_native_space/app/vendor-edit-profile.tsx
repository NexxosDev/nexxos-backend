import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert, Modal, Switch, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../src/services/upload';
import { getVendorProfile, updateVendorProfile } from '../src/services/vendor';
import { getErrorMessage } from '../src/services/api';
import { useCatalog } from '../src/contexts/CatalogContext';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import type { ThemeColors } from '../src/theme/colors';
import { Spacing, BorderRadius } from '../src/theme/colors';
import Button from '../src/components/Button';
import LoadingSpinner from '../src/components/LoadingSpinner';
import CollapsibleSection from '../src/components/CollapsibleSection';
import VehicleAccordion from '../src/components/VehicleAccordion';
import PartsAccordion from '../src/components/PartsAccordion';
import QuickRepliesManager from '../src/components/QuickRepliesManager';
import DeleteAccountModal from '../src/components/DeleteAccountModal';
import type { VendorProfile, CatalogItem } from '../src/types';

export default function VendorEditProfileScreen() {
  const router = useRouter();
  const catalog = useCatalog();
  const { logout } = useAuth();
  const { colors } = useTheme();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  // Envíos / delivery
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false);
  const [freeShippingRadiusKm, setFreeShippingRadiusKm] = useState('');
  const [ownDeliveryEnabled, setOwnDeliveryEnabled] = useState(false);
  const [ownDeliveryCost, setOwnDeliveryCost] = useState('');
  const [ownDeliveryPricingMode, setOwnDeliveryPricingMode] = useState<'FIXED' | 'PER_KM'>('FIXED');
  const [ownDeliveryPerKm, setOwnDeliveryPerKm] = useState('');
  const [ownDeliveryMaxKm, setOwnDeliveryMaxKm] = useState('');
  const [ownDeliveryFlatFromKm, setOwnDeliveryFlatFromKm] = useState('');
  const [ownDeliveryFlatCost, setOwnDeliveryFlatCost] = useState('');

  // Facade image
  const [facadeUri, setFacadeUri] = useState<string | null>(null); // local pick URI
  const [facadeRemoteUrl, setFacadeRemoteUrl] = useState<string | null>(null); // existing server URL
  const [facadePreview, setFacadePreview] = useState(false);

  const [modelsMap, setModelsMap] = useState<Record<string, CatalogItem[]>>({});
  const [subcategoriesMap, setSubcategoriesMap] = useState<Record<string, CatalogItem[]>>({});

  useEffect(() => {
    catalog?.loadBrands?.();
  }, []);

  // Keep latest refs to avoid re-registering the focus effect on every render
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const subMapRef = useRef(subcategoriesMap);
  subMapRef.current = subcategoriesMap;

  // Force-refresh catalog from server whenever the screen gains focus, so
  // categories/subcategories newly added by the admin appear without an app restart.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await catalogRef.current?.loadCategories?.(true);
        const catIds = Object.keys(subMapRef.current ?? {});
        for (const catId of catIds) {
          const items = (await catalogRef.current?.loadSubcategories?.(catId, true)) ?? [];
          if (active) setSubcategoriesMap((prev) => ({ ...(prev ?? {}), [catId]: items }));
        }
      })();
      return () => { active = false; };
    }, [])
  );

  useEffect(() => {
    (async () => {
      try {
        const p = await getVendorProfile();
        setProfile(p ?? null);
        if (p?.facadeImageUrl) setFacadeRemoteUrl(p.facadeImageUrl);
        setFreeShippingEnabled(p?.freeShippingEnabled === true);
        setFreeShippingRadiusKm(p?.freeShippingRadiusKm != null ? String(p.freeShippingRadiusKm) : '');
        setOwnDeliveryEnabled(p?.ownDeliveryEnabled === true);
        setOwnDeliveryCost(p?.ownDeliveryCost != null ? String(p.ownDeliveryCost) : '');
        setOwnDeliveryPricingMode(p?.ownDeliveryPricingMode === 'PER_KM' ? 'PER_KM' : 'FIXED');
        setOwnDeliveryPerKm(p?.ownDeliveryPerKm != null ? String(p.ownDeliveryPerKm) : '');
        setOwnDeliveryMaxKm(p?.ownDeliveryMaxKm != null ? String(p.ownDeliveryMaxKm) : '');
        setOwnDeliveryFlatFromKm(p?.ownDeliveryFlatFromKm != null ? String(p.ownDeliveryFlatFromKm) : '');
        setOwnDeliveryFlatCost(p?.ownDeliveryFlatCost != null ? String(p.ownDeliveryFlatCost) : '');
        const models = p?.vehicleModels ?? [];
        const brandIds = [...new Set(models.map((m) => m?.brand?.id).filter(Boolean))] as string[];
        setSelectedModels(models.map((m) => m?.id).filter(Boolean) as string[]);
        for (const brandId of brandIds) {
          const items = await catalog?.loadModels?.(brandId) ?? [];
          setModelsMap((prev) => ({ ...(prev ?? {}), [brandId]: items }));
        }
        const subs = p?.partSubcategories ?? [];
        const catIds = [...new Set(subs.map((s) => s?.category?.id).filter(Boolean))] as string[];
        setSelectedSubcategories(subs.map((s) => s?.id).filter(Boolean) as string[]);
        for (const catId of catIds) {
          const items = await catalog?.loadSubcategories?.(catId) ?? [];
          setSubcategoriesMap((prev) => ({ ...(prev ?? {}), [catId]: items }));
        }
      } catch { }
      setLoading(false);
    })();
  }, []);

  const loadModelsForBrand = useCallback(async (brandId: string) => {
    if (!modelsMap?.[brandId]) {
      const items = await catalog?.loadModels?.(brandId) ?? [];
      setModelsMap((prev) => ({ ...(prev ?? {}), [brandId]: items }));
    }
  }, [modelsMap, catalog]);

  const loadSubsForCategory = useCallback(async (catId: string) => {
    // Always force-refresh from server so subcategories newly added by the
    // admin appear immediately when the category is expanded.
    const items = await catalog?.loadSubcategories?.(catId, true) ?? [];
    setSubcategoriesMap((prev) => ({ ...(prev ?? {}), [catId]: items }));
  }, [catalog]);

  const toggleModel = useCallback((modelId: string) => {
    setSelectedModels((prev) => {
      const arr = prev ?? [];
      return arr.includes(modelId) ? arr.filter((id) => id !== modelId) : [...arr, modelId];
    });
  }, []);

  const selectAllModels = useCallback((brandId: string) => {
    const brandModels = modelsMap?.[brandId] ?? [];
    const ids = brandModels.map((m) => m?.id).filter(Boolean) as string[];
    setSelectedModels((prev) => [...new Set([...(prev ?? []), ...ids])]);
  }, [modelsMap]);

  const deselectAllModels = useCallback((brandId: string) => {
    const brandModelIds = new Set((modelsMap?.[brandId] ?? []).map((m) => m?.id).filter(Boolean));
    setSelectedModels((prev) => (prev ?? []).filter((id) => !brandModelIds.has(id)));
  }, [modelsMap]);

  const toggleSubcategory = useCallback((subId: string) => {
    setSelectedSubcategories((prev) => {
      const arr = prev ?? [];
      return arr.includes(subId) ? arr.filter((id) => id !== subId) : [...arr, subId];
    });
  }, []);

  const selectAllSubs = useCallback((catId: string) => {
    const catSubs = subcategoriesMap?.[catId] ?? [];
    const ids = catSubs.map((s) => s?.id).filter(Boolean) as string[];
    setSelectedSubcategories((prev) => [...new Set([...(prev ?? []), ...ids])]);
  }, [subcategoriesMap]);

  const deselectAllSubs = useCallback((catId: string) => {
    const catSubIds = new Set((subcategoriesMap?.[catId] ?? []).map((s) => s?.id).filter(Boolean));
    setSelectedSubcategories((prev) => (prev ?? []).filter((id) => !catSubIds.has(id)));
  }, [subcategoriesMap]);

  const pickFacadeImage = async (source: 'camera' | 'library') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm?.status !== 'granted') {
          Alert.alert('Permiso Denegado', 'Necesitamos acceso a la cámara.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [4, 3] });
      }
      if (!result?.canceled && result?.assets?.[0]?.uri) {
        setFacadeUri(result.assets[0].uri);
      }
    } catch { }
  };

  const showFacadeOptions = () => {
    Alert.alert('Foto de Fachada', 'Selecciona una opción', [
      { text: 'Tomar Foto', onPress: () => pickFacadeImage('camera') },
      { text: 'Seleccionar del Dispositivo', onPress: () => pickFacadeImage('library') },
      { text: 'Cancelar', style: 'cancel' },
    ], { cancelable: true });
  };

  const handleSave = async () => {
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        vehicleModelIds: selectedModels ?? [],
        partSubcategoryIds: selectedSubcategories ?? [],
        freeShippingEnabled,
        ownDeliveryEnabled,
      };
      if (freeShippingEnabled) {
        const r = parseInt(freeShippingRadiusKm, 10);
        if (!isNaN(r) && r > 0) updateData.freeShippingRadiusKm = Math.min(r, 100);
      }
      if (ownDeliveryEnabled) {
        updateData.ownDeliveryPricingMode = ownDeliveryPricingMode;
        if (ownDeliveryPricingMode === 'FIXED') {
          const c = parseFloat(ownDeliveryCost);
          if (!isNaN(c) && c >= 0) updateData.ownDeliveryCost = c;
        } else {
          const pk = parseFloat(ownDeliveryPerKm);
          if (!isNaN(pk) && pk >= 0) updateData.ownDeliveryPerKm = pk;
          const mx = parseFloat(ownDeliveryMaxKm);
          updateData.ownDeliveryMaxKm = !isNaN(mx) && mx > 0 ? mx : null;
          const ffk = parseFloat(ownDeliveryFlatFromKm);
          const fc = parseFloat(ownDeliveryFlatCost);
          // La tarifa plana requiere AMBOS valores; si falta alguno, se limpia.
          if (!isNaN(ffk) && ffk > 0 && !isNaN(fc) && fc >= 0) {
            updateData.ownDeliveryFlatFromKm = ffk;
            updateData.ownDeliveryFlatCost = fc;
          } else {
            updateData.ownDeliveryFlatFromKm = null;
            updateData.ownDeliveryFlatCost = null;
          }
        }
      }
      if (facadeUri) {
        const facadePath = await uploadFile(facadeUri, 'facade.jpg', 'image/jpeg', true);
        if (facadePath) updateData.facadeImagePath = facadePath;
      }
      await updateVendorProfile(updateData);
      setSuccess(true);
      setTimeout(() => router.back(), 1000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const addressText = profile?.fullAddress
    || [profile?.street, profile?.parish, profile?.municipality, profile?.state, profile?.country].filter(Boolean).join(', ')
    || 'No registrada';

  const vehicleCount = selectedModels?.length ?? 0;
  const partsCount = selectedSubcategories?.length ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Editar Negocio</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>Perfil actualizado ✓</Text> : null}

          {/* Datos del negocio — siempre abierto */}
          <CollapsibleSection
            icon="business-outline"
            title="Datos del negocio"
            defaultOpen
          >
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Razón Social</Text>
              <Text style={styles.readOnlyValue}>{profile?.businessName ?? '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>RIF</Text>
              <Text style={styles.readOnlyValue}>{profile?.rif ?? '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Ubicación</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.readOnlyValueSmall}>{addressText}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Foto de Fachada</Text>
              {(facadeUri || facadeRemoteUrl) ? (
                <View style={{ marginTop: 6 }}>
                  <Pressable onPress={() => setFacadePreview(true)}>
                    <Image source={{ uri: facadeUri ?? facadeRemoteUrl ?? '' }} style={{ width: '100%', height: 140, borderRadius: 10 }} contentFit="cover" />
                    <View style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 }}>
                      <Ionicons name="expand-outline" size={14} color="#fff" />
                    </View>
                  </Pressable>
                  <Pressable onPress={showFacadeOptions} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Ionicons name="camera-outline" size={14} color={colors.primary} />
                    <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '500' }}>Cambiar foto</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={showFacadeOptions} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.backgroundSection, borderRadius: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
                  <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>Agregar foto de fachada</Text>
                </Pressable>
              )}
            </View>
          </CollapsibleSection>

          {/* Vehículos — cerrado por defecto */}
          <CollapsibleSection
            icon="car-sport-outline"
            iconColor="#3B82F6"
            title="Vehículos"
            badge={`${vehicleCount} modelo${vehicleCount !== 1 ? 's' : ''}`}
          >
            <Text style={styles.sectionHint}>Toca una marca para ver sus modelos</Text>
            <VehicleAccordion
              brands={catalog?.brands ?? []}
              modelsMap={modelsMap ?? {}}
              selectedModels={selectedModels ?? []}
              onToggleModel={toggleModel}
              onSelectAllModels={selectAllModels}
              onDeselectAllModels={deselectAllModels}
              onExpandBrand={loadModelsForBrand}
            />
          </CollapsibleSection>

          {/* Repuestos — cerrado por defecto */}
          <CollapsibleSection
            icon="construct-outline"
            iconColor="#F59E0B"
            title="Repuestos"
            badge={`${partsCount} tipo${partsCount !== 1 ? 's' : ''}`}
          >
            <Text style={styles.sectionHint}>Toca una categoría para ver subcategorías</Text>
            <PartsAccordion
              categories={catalog?.categories ?? []}
              subcategoriesMap={subcategoriesMap ?? {}}
              selectedSubcategories={selectedSubcategories ?? []}
              onToggleSubcategory={toggleSubcategory}
              onSelectAllSubs={selectAllSubs}
              onDeselectAllSubs={deselectAllSubs}
              onExpandCategory={loadSubsForCategory}
            />
          </CollapsibleSection>

          {/* Envíos — cerrado por defecto */}
          <CollapsibleSection
            icon="motorbike"
            iconFamily="material"
            iconColor="#0B6BB5"
            title="Envíos"
            badge={freeShippingEnabled || ownDeliveryEnabled ? 'Activo' : 'Inactivo'}
          >
            <Text style={styles.sectionHint}>
              Configura si ofreces envío a tus clientes. Podrás ofrecerlo dentro de cada chat.
            </Text>

            <View style={styles.shipRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.shipLabel}>Envío gratis por cercanía</Text>
                <Text style={styles.shipDesc}>Absorbes el costo del envío para clientes dentro de un radio.</Text>
              </View>
              <Switch
                value={freeShippingEnabled}
                onValueChange={setFreeShippingEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            {freeShippingEnabled ? (
              <View style={styles.shipInputRow}>
                <Text style={styles.shipInputLabel}>Radio (km)</Text>
                <TextInput
                  value={freeShippingRadiusKm}
                  onChangeText={(t) => setFreeShippingRadiusKm(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="Ej. 10"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.shipInput}
                  maxLength={3}
                />
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.shipRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.shipLabel}>Servicio de Entrega</Text>
                <Text style={styles.shipDesc}>Repartidores propios o delivery externo. Indica el costo (0 = gratis).</Text>
              </View>
              <Switch
                value={ownDeliveryEnabled}
                onValueChange={setOwnDeliveryEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            {ownDeliveryEnabled ? (
              <View style={{ marginTop: 4 }}>
                {/* Selector de modalidad de cobro */}
                <View style={styles.modeSelector}>
                  <Pressable
                    onPress={() => setOwnDeliveryPricingMode('FIXED')}
                    style={[styles.modeBtn, ownDeliveryPricingMode === 'FIXED' && styles.modeBtnActive]}
                  >
                    <Text style={[styles.modeBtnText, ownDeliveryPricingMode === 'FIXED' && styles.modeBtnTextActive]}>
                      Costo fijo
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setOwnDeliveryPricingMode('PER_KM')}
                    style={[styles.modeBtn, ownDeliveryPricingMode === 'PER_KM' && styles.modeBtnActive]}
                  >
                    <Text style={[styles.modeBtnText, ownDeliveryPricingMode === 'PER_KM' && styles.modeBtnTextActive]}>
                      Costo por distancia
                    </Text>
                  </Pressable>
                </View>

                {ownDeliveryPricingMode === 'FIXED' ? (
                  <View style={styles.shipInputRow}>
                    <Text style={styles.shipInputLabel}>Costo (USD)</Text>
                    <TextInput
                      value={ownDeliveryCost}
                      onChangeText={(t) => setOwnDeliveryCost(t.replace(/[^0-9.]/g, ''))}
                      keyboardType="decimal-pad"
                      placeholder="Ej. 3.00"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.shipInput}
                      maxLength={7}
                    />
                  </View>
                ) : (
                  <View>
                    <Text style={styles.shipDesc}>
                      Cobra según la distancia entre tu negocio y el cliente. El costo se calcula
                      automáticamente: distancia (km) × costo por km.
                    </Text>
                    <View style={styles.shipInputRow}>
                      <Text style={styles.shipInputLabel}>Costo por km (USD)</Text>
                      <TextInput
                        value={ownDeliveryPerKm}
                        onChangeText={(t) => setOwnDeliveryPerKm(t.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholder="Ej. 1.00"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.shipInput}
                        maxLength={7}
                      />
                    </View>

                    <View style={styles.shipInputRow}>
                      <Text style={styles.shipInputLabel}>Distancia máxima (km)</Text>
                      <TextInput
                        value={ownDeliveryMaxKm}
                        onChangeText={(t) => setOwnDeliveryMaxKm(t.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholder="Ej. 10"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.shipInput}
                        maxLength={6}
                      />
                    </View>
                    <Text style={styles.shipHint}>
                      Si el cliente está más lejos de este límite, no se le ofrece el servicio de entrega. Déjalo vacío para no poner límite.
                    </Text>

                    <View style={styles.divider} />
                    <Text style={styles.shipLabel}>Tarifa plana especial (opcional)</Text>
                    <Text style={styles.shipDesc}>
                      Evita costos excesivos en distancias medianas o largas. A partir de cierta distancia, se cobra un monto fijo en vez del cálculo por km.
                    </Text>
                    <View style={styles.shipInputRow}>
                      <Text style={styles.shipInputLabel}>A partir de (km)</Text>
                      <TextInput
                        value={ownDeliveryFlatFromKm}
                        onChangeText={(t) => setOwnDeliveryFlatFromKm(t.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholder="Ej. 5"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.shipInput}
                        maxLength={6}
                      />
                    </View>
                    <View style={styles.shipInputRow}>
                      <Text style={styles.shipInputLabel}>Tarifa fija (USD)</Text>
                      <TextInput
                        value={ownDeliveryFlatCost}
                        onChangeText={(t) => setOwnDeliveryFlatCost(t.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholder="Ej. 6.00"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.shipInput}
                        maxLength={7}
                      />
                    </View>

                    <View style={styles.previewBox}>
                      <Ionicons name="calculator-outline" size={16} color={colors.primary} />
                      <Text style={styles.previewText}>
                        {(() => {
                          const pk = parseFloat(ownDeliveryPerKm) || 0;
                          const mx = parseFloat(ownDeliveryMaxKm);
                          const ffk = parseFloat(ownDeliveryFlatFromKm);
                          const fc = parseFloat(ownDeliveryFlatCost);
                          const hasFlat = !isNaN(ffk) && ffk > 0 && !isNaN(fc) && fc >= 0;
                          const hasMax = !isNaN(mx) && mx > 0;
                          const calc = (km: number): string => {
                            if (hasMax && km > mx) return 'no disponible';
                            if (hasFlat && km >= ffk) return `USD ${fc.toFixed(2)} (fija)`;
                            return `USD ${(km * pk).toFixed(2)}`;
                          };
                          return `Ejemplo:  3 km = ${calc(3)}   ·   7 km = ${calc(7)}   ·   12 km = ${calc(12)}`;
                        })()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : null}
          </CollapsibleSection>

          {/* Respuestas rápidas — cerrado por defecto */}
          <CollapsibleSection
            icon="flash-outline"
            iconColor="#8B5CF6"
            title="Respuestas rápidas"
          >
            <QuickRepliesManager embedded />
          </CollapsibleSection>

          <Button title="Guardar Cambios" onPress={handleSave} loading={saving} style={styles.saveBtn} />

          <Pressable onPress={() => setDeleteModalVisible(true)} style={styles.deleteLink}>
            <Ionicons name="trash-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.deleteLinkText}>Eliminar cuenta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {(facadeUri || facadeRemoteUrl) ? (
        <Modal visible={facadePreview} transparent animationType="fade" onRequestClose={() => setFacadePreview(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setFacadePreview(false)}>
            <Image source={{ uri: facadeUri ?? facadeRemoteUrl ?? '' }} style={{ width: 320, height: 240, borderRadius: 12 }} contentFit="contain" />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 12 }}>Fachada del negocio</Text>
            <Pressable style={{ position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, right: 20 }} onPress={() => setFacadePreview(false)} hitSlop={12}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      <DeleteAccountModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onDeleted={async () => {
          setDeleteModalVisible(false);
          await logout();
          router.replace('/auth/login');
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: c.textPrimary },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  error: { backgroundColor: c.errorBg, color: c.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
  success: { backgroundColor: c.successBg, color: c.success, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md, textAlign: 'center' },
  readOnlyRow: { paddingVertical: 6 },
  readOnlyLabel: { fontSize: 12, color: c.textSecondary, fontWeight: '500', marginBottom: 2 },
  readOnlyValue: { fontSize: 15, color: c.textPrimary, fontWeight: '600' },
  readOnlyValueSmall: { fontSize: 13, color: c.textSubtitle, lineHeight: 18, flex: 1 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 4 },
  sectionHint: { fontSize: 13, color: c.textSecondary, marginBottom: Spacing.sm },
  shipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  shipLabel: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  shipDesc: { fontSize: 12, color: c.textSecondary, marginTop: 2, lineHeight: 16 },
  shipHint: { fontSize: 12, color: c.textSecondary, marginTop: -2, marginBottom: 6, lineHeight: 16, paddingLeft: 2 },
  shipInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, paddingLeft: 2 },
  shipInputLabel: { fontSize: 13, color: c.textSecondary, width: 90 },
  shipInput: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 6, color: c.textPrimary, backgroundColor: c.backgroundSection, fontSize: 15 },
  modeSelector: { flexDirection: 'row', backgroundColor: c.backgroundSection, borderRadius: BorderRadius.md, padding: 4, gap: 4, marginTop: 6, marginBottom: Spacing.sm, borderWidth: 1, borderColor: c.border },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  modeBtnActive: { backgroundColor: c.primary },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
  modeBtnTextActive: { color: '#121212' },
  previewBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: c.chipBg, borderRadius: BorderRadius.sm },
  previewText: { flex: 1, fontSize: 12, color: c.textPrimary, fontWeight: '500' },
  saveBtn: { marginTop: Spacing.lg },
  deleteLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40, marginBottom: 20, paddingVertical: 8 },
  deleteLinkText: { fontSize: 13, color: c.textSecondary },
});
