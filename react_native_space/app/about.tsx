import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Platform, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useTheme } from '../src/contexts/ThemeContext';
import api from '../src/services/api';

interface ParsedSection {
  emoji: string;
  title: string;
  items: string[];
  type: 'text' | 'list' | 'contact' | 'social';
}

export default function AboutScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sections, setSections] = useState<ParsedSection[]>([]);

  const fetchAbout = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/legal/sobre-nosotros');
      const html = res?.data?.content ?? '';
      setSections(parseHtmlToSections(html));
    } catch (err) {
      console.error('Error fetching about:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAbout();
  }, [fetchAbout]);

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light)?.catch?.(() => {});
    }
    router.back();
  };

  const openLink = (url: string) => {
    Linking.openURL(url)?.catch?.(() => {});
  };

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`)?.catch?.(() => {});
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handleBack} style={styles.backBtn} accessibilityLabel="Volver" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Sobre NEXXOS</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFC107" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>No se pudo cargar la información</Text>
          <Pressable onPress={fetchAbout} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <LinearGradient
            colors={['#FFC107', '#FF9800'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroTitle}>NEXXOS</Text>
            <Text style={styles.heroSub}>Conectando soluciones, acercando oportunidades</Text>
          </LinearGradient>

          {/* Sections */}
          {sections?.map?.((section, idx) => (
            <View key={idx} style={[styles.sectionCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>{section?.emoji ?? ''}</Text>
                <Text style={[styles.sectionTitle, { color: '#FFC107' }]}>{section?.title ?? ''}</Text>
              </View>
              {section?.type === 'contact' ? (
                (section?.items ?? []).map((item, i) => {
                  const emailMatch = item?.match?.(/([\w.-]+@[\w.-]+\.\w+)/);
                  const email = emailMatch?.[1];
                  return (
                    <Pressable key={i} onPress={() => email && openEmail(email)} style={styles.contactRow}>
                      <Ionicons name="mail-outline" size={18} color="#FFC107" />
                      <Text style={[styles.contactText, { color: colors.textPrimary }]}>{email ?? item}</Text>
                    </Pressable>
                  );
                })
              ) : section?.type === 'social' ? (
                (section?.items ?? []).map((item, i) => {
                  const urlMatch = item?.match?.(/href="([^"]+)"/);
                  const labelMatch = item?.match?.(/>([^<]+)<\/a>/);
                  const iconMatch = item?.match?.(/^([📷🎵📘])/);
                  const platformMatch = item?.match?.(/Instagram|TikTok|Facebook/i);
                  const icon: any = platformMatch?.[0]?.toLowerCase?.() === 'instagram' ? 'logo-instagram' : platformMatch?.[0]?.toLowerCase?.() === 'tiktok' ? 'logo-tiktok' : 'logo-facebook';
                  return (
                    <Pressable key={i} onPress={() => urlMatch?.[1] && openLink(urlMatch[1])} style={styles.contactRow}>
                      <Ionicons name={icon} size={18} color="#FFC107" />
                      <Text style={[styles.contactText, { color: colors.textPrimary }]}>{labelMatch?.[1] ?? platformMatch?.[0] ?? item?.replace?.(/<[^>]*>/g, '') ?? ''}</Text>
                      <Ionicons name="open-outline" size={14} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                    </Pressable>
                  );
                })
              ) : section?.type === 'list' ? (
                (section?.items ?? []).map((item, i) => (
                  <View key={i} style={styles.listRow}>
                    <View style={styles.bullet} />
                    <Text style={[styles.listText, { color: colors.textSecondary }]}>{stripHtml(item)}</Text>
                  </View>
                ))
              ) : (
                (section?.items ?? []).map((item, i) => (
                  <Text key={i} style={[styles.bodyText, { color: colors.textSecondary }]}>{stripHtml(item)}</Text>
                ))
              )}
            </View>
          ))}

          <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 12, opacity: 0.6, marginTop: 24 }}>
            Versión {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function stripHtml(html: string): string {
  return (html ?? '').replace?.(/<[^>]*>/g, '') ?? '';
}

function parseHtmlToSections(html: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  if (!html) return sections;

  // Split by h2 tags
  const parts = html.split(/<h2>/i);
  for (const part of parts) {
    if (!part?.trim?.()) continue;
    const titleMatch = part.match(/^([^<]*)<\/h2>/i);
    if (!titleMatch) continue;

    const rawTitle = titleMatch[1]?.trim?.() ?? '';
    const restContent = part.substring(titleMatch[0]?.length ?? 0)?.trim?.() ?? '';

    // Extract emoji from title
    const emojiMatch = rawTitle.match(/^([\p{Emoji}\u200d]+)\s*/u);
    const emoji = emojiMatch?.[1] ?? '';
    const title = rawTitle.replace(/^[\p{Emoji}\u200d]+\s*/u, '')?.trim?.() ?? rawTitle;

    // Determine type based on content
    const isContact = title.toLowerCase().includes('contacto');
    const isSocial = title.toLowerCase().includes('redes');
    const hasList = restContent.includes('<li>');

    let items: string[] = [];
    if (hasList) {
      const listItems = restContent.match(/<li>([\s\S]*?)<\/li>/gi) ?? [];
      items = listItems.map(li => li.replace(/<\/?li>/gi, '')?.trim?.() ?? '');
    } else {
      const paragraphs = restContent.match(/<p>([\s\S]*?)<\/p>/gi) ?? [];
      items = paragraphs.map(p => p.replace(/<\/?p>/gi, '')?.trim?.() ?? '');
    }

    if (items.length === 0 && restContent) {
      items = [restContent];
    }

    let type: ParsedSection['type'] = 'text';
    if (isContact) type = 'contact';
    else if (isSocial) type = 'social';
    else if (hasList) type = 'list';

    sections.push({ emoji, title, items, type });
  }
  return sections;
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
  scrollContent: { padding: 16 },
  hero: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', web: 'Arial, sans-serif' }),
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 6,
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFC107',
    marginTop: 7,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
