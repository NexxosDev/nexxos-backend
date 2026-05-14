import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import type { CatalogItem } from '../types';
import { getCategoryIcon } from '../utils/categoryIcons';

if (Platform.OS === 'android' && UIManager?.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PartsAccordionProps {
  categories: CatalogItem[];
  subcategoriesMap: Record<string, CatalogItem[]>;
  selectedSubcategories: string[];
  onToggleSubcategory: (subId: string) => void;
  onSelectAllSubs: (catId: string) => void;
  onDeselectAllSubs: (catId: string) => void;
  onExpandCategory: (catId: string) => void;
}

export default function PartsAccordion({
  categories,
  subcategoriesMap,
  selectedSubcategories,
  onToggleSubcategory,
  onSelectAllSubs,
  onDeselectAllSubs,
  onExpandCategory,
}: PartsAccordionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const safeSubs = selectedSubcategories ?? [];

  const toggleExpand = useCallback((catId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
        onExpandCategory?.(catId);
      }
      return next;
    });
  }, [onExpandCategory]);

  return (
    <View>
      {(categories ?? []).map((cat) => {
        const catId = cat?.id ?? '';
        const isExpanded = expandedCats.has(catId);
        const catSubs = subcategoriesMap?.[catId] ?? [];
        const selectedCount = catSubs.filter((s) => safeSubs.includes(s?.id ?? '')).length;
        const totalCount = catSubs?.length ?? 0;
        const allSelected = totalCount > 0 && selectedCount === totalCount;
        const iconName = getCategoryIcon(cat?.name ?? '');

        return (
          <View key={catId} style={styles.catCard}>
            <Pressable
              style={({ pressed }) => [
                styles.catRow,
                isExpanded && styles.catRowExpanded,
                pressed && styles.catRowPressed,
              ]}
              onPress={() => toggleExpand(catId)}
            >
              <View style={styles.catIconWrap}>
                <Ionicons name={iconName as any} size={18} color={colors.primary} />
              </View>
              <Text style={styles.catName}>{cat?.name ?? ''}</Text>
              {totalCount > 0 ? (
                <View style={[
                  styles.countBadge,
                  selectedCount > 0 && styles.countBadgeActive,
                ]}>
                  <Text style={[
                    styles.countText,
                    selectedCount > 0 && styles.countTextActive,
                  ]}>
                    {selectedCount}/{totalCount}
                  </Text>
                </View>
              ) : null}
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
                style={styles.chevron}
              />
            </Pressable>

            {isExpanded ? (
              <View style={styles.subsContainer}>
                {totalCount === 0 ? (
                  <Text style={styles.loadingText}>Cargando subcategorías...</Text>
                ) : (
                  <>
                    <View style={styles.quickActions}>
                      <Pressable
                        onPress={() => onSelectAllSubs?.(catId)}
                        style={({ pressed }) => [
                          styles.quickBtn,
                          allSelected && styles.quickBtnDisabled,
                          pressed && !allSelected && styles.quickBtnPressed,
                        ]}
                        disabled={allSelected}
                      >
                        <Ionicons name="checkmark-done" size={14} color={allSelected ? colors.textSecondary : colors.primary} />
                        <Text style={[styles.quickBtnText, allSelected && styles.quickBtnTextDisabled]}>Todos</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onDeselectAllSubs?.(catId)}
                        style={({ pressed }) => [
                          styles.quickBtn,
                          selectedCount === 0 && styles.quickBtnDisabled,
                          pressed && selectedCount > 0 && styles.quickBtnPressed,
                        ]}
                        disabled={selectedCount === 0}
                      >
                        <Ionicons name="close-circle-outline" size={14} color={selectedCount === 0 ? colors.textSecondary : colors.error} />
                        <Text style={[styles.quickBtnText, selectedCount === 0 && styles.quickBtnTextDisabled]}>Ninguno</Text>
                      </Pressable>
                    </View>

                    <View style={styles.subsGrid}>
                      {catSubs.map((sub) => {
                        const subId = sub?.id ?? '';
                        const isSelected = safeSubs.includes(subId);
                        return (
                          <Pressable
                            key={subId}
                            style={({ pressed }) => [
                              styles.subCell,
                              isSelected && styles.subCellSelected,
                              pressed && styles.subCellPressed,
                            ]}
                            onPress={() => onToggleSubcategory?.(subId)}
                          >
                            <Ionicons
                              name={isSelected ? 'checkbox' : 'square-outline'}
                              size={18}
                              color={isSelected ? colors.primary : colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.subName,
                                isSelected && styles.subNameSelected,
                              ]}
                              numberOfLines={2}
                            >
                              {sub?.name ?? ''}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  catCard: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  catRowExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  catRowPressed: {
    opacity: 0.7,
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${c.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: c.textPrimary,
  },
  countBadge: {
    backgroundColor: c.backgroundSection,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 36,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: `${c.primary}20`,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
  },
  countTextActive: {
    color: c.primary,
  },
  chevron: {
    marginLeft: 4,
  },

  subsContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: c.backgroundSection,
  },
  loadingText: {
    fontSize: 13,
    color: c.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  quickBtnDisabled: {
    opacity: 0.5,
  },
  quickBtnPressed: {
    opacity: 0.7,
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSubtitle,
  },
  quickBtnTextDisabled: {
    color: c.textSecondary,
  },

  subsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  subCellSelected: {
    borderColor: c.primary,
    backgroundColor: `${c.primary}25`,
  },
  subCellPressed: {
    opacity: 0.7,
  },
  subName: {
    fontSize: 13,
    color: c.textSubtitle,
    flex: 1,
  },
  subNameSelected: {
    fontWeight: '600',
    color: c.primary,
  },
});
