import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert, ActivityIndicator, Image as RNImage, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';

type LivenessStep = 'neutral' | 'smile' | 'turn';
interface CapturedSelfies { neutral?: string; smile?: string; turn?: string; }
interface LivenessSelfieCaptureProps { onComplete: (selfies: { neutral: string; smile: string; turn: string }) => void; onCancel: () => void; }

const STEPS: { key: LivenessStep; icon: string; title: string; instruction: string; tip: string }[] = [
  { key: 'neutral', icon: 'person-outline', title: 'Paso 1 de 3', instruction: 'Expresión neutra', tip: 'Mira directamente a la cámara con expresión natural, sin sonreír.' },
  { key: 'smile', icon: 'happy-outline', title: 'Paso 2 de 3', instruction: '¡Sonríe!', tip: 'Muestra una sonrisa natural mirando a la cámara.' },
  { key: 'turn', icon: 'arrow-redo-outline', title: 'Paso 3 de 3', instruction: 'Gira tu cabeza', tip: 'Gira tu cabeza ligeramente hacia la derecha y mira a la cámara.' },
];

const { width: SCREEN_W } = Dimensions.get('window');

export default function LivenessSelfieCapture({ onComplete, onCancel }: LivenessSelfieCaptureProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [currentStep, setCurrentStep] = useState(0);
  const [captured, setCaptured] = useState<CapturedSelfies>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const stepInfo = STEPS[currentStep] ?? STEPS[0];
  const currentUri = captured?.[stepInfo.key];

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (photo?.uri) {
        // Process through image-manipulator to create a reliable file
        const manipulated = await manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: SaveFormat.JPEG }
        );
        const finalUri = manipulated?.uri ?? photo.uri;
        console.log('[LivenessSelfie] captured step:', stepInfo.key, 'uri:', finalUri?.substring?.(0, 60));
        setCaptured((prev) => ({ ...(prev ?? {}), [stepInfo.key]: finalUri }));
        setShowCamera(false);
        setShowPreview(true);
      }
    } catch (err) {
      console.log('[LivenessSelfie] capture error:', err);
      Alert.alert('Error', 'No se pudo capturar la foto. Intenta nuevamente.');
    } finally {
      setCapturing(false);
    }
  }, [stepInfo, capturing]);

  const openCamera = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result?.granted) {
        Alert.alert('Permiso Denegado', 'Necesitamos acceso a la cámara para tomar las selfies de verificación. Ve a Ajustes para habilitarlo.');
        return;
      }
    }
    setShowCamera(true);
  }, [permission, requestPermission]);

  const confirmAndNext = useCallback(() => {
    setShowPreview(false);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else if (captured?.neutral && captured?.smile && captured?.turn) {
      onComplete({ neutral: captured.neutral, smile: captured.smile, turn: captured.turn });
    }
  }, [currentStep, captured, onComplete]);

  const retake = useCallback(() => {
    setCaptured((prev) => ({ ...(prev ?? {}), [stepInfo.key]: undefined }));
    setShowPreview(false);
  }, [stepInfo]);

  // Intro screen with tips
  if (showIntro) {
    return (
      <View style={styles.introContainer}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} hitSlop={10}><Ionicons name="close" size={28} color="#FFFFFF" /></Pressable>
          <Text style={styles.headerTitle}>Verificación Facial</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.introContent}>
          <View style={styles.introIconCircle}>
            <Ionicons name="sunny-outline" size={56} color={colors.primary} />
          </View>
          <Text style={styles.introTitle}>Antes de empezar</Text>
          <Text style={styles.introSubtitle}>Para obtener fotos claras, sigue estos consejos:</Text>

          <View style={styles.tipsList}>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.tipText}>Ubícate en un lugar bien iluminado</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.tipText}>Evita tener luz fuerte detrás de ti</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.tipText}>Se usará la cámara frontal automáticamente</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.tipText}>Podrás revisar y repetir cada foto</Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.warningText}>
              Se tomarán 3 fotos: expresión neutra, sonrisa y giro de cabeza.
            </Text>
          </View>
        </View>

        <View style={styles.introFooter}>
          <Pressable style={styles.introStartBtn} onPress={() => setShowIntro(false)}>
            <Ionicons name="camera" size={22} color="#000" />
            <Text style={styles.introStartBtnText}>Comenzar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // In-app camera view (always front-facing)
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          mirror={true}
        />

        {/* Overlay with instruction */}
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraTopBar}>
            <Pressable onPress={() => setShowCamera(false)} hitSlop={10}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.cameraStepText}>{stepInfo.instruction}</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Face guide oval */}
          <View style={styles.faceGuide}>
            <View style={styles.faceOval} />
          </View>

          <Text style={styles.cameraTip}>{stepInfo.tip}</Text>

          {/* Capture button */}
          <View style={styles.cameraBottomBar}>
            <Pressable
              style={[styles.shutterButton, capturing && { opacity: 0.5 }]}
              onPress={handleCapture}
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Preview screen after capturing a photo
  if (showPreview && currentUri) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} hitSlop={10}><Ionicons name="close" size={28} color="#FFFFFF" /></Pressable>
          <Text style={styles.headerTitle}>{stepInfo.title}</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.dotsRow}>{STEPS.map((_, i) => <View key={i} style={[styles.dot, i <= currentStep ? styles.dotActive : null]} />)}</View>

        <View style={styles.previewContainer}>
          <RNImage source={{ uri: currentUri }} style={styles.previewImage} resizeMode="cover" fadeDuration={0} />
        </View>

        <Text style={styles.previewLabel}>¿La foto se ve bien?</Text>
        <Text style={styles.previewHint}>Asegúrate de que tu rostro se vea claramente, sin borrosidad ni partes blancas.</Text>

        <View style={styles.buttonsRow}>
          <Pressable style={styles.retakeBtn} onPress={retake}>
            <Ionicons name="refresh" size={20} color={colors.error} />
            <Text style={styles.retakeBtnText}>Repetir</Text>
          </Pressable>
          <Pressable style={styles.confirmBtn} onPress={confirmAndNext}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>{currentStep < STEPS.length - 1 ? 'Siguiente' : 'Finalizar'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Instruction screen before opening camera
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} hitSlop={10}><Ionicons name="close" size={28} color="#FFFFFF" /></Pressable>
        <Text style={styles.headerTitle}>{stepInfo.title}</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.dotsRow}>{STEPS.map((_, i) => <View key={i} style={[styles.dot, i <= currentStep ? styles.dotActive : null]} />)}</View>

      <View style={styles.instructionContainer}>
        <View style={styles.instructionIconCircle}>
          <Ionicons name={stepInfo.icon as any} size={64} color={colors.primary} />
        </View>
        <Text style={styles.instructionTitle}>{stepInfo.instruction}</Text>
        <Text style={styles.instructionTip}>{stepInfo.tip}</Text>

        <View style={styles.reminderBox}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={styles.reminderText}>Se abrirá la cámara frontal dentro de la app. Presiona el botón circular para capturar.</Text>
        </View>
      </View>

      <View style={styles.captureFooter}>
        <Pressable
          style={styles.captureButton}
          onPress={openCamera}
        >
          <Ionicons name="camera" size={24} color="#000" />
          <Text style={styles.captureButtonText}>Abrir Cámara</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: Spacing.md, paddingTop: Platform.OS === 'ios' ? 8 : Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: c.primary },

  // Instruction screen
  instructionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  instructionIconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,193,7,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  instructionTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, textAlign: 'center' },
  instructionTip: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  reminderBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,193,7,0.1)', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: c.primary,
  },
  reminderText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1, lineHeight: 18 },

  // Capture button footer
  captureFooter: { padding: Spacing.lg, paddingBottom: Spacing.xl, width: '100%' },
  captureButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: c.primary, paddingVertical: 16, borderRadius: BorderRadius.md,
  },
  captureButtonText: { fontSize: 17, fontWeight: '700', color: '#000' },

  // In-app camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  cameraTopBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Platform.OS === 'ios' ? 56 : 40,
  },
  cameraStepText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  faceGuide: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  faceOval: {
    width: SCREEN_W * 0.55,
    height: SCREEN_W * 0.75,
    borderRadius: SCREEN_W * 0.375,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  cameraTip: {
    fontSize: 14, color: '#FFFFFF', textAlign: 'center',
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.md,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  cameraBottomBar: {
    alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 50 : 40,
  },
  shutterButton: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#FFFFFF',
  },
  shutterInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },

  // Preview screen
  previewContainer: {
    width: 260, height: 340, borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#1A1A1A', marginTop: Spacing.md,
    borderWidth: 2, borderColor: c.primary,
  },
  previewImage: { width: 260, height: 340 },
  previewLabel: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginTop: 20 },
  previewHint: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 6, paddingHorizontal: Spacing.xl, lineHeight: 18 },

  buttonsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: Spacing.lg, paddingBottom: Spacing.xl },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: c.error },
  retakeBtnText: { color: c.error, fontWeight: '600', fontSize: 15 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.full, backgroundColor: c.success },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },

  // Intro screen
  introContainer: { flex: 1, backgroundColor: '#0A0A0A' },
  introContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  introIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,193,7,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  introTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  introSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 22 },
  tipsList: { width: '100%', gap: 14, marginBottom: Spacing.lg },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipText: { fontSize: 14, color: '#FFFFFF', flex: 1, lineHeight: 20 },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(255,193,7,0.1)', borderRadius: BorderRadius.md, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: c.primary },
  warningText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 18 },
  introFooter: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  introStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.primary, paddingVertical: 16, borderRadius: BorderRadius.md },
  introStartBtnText: { fontSize: 17, fontWeight: '700', color: '#000' },
});
