import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import { groupBrandsByOrigin } from '../utils/brandOrigins';
import BrandLogo from './BrandLogo';
import type { CatalogItem } from '../types';

interface BrandsByOriginProps {
  brands: CatalogItem[];
  selectedBrands: string[];
  onToggleBrand: (brandId: string) => void;
}

export default function BrandsByOrigin({ brands, selectedBrands, onToggleBrand }: BrandsByOriginProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const grouped = groupBrandsByOrigin(brands ?? []);

  return (
    <View>
      {grouped.map((group) => (
        <View key={group.region.key} style={styles.regionSection}>
          <View style={styles.regionHeader}>
            <Text style={styles.regionFlag}>{group.region.flag}</Text>
            <Text style={styles.regionLabel}>{group.region.label}</Text>
            <View style={styles.regionLine} />
          </View>
          <View style={styles.chipContainer}>
            {(group.brands ?? []).map((b) => {
              const isSelected = (selectedBrands ?? []).includes(b?.id ?? '');
              return (
                <Pressable key={b?.id} style={[styles.chip, isSelected && styles.chipSelected]} onPress={() => onToggleBrand(b?.id ?? '')}>
                  <BrandLogo brandName={b?.name ?? ''} logoUrl={b?.logoUrl} size={20} />
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{b?.name ?? ''}</Text>
                </Pressable>
              );
            })}
          </View>
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
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: c.chipBg },
  chipSelected: { backgroundColor: c.chipSelectedBg },
  chipText: { fontSize: 14, color: c.textSubtitle },
  chipTextSelected: { color: c.accent, fontWeight: '600' },
});
