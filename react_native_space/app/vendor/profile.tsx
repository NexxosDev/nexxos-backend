import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getVendorProfile, getVendorPlan } from '../../src/services/vendor';
import { Spacing, BorderRadius } from '../../src/theme/colors';
import type { ThemeColors } from '../../src/theme/colors';
import StarRating from '../../src/components/StarRating';
import LoadingSpinner from '../../src/components/LoadingSpinner';
import BrandLogo from '../../src/components/BrandLogo';
import VendorPlanCard from '../../src/components/VendorPlanCard';
import RenewalBanner from '../../src/components/RenewalBanner';

import ProfileActionButton from '../../src/components/ProfileActionButton';
import type { VendorProfile as VPType, VendorPlanInfo } from '../../src/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CATEGORY_ICONS: Record<string, string> = {
  'Partes Electricas': 'flash-outline',
  'Kit de Tiempos y Correas': 'time-outline',
  'Partes de Frenos': 'disc-outline',
  'Partes de Motor': 'cog-outline',
  'Rodamientos': 'sync-outline',
  'Suspension y Componentes': 'car-outline',
  'Cajas y Componentes': 'git-merge-outline',
  'Filtros y Purificadores': 'funnel-outline',
  'Direccion y Componentes': 'navigate-outline',
  'Estoperas': 'ellipse-outline',
  'Empacaduras': 'layers-outline',
  'Lubricantes y Aditivos': 'water-outline',
  'Seguridad Automotriz': 'shield-checkmark-outline',
  'Accesorios': 'construct-outline',
  'Mangueras': 'git-branch-outline',
  'Gomas y Guardapolvos': 'radio-button-off-outline',
  'Carroceria': 'car-sport-outline',
  'Guayas': 'link-outline',
  'Faros y Micas': 'bulb-outline',
  'Inyeccion y Combustion': 'flame-outline',
};

function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? 'pricetag-outline';
}

export default function VendorProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<VPType | null>(null);
  const [planInfo, setPlanInfo] = useState<VendorPlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());


  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [data, plan] = await Promise.all([
        getVendorProfile(),
        getVendorPlan().catch(() => null),
      ]);
      setProfile(data ?? null);
      setPlanInfo(plan ?? null);
    } catch { }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: async () => { await logout(); router.replace('/auth/login'); } },
    ]);
  };

  const toggleSection = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const toggleItem = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  const brandsGrouped = (profile?.vehicleModels ?? []).reduce<Record<string, string[]>>((acc, m) => {
    const brandName = m?.brand?.name ?? 'Otro';
    if (!acc[brandName]) acc[brandName] = [];
    acc[brandName]?.push?.(m?.name ?? '');
    return acc;
  }, {});

  const catsGrouped = (profile?.partSubcategories ?? []).reduce<Record<string, string[]>>((acc, s) => {
    const catName = s?.category?.name ?? 'Otro';
    if (!acc[catName]) acc[catName] = [];
    acc[catName]?.push?.(s?.name ?? '');
    return acc;
  }, {});

  const totalModels = profile?.vehicleModels?.length ?? 0;
  const totalSubs = profile?.partSubcategories?.length ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} tintColor={colors.primary} />}>
        {/* Dark mode toggle */}
        <View style={styles.themeRow}>
          <Pressable style={styles.themeBtn} onPress={toggleTheme} hitSlop={8}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {profile?.logoUrl ? (
              <Image
                source={{ uri: profile.logoUrl }}
                style={styles.logoImage}
                contentFit="cover"
                transition={200}
                cachePolicy="none"
              />
            ) : (
              <View style={styles.logoFallback}>
                <Ionicons name="storefront-outline" size={40} color={colors.textSecondary} />
              </View>
            )}
          </View>
          <Text style={styles.businessName}>{profile?.businessName ?? ''}</Text>
          <Text style={styles.rif}>RIF: {profile?.rif ?? ''}</Text>
          {typeof profile?.metrics?.avgRating === 'number' ? (
            <View style={styles.ratingRow}>
              <StarRating rating={Math.round(profile.metrics.avgRating)} readonly size={18} />
              <Text style={styles.ratingText}>({profile?.metrics?.totalRatings ?? 0})</Text>
            </View>
          ) : null}
        </View>

        <RenewalBanner planInfo={planInfo} />
        <VendorPlanCard planInfo={planInfo} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          {profile?.fullAddress ? (
            <Text style={styles.sectionValue}>{profile.fullAddress}</Text>
          ) : (
            <>
              {(profile?.street || profile?.parish) ? (
                <Text style={styles.sectionValue}>{[profile?.street, profile?.parish].filter(Boolean).join(', ')}</Text>
              ) : null}
              {(profile?.municipality || profile?.city || profile?.state) ? (
                <Text style={styles.sectionValue}>{[profile?.municipality, profile?.city, profile?.state].filter(Boolean).join(', ')}</Text>
              ) : null}
              {profile?.country ? (
                <Text style={styles.sectionValue}>{profile.country}</Text>
              ) : null}
            </>
          )}
          {profile?.referencePoint ? (
            <Text style={styles.sectionValueMuted}>Ref: {profile.referencePoint}</Text>
          ) : null}
        </View>

        {/* ── Accordion: Vehículos ── */}
        <View style={styles.accordionContainer}>
          <Pressable style={styles.accordionHeader} onPress={() => toggleSection('vehicles')}>
            <View style={styles.accordionHeaderLeft}>
              <Ionicons name="car-sport" size={22} color={colors.primary} />
              <Text style={styles.accordionTitle}>Vehículos</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{totalModels}</Text>
              </View>
            </View>
            <Ionicons
              name={expandedSections.has('vehicles') ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
          {expandedSections.has('vehicles') ? (
            <View style={styles.accordionBody}>
              {Object.entries(brandsGrouped).map(([brand, models]) => {
                const itemKey = `brand-${brand}`;
                const isOpen = expandedItems.has(itemKey);
                return (
                  <View key={brand}>
                    <Pressable style={styles.accordionItemHeader} onPress={() => toggleItem(itemKey)}>
                      <View style={styles.accordionItemLeft}>
                        <View style={styles.brandLogoWrap}>
                          <BrandLogo brandName={brand} size={28} />
                        </View>
                        <Text style={styles.accordionItemTitle}>{brand}</Text>
                        <Text style={styles.accordionItemCount}>({models?.length ?? 0})</Text>
                      </View>
                      <Ionicons
                        name={isOpen ? 'chevron-down' : 'chevron-forward'}
                        size={16}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                    {isOpen ? (
                      <View style={styles.accordionItemBody}>
                        {(models ?? []).map((m, i) => (
                          <View key={i} style={styles.leafItem}>
                            <View style={styles.leafDot} />
                            <Text style={styles.leafText}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
              {Object.keys(brandsGrouped).length === 0 ? (
                <Text style={styles.emptyText}>Sin vehículos registrados</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Accordion: Categorías ── */}
        <View style={styles.accordionContainer}>
          <Pressable style={styles.accordionHeader} onPress={() => toggleSection('categories')}>
            <View style={styles.accordionHeaderLeft}>
              <Ionicons name="pricetags" size={22} color={colors.primary} />
              <Text style={styles.accordionTitle}>Categorías</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{totalSubs}</Text>
              </View>
            </View>
            <Ionicons
              name={expandedSections.has('categories') ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
          {expandedSections.has('categories') ? (
            <View style={styles.accordionBody}>
              {Object.entries(catsGrouped).map(([cat, subs]) => {
                const itemKey = `cat-${cat}`;
                const isOpen = expandedItems.has(itemKey);
                const iconName = getCategoryIcon(cat);
                return (
                  <View key={cat}>
                    <Pressable style={styles.accordionItemHeader} onPress={() => toggleItem(itemKey)}>
                      <View style={styles.accordionItemLeft}>
                        <View style={styles.catIconWrap}>
                          <Ionicons name={iconName as any} size={18} color={colors.primary} />
                        </View>
                        <Text style={styles.accordionItemTitle}>{cat}</Text>
                        <Text style={styles.accordionItemCount}>({subs?.length ?? 0})</Text>
                      </View>
                      <Ionicons
                        name={isOpen ? 'chevron-down' : 'chevron-forward'}
                        size={16}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                    {isOpen ? (
                      <View style={styles.accordionItemBody}>
                        {(subs ?? []).map((s, i) => (
                          <View key={i} style={styles.leafItem}>
                            <View style={styles.leafDot} />
                            <Text style={styles.leafText}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
              {Object.keys(catsGrouped).length === 0 ? (
                <Text style={styles.emptyText}>Sin categorías registradas</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── CUENTA ── */}
        <Text style={styles.sectionLabel}>CUENTA</Text>
        <View style={styles.actionsCard}>
          <ProfileActionButton
            label="Editar Perfil"
            icon="create-outline"
            onPress={() => router.push('/vendor-edit-profile')}
          />
          <View style={styles.actionDivider} />
          <ProfileActionButton
            label="Cambiar Modo"
            icon="swap-horizontal-outline"
            onPress={() => router.replace('/role-selection')}
          />
        </View>

        {/* ── COMUNIDAD ── */}
        <Text style={styles.sectionLabel}>COMUNIDAD</Text>
        <View style={styles.actionsCard}>
          <ProfileActionButton
            label="Ayúdanos a crecer"
            icon="bulb-outline"
            onPress={() => router.push('/suggestions')}
          />
        </View>

        {/* ── INFORMACIÓN Y LEGAL ── */}
        <Text style={styles.sectionLabel}>INFORMACIÓN Y LEGAL</Text>
        <View style={styles.actionsCard}>
          <ProfileActionButton
            label="Sobre NEXXOS"
            icon="information-circle-outline"
            onPress={() => router.push('/about')}
          />
          <View style={styles.actionDivider} />
          <ProfileActionButton
            label="Términos y Condiciones"
            icon="document-text-outline"
            onPress={() => router.push('/legal-document?key=terminos')}
          />
          <View style={styles.actionDivider} />
          <ProfileActionButton
            label="Política de Privacidad"
            icon="shield-checkmark-outline"
            onPress={() => router.push('/legal-document?key=privacidad')}
          />
          <View style={styles.actionDivider} />
          <ProfileActionButton
            label="Preguntas Frecuentes"
            icon="help-circle-outline"
            onPress={() => router.push('/faq')}
          />
        </View>

        <View style={styles.dangerCard}>
          <ProfileActionButton
            label="Cerrar Sesión"
            icon="log-out-outline"
            onPress={handleLogout}
            showChevron={false}
          />
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  themeRow: { alignItems: 'flex-end', marginBottom: Spacing.sm },
  themeBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: c.backgroundSection,
    justifyContent: 'center', alignItems: 'center',
  },
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: c.backgroundSection,
    borderWidth: 2,
    borderColor: c.primary,
  },
  logoImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  logoFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessName: { fontSize: 22, fontWeight: '700', color: c.textPrimary, marginTop: Spacing.sm },
  rif: { fontSize: 14, color: c.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  ratingText: { fontSize: 13, color: c.textSecondary },
  section: {
    backgroundColor: c.cardBg, borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: c.border, marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: c.textPrimary, marginBottom: Spacing.sm },
  sectionValue: { fontSize: 14, color: c.textSubtitle, marginBottom: 4 },
  sectionValueMuted: { fontSize: 13, color: c.textSecondary, marginBottom: 4, fontStyle: 'italic' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: 4,
  },
  actionsCard: {
    marginBottom: Spacing.md,
    gap: 2,
  },
  dangerCard: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  actionDivider: {
    height: 4,
  },

  // ── Accordion ──
  accordionContainer: {
    backgroundColor: c.cardBg, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: c.border, marginBottom: Spacing.md, overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: Spacing.md,
  },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
  countBadge: {
    backgroundColor: c.primary, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center',
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#121212' },
  accordionBody: { borderTopWidth: 1, borderTopColor: c.border },

  // ── Accordion item (level 2) ──
  accordionItemHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border,
  },
  accordionItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  brandLogoWrap: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: c.border,
  },
  catIconWrap: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: `${c.primary}15`,
    justifyContent: 'center', alignItems: 'center',
  },
  accordionItemTitle: { fontSize: 15, fontWeight: '500', color: c.textPrimary, flex: 1 },
  accordionItemCount: { fontSize: 13, color: c.textSecondary },
  accordionItemBody: { paddingLeft: 56, paddingBottom: 8 },

  // ── Leaf items ──
  leafItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  leafDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary },
  leafText: { fontSize: 14, color: c.textSubtitle },
  emptyText: { padding: Spacing.md, fontSize: 14, color: c.textSecondary, textAlign: 'center' },

});
