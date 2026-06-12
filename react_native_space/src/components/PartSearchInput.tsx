import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import { searchParts, type PartSearchResult } from '../services/catalog';
import VoiceSearchButton from './VoiceSearchButton';

interface PartSearchInputProps {
  onSelect: (result: PartSearchResult) => void;
  onClear?: () => void;
}

export default function PartSearchInput({ onSelect, onClear }: PartSearchInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PartSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const selectedRef = useRef(false);

  const doSearch = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = text?.trim?.() ?? '';
    if (trimmed.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const items = await searchParts(trimmed);
        setResults(items ?? []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  }, []);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    // CRITICAL: always mark focused when user types — onFocus may not fire
    // if the native input never actually lost focus (Android quirk)
    setFocused(true);
    if (selectedRef.current) {
      selectedRef.current = false;
      setSelected(false);
    }
    doSearch(text);
  }, [doSearch]);

  const handleSelect = useCallback((item: PartSearchResult) => {
    const label = item?.subcategoryName ?? item?.categoryName ?? '';
    setQuery(label);
    selectedRef.current = true;
    setSelected(true);
    setResults([]);
    setFocused(false);
    // Blur the native input so next tap triggers onFocus reliably
    inputRef.current?.blur?.();
    onSelect?.(item);
  }, [onSelect]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    selectedRef.current = false;
    setSelected(false);
    // CRITICAL: set focused immediately — .focus() may not trigger onFocus on Android
    setFocused(true);
    onClear?.();
    inputRef.current?.focus?.();
  }, [onClear]);

  const handleVoiceResult = useCallback((text: string) => {
    const trimmed = text?.trim?.() ?? '';
    if (!trimmed) return;
    setQuery(trimmed);
    selectedRef.current = false;
    setSelected(false);
    setFocused(true);
    doSearch(trimmed);
  }, [doSearch]);

  const showResults = focused && !selected && (query?.trim?.()?.length ?? 0) >= 2 && ((results?.length ?? 0) > 0 || loading);

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, selected ? styles.inputRowSelected : null]}>
        <Ionicons name="search" size={18} color={selected ? colors.primary : colors.textSecondary} style={styles.icon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          placeholder='Buscar repuesto... (ej: "croche", "tacos", "aceite")'
          placeholderTextColor={colors.textSecondary}
          onFocus={() => { if (blurTimerRef.current) { clearTimeout(blurTimerRef.current); blurTimerRef.current = null; } setFocused(true); }}
          onBlur={() => { blurTimerRef.current = setTimeout(() => { setFocused(false); blurTimerRef.current = null; }, 200); }}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading ? <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} /> : null}
        {!loading && (query?.length ?? 0) > 0 ? (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
        <VoiceSearchButton onResult={handleVoiceResult} size={20} />
      </View>

      {showResults ? (
        <View style={styles.dropdown}>
          {loading && (results?.length ?? 0) === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Buscando...</Text>
            </View>
          ) : null}
          {(results ?? []).map((item) => (
            <Pressable
              key={`${item?.subcategoryId}`}
              style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
              onPress={() => handleSelect(item)}
            >
              <Ionicons name="build-outline" size={16} color={colors.primary} />
              <View style={styles.resultTextCol}>
                <Text style={styles.resultName}>{item?.subcategoryName ?? ''}</Text>
                <Text style={styles.resultCategory}>{item?.categoryName ?? ''}</Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
            </Pressable>
          ))}
          {!loading && (results?.length ?? 0) === 0 && (query?.trim?.()?.length ?? 0) >= 2 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>Sin resultados para "{query?.trim?.() ?? ''}"</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { marginBottom: Spacing.md, zIndex: 10 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: c.border,
    paddingHorizontal: Spacing.sm,
  },
  inputRowSelected: {
    borderColor: c.primary,
    backgroundColor: `${c.primary}08`,
  },
  icon: { marginRight: 6 },
  input: { flex: 1, fontSize: 15, color: c.textPrimary, paddingVertical: Platform.OS === 'ios' ? 12 : 10 },
  spinner: { marginLeft: 6 },
  clearBtn: { padding: 4, marginLeft: 4 },
  dropdown: {
    backgroundColor: c.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: c.border,
    marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 6 },
      default: {},
    }),
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  resultRowPressed: { backgroundColor: `${c.primary}15` },
  resultTextCol: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  resultCategory: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md },
  loadingText: { fontSize: 14, color: c.textSecondary },
  emptyRow: { padding: Spacing.md },
  emptyText: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
});
