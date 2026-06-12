import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/colors';

// Lazy-load speech recognition to avoid crash on web
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;

if (Platform.OS !== 'web') {
  try {
    const mod = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
  } catch {
    // Module not available (e.g. Expo Go without dev build)
  }
}

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  size?: number;
}

// Dummy hook for web or when module unavailable
const useNoopEvent = (_event: string, _cb: any) => {};

export default function VoiceSearchButton({ onResult, size = 22 }: VoiceSearchButtonProps) {
  const { colors } = useTheme();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const useEvent = useSpeechRecognitionEvent ?? useNoopEvent;

  // Not available on web or without native module
  const isAvailable = Platform.OS !== 'web' && !!ExpoSpeechRecognitionModule;

  // Pulse animation while listening
  useEffect(() => {
    if (listening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [listening, pulseAnim]);

  // Speech recognition events
  useEvent('start', () => {
    setListening(true);
    setTranscript('');
    setError('');
  });

  useEvent('end', () => {
    setListening(false);
  });

  useEvent('result', (ev: any) => {
    const results = ev?.results ?? [];
    const last = results?.[results.length - 1];
    const text = last?.transcript ?? '';
    setTranscript(text);
    // If it's a final result, send it back
    if (last?.isFinal && text) {
      onResult(text);
      stopListening();
    }
  });

  useEvent('error', (ev: any) => {
    const code = ev?.error ?? '';
    console.warn('[VoiceSearch] error:', code, ev?.message);
    if (code === 'no-speech') {
      setError('No se detectó voz. Intenta de nuevo.');
    } else if (code === 'not-allowed' || code === 'service-not-allowed') {
      setError('Permiso de micrófono denegado.');
    } else {
      setError('Error de reconocimiento de voz.');
    }
    setListening(false);
  });

  const startListening = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) return;
    setError('');
    setTranscript('');
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        setError('Permiso de micrófono denegado.');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'es-VE',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
      });
    } catch (err: any) {
      console.warn('[VoiceSearch] start error:', err);
      setError('No se pudo iniciar el reconocimiento de voz.');
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule?.stop?.();
    } catch { }
    setListening(false);
  }, []);

  const handlePress = useCallback(() => {
    if (listening) {
      // If we have interim text, send it before stopping
      if (transcript) onResult(transcript);
      stopListening();
    } else {
      startListening();
    }
  }, [listening, transcript, onResult, startListening, stopListening]);

  const handleDismiss = useCallback(() => {
    stopListening();
    setError('');
    setTranscript('');
  }, [stopListening]);

  if (!isAvailable) return null;

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.6 : 1 }]}
        hitSlop={8}
        accessibilityLabel={listening ? 'Detener búsqueda por voz' : 'Buscar por voz'}
        accessibilityRole="button"
      >
        <Ionicons
          name={listening ? 'mic' : 'mic-outline'}
          size={size}
          color={listening ? '#EF4444' : colors.textSecondary}
        />
      </Pressable>

      {/* Listening modal overlay */}
      <Modal
        visible={listening || !!error}
        transparent
        animationType="fade"
        onRequestClose={handleDismiss}
      >
        <Pressable style={styles.overlay} onPress={handleDismiss}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            {error ? (
              <>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={[styles.errorText, { color: colors.textPrimary }]}>{error}</Text>
                <Pressable onPress={handleDismiss} style={[styles.dismissBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.dismissBtnText}>Cerrar</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Animated.View style={[styles.micCircle, { transform: [{ scale: pulseAnim }] }]}>
                  <Ionicons name="mic" size={40} color="#FFFFFF" />
                </Animated.View>
                <Text style={[styles.listeningText, { color: colors.textPrimary }]}>Escuchando...</Text>
                {transcript ? (
                  <Text style={[styles.transcript, { color: colors.textSecondary }]}>"{transcript}"</Text>
                ) : (
                  <Text style={[styles.hint, { color: colors.textSecondary }]}>Di el nombre del repuesto</Text>
                )}
                <Pressable onPress={handleDismiss} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
    marginLeft: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  listeningText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  transcript: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  dismissBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  dismissBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
});
