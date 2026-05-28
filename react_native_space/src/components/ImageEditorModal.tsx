import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, Dimensions,
  ActivityIndicator, PanResponder, Image as RNImage,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';

interface ImageEditorModalProps {
  uri: string;
  onSend: (editedUri: string) => void;
  onCancel: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PREVIEW_W = SCREEN_W - 32;
const PREVIEW_H = SCREEN_H * 0.55;

const HANDLE_HIT = 32; // corner handle hit-area radius
const MIN_CROP = 50;   // minimum crop dimension (display px)
const HANDLE_SIZE = 14; // visual handle size
const CORNER_LEN = 22;  // L-bracket arm length
const CORNER_THK = 3;   // L-bracket thickness

type GrabMode = 'none' | 'tl' | 'tr' | 'bl' | 'br' | 'move';

interface CropRect { x: number; y: number; w: number; h: number }
interface ImgSize { width: number; height: number }
interface DisplayInfo { scale: number; dw: number; dh: number; ox: number; oy: number }

function computeDisplayInfo(img: ImgSize): DisplayInfo {
  if (!img.width || !img.height) return { scale: 1, dw: PREVIEW_W, dh: PREVIEW_H, ox: 0, oy: 0 };
  const scale = Math.min(PREVIEW_W / img.width, PREVIEW_H / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  return { scale, dw, dh, ox: (PREVIEW_W - dw) / 2, oy: (PREVIEW_H - dh) / 2 };
}

function getImageSize(uri: string): Promise<ImgSize> {
  return new Promise((resolve) => {
    RNImage.getSize(uri, (w, h) => resolve({ width: w, height: h }), () => resolve({ width: 0, height: 0 }));
  });
}

export default function ImageEditorModal({ uri, onSend, onCancel }: ImageEditorModalProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Crop state
  const [editedUri, setEditedUri] = useState(uri);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [imageSize, setImageSize] = useState<ImgSize>({ width: 0, height: 0 });

  const displayInfo = useMemo(() => computeDisplayInfo(imageSize), [imageSize]);

  // Refs for PanResponder (avoids stale closures)
  const cropRectRef = useRef(cropRect);
  const displayInfoRef = useRef(displayInfo);
  const grabRef = useRef<GrabMode>('none');
  const startRef = useRef<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  useEffect(() => { cropRectRef.current = cropRect; }, [cropRect]);
  useEffect(() => { displayInfoRef.current = displayInfo; }, [displayInfo]);

  // Load image size whenever editedUri changes
  useEffect(() => {
    let cancelled = false;
    getImageSize(editedUri).then((s) => { if (!cancelled) setImageSize(s); });
    return () => { cancelled = true; };
  }, [editedUri]);

  // ── Handlers ──
  const handleRotate = useCallback(() => setRotation((p) => (p + 90) % 360), []);
  const handleFlipH = useCallback(() => setFlipH((p) => !p), []);
  const handleFlipV = useCallback(() => setFlipV((p) => !p), []);

  const handleReset = useCallback(() => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setEditedUri(uri);
    setCropMode(false);
  }, [uri]);

  const handleSend = useCallback(async () => {
    setProcessing(true);
    try {
      const hasTransforms = rotation !== 0 || flipH || flipV;
      if (!hasTransforms) { onSend(editedUri); return; }

      const actions: any[] = [];
      if (rotation !== 0) actions.push({ rotate: rotation });
      if (flipH) actions.push({ flip: FlipType.Horizontal });
      if (flipV) actions.push({ flip: FlipType.Vertical });

      const result = await manipulateAsync(editedUri, actions, { compress: 0.8, format: SaveFormat.JPEG });
      onSend(result?.uri ?? editedUri);
    } catch (err) {
      console.warn('Image manipulation failed:', err);
      onSend(editedUri);
    } finally {
      setProcessing(false);
    }
  }, [editedUri, rotation, flipH, flipV, onSend]);

  // ── Crop ──
  const handleEnterCrop = useCallback(async () => {
    setProcessing(true);
    try {
      let currentUri = editedUri;
      // Bake in any pending rotation/flip first
      if (rotation !== 0 || flipH || flipV) {
        const actions: any[] = [];
        if (rotation !== 0) actions.push({ rotate: rotation });
        if (flipH) actions.push({ flip: FlipType.Horizontal });
        if (flipV) actions.push({ flip: FlipType.Vertical });
        const r = await manipulateAsync(currentUri, actions, { compress: 0.9, format: SaveFormat.JPEG });
        currentUri = r?.uri ?? currentUri;
        setEditedUri(currentUri);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
      }
      const size = await getImageSize(currentUri);
      setImageSize(size);
      const di = computeDisplayInfo(size);
      const m = 0.1;
      setCropRect({ x: di.dw * m, y: di.dh * m, w: di.dw * (1 - 2 * m), h: di.dh * (1 - 2 * m) });
      setCropMode(true);
    } catch (err) {
      console.warn('Enter crop failed:', err);
    } finally {
      setProcessing(false);
    }
  }, [editedUri, rotation, flipH, flipV]);

  const handleCancelCrop = useCallback(() => setCropMode(false), []);

  const handleApplyCrop = useCallback(async () => {
    setProcessing(true);
    try {
      const { scale } = displayInfoRef.current;
      const cr = cropRectRef.current;
      const originX = Math.max(0, Math.round(cr.x / scale));
      const originY = Math.max(0, Math.round(cr.y / scale));
      const width = Math.max(1, Math.round(cr.w / scale));
      const height = Math.max(1, Math.round(cr.h / scale));

      const result = await manipulateAsync(editedUri, [{ crop: { originX, originY, width, height } }], {
        compress: 0.9, format: SaveFormat.JPEG,
      });
      setEditedUri(result?.uri ?? editedUri);
      setCropMode(false);
    } catch (err) {
      console.warn('Crop failed:', err);
    } finally {
      setProcessing(false);
    }
  }, [editedUri]);

  // ── PanResponder for crop ──
  const cropPan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e?.nativeEvent ?? {};
      const di = displayInfoRef.current;
      const tx = (locationX ?? 0) - di.ox;
      const ty = (locationY ?? 0) - di.oy;
      const c = cropRectRef.current;

      const nearCorner = (cx: number, cy: number) =>
        Math.abs(tx - cx) < HANDLE_HIT && Math.abs(ty - cy) < HANDLE_HIT;

      if (nearCorner(c.x, c.y)) grabRef.current = 'tl';
      else if (nearCorner(c.x + c.w, c.y)) grabRef.current = 'tr';
      else if (nearCorner(c.x, c.y + c.h)) grabRef.current = 'bl';
      else if (nearCorner(c.x + c.w, c.y + c.h)) grabRef.current = 'br';
      else if (tx >= c.x && tx <= c.x + c.w && ty >= c.y && ty <= c.y + c.h) grabRef.current = 'move';
      else grabRef.current = 'none';

      startRef.current = { ...c };
    },
    onPanResponderMove: (_, gs) => {
      const mode = grabRef.current;
      if (mode === 'none') return;
      const { dx, dy } = gs;
      const s = startRef.current;
      const { dw, dh } = displayInfoRef.current;
      let nr: CropRect;

      if (mode === 'move') {
        nr = {
          x: Math.max(0, Math.min(dw - s.w, s.x + dx)),
          y: Math.max(0, Math.min(dh - s.h, s.y + dy)),
          w: s.w,
          h: s.h,
        };
      } else {
        nr = { ...s };
        if (mode === 'tl' || mode === 'bl') {
          const nx = Math.max(0, Math.min(s.x + s.w - MIN_CROP, s.x + dx));
          nr.w = s.w + (s.x - nx);
          nr.x = nx;
        }
        if (mode === 'tr' || mode === 'br') {
          nr.w = Math.max(MIN_CROP, Math.min(dw - s.x, s.w + dx));
        }
        if (mode === 'tl' || mode === 'tr') {
          const ny = Math.max(0, Math.min(s.y + s.h - MIN_CROP, s.y + dy));
          nr.h = s.h + (s.y - ny);
          nr.y = ny;
        }
        if (mode === 'bl' || mode === 'br') {
          nr.h = Math.max(MIN_CROP, Math.min(dh - s.y, s.h + dy));
        }
      }
      setCropRect(nr);
    },
    onPanResponderRelease: () => { grabRef.current = 'none'; },
  }), []);

  // ── Derived ──
  const hasChanges = rotation !== 0 || flipH || flipV || editedUri !== uri;

  const previewWrapperStyle = useMemo((): ViewStyle => {
    if (cropMode) return {};
    const t: ViewStyle['transform'] = [];
    if (rotation !== 0) (t as any[]).push({ rotate: `${rotation}deg` });
    if (flipH) (t as any[]).push({ scaleX: -1 });
    if (flipV) (t as any[]).push({ scaleY: -1 });
    if ((t as any[]).length === 0) (t as any[]).push({ rotate: '0deg' });
    return { transform: t };
  }, [rotation, flipH, flipV, cropMode]);

  // Crop overlay absolute positions (within PREVIEW_W × PREVIEW_H)
  const absX = displayInfo.ox + cropRect.x;
  const absY = displayInfo.oy + cropRect.y;

  // ── Render ──
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onCancel} hitSlop={12} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={styles.iconColor.color} />
        </Pressable>
        <Text style={styles.headerTitle}>{cropMode ? 'Recortar' : 'Editar imagen'}</Text>
        {hasChanges && !cropMode ? (
          <Pressable onPress={handleReset} hitSlop={12} style={styles.headerBtn}>
            <Ionicons name="refresh-outline" size={22} color={styles.iconColor.color} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Image preview + crop overlay */}
      <View style={styles.previewContainer}>
        <View style={{ width: PREVIEW_W, height: PREVIEW_H }}>
          <View style={previewWrapperStyle}>
            <Image source={{ uri: editedUri }} style={styles.previewImage} contentFit="contain" transition={150} />
          </View>

          {cropMode && (
            <View style={StyleSheet.absoluteFill} {...cropPan.panHandlers} pointerEvents="box-only">
              {/* Dark mask — 4 rects */}
              <View style={{ position: 'absolute', left: 0, top: 0, right: 0, height: absY, backgroundColor: 'rgba(0,0,0,0.55)' }} />
              <View style={{ position: 'absolute', left: 0, top: absY + cropRect.h, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />
              <View style={{ position: 'absolute', left: 0, top: absY, width: absX, height: cropRect.h, backgroundColor: 'rgba(0,0,0,0.55)' }} />
              <View style={{ position: 'absolute', left: absX + cropRect.w, top: absY, right: 0, height: cropRect.h, backgroundColor: 'rgba(0,0,0,0.55)' }} />

              {/* Crop border */}
              <View style={{
                position: 'absolute', left: absX, top: absY, width: cropRect.w, height: cropRect.h,
                borderWidth: 1.5, borderColor: colors.primary,
              }}>
                {/* Rule-of-thirds grid */}
                <View style={{ position: 'absolute', left: '33%', top: 0, bottom: 0, width: 0.5, backgroundColor: 'rgba(255,255,255,0.35)' }} />
                <View style={{ position: 'absolute', left: '66%', top: 0, bottom: 0, width: 0.5, backgroundColor: 'rgba(255,255,255,0.35)' }} />
                <View style={{ position: 'absolute', top: '33%', left: 0, right: 0, height: 0.5, backgroundColor: 'rgba(255,255,255,0.35)' }} />
                <View style={{ position: 'absolute', top: '66%', left: 0, right: 0, height: 0.5, backgroundColor: 'rgba(255,255,255,0.35)' }} />
              </View>

              {/* Corner L-brackets */}
              {renderCorner(absX, absY, 'tl', colors.primary)}
              {renderCorner(absX + cropRect.w, absY, 'tr', colors.primary)}
              {renderCorner(absX, absY + cropRect.h, 'bl', colors.primary)}
              {renderCorner(absX + cropRect.w, absY + cropRect.h, 'br', colors.primary)}
            </View>
          )}
        </View>
      </View>

      {/* Toolbar */}
      {cropMode ? (
        <View style={styles.toolbar}>
          <Pressable style={styles.toolBtn} onPress={handleCancelCrop}>
            <View style={styles.toolIconCircle}>
              <Ionicons name="close-outline" size={24} color={styles.toolIconColor.color} />
            </View>
            <Text style={styles.toolLabel}>Cancelar</Text>
          </Pressable>
          <Pressable style={styles.toolBtn} onPress={handleApplyCrop} disabled={processing}>
            <View style={[styles.toolIconCircle, styles.toolIconActive]}>
              {processing ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="checkmark-outline" size={26} color="#000" />
              )}
            </View>
            <Text style={styles.toolLabel}>Aplicar</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.toolbar}>
          <Pressable style={styles.toolBtn} onPress={handleEnterCrop} disabled={processing}>
            <View style={[styles.toolIconCircle, editedUri !== uri && styles.toolIconActive]}>
              {processing ? (
                <ActivityIndicator size="small" color={editedUri !== uri ? '#000' : styles.toolIconColor.color} />
              ) : (
                <Ionicons name="crop-outline" size={24} color={editedUri !== uri ? '#000' : styles.toolIconColor.color} />
              )}
            </View>
            <Text style={styles.toolLabel}>Recortar</Text>
          </Pressable>

          <Pressable style={styles.toolBtn} onPress={handleRotate}>
            <View style={[styles.toolIconCircle, rotation !== 0 && styles.toolIconActive]}>
              <Ionicons name="refresh-outline" size={24} color={rotation !== 0 ? '#000' : styles.toolIconColor.color} />
            </View>
            <Text style={styles.toolLabel}>Girar</Text>
          </Pressable>

          <Pressable style={styles.toolBtn} onPress={handleFlipH}>
            <View style={[styles.toolIconCircle, flipH && styles.toolIconActive]}>
              <Ionicons name="swap-horizontal-outline" size={24} color={flipH ? '#000' : styles.toolIconColor.color} />
            </View>
            <Text style={styles.toolLabel}>Voltear H</Text>
          </Pressable>

          <Pressable style={styles.toolBtn} onPress={handleFlipV}>
            <View style={[styles.toolIconCircle, flipV && styles.toolIconActive]}>
              <Ionicons name="swap-vertical-outline" size={24} color={flipV ? '#000' : styles.toolIconColor.color} />
            </View>
            <Text style={styles.toolLabel}>Voltear V</Text>
          </Pressable>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={cropMode}>
          <Text style={[styles.cancelBtnText, cropMode && { opacity: 0.4 }]}>Descartar</Text>
        </Pressable>
        <Pressable
          style={[styles.sendBtn, (processing || cropMode) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={processing || cropMode}
        >
          {processing && !cropMode ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#000" />
              <Text style={styles.sendBtnText}>Enviar</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/* ── Corner L-bracket ── */
function renderCorner(cx: number, cy: number, pos: 'tl' | 'tr' | 'bl' | 'br', color: string) {
  const isLeft = pos === 'tl' || pos === 'bl';
  const isTop = pos === 'tl' || pos === 'tr';
  return (
    <View
      key={pos}
      style={{
        position: 'absolute',
        left: isLeft ? cx - CORNER_THK : cx - CORNER_LEN + CORNER_THK,
        top: isTop ? cy - CORNER_THK : cy - CORNER_LEN + CORNER_THK,
        width: CORNER_LEN,
        height: CORNER_LEN,
      }}
      pointerEvents="none"
    >
      {/* Horizontal arm */}
      <View style={{
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: 0,
        [isLeft ? 'left' : 'right']: 0,
        width: CORNER_LEN,
        height: CORNER_THK,
        backgroundColor: color,
        borderRadius: 1,
      }} />
      {/* Vertical arm */}
      <View style={{
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: 0,
        [isLeft ? 'left' : 'right']: 0,
        width: CORNER_THK,
        height: CORNER_LEN,
        backgroundColor: color,
        borderRadius: 1,
      }} />
    </View>
  );
}

/* ── Styles ── */
const createStyles = (c: ThemeColors, isDark: boolean) => {
  const iconColor = isDark ? '#FFFFFF' : '#222222';
  const toolIconColor = isDark ? '#CCCCCC' : '#444444';
  const bgColor = isDark ? '#0A0A0A' : '#FAFAFA';
  const toolbarBg = isDark ? '#1A1A1A' : '#F0F0F0';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bgColor },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Platform.OS === 'ios' ? 8 : Spacing.md,
      paddingBottom: Spacing.sm,
    },
    headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '600', color: isDark ? '#FFFFFF' : '#222222' },
    previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.md },
    previewImage: { width: PREVIEW_W, height: PREVIEW_H },
    toolbar: {
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 28,
      paddingVertical: Spacing.md, backgroundColor: toolbarBg,
      borderRadius: BorderRadius.lg, marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    },
    toolBtn: { alignItems: 'center', gap: 6 },
    toolIconCircle: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      justifyContent: 'center', alignItems: 'center',
    },
    toolIconActive: { backgroundColor: c.primary },
    toolLabel: { fontSize: 12, fontWeight: '500', color: isDark ? '#AAAAAA' : '#666666' },
    footer: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
      paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg, gap: Spacing.md,
    },
    cancelBtn: {
      paddingHorizontal: 20, paddingVertical: 14, borderRadius: BorderRadius.md,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : c.border,
    },
    cancelBtnText: { fontSize: 15, fontWeight: '500', color: isDark ? '#AAAAAA' : '#666666' },
    sendBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: c.primary, paddingVertical: 14, borderRadius: BorderRadius.md,
    },
    sendBtnDisabled: { opacity: 0.6 },
    sendBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
    iconColor: { color: iconColor },
    toolIconColor: { color: toolIconColor },
  });
};
