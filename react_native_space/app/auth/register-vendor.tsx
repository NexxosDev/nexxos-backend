import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert, Image, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCatalog } from '../../src/contexts/CatalogContext';
import { getErrorMessage } from '../../src/services/api';
import { uploadFile } from '../../src/services/upload';
import { updateVendorProfile } from '../../src/services/vendor';
import { uploadRegistrationFile, verifyIdentity } from '../../src/services/identity';
import { useTheme } from '../../src/contexts/ThemeContext';
import { formatCedula, validateCedula } from '../../src/utils/cedula';
import type { ThemeColors } from '../../src/theme/colors';
import { Spacing, BorderRadius } from '../../src/theme/colors';
import Input from '../../src/components/Input';
import PhoneInput from '../../src/components/PhoneInput';
import Button from '../../src/components/Button';
import StepIndicator from '../../src/components/StepIndicator';
import SelectInput from '../../src/components/SelectInput';
import MapLocationPicker from '../../src/components/MapLocationPicker';
import LivenessSelfieCapture from '../../src/components/LivenessSelfieCapture';
import BrandsByOrigin from '../../src/components/BrandsByOrigin';
import EmailVerification from '../../src/components/EmailVerification';
import type { CatalogItem } from '../../src/types';

const TOTAL_STEPS = 6;

export default function RegisterVendorScreen() {
  const router = useRouter();
  const { signup, user } = useAuth();
  const catalog = useCatalog();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  // Identity verification state
  const [personalDocUri, setPersonalDocUri] = useState('');
  const [personalDocUrl, setPersonalDocUrl] = useState('');
  const [personalDocPath, setPersonalDocPath] = useState('');
  const [selfies, setSelfies] = useState<{ neutral?: string; smile?: string; turn?: string }>({});
  const [selfieUrls, setSelfieUrls] = useState<{ neutral?: string; smile?: string; turn?: string }>({});
  const [selfiePath, setSelfiePath] = useState('');
  const [identityVerified, setIdentityVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [showLiveness, setShowLiveness] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/role-selection');
    }
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

  const pickImageFromLibrary = async (type: 'doc' | 'logo' | 'personalDoc') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [4, 3],
      });
      if (!result?.canceled && result?.assets?.[0]?.uri) {
        if (type === 'personalDoc') { setPersonalDocUri(result.assets[0].uri); setIdentityVerified(false); setVerifyError(''); }
        else if (type === 'doc') setBusiness((p) => ({ ...(p ?? {}), docImageUri: result.assets[0].uri }));
        else setBusiness((p) => ({ ...(p ?? {}), logoUri: result.assets[0].uri }));
      }
    } catch { }
  };

  const takePhoto = async (type: 'doc' | 'logo' | 'personalDoc') => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission?.status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Necesitamos acceso a la cámara para tomar fotos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [4, 3],
      });
      if (!result?.canceled && result?.assets?.[0]?.uri) {
        if (type === 'personalDoc') { setPersonalDocUri(result.assets[0].uri); setIdentityVerified(false); setVerifyError(''); }
        else if (type === 'doc') setBusiness((p) => ({ ...(p ?? {}), docImageUri: result.assets[0].uri }));
        else setBusiness((p) => ({ ...(p ?? {}), logoUri: result.assets[0].uri }));
      }
    } catch { }
  };

  const showImageOptions = (type: 'doc' | 'logo' | 'personalDoc') => {
    const titles: Record<string, string> = { personalDoc: 'Documento de Identidad', doc: 'Documento de la Empresa', logo: 'Logo del Negocio' };
    Alert.alert(
      titles[type] ?? 'Imagen',
      'Selecciona una opción',
      [
        { text: 'Tomar Foto', onPress: () => takePhoto(type) },
        { text: 'Seleccionar del Dispositivo', onPress: () => pickImageFromLibrary(type) },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleLivenessComplete = (result: { neutral: string; smile: string; turn: string }) => {
    setSelfies(result);
    setShowLiveness(false);
    setIdentityVerified(false);
    setVerifyError('');
  };

  const handleVerifyIdentity = async () => {
    if (!personalDocUri) { setVerifyError('Sube tu documento de identidad primero'); return; }
    if (!selfies?.neutral || !selfies?.smile || !selfies?.turn) { setVerifyError('Completa la captura de selfie primero'); return; }
    setVerifying(true);
    setVerifyError('');
    try {
      const docResult = await uploadRegistrationFile(personalDocUri, `personal_doc_${Date.now()}.jpg`, 'image/jpeg');
      setPersonalDocUrl(docResult?.url ?? '');
      setPersonalDocPath(docResult?.storagePath ?? '');

      const neutralRes = await uploadRegistrationFile(selfies.neutral, `selfie_neutral_${Date.now()}.jpg`, 'image/jpeg');
      const smileRes = await uploadRegistrationFile(selfies.smile, `selfie_smile_${Date.now()}.jpg`, 'image/jpeg');
      const turnRes = await uploadRegistrationFile(selfies.turn, `selfie_turn_${Date.now()}.jpg`, 'image/jpeg');
      setSelfieUrls({ neutral: neutralRes?.url, smile: smileRes?.url, turn: turnRes?.url });
      setSelfiePath(neutralRes?.storagePath ?? '');

      const verifyResult = await verifyIdentity({
        documentImageUrl: docResult?.url ?? '',
        selfieNeutralUrl: neutralRes?.url ?? '',
        selfieSmileUrl: smileRes?.url ?? '',
        selfieTurnUrl: turnRes?.url ?? '',
      });

      if (verifyResult?.match && verifyResult?.liveness) {
        setIdentityVerified(true);
        setVerifyError('');
      } else {
        setIdentityVerified(false);
        const reason = verifyResult?.reason ?? 'No se pudo verificar la identidad';
        setVerifyError(`Verificación fallida: ${reason}. Intenta nuevamente con mejores fotos.`);
      }
    } catch (err) {
      setIdentityVerified(false);
      setVerifyError(`Error al verificar: ${getErrorMessage(err)}`);
    } finally {
      setVerifying(false);
    }
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
    if (step === 1) {
      const emailValid = personal?.email?.trim?.() && /\S+@\S+\.\S+/.test(personal.email);
      const cedulaOk = !validateCedula(personal?.documentId ?? '');
      const personalValid = !!(personal?.firstName?.trim?.() && personal?.lastName?.trim?.() && personal?.phone?.trim?.() && cedulaOk && emailValid && personal?.password && personal?.password === personal?.confirmPassword && (personal?.password?.length ?? 0) >= 6);
      return personalValid && identityVerified && emailVerified;
    }
    if (step === 2) {
      return !!(business?.businessName?.trim?.() && business?.rif?.trim?.() && business?.docImageUri && business?.logoUri);
    }
    if (step === 3) return !!(location?.latitude && location?.longitude && location?.fullAddress?.trim?.());
    if (step === 4) return (selectedModels?.length ?? 0) > 0;
    if (step === 5) return (selectedSubcategories?.length ?? 0) > 0 || (selectedCategories?.length ?? 0) > 0;
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
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
          personalDocPath: personalDocPath || undefined,
          selfiePath: selfiePath || undefined,
          identityVerified: identityVerified,
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
        },
      });

      try {
        let docPath = '';
        let logoPathVal = '';
        if (business?.docImageUri) {
          docPath = await uploadFile(business.docImageUri, 'doc_id.jpg', 'image/jpeg', false);
        }
        if (business?.logoUri) {
          logoPathVal = await uploadFile(business.logoUri, 'logo.jpg', 'image/jpeg', true);
        }
        if (docPath || logoPathVal) {
          const updateData: Record<string, unknown> = {};
          if (docPath) updateData.documentImagePath = docPath;
          if (logoPathVal) updateData.logoPath = logoPathVal;
          await updateVendorProfile(updateData);
        }
      } catch (imgErr) {
        console.warn('Image upload failed after signup:', imgErr);
      }
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
            <Input label="Cédula" value={personal.documentId} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), documentId: formatCedula(v) }))} placeholder="V-12345678" />
            <PhoneInput label="Teléfono" value={personal.phone} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), phone: v }))} />
            <Input label="Email" value={personal.email} onChangeText={(v) => { setPersonal((p) => ({ ...(p ?? {}), email: v })); setEmailVerified(false); }} keyboardType="email-address" autoCapitalize="none" />
            <EmailVerification email={personal.email} verified={emailVerified} onVerified={setEmailVerified} />
            <Input label="Contraseña" value={personal.password} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), password: v }))} secureTextEntry />
            <Input label="Confirmar Contraseña" value={personal.confirmPassword} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), confirmPassword: v }))} secureTextEntry />

            <View style={styles.identitySection}>
              <Text style={styles.identitySectionTitle}>Verificación de Identidad</Text>
              <Text style={styles.identitySectionDesc}>Necesitamos verificar tu identidad antes de continuar. Sube una foto de tu cédula y toma selfies de verificación.</Text>

              <Text style={styles.fieldLabel}>
                Foto de Cédula <Text style={styles.requiredStar}>*</Text>
              </Text>
              {personalDocUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: personalDocUri }} style={styles.imagePreviewFull} />
                  <Pressable style={styles.changeImageButton} onPress={() => showImageOptions('personalDoc')}>
                    <Ionicons name="camera-outline" size={20} color={colors.white} />
                    <Text style={styles.changeImageText}>Cambiar</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.imagePicker} onPress={() => showImageOptions('personalDoc')}>
                  <Ionicons name="id-card-outline" size={40} color={colors.textSecondary} />
                  <Text style={styles.imagePickerTitle}>Cargar Cédula de Identidad</Text>
                  <Text style={styles.imagePickerSubtitle}>Tomar foto o seleccionar del dispositivo</Text>
                </Pressable>
              )}

              <Text style={styles.fieldLabel}>
                Selfie de Verificación <Text style={styles.requiredStar}>*</Text>
              </Text>
              {selfies?.neutral ? (
                <View style={styles.selfiePreviewRow}>
                  <View style={styles.selfieThumb}>
                    <Image source={{ uri: selfies.neutral }} style={styles.selfieThumbImg} />
                    <Text style={styles.selfieThumbLabel}>Neutra</Text>
                  </View>
                  {selfies?.smile ? (
                    <View style={styles.selfieThumb}>
                      <Image source={{ uri: selfies.smile }} style={styles.selfieThumbImg} />
                      <Text style={styles.selfieThumbLabel}>Sonrisa</Text>
                    </View>
                  ) : null}
                  {selfies?.turn ? (
                    <View style={styles.selfieThumb}>
                      <Image source={{ uri: selfies.turn }} style={styles.selfieThumbImg} />
                      <Text style={styles.selfieThumbLabel}>Girada</Text>
                    </View>
                  ) : null}
                  <Pressable style={styles.retakeSelfieBtn} onPress={() => { setSelfies({}); setIdentityVerified(false); setShowLiveness(true); }}>
                    <Ionicons name="refresh-outline" size={20} color={colors.primary} />
                    <Text style={styles.retakeSelfieText}>Repetir</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.imagePicker} onPress={() => setShowLiveness(true)}>
                  <Ionicons name="person-circle-outline" size={40} color={colors.textSecondary} />
                  <Text style={styles.imagePickerTitle}>Capturar Selfie de Verificación</Text>
                  <Text style={styles.imagePickerSubtitle}>Se tomarán 3 fotos: neutra, sonrisa y giro de cabeza</Text>
                </Pressable>
              )}

              {personalDocUri && selfies?.neutral && selfies?.smile && selfies?.turn && !identityVerified ? (
                <Pressable
                  style={[styles.verifyButton, verifying && styles.verifyButtonDisabled]}
                  onPress={handleVerifyIdentity}
                  disabled={verifying}
                >
                  {verifying ? (
                    <View style={styles.verifyButtonContent}>
                      <ActivityIndicator size="small" color={colors.white} />
                      <Text style={styles.verifyButtonText}>Verificando identidad...</Text>
                    </View>
                  ) : (
                    <View style={styles.verifyButtonContent}>
                      <Ionicons name="shield-checkmark-outline" size={20} color={colors.white} />
                      <Text style={styles.verifyButtonText}>Verificar Identidad</Text>
                    </View>
                  )}
                </Pressable>
              ) : null}

              {verifyError ? (
                <View style={styles.verifyStatus}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                  <Text style={styles.verifyErrorText}>{verifyError}</Text>
                </View>
              ) : null}
              {identityVerified ? (
                <View style={styles.verifyStatus}>
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  <Text style={styles.verifySuccessText}>Identidad verificada correctamente</Text>
                </View>
              ) : null}
            </View>

            <Modal visible={showLiveness} animationType="slide" presentationStyle="fullScreen">
              <LivenessSelfieCapture
                onComplete={handleLivenessComplete}
                onCancel={() => setShowLiveness(false)}
              />
            </Modal>
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Datos del Negocio</Text>
            <Input label="Razón Social" value={business.businessName} onChangeText={(v) => setBusiness((p) => ({ ...(p ?? {}), businessName: v }))} />
            <Input label="RIF" value={business.rif} onChangeText={(v) => setBusiness((p) => ({ ...(p ?? {}), rif: v }))} />

            <Text style={styles.fieldLabel}>
              Documento de la Empresa (RIF/Acta Constitutiva) <Text style={styles.requiredStar}>*</Text>
            </Text>
            {business?.docImageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: business.docImageUri }} style={styles.imagePreviewFull} />
                <Pressable style={styles.changeImageButton} onPress={() => showImageOptions('doc')}>
                  <Ionicons name="camera-outline" size={20} color={colors.white} />
                  <Text style={styles.changeImageText}>Cambiar</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.imagePicker} onPress={() => showImageOptions('doc')}>
                <Ionicons name="document-text-outline" size={40} color={colors.textSecondary} />
                <Text style={styles.imagePickerTitle}>Cargar Documento de la Empresa</Text>
                <Text style={styles.imagePickerSubtitle}>RIF o Acta Constitutiva</Text>
              </Pressable>
            )}

            <Text style={styles.fieldLabel}>
              Logo del Negocio <Text style={styles.requiredStar}>*</Text>
            </Text>
            {business?.logoUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: business.logoUri }} style={styles.imagePreviewFull} />
                <Pressable style={styles.changeImageButton} onPress={() => showImageOptions('logo')}>
                  <Ionicons name="image-outline" size={20} color={colors.white} />
                  <Text style={styles.changeImageText}>Cambiar</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.imagePicker} onPress={() => showImageOptions('logo')}>
                <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                <Text style={styles.imagePickerTitle}>Cargar Logo del Negocio</Text>
                <Text style={styles.imagePickerSubtitle}>Tomar foto o seleccionar del dispositivo</Text>
              </Pressable>
            )}
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
            <BrandsByOrigin
              brands={catalog?.brands ?? []}
              selectedBrands={selectedBrands ?? []}
              onToggleBrand={toggleBrand}
            />
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
                    <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? colors.primary : colors.border} />
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
              <Text style={styles.summaryLabel}>Identidad verificada</Text>
              <Text style={[styles.summaryValue, { color: identityVerified ? '#22C55E' : colors.error }]}>
                {identityVerified ? '✅ Sí' : '❌ No'}
              </Text>
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
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: c.textPrimary },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface },
  error: { backgroundColor: c.errorBg, color: c.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
  stepTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: Spacing.md },
  stepDesc: { fontSize: 14, color: c.textSecondary, marginBottom: Spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: c.textSubtitle, marginBottom: 6, marginTop: Spacing.sm },
  imagePicker: {
    borderWidth: 1, borderColor: c.border, borderRadius: BorderRadius.md, borderStyle: 'dashed',
    padding: Spacing.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  imagePreview: { width: 100, height: 100, borderRadius: 8, marginBottom: Spacing.sm },
  imagePickerText: { fontSize: 13, color: c.textSecondary, marginTop: 4 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: c.chipBg },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 6 },
  chipSelected: { backgroundColor: c.chipSelectedBg },
  chipText: { fontSize: 14, color: c.textSubtitle },
  chipTextSmall: { fontSize: 12, color: c.textSubtitle },
  chipTextSelected: { color: c.accent, fontWeight: '600' },
  modelSection: { marginBottom: Spacing.md },
  modelBrand: { fontSize: 15, fontWeight: '600', color: c.textPrimary, marginBottom: 8 },
  categoryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm,
    marginBottom: 4, backgroundColor: c.backgroundSection,
  },
  categoryRowSelected: { backgroundColor: `${c.primary}15` },
  categoryText: { fontSize: 15, color: c.textPrimary },
  categoryTextSelected: { fontWeight: '600', color: c.primary },
  summaryCard: { backgroundColor: c.backgroundSection, borderRadius: BorderRadius.md, padding: Spacing.md },
  summaryLabel: { fontSize: 12, color: c.textSecondary, marginTop: Spacing.sm },
  summaryValue: { fontSize: 15, fontWeight: '500', color: c.textPrimary },
  requiredStar: { color: c.error, fontSize: 13 },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: c.backgroundSection,
  },
  imagePreviewFull: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  imagePickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textPrimary,
    marginTop: Spacing.sm,
  },
  imagePickerSubtitle: {
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 4,
  },
  identitySection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  identitySectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 4,
  },
  identitySectionDesc: {
    fontSize: 13,
    color: c.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  selfiePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  selfieThumb: {
    alignItems: 'center',
  },
  selfieThumbImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: c.backgroundSection,
  },
  selfieThumbLabel: {
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 4,
  },
  retakeSelfieBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: c.primary,
  },
  retakeSelfieText: {
    fontSize: 13,
    color: c.primary,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: c.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  verifyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: c.backgroundSection,
    marginBottom: Spacing.sm,
  },
  verifyErrorText: {
    fontSize: 13,
    color: c.error,
    flex: 1,
    lineHeight: 18,
  },
  verifySuccessText: {
    fontSize: 13,
    color: '#22C55E',
    flex: 1,
    fontWeight: '600',
  },
});
