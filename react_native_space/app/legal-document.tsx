import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/contexts/ThemeContext';

const TITLE_MAP: Record<string, string> = {
  terminos: 'Términos y Condiciones',
  privacidad: 'Política de Privacidad',
  'sobre-nosotros': 'Sobre Nosotros',
};

const URL_MAP: Record<string, string> = {
  terminos: 'https://nexxos.app/terminos',
  privacidad: 'https://nexxos.app/privacidad',
};

export default function LegalDocumentScreen() {
  const { key = '' } = useLocalSearchParams<{ key: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [title] = useState(TITLE_MAP[key as string] ?? 'Documento Legal');
  const webUrl = URL_MAP[key as string] ?? '';

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light)?.catch?.(() => {});
    }
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handleBack} style={styles.backBtn} accessibilityLabel="Volver" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
        <View style={styles.backBtn} />
      </View>

      {webUrl ? (
        Platform.OS === 'web' ? (
          <WebContentWeb url={webUrl} />
        ) : (
          <WebViewLegal url={webUrl} />
        )
      ) : (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Documento no disponible</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Web: render via iframe
function WebContentWeb({ url }: { url: string }) {
  return (
    <View style={styles.webview}>
      {/* @ts-ignore - iframe is valid on web */}
      <iframe
        src={url}
        style={{ width: '100%', height: '100%', border: 'none' } as any}
        title="Legal Document"
      />
    </View>
  );
}

// Native: render via WebView
function WebViewLegal({ url }: { url: string }) {
  const WebView = require('react-native-webview').default;
  return (
    <WebView
      source={{ uri: url }}
      style={styles.webview}
      originWhitelist={['*']}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { fontSize: 15, marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#FFC107', borderRadius: 8 },
  retryText: { color: '#000', fontWeight: '700', fontSize: 14 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 0 },
  webview: { flex: 1 },
});
