import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions, ActivityIndicator } from 'react-native';
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

export default function ImageEditorModal({ uri, onSend, onCancel }: ImageEditorModalProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleFlipH = useCallback(() => {
    setFlipH((prev) => !prev);
  }, []);

  const handleFlipV = useCallback(() => {
    setFlipV((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  }, []);

  const handleSend = useCallback(async () => {
    setProcessing(true);
    try {
      const hasChanges = rotation !== 0 || flipH || flipV;
      if (!hasChanges) {
        onSend(uri);
        return;
      }

      // Build actions array
      const actions: any[] = [];
      if (rotation !== 0) {
        actions.push({ rotate: rotation });
      }
      if (flipH) {
        actions.push({ flip: FlipType.Horizontal });
      }
      if (flipV) {
        actions.push({ flip: FlipType.Vertical });
      }

      const result = await manipulateAsync(uri, actions, {
        compress: 0.8,
        format: SaveFormat.JPEG,
      });

      onSend(result?.uri ?? uri);
    } catch (err) {
      console.warn('Image manipulation failed:', err);
      // Send original if manipulation fails
      onSend(uri);
    } finally {
      setProcessing(false);
    }
  }, [uri, rotation, flipH, flipV, onSend]);

  // Build transform style for preview
  const previewTransform = useMemo(() => {
    const transforms: any[] = [];
    if (rotation !== 0) transforms.push({ rotate: `${rotation}deg` });
    if (flipH) transforms.push({ scaleX: -1 });
    if (flipV) transforms.push({ scaleY: -1 });
    return transforms;
  }, [rotation, flipH, flipV]);

  const hasChanges = rotation !== 0 || flipH || flipV;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onCancel} hitSlop={12} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={styles.iconColor.color} />
        </Pressable>
        <Text style={styles.headerTitle}>Editar imagen</Text>
        {hasChanges ? (
          <Pressable onPress={handleReset} hitSlop={12} style={styles.headerBtn}>
            <Ionicons name="refresh-outline" size={22} color={styles.iconColor.color} />
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Image preview */}
      <View style={styles.previewContainer}>
        <Image
          source={{ uri }}
          style={[
            styles.previewImage,
            { transform: previewTransform.length > 0 ? previewTransform : undefined },
          ]}
          contentFit="contain"
          transition={150}
        />
      </View>

      {/* Tool bar */}
      <View style={styles.toolbar}>
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

      {/* Footer with Send button */}
      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Descartar</Text>
        </Pressable>

        <Pressable
          style={[styles.sendBtn, processing && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={processing}
        >
          {processing ? (
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

const createStyles = (c: ThemeColors, isDark: boolean) => {
  const iconColor = isDark ? '#FFFFFF' : '#222222';
  const toolIconColor = isDark ? '#CCCCCC' : '#444444';
  const bgColor = isDark ? '#0A0A0A' : '#FAFAFA';
  const toolbarBg = isDark ? '#1A1A1A' : '#F0F0F0';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bgColor,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Platform.OS === 'ios' ? 8 : Spacing.md,
      paddingBottom: Spacing.sm,
    },
    headerBtn: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#222222',
    },
    previewContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
    },
    previewImage: {
      width: PREVIEW_W,
      height: PREVIEW_H,
    },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 32,
      paddingVertical: Spacing.md,
      backgroundColor: toolbarBg,
      borderRadius: BorderRadius.lg,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
    },
    toolBtn: {
      alignItems: 'center',
      gap: 6,
    },
    toolIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    toolIconActive: {
      backgroundColor: c.primary,
    },
    toolLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#AAAAAA' : '#666666',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
      gap: Spacing.md,
    },
    cancelBtn: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.2)' : c.border,
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: '500',
      color: isDark ? '#AAAAAA' : '#666666',
    },
    sendBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.primary,
      paddingVertical: 14,
      borderRadius: BorderRadius.md,
    },
    sendBtnDisabled: {
      opacity: 0.6,
    },
    sendBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#000',
    },
    // Helper style objects for dynamic icon colors
    iconColor: {
      color: iconColor,
    },
    toolIconColor: {
      color: toolIconColor,
    },
  });
};
