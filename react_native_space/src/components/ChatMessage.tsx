import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Dimensions, Platform, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import type { ChatMessageReplyTo } from '../types';
import { getGoogleMapsKey } from '../services/publicKeys';
import VoiceNotePlayer from './VoiceNotePlayer';

interface ChatMessageProps {
  messageText: string;
  senderName: string;
  createdAt: string;
  isOwn: boolean;
  isVendorMessage?: boolean;
  messageType?: string;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  addressText?: string | null;
  audioUrl?: string | null;
  audioDuration?: number | null;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isEdited?: boolean;
  deletedForAll?: boolean;
  replyTo?: ChatMessageReplyTo | null;
  onReplyPress?: (replyToId: string) => void;
  onLongPress?: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const IMG_SIZE = SCREEN_W * 0.55;
const SPRING_CFG = { damping: 18, stiffness: 200 };
const MIN_SCALE = 1;
const MAX_SCALE = 4;

function StatusTicks({ status, colors }: { status?: string; colors: ThemeColors }) {
  if (!status) return null;
  const isRead = status === 'read';
  const tickColor = isRead ? '#4FC3F7' : (colors.textSecondary ?? '#999');

  if (status === 'sending') {
    return <Ionicons name="time-outline" size={13} color={colors.textSecondary ?? '#999'} style={{ marginLeft: 4 }} />;
  }
  if (status === 'sent') {
    return <Ionicons name="checkmark" size={14} color={tickColor} style={{ marginLeft: 4 }} />;
  }
  return (
    <View style={{ flexDirection: 'row', marginLeft: 4 }}>
      <Ionicons name="checkmark" size={14} color={tickColor} style={{ marginRight: -6 }} />
      <Ionicons name="checkmark" size={14} color={tickColor} />
    </View>
  );
}

export default function ChatMessage({
  messageText, senderName, createdAt, isOwn, isVendorMessage = false,
  messageType, imageUrl, latitude, longitude, addressText,
  audioUrl, audioDuration, status, isEdited, deletedForAll,
  replyTo, onReplyPress, onLongPress,
}: ChatMessageProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const formatTime = (d: string) => {
    try { return new Date(d)?.toLocaleTimeString?.('es-VE', { hour: '2-digit', minute: '2-digit' }) ?? ''; }
    catch { return ''; }
  };

  const shouldBeYellow = isVendorMessage;
  const shouldBeOnRight = isOwn;
  const isImage = !deletedForAll && (messageType ?? 'text') === 'image' && !!imageUrl;
  const isLocation = !deletedForAll && (messageType ?? 'text') === 'location' && latitude != null && longitude != null;
  const isAudio = !deletedForAll && (messageType ?? 'text') === 'audio' && !!audioUrl;
  const isDeleted = !!deletedForAll;

  const openInMaps = useCallback(() => {
    if (latitude == null || longitude == null) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      default: `https://www.google.com/maps?q=${latitude},${longitude}`,
    }) ?? `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {});
  }, [latitude, longitude]);

  const [mapsKey, setMapsKey] = useState('');

  useEffect(() => {
    if (latitude != null && longitude != null) {
      getGoogleMapsKey().then((k) => setMapsKey(k ?? '')).catch(() => {});
    }
  }, [latitude, longitude]);

  const staticMapUrl = useMemo(() => {
    if (latitude == null || longitude == null || !mapsKey) return '';
    const lat = latitude;
    const lng = longitude;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red%7C${lat},${lng}&key=${mapsKey}`;
  }, [latitude, longitude, mapsKey]);

  const replySnippet = (replyTo?.messageText ?? '').length > 60
    ? (replyTo?.messageText ?? '').substring(0, 57) + '...'
    : (replyTo?.messageText ?? '');

  return (
    <View style={[styles.row, shouldBeOnRight ? styles.rowOwn : styles.rowOther]}>
      <Pressable
        style={[
          styles.bubble,
          shouldBeYellow ? styles.bubbleVendor : styles.bubbleClient,
          isImage && styles.bubbleImage,
          isDeleted && styles.bubbleDeleted,
        ]}
        onLongPress={!isDeleted ? onLongPress : undefined}
        delayLongPress={400}
      >
        {!isOwn ? <Text style={styles.sender}>{senderName ?? ''}</Text> : null}

        {replyTo?.id && !isDeleted ? (
          <Pressable
            style={[styles.quotedBox, shouldBeYellow ? styles.quotedBoxVendor : styles.quotedBoxClient]}
            onPress={() => onReplyPress?.(replyTo.id)}
          >
            <Text style={styles.quotedName} numberOfLines={1}>{replyTo?.senderName ?? ''}</Text>
            <Text style={styles.quotedText} numberOfLines={2}>{replySnippet}</Text>
          </Pressable>
        ) : null}

        {isDeleted ? (
          <View style={styles.deletedRow}>
            <Ionicons name="ban-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.deletedText}>Mensaje eliminado</Text>
          </View>
        ) : isLocation ? (
          <Pressable onPress={openInMaps} style={styles.locationBubble}>
            <View style={styles.locationMapWrapper}>
              {staticMapUrl ? (
                <Image source={{ uri: staticMapUrl }} style={styles.locationMap} contentFit="cover" transition={200} cachePolicy="none" placeholder={{ color: colors.border } as any} />
              ) : (
                <View style={[styles.locationMap, styles.locationMapPlaceholder]}>
                  <Ionicons name="location" size={32} color="#E53935" />
                </View>
              )}
              <View style={styles.locationNavIcon}>
                <Ionicons name="navigate" size={14} color="#fff" />
              </View>
            </View>
            <View style={styles.locationInfo}>
              <Ionicons name="location-sharp" size={16} color="#E53935" />
              <Text style={[styles.locationAddress, shouldBeYellow ? styles.textVendor : styles.textClient]} numberOfLines={2}>
                {addressText || 'Ubicación compartida'}
              </Text>
            </View>
          </Pressable>
        ) : isAudio ? (
          <VoiceNotePlayer
            audioUrl={audioUrl ?? ''}
            duration={audioDuration ?? 0}
            isOwn={isOwn}
            isVendorMessage={isVendorMessage}
          />
        ) : isImage ? (
          <Pressable onPress={() => setPreviewOpen(true)}>
            <Image source={{ uri: imageUrl ?? '' }} style={styles.image} contentFit="cover" transition={200} cachePolicy="none" placeholder={{ color: colors.border } as any} />
          </Pressable>
        ) : (
          <Text style={[styles.text, shouldBeYellow ? styles.textVendor : styles.textClient]}>{messageText ?? ''}</Text>
        )}

        <View style={styles.metaRow}>
          {isEdited && !isDeleted ? (
            <Text style={styles.editedLabel}>editado</Text>
          ) : null}
          <Text style={styles.time}>{formatTime(createdAt ?? '')}</Text>
          {isOwn ? <StatusTicks status={status} colors={colors} /> : null}
        </View>
      </Pressable>

      {isImage ? (
        <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
          <ZoomableImageViewer uri={imageUrl ?? ''} onClose={() => setPreviewOpen(false)} />
        </Modal>
      ) : null}
    </View>
  );
}

/* ---------- Zoomable Image Viewer ---------- */
const AnimatedImage = Animated.createAnimatedComponent(Image);

function ZoomableImageViewer({ uri, onClose }: { uri: string; onClose: () => void }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const closeViewer = useCallback(() => { onClose?.(); }, [onClose]);

  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE * 0.5, savedScale.value * e.scale));
      scale.value = newScale;
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE, SPRING_CFG);
        translateX.value = withSpring(0, SPRING_CFG);
        translateY.value = withSpring(0, SPRING_CFG);
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        const maxX = ((savedScale.value - 1) * SCREEN_W) / 2;
        const maxY = ((savedScale.value - 1) * SCREEN_H) / 2;
        translateX.value = Math.max(-maxX, Math.min(maxX, savedTranslateX.value + e.translationX));
        translateY.value = Math.max(-maxY, Math.min(maxY, savedTranslateY.value + e.translationY));
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (savedScale.value > 1.1) {
        scale.value = withSpring(MIN_SCALE, SPRING_CFG);
        translateX.value = withSpring(0, SPRING_CFG);
        translateY.value = withSpring(0, SPRING_CFG);
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        const targetScale = 2.5;
        const originX = e.x - SCREEN_W / 2;
        const originY = e.y - SCREEN_H / 2;
        scale.value = withSpring(targetScale, SPRING_CFG);
        translateX.value = withSpring(-originX * (targetScale - 1), SPRING_CFG);
        translateY.value = withSpring(-originY * (targetScale - 1), SPRING_CFG);
        savedScale.value = targetScale;
        savedTranslateX.value = -originX * (targetScale - 1);
        savedTranslateY.value = -originY * (targetScale - 1);
      }
    });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (savedScale.value <= 1.05) {
        runOnJS(closeViewer)();
      }
    });

  const composed = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    Gesture.Exclusive(doubleTapGesture, singleTapGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={zoomStyles.root}>
      <Pressable style={zoomStyles.closeBtn} onPress={onClose}>
        <Ionicons name="close-circle" size={36} color="#fff" />
      </Pressable>
      <GestureDetector gesture={composed}>
        <AnimatedImage
          source={{ uri }}
          style={[zoomStyles.image, animatedStyle]}
          contentFit="contain"
          transition={200}
        />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const zoomStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, zIndex: 10 },
  image: { width: SCREEN_W, height: SCREEN_H * 0.8 },
});

const createStyles = (c: ThemeColors) => StyleSheet.create({
  row: { marginBottom: Spacing.sm, paddingHorizontal: Spacing.md },
  rowOwn: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', padding: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg },
  bubbleVendor: { backgroundColor: c.bubbleVendor, borderBottomRightRadius: 4, borderWidth: 1, borderColor: c.bubbleVendorBorder },
  bubbleClient: { backgroundColor: c.bubbleClient, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: c.bubbleClientBorder },
  bubbleImage: { padding: 4, paddingHorizontal: 4 },
  bubbleDeleted: { opacity: 0.7 },
  sender: { fontSize: 11, fontWeight: '600', color: c.textSecondary, marginBottom: 2, paddingHorizontal: 4 },
  quotedBox: { borderLeftWidth: 3, borderRadius: 6, padding: 6, paddingLeft: 8, marginBottom: 4 },
  quotedBoxVendor: { borderLeftColor: '#F9A825', backgroundColor: 'rgba(249,168,37,0.12)' },
  quotedBoxClient: { borderLeftColor: c.border, backgroundColor: `${c.textSecondary}10` },
  quotedName: { fontSize: 11, fontWeight: '700', color: '#F9A825', marginBottom: 1 },
  quotedText: { fontSize: 12, color: c.textSecondary, lineHeight: 16 },
  text: { fontSize: 15, lineHeight: 20 },
  textVendor: { color: c.textPrimary },
  textClient: { color: c.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3, paddingHorizontal: 4 },
  editedLabel: { fontSize: 10, color: c.textSecondary, fontStyle: 'italic', marginRight: 4 },
  time: { fontSize: 10, color: c.textSecondary },
  deletedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  deletedText: { fontSize: 14, fontStyle: 'italic', color: c.textSecondary },
  image: { width: IMG_SIZE, height: IMG_SIZE, borderRadius: BorderRadius.md },
  locationBubble: { width: IMG_SIZE },
  locationMapWrapper: { position: 'relative' as const },
  locationMap: { width: '100%' as const, height: 150, borderRadius: BorderRadius.md, marginBottom: 6 },
  locationMapPlaceholder: { backgroundColor: c.backgroundSection, justifyContent: 'center' as const, alignItems: 'center' as const },
  locationNavIcon: { position: 'absolute' as const, bottom: 14, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 14, width: 28, height: 28, justifyContent: 'center' as const, alignItems: 'center' as const },
  locationInfo: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingHorizontal: 2, marginTop: 2 },
  locationAddress: { flex: 1, fontSize: 13, lineHeight: 17 },
});
