import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import { groupBrandsByOrigin } from '../utils/brandOrigins';
import BrandLogo from './BrandLogo';
import type { CatalogItem } from '../types';

if (Platform.OS === 'android' && UIManager?.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface VehicleAccordionProps {
  brands: CatalogItem[];
  modelsMap: Record<string, CatalogItem[]>;
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
  onSelectAllModels: (brandId: string) => void;
  onDeselectAllModels: (brandId: string) => void;
  onExpandBrand: (brandId: string) => void;
}

export default function VehicleAccordion({
  brands,
  modelsMap,
  selectedModels,
  onToggleModel,
  onSelectAllModels,
  onDeselectAllModels,
  onExpandBrand,
}: VehicleAccordionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const grouped = groupBrandsByOrigin(brands ?? []);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((brandId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
        onExpandBrand?.(brandId);
      }
      return next;
    });
  }, [onExpandBrand]);

  const safeModels = selectedModels ?? [];

  return (
    <View>
      {grouped.map((group) => (
        <View key={group?.region?.key} style={styles.regionSection}>
          <View style={styles.regionHeader}>
            <Text style={styles.regionFlag}>{group?.region?.flag}</Text>
            <Text style={styles.regionLabel}>{group?.region?.label}</Text>
            <View style={styles.regionLine} />
          </View>
          {(group?.brands ?? []).map((brand) => {
            const brandId = brand?.id ?? '';
            const isExpanded = expandedBrands.has(brandId);
            const brandModels = modelsMap?.[brandId] ?? [];
            const selectedCount = brandModels.filter((m) => safeModels.includes(m?.id ?? '')).length;
            const totalCount = brandModels?.length ?? 0;
            const allSelected = totalCount > 0 && selectedCount === totalCount;

            return (
              <View key={brandId} style={styles.brandCard}>
                {/* Brand header row — tap to expand/collapse */}
                <Pressable
                  style={({ pressed }) => [
                    styles.brandRow,
                    isExpanded && styles.brandRowExpanded,
                    pressed && styles.brandRowPressed,
                  ]}
                  onPress={() => toggleExpand(brandId)}
                >
                  <BrandLogo brandName={brand?.name ?? ''} logoUrl={brand?.logoUrl} size={22} />
                  <Text style={styles.brandName}>{brand?.name ?? ''}</Text>
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

                {/* Expanded content — models grid */}
                {isExpanded ? (
                  <View style={styles.modelsContainer}>
                    {totalCount === 0 ? (
                      <Text style={styles.loadingText}>Cargando modelos...</Text>
                    ) : (
                      <>
                        {/* Quick actions */}
                        <View style={styles.quickActions}>
                          <Pressable
                            onPress={() => onSelectAllModels?.(brandId)}
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
                            onPress={() => onDeselectAllModels?.(brandId)}
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

                        {/* 2-column grid */}
                        <View style={styles.modelsGrid}>
                          {brandModels.map((model) => {
                            const modelId = model?.id ?? '';
                            const isSelected = safeModels.includes(modelId);
                            return (
                              <Pressable
                                key={modelId}
                                style={({ pressed }) => [
                                  styles.modelCell,
                                  isSelected && styles.modelCellSelected,
                                  pressed && styles.modelCellPressed,
                                ]}
                                onPress={() => onToggleModel?.(modelId)}
                              >
                                <Ionicons
                                  name={isSelected ? 'checkbox' : 'square-outline'}
                                  size={18}
                                  color={isSelected ? colors.primary : colors.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.modelName,
                                    isSelected && styles.modelNameSelected,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {model?.name ?? ''}
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
      ))}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  regionSection: { marginBottom: Spacing.md },
  regionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  regionFlag: { fontSize: 18 },
  regionLabel: { fontSize: 13, fontWeight: '700', color: c.textSecondary, letterSpacing: 0.8 },
  regionLine: { flex: 1, height: 1, backgroundColor: c.border, marginLeft: 4 },

  brandCard: {
    backgroundColor: c.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  brandRowExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  brandRowPressed: {
    opacity: 0.7,
  },
  brandName: {
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

  modelsContainer: {
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

  modelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modelCell: {
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
  modelCellSelected: {
    borderColor: c.primary,
    backgroundColor: `${c.primary}25`,
  },
  modelCellPressed: {
    opacity: 0.7,
  },
  modelName: {
    fontSize: 13,
    color: c.textSubtitle,
    flex: 1,
  },
  modelNameSelected: {
    fontWeight: '600',
    color: c.primary,
  },
});
