import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Linking, Alert, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import type { ResponseTagValue } from '../types';
import { getTagDef } from '../utils/responseTags';
import Button from './Button';

const LINK_COLOR = '#07a0ff';

interface ResponseCardProps {
  businessName: string;
  logoUrl?: string | null;
  facadeImageUrl?: string | null;
  avgRating?: number | null;
  initialMessage: string;
  distanceKm?: number | null;
  vendorLatitude?: number | null;
  vendorLongitude?: number | null;
  onOpenChat?: () => void;
  unreadCount?: number;
  tags?: ResponseTagValue[];
  onTagPress?: () => void;
}

function formatDistance(km: number): string {
  if (km < 1) return `A ${Math.round(km * 1000)} m de tu ubicación`;
  return `A ${km.toFixed(1)} km de tu ubicación`;
}

function openGoogleMaps(lat: number, lng: number) {
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const iosUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
  if (Platform.OS === 'ios') {
    Linking.canOpenURL(iosUrl).then((s) => { if (s) return Linking.openURL(iosUrl); return Linking.openURL(webUrl); }).catch(() => Linking.openURL(webUrl).catch(() => {}));
  } else {
    Linking.openURL(webUrl).catch(() => Alert.alert('Error', 'No se pudo abrir Google Maps'));
  }
}

export default function ResponseCard({ businessName, logoUrl, facadeImageUrl, avgRating, initialMessage, distanceKm, vendorLatitude, vendorLongitude, onOpenChat, unreadCount, tags, onTagPress }: ResponseCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasDistance = typeof distanceKm === 'number' && isFinite(distanceKm);
  const hasCoords = typeof vendorLatitude === 'number' && typeof vendorLongitude === 'number';
  const canNavigate = hasDistance && hasCoords;
  const unread = unreadCount ?? 0;
  const activeTags = (tags ?? []).filter(Boolean);
  const [logoError, setLogoError] = useState(false);
  const [logoModal, setLogoModal] = useState(false);
  const [facadeError, setFacadeError] = useState(false);
  const [facadeModal, setFacadeModal] = useState(false);
  const hasLogo = !!logoUrl && !logoError;
  const hasFacade = !!facadeImageUrl && !facadeError;

  return (
    <View style={[styles.card, unread > 0 && { borderColor: colors.primary, borderWidth: 1.5 }]}>
      <View style={styles.header}>
        {hasLogo ? (
          <Pressable onPress={() => setLogoModal(true)}>
            <Image source={{ uri: logoUrl }} style={styles.avatarImg} contentFit="cover" cachePolicy="none" onError={() => setLogoError(true)} />
          </Pressable>
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="storefront-outline" size={20} color={colors.primary} />
          </View>
        )}
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {hasFacade ? (
              <Pressable onPress={() => setFacadeModal(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                <Text style={styles.nameLink} numberOfLines={1}>{businessName ?? ''}</Text>
                <Ionicons name="storefront-outline" size={12} color={LINK_COLOR} />
              </Pressable>
            ) : (
              <Text style={styles.name} numberOfLines={1}>{businessName ?? ''}</Text>
            )}
            {unread > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unread > 99 ? '99+' : String(unread)}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            {typeof avgRating === 'number' ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={colors.primary} />
                <Text style={styles.rating}>{avgRating?.toFixed?.(1) ?? '0'}</Text>
              </View>
            ) : null}
            {hasDistance ? (
              canNavigate ? (
                <Pressable style={styles.distanceRow} onPress={() => openGoogleMaps(vendorLatitude!, vendorLongitude!)}>
                  <Ionicons name="navigate-outline" size={12} color={LINK_COLOR} />
                  <Text style={styles.distanceLink}>{formatDistance(distanceKm as number)}</Text>
                </Pressable>
              ) : (
                <View style={styles.distanceRow}>
                  <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.distance}>{formatDistance(distanceKm as number)}</Text>
                </View>
              )
            ) : null}
          </View>
        </View>
        {onTagPress ? (
          <Pressable onPress={onTagPress} hitSlop={10} style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {activeTags.length > 0 ? (
        <View style={styles.tagsRow}>
          {activeTags.map((t) => {
            const def = getTagDef(t);
            if (!def) return null;
            return (
              <View key={t} style={[styles.tagChip, { backgroundColor: def.bgColor }]}>
                <Text style={styles.tagChipEmoji}>{def.emoji}</Text>
                <Text style={[styles.tagChipText, { color: def.color }]}>{def.label}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.message} numberOfLines={2}>{initialMessage ?? ''}</Text>
      {onOpenChat ? <Button title="Abrir Chat" variant="secondary" onPress={onOpenChat} style={styles.chatBtn} /> : null}

      {hasFacade ? (
        <Modal visible={facadeModal} transparent animationType="fade" onRequestClose={() => setFacadeModal(false)}>
          <Pressable style={styles.logoModalOverlay} onPress={() => setFacadeModal(false)}>
            <View style={styles.logoModalContent}>
              <Image source={{ uri: facadeImageUrl! }} style={styles.facadeModalImg} contentFit="contain" cachePolicy="none" />
              <Text style={styles.logoModalName}>{businessName ?? ''} — Fachada</Text>
            </View>
            <Pressable style={styles.logoModalClose} onPress={() => setFacadeModal(false)} hitSlop={12}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {hasLogo ? (
        <Modal visible={logoModal} transparent animationType="fade" onRequestClose={() => setLogoModal(false)}>
          <Pressable style={styles.logoModalOverlay} onPress={() => setLogoModal(false)}>
            <View style={styles.logoModalContent}>
              <Image source={{ uri: logoUrl }} style={styles.logoModalImg} contentFit="contain" cachePolicy="none" />
              <Text style={styles.logoModalName}>{businessName ?? ''}</Text>
            </View>
            <Pressable style={styles.logoModalClose} onPress={() => setLogoModal(false)} hitSlop={12}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.cardBg, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: c.border,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }, android: { elevation: 1 }, default: {} }),
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.backgroundSection, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  avatarImg: { width: 36, height: 36, borderRadius: 18, marginRight: Spacing.sm, backgroundColor: c.backgroundSection },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  nameLink: { fontSize: 14, fontWeight: '600', color: '#07a0ff', textDecorationLine: 'underline', flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2, flexWrap: 'wrap' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: 12, color: c.textSecondary },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  distance: { fontSize: 12, color: c.textSecondary },
  distanceLink: { fontSize: 12, color: '#07a0ff', textDecorationLine: 'underline', fontWeight: '600' },
  message: { fontSize: 13, color: c.textSubtitle, marginBottom: Spacing.sm, lineHeight: 18 },
  chatBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: Spacing.md },
  unreadBadge: { backgroundColor: '#E53935', borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 5, justifyContent: 'center', alignItems: 'center' },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  moreBtn: { padding: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  tagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, gap: 4 },
  tagChipEmoji: { fontSize: 12 },
  tagChipText: { fontSize: 11, fontWeight: '600' },
  facadeModalImg: { width: 320, height: 240, borderRadius: 12 },
  logoModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center',
  },
  logoModalContent: { alignItems: 'center' },
  logoModalImg: { width: 200, height: 200, borderRadius: 20 },
  logoModalName: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: Spacing.md, textAlign: 'center' },
  logoModalClose: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, right: 20 },
});
