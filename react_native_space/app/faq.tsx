import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { Spacing, BorderRadius } from '../src/theme/colors';
import type { ThemeColors } from '../src/theme/colors';
import api from '../src/services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategoryData {
  key: string;
  label: string;
  icon: string;
  items: FAQItem[];
}

export default function FAQScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [categories, setCategories] = useState<FAQCategoryData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/legal/faq');
        const cats = res?.data?.categories ?? [];
        if (mounted) setCategories(cats);
      } catch {
        // fallback: empty
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleQuestion = useCallback((index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleCategoryChange = useCallback((idx: number) => {
    setActiveIndex(idx);
    setExpandedIndex(null);
  }, []);

  const activeCat = categories?.[activeIndex];
  const items = activeCat?.items ?? [];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Preguntas Frecuentes</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Preguntas Frecuentes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        {categories.map((cat, idx) => {
          const isActive = activeIndex === idx;
          return (
            <Pressable
              key={cat?.key ?? idx}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleCategoryChange(idx)}
            >
              <Ionicons
                name={(cat?.icon ?? 'help-outline') as any}
                size={16}
                color={isActive ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {cat?.label ?? ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* FAQ List */}
      <ScrollView contentContainerStyle={styles.scroll}>
        {items.map((item, index) => {
          const isOpen = expandedIndex === index;
          return (
            <View key={`${activeIndex}-${index}`} style={styles.faqCard}>
              <Pressable
                style={styles.questionRow}
                onPress={() => toggleQuestion(index)}
              >
                <Text style={styles.questionText}>{item?.q ?? ''}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.primary}
                />
              </Pressable>
              {isOpen ? (
                <View style={styles.answerContainer}>
                  <View style={styles.answerDivider} />
                  <Text style={styles.answerText}>{item?.a ?? ''}</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        {/* Contact footer */}
        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={24} color={colors.primary} />
          <Text style={styles.contactTitle}>¿No encontraste tu respuesta?</Text>
          <Text style={styles.contactText}>Escríbenos a soporte@nexxos.com</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: c.textPrimary,
    },
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: 8,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: BorderRadius.md,
      backgroundColor: c.backgroundSection,
      borderWidth: 1,
      borderColor: c.border,
    },
    tabActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
    },
    tabTextActive: {
      color: c.accent,
      fontWeight: '600',
    },
    scroll: {
      padding: Spacing.md,
      paddingBottom: 40,
    },
    faqCard: {
      backgroundColor: c.cardBg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: Spacing.sm,
      overflow: 'hidden',
    },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    questionText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: c.textPrimary,
      lineHeight: 21,
    },
    answerContainer: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
    answerDivider: {
      height: 1,
      backgroundColor: c.border,
      marginBottom: Spacing.sm,
    },
    answerText: {
      fontSize: 14,
      color: c.textSubtitle ?? c.textSecondary,
      lineHeight: 22,
    },
    contactCard: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      marginTop: Spacing.md,
      gap: 8,
    },
    contactTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textPrimary,
    },
    contactText: {
      fontSize: 14,
      color: c.primary,
      fontWeight: '500',
    },
  });
