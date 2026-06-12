import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert, Modal, ActivityIndicator, Linking, Image as RNImage } from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCatalog } from '../../src/contexts/CatalogContext';
import { getErrorMessage } from '../../src/services/api';
import { uploadFile } from '../../src/services/upload';
import { updateVendorProfile } from '../../src/services/vendor';
import { uploadRegistrationFile, verifyIdentity, fileToBase64 } from '../../src/services/identity';
import { upgradeToVendorApi } from '../../src/services/auth';
import { useTheme } from '../../src/contexts/ThemeContext';
import { formatCedula, validateCedula } from '../../src/utils/cedula';
import { formatRif, validateRif } from '../../src/utils/rif';
import ImagePreviewModal from '../../src/components/ImagePreviewModal';
import type { ThemeColors } from '../../src/theme/colors';
import { Spacing, BorderRadius } from '../../src/theme/colors';
import Input from '../../src/components/Input';
import PhoneInput from '../../src/components/PhoneInput';
import Button from '../../src/components/Button';
import StepIndicator from '../../src/components/StepIndicator';
import SelectInput from '../../src/components/SelectInput';
import MapLocationPicker from '../../src/components/MapLocationPicker';
import LivenessSelfieCapture from '../../src/components/LivenessSelfieCapture';
import VehicleAccordion from '../../src/components/VehicleAccordion';
import PartsAccordion from '../../src/components/PartsAccordion';
import EmailVerification from '../../src/components/EmailVerification';
import type { CatalogItem } from '../../src/types';

const TOTAL_STEPS = 6;
const DRAFT_KEY = 'nexxos_vendor_registration_draft';

/* no helper components - images rendered inline */

interface RegistrationDraft {
  step: number;
  personal: { firstName: string; lastName: string; phone: string; documentId: string; email: string; password: string; confirmPassword: string };
  business: { businessName: string; rif: string; docImageUri: string; docImagePath: string; logoUri: string; logoPath: string; facadeUri: string; facadePath: string };
  location: { latitude?: number; longitude?: number; country: string; city: string; state: string; municipality: string; parish: string; street: string; postalCode: string; referencePoint: string; fullAddress: string };
  selectedModels: string[];
  selectedSubcategories: string[];
  ageConfirmed: boolean;
  savedAt: number;
}

export default function RegisterVendorScreen() {
  const router = useRouter();
  const { existing: existingParam = '' } = useLocalSearchParams<{ existing?: string }>();
  const isExisting = existingParam === '1';
  const { signup, user, refreshUser } = useAuth();
  const catalog = useCatalog();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftChecked, setDraftChecked] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const pendingDraftRef = useRef<RegistrationDraft | null>(null);

  const [personal, setPersonal] = useState({ firstName: '', lastName: '', phone: '', documentId: '', email: '', password: '', confirmPassword: '' });
  const [business, setBusiness] = useState({ businessName: '', rif: '', docImageUri: '', docImagePath: '', logoUri: '', logoPath: '', facadeUri: '', facadePath: '' });
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
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
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
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [showLiveness, setShowLiveness] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // --- Draft persistence ---
  const saveDraft = useCallback(async (currentStep: number) => {
    try {
      const draft: RegistrationDraft = {
        step: currentStep,
        personal: { ...personal, password: '', confirmPassword: '' }, // Never persist passwords
        business: { ...business, docImageUri: '', logoUri: '', facadeUri: '' }, // Image URIs are temporary
        location,
        selectedModels,
        selectedSubcategories,
        ageConfirmed,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* silently fail */ }
  }, [personal, business, location, selectedModels, selectedSubcategories, ageConfirmed]);

  const clearDraft = useCallback(async () => {
    try { await AsyncStorage.removeItem(DRAFT_KEY); } catch { }
  }, []);

  const restoreDraft = useCallback((draft: RegistrationDraft) => {
    setStep(draft?.step ?? 1);
    if (draft?.personal) {
      setPersonal((p) => ({
        ...(p ?? {}),
        firstName: draft.personal?.firstName ?? '',
        lastName: draft.personal?.lastName ?? '',
        phone: draft.personal?.phone ?? '',
        documentId: draft.personal?.documentId ?? '',
        email: draft.personal?.email ?? '',
        password: '',
        confirmPassword: '',
      }));
    }
    if (draft?.business) {
      setBusiness((p) => ({
        ...(p ?? {}),
        businessName: draft.business?.businessName ?? '',
        rif: draft.business?.rif ?? '',
        docImageUri: '',
        docImagePath: '',
        logoUri: '',
        logoPath: '',
        facadeUri: '',
        facadePath: '',
      }));
    }
    if (draft?.location) setLocation({
      latitude: draft.location?.latitude ?? undefined,
      longitude: draft.location?.longitude ?? undefined,
      country: draft.location?.country ?? '',
      city: draft.location?.city ?? '',
      state: draft.location?.state ?? '',
      municipality: draft.location?.municipality ?? '',
      parish: draft.location?.parish ?? '',
      street: draft.location?.street ?? '',
      postalCode: draft.location?.postalCode ?? '',
      referencePoint: draft.location?.referencePoint ?? '',
      fullAddress: draft.location?.fullAddress ?? '',
    });
    if (draft?.selectedModels) setSelectedModels(draft.selectedModels);
    if (draft?.selectedSubcategories) setSelectedSubcategories(draft.selectedSubcategories);
    if (draft?.ageConfirmed) setAgeConfirmed(draft.ageConfirmed);
  }, []);

  // Check for existing draft on mount
  useEffect(() => {
    if (draftChecked) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw) as RegistrationDraft;
          // Only show prompt if draft is less than 7 days old and has meaningful data
          const ageMs = Date.now() - (draft?.savedAt ?? 0);
          const hasData = (draft?.personal?.firstName?.trim?.() || draft?.business?.businessName?.trim?.() || (draft?.selectedModels?.length ?? 0) > 0);
          if (ageMs < 7 * 24 * 60 * 60 * 1000 && hasData) {
            pendingDraftRef.current = draft;
            setShowDraftModal(true);
          } else {
            await clearDraft();
          }
        }
      } catch { }
      setDraftChecked(true);
    })();
  }, [draftChecked, clearDraft]);

  // Pre-fill personal data for existing users
  useEffect(() => {
    if (isExisting && user) {
      setPersonal((p) => ({
        ...(p ?? {}),
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        phone: user?.phone ?? '',
        documentId: user?.documentId ?? '',
        email: user?.email ?? '',
        password: '',
        confirmPassword: '',
      }));
    }
  }, [isExisting, user]);

  // Only redirect logged-in users away if this is NOT an existing-user upgrade
  useEffect(() => {
    if (user && !isExisting) {
      router.replace('/role-selection');
    }
  }, [user, isExisting]);

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

  const applyPickedResult = (asset: ImagePicker.ImagePickerAsset, type: 'doc' | 'logo' | 'personalDoc' | 'facade') => {
    const uri = asset?.uri ?? '';
    console.log('[applyPickedResult]', type, 'uri:', uri);
    if (!uri) return;
    if (type === 'personalDoc') {
      setPersonalDocUri(uri);
      setIdentityVerified(false);
      setVerifyError('');
    } else if (type === 'doc') {
      setBusiness((p) => ({ ...(p ?? {}), docImageUri: uri }));
    } else if (type === 'facade') {
      setBusiness((p) => ({ ...(p ?? {}), facadeUri: uri }));
    } else {
      setBusiness((p) => ({ ...(p ?? {}), logoUri: uri }));
    }
  };

  const pickImageFromLibrary = async (type: 'doc' | 'logo' | 'personalDoc' | 'facade') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [4, 3],
      });
      if (!result?.canceled && result?.assets?.[0]) {
        applyPickedResult(result.assets[0], type);
      }
    } catch { }
  };

  const takePhoto = async (type: 'doc' | 'logo' | 'personalDoc' | 'facade') => {
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
      if (!result?.canceled && result?.assets?.[0]) {
        applyPickedResult(result.assets[0], type);
      }
    } catch { }
  };

  const showImageOptions = (type: 'doc' | 'logo' | 'personalDoc' | 'facade') => {
    const titles: Record<string, string> = { personalDoc: 'Documento de Identidad', doc: 'Documento de la Empresa', logo: 'Logo del Negocio', facade: 'Foto de Fachada' };
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
      // Use original (non-manipulated) URI for upload and base64 conversion
      const docUploadUri = personalDocUri;
      const docB64 = await fileToBase64(docUploadUri);
      const [neutralB64, smileB64, turnB64] = await Promise.all([
        fileToBase64(selfies.neutral),
        fileToBase64(selfies.smile),
        fileToBase64(selfies.turn),
      ]);

      // Upload files to S3 in parallel (for storage)
      const [docResult, neutralRes, smileRes, turnRes] = await Promise.all([
        uploadRegistrationFile(docUploadUri, `personal_doc_${Date.now()}.jpg`, 'image/jpeg'),
        uploadRegistrationFile(selfies.neutral, `selfie_neutral_${Date.now()}.jpg`, 'image/jpeg'),
        uploadRegistrationFile(selfies.smile, `selfie_smile_${Date.now()}.jpg`, 'image/jpeg'),
        uploadRegistrationFile(selfies.turn, `selfie_turn_${Date.now()}.jpg`, 'image/jpeg'),
      ]);

      setPersonalDocUrl(docResult?.url ?? '');
      setPersonalDocPath(docResult?.storagePath ?? '');
      setSelfieUrls({ neutral: neutralRes?.url, smile: smileRes?.url, turn: turnRes?.url });
      setSelfiePath(neutralRes?.storagePath ?? '');

      // Verify identity using base64 images (no S3 download needed on backend)
      const verifyResult = await verifyIdentity({
        documentImageBase64: docB64,
        selfieNeutralBase64: neutralB64,
        selfieSmileBase64: smileB64,
        selfieTurnBase64: turnB64,
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

  const toggleModel = useCallback((modelId: string) => {
    setSelectedModels((prev) => {
      const arr = prev ?? [];
      return arr.includes(modelId) ? arr.filter((id) => id !== modelId) : [...arr, modelId];
    });
  }, []);

  const selectAllModels = useCallback((brandId: string) => {
    const models = modelsMap?.[brandId] ?? [];
    const ids = models.map((m) => m?.id).filter(Boolean) as string[];
    setSelectedModels((prev) => Array.from(new Set([...(prev ?? []), ...ids])));
  }, [modelsMap]);

  const deselectAllModels = useCallback((brandId: string) => {
    const models = modelsMap?.[brandId] ?? [];
    const ids = new Set(models.map((m) => m?.id));
    setSelectedModels((prev) => (prev ?? []).filter((id) => !ids.has(id)));
  }, [modelsMap]);

  const toggleSubcategory = useCallback((subId: string) => {
    setSelectedSubcategories((prev) => {
      const arr = prev ?? [];
      return arr.includes(subId) ? arr.filter((id) => id !== subId) : [...arr, subId];
    });
  }, []);

  const selectAllSubs = useCallback((catId: string) => {
    const subs = subcategoriesMap?.[catId] ?? [];
    const ids = subs.map((s) => s?.id).filter(Boolean) as string[];
    setSelectedSubcategories((prev) => Array.from(new Set([...(prev ?? []), ...ids])));
  }, [subcategoriesMap]);

  const deselectAllSubs = useCallback((catId: string) => {
    const subs = subcategoriesMap?.[catId] ?? [];
    const ids = new Set(subs.map((s) => s?.id));
    setSelectedSubcategories((prev) => (prev ?? []).filter((id) => !ids.has(id)));
  }, [subcategoriesMap]);

  const canNext = (): boolean => {
    if (step === 1) {
      if (isExisting) {
        // Existing user: personal data is pre-filled, only identity verification needed
        return identityVerified;
      }
      const emailValid = personal?.email?.trim?.() && /\S+@\S+\.\S+/.test(personal.email);
      const cedulaOk = !validateCedula(personal?.documentId ?? '');
      const personalValid = !!(personal?.firstName?.trim?.() && personal?.lastName?.trim?.() && personal?.phone?.trim?.() && cedulaOk && emailValid && personal?.password && personal?.password === personal?.confirmPassword && (personal?.password?.length ?? 0) >= 6);
      return personalValid && identityVerified && emailVerified;
    }
    if (step === 2) {
      const rifOk = !validateRif(business?.rif ?? '');
      return !!(business?.businessName?.trim?.() && rifOk && business?.docImageUri && business?.logoUri);
    }
    if (step === 3) return !!(location?.latitude && location?.longitude && location?.fullAddress?.trim?.());
    if (step === 4) return (selectedModels?.length ?? 0) > 0;
    if (step === 5) return (selectedSubcategories?.length ?? 0) > 0;
    if (step === 6) return ageConfirmed;
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const subcatIds = (selectedSubcategories?.length ?? 0) > 0 ? selectedSubcategories : [];

      const vendorData = {
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
      };

      if (isExisting) {
        // Existing user: upgrade to vendor (no signup needed)
        await upgradeToVendorApi(vendorData);
      } else {
        // New user: full signup flow
        await signup({
          email: personal?.email?.trim?.() ?? '',
          password: personal?.password ?? '',
          name: `${personal?.firstName?.trim?.() ?? ''} ${personal?.lastName?.trim?.() ?? ''}`,
          firstName: personal?.firstName?.trim?.() ?? '',
          lastName: personal?.lastName?.trim?.() ?? '',
          phone: personal?.phone?.trim?.() ?? '',
          documentId: personal?.documentId?.trim?.() ?? '',
          role: 'VENDEDOR',
          vendor: vendorData,
        });
      }

      try {
        let docPath = '';
        let logoPathVal = '';
        if (business?.docImageUri) {
          docPath = await uploadFile(business.docImageUri, 'doc_id.jpg', 'image/jpeg', false);
        }
        if (business?.logoUri) {
          logoPathVal = await uploadFile(business.logoUri, 'logo.jpg', 'image/jpeg', true);
        }
        let facadePathVal = '';
        if (business?.facadeUri) {
          facadePathVal = await uploadFile(business.facadeUri, 'facade.jpg', 'image/jpeg', true);
        }
        if (docPath || logoPathVal || facadePathVal) {
          const updateData: Record<string, unknown> = {};
          if (docPath) updateData.documentImagePath = docPath;
          if (logoPathVal) updateData.logoPath = logoPathVal;
          if (facadePathVal) updateData.facadeImagePath = facadePathVal;
          await updateVendorProfile(updateData);
        }
      } catch (imgErr) {
        console.warn('Image upload failed after signup:', imgErr);
      }

      // Clear draft on successful registration
      await clearDraft();

      if (isExisting) {
        await refreshUser?.();
        router.replace('/vendor');
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
            {isExisting ? (
              <View style={styles.existingUserNotice}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.existingUserNoticeText}>Tus datos personales ya están registrados. Solo necesitas completar la verificación de identidad.</Text>
              </View>
            ) : null}
            <Input label="Nombre" value={personal.firstName} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), firstName: v }))} locked={isExisting} />
            <Input label="Apellido" value={personal.lastName} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), lastName: v }))} locked={isExisting} />
            <Input label="Cédula" value={personal.documentId} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), documentId: formatCedula(v) }))} placeholder="V-12345678" locked={isExisting} />
            <PhoneInput label="Teléfono" value={personal.phone} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), phone: v }))} locked={isExisting} />
            <Input label="Email" value={personal.email} onChangeText={(v) => { setPersonal((p) => ({ ...(p ?? {}), email: v })); setEmailVerified(false); }} keyboardType="email-address" autoCapitalize="none" locked={isExisting} />
            {!isExisting ? (
              <>
                <EmailVerification email={personal.email} verified={emailVerified} onVerified={setEmailVerified} />
                <Input label="Contraseña" value={personal.password} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), password: v }))} secureTextEntry />
                <Input label="Confirmar Contraseña" value={personal.confirmPassword} onChangeText={(v) => setPersonal((p) => ({ ...(p ?? {}), confirmPassword: v }))} secureTextEntry />
              </>
            ) : null}

            <View style={styles.identitySection}>
              <Text style={styles.identitySectionTitle}>Verificación de Identidad</Text>
              <Text style={styles.identitySectionDesc}>Necesitamos verificar tu identidad antes de continuar. Sube una foto de tu cédula y toma selfies de verificación.</Text>

              <Text style={styles.fieldLabel}>
                Foto de Cédula <Text style={styles.requiredStar}>*</Text>
              </Text>
              {personalDocUri ? (
                <View style={styles.inlinePreviewBlock}>
                  <Pressable onPress={() => setPreviewImageUri(personalDocUri)}>
                    <ExpoImage
                      source={{ uri: personalDocUri }}
                      style={styles.inlinePreviewImage}
                      contentFit="cover"
                      cachePolicy="none"
                    />
                  </Pressable>
                  <Pressable style={styles.changeBtn} onPress={() => showImageOptions('personalDoc')}>
                    <Ionicons name="camera-outline" size={18} color={colors.white} />
                    <Text style={styles.changeBtnText}>Cambiar</Text>
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
                  <Pressable style={styles.selfieThumb} onPress={() => setPreviewImageUri(selfies?.neutral ?? null)}>
                    <RNImage source={{ uri: selfies.neutral }} style={styles.selfieThumbImg} resizeMode="cover" />
                    <Text style={styles.selfieThumbLabel}>Neutra</Text>
                  </Pressable>
                  {selfies?.smile ? (
                    <Pressable style={styles.selfieThumb} onPress={() => setPreviewImageUri(selfies?.smile ?? null)}>
                      <RNImage source={{ uri: selfies.smile }} style={styles.selfieThumbImg} resizeMode="cover" />
                      <Text style={styles.selfieThumbLabel}>Sonrisa</Text>
                    </Pressable>
                  ) : null}
                  {selfies?.turn ? (
                    <Pressable style={styles.selfieThumb} onPress={() => setPreviewImageUri(selfies?.turn ?? null)}>
                      <RNImage source={{ uri: selfies.turn }} style={styles.selfieThumbImg} resizeMode="cover" />
                      <Text style={styles.selfieThumbLabel}>Girada</Text>
                    </Pressable>
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
            <Input label="RIF" value={business.rif} onChangeText={(v) => setBusiness((p) => ({ ...(p ?? {}), rif: formatRif(v) }))} placeholder="J-12345678" error={business?.rif ? validateRif(business.rif) : ''} />

            <Text style={styles.fieldLabel}>
              Documento de la Empresa (RIF/Acta Constitutiva) <Text style={styles.requiredStar}>*</Text>
            </Text>
            {business?.docImageUri ? (
              <View style={styles.inlinePreviewBlock}>
                <Pressable onPress={() => setPreviewImageUri(business.docImageUri)}>
                  <ExpoImage
                    source={{ uri: business.docImageUri }}
                    style={styles.inlinePreviewImage}
                    contentFit="cover"
                    cachePolicy="none"
                  />
                </Pressable>
                <Pressable style={styles.changeBtn} onPress={() => showImageOptions('doc')}>
                  <Ionicons name="camera-outline" size={18} color={colors.white} />
                  <Text style={styles.changeBtnText}>Cambiar</Text>
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
              <View style={styles.inlinePreviewBlock}>
                <Pressable onPress={() => setPreviewImageUri(business.logoUri)}>
                  <ExpoImage
                    source={{ uri: business.logoUri }}
                    style={styles.inlinePreviewImage}
                    contentFit="cover"
                    cachePolicy="none"
                  />
                </Pressable>
                <Pressable style={styles.changeBtn} onPress={() => showImageOptions('logo')}>
                  <Ionicons name="image-outline" size={18} color={colors.white} />
                  <Text style={styles.changeBtnText}>Cambiar</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.imagePicker} onPress={() => showImageOptions('logo')}>
                <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                <Text style={styles.imagePickerTitle}>Cargar Logo del Negocio</Text>
                <Text style={styles.imagePickerSubtitle}>Tomar foto o seleccionar del dispositivo</Text>
              </Pressable>
            )}

            <Text style={styles.fieldLabel}>
              Foto de Fachada <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '400' }}>(opcional)</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8, lineHeight: 16 }}>
              Muestra el frente de tu negocio para generar más confianza con los compradores.
            </Text>
            {business?.facadeUri ? (
              <View style={styles.inlinePreviewBlock}>
                <Pressable onPress={() => setPreviewImageUri(business.facadeUri)}>
                  <ExpoImage
                    source={{ uri: business.facadeUri }}
                    style={styles.inlinePreviewImage}
                    contentFit="cover"
                    cachePolicy="none"
                  />
                </Pressable>
                <Pressable style={styles.changeBtn} onPress={() => showImageOptions('facade')}>
                  <Ionicons name="business-outline" size={18} color={colors.white} />
                  <Text style={styles.changeBtnText}>Cambiar</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.imagePicker} onPress={() => showImageOptions('facade')}>
                <Ionicons name="business-outline" size={40} color={colors.textSecondary} />
                <Text style={styles.imagePickerTitle}>Foto de la Fachada</Text>
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
            <VehicleAccordion
              brands={catalog?.brands ?? []}
              modelsMap={modelsMap ?? {}}
              selectedModels={selectedModels ?? []}
              onToggleModel={toggleModel}
              onSelectAllModels={selectAllModels}
              onDeselectAllModels={deselectAllModels}
              onExpandBrand={loadModelsForBrand}
            />
          </View>
        );
      case 5:
        return (
          <View>
            <Text style={styles.stepTitle}>¿Qué repuestos ofreces?</Text>
            <Text style={styles.stepDesc}>Selecciona categorías y subcategorías</Text>
            <PartsAccordion
              categories={catalog?.categories ?? []}
              subcategoriesMap={subcategoriesMap ?? {}}
              selectedSubcategories={selectedSubcategories ?? []}
              onToggleSubcategory={toggleSubcategory}
              onSelectAllSubs={selectAllSubs}
              onDeselectAllSubs={deselectAllSubs}
              onExpandCategory={loadSubsForCategory}
            />
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
              <Text style={styles.summaryLabel}>Subcategorías seleccionadas</Text>
              <Text style={styles.summaryValue}>{selectedSubcategories?.length ?? 0} subcategorías</Text>
            </View>

            {/* Age confirmation checkbox (LOPNNA) */}
            <Pressable
              onPress={() => setAgeConfirmed((v) => !v)}
              style={styles.checkboxRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ageConfirmed }}
            >
              <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
                {ageConfirmed ? <Ionicons name="checkmark" size={14} color="#000" /> : null}
              </View>
              <Text style={styles.checkboxLabel}>
                Confirmo que soy <Text style={{ fontWeight: '700' }}>mayor de 18 años</Text> (LOPNNA)
              </Text>
            </Pressable>
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
            <Button title="Siguiente" onPress={() => { const nextStep = step + 1; setStep(nextStep); saveDraft(nextStep); }} disabled={!canNext()} />
          ) : (
            <>
              <Button title="Crear Cuenta" onPress={handleSubmit} loading={loading} disabled={!canNext()} />
              <Text style={styles.legalText}>
                Al crear tu cuenta, aceptas los{' '}
                <Text style={styles.legalLink} onPress={() => Linking.openURL('https://nexxos.app/terminos')}>Términos y Condiciones</Text>
                {' '}y la{' '}
                <Text style={styles.legalLink} onPress={() => Linking.openURL('https://nexxos.app/privacidad')}>Política de Privacidad</Text>.
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
      {/* Draft restoration modal */}
      <Modal visible={showDraftModal} transparent animationType="fade">
        <View style={styles.draftOverlay}>
          <View style={styles.draftCard}>
            <View style={styles.draftIconCircle}>
              <Ionicons name="document-text-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.draftTitle}>Registro pendiente</Text>
            <Text style={styles.draftDesc}>
              Encontramos un registro que no completaste.{'\n'}¿Deseas continuar donde lo dejaste?
            </Text>
            {pendingDraftRef.current?.personal?.firstName ? (
              <View style={styles.draftInfoRow}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.draftInfoText}>
                  {pendingDraftRef.current.personal.firstName} {pendingDraftRef.current.personal.lastName ?? ''}
                </Text>
              </View>
            ) : null}
            {pendingDraftRef.current?.business?.businessName ? (
              <View style={styles.draftInfoRow}>
                <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.draftInfoText}>{pendingDraftRef.current.business.businessName}</Text>
              </View>
            ) : null}
            <View style={styles.draftInfoRow}>
              <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.draftInfoText}>Paso {pendingDraftRef.current?.step ?? 1} de {TOTAL_STEPS}</Text>
            </View>

            <Pressable
              style={styles.draftContinueBtn}
              onPress={() => {
                if (pendingDraftRef.current) restoreDraft(pendingDraftRef.current);
                pendingDraftRef.current = null;
                setShowDraftModal(false);
              }}
            >
              <Ionicons name="arrow-forward" size={20} color="#000" />
              <Text style={styles.draftContinueBtnText}>Continuar registro</Text>
            </Pressable>

            <Pressable
              style={styles.draftNewBtn}
              onPress={() => {
                pendingDraftRef.current = null;
                clearDraft();
                setShowDraftModal(false);
              }}
            >
              <Text style={styles.draftNewBtnText}>Empezar de nuevo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ImagePreviewModal
        visible={!!previewImageUri}
        imageUri={previewImageUri}
        onClose={() => setPreviewImageUri(null)}
      />
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
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, paddingVertical: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: c.border, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: c.primary, borderColor: c.primary },
  checkboxLabel: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 18 },
  legalText: { fontSize: 12, color: c.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 18 },
  legalLink: { color: c.primary, fontWeight: '600', textDecorationLine: 'underline' } as any,
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

  summaryCard: { backgroundColor: c.backgroundSection, borderRadius: BorderRadius.md, padding: Spacing.md },
  summaryLabel: { fontSize: 12, color: c.textSecondary, marginTop: Spacing.sm },
  summaryValue: { fontSize: 15, fontWeight: '500', color: c.textPrimary },
  requiredStar: { color: c.error, fontSize: 13 },
  inlinePreviewBlock: {
    marginBottom: Spacing.md,
  },
  inlinePreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: c.backgroundSection,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
    marginTop: Spacing.sm,
  },
  changeBtnText: {
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
  existingUserNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: c.primary + '15',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: 8,
  },
  existingUserNoticeText: {
    fontSize: 13,
    color: c.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  // Draft modal styles
  draftOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  draftCard: {
    backgroundColor: c.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  draftIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  draftTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 6,
  },
  draftDesc: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  draftInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    width: '100%',
  },
  draftInfoText: {
    fontSize: 14,
    color: c.textSubtitle,
    flex: 1,
  },
  draftContinueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    width: '100%',
    marginTop: Spacing.lg,
  },
  draftContinueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  draftNewBtn: {
    paddingVertical: 12,
    marginTop: Spacing.sm,
  },
  draftNewBtnText: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '500',
  },
});
