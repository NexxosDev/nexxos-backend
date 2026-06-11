import React, { useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ImagePreviewModalProps {
  visible: boolean;
  imageUri: string | null | undefined;
  onClose: () => void;
}

export default function ImagePreviewModal({ visible, imageUri, onClose }: ImagePreviewModalProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastDist = useRef(0);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  const resetTransforms = () => {
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  };

  const getDistance = (touches: any[]) => {
    const dx = (touches?.[0]?.pageX ?? 0) - (touches?.[1]?.pageX ?? 0);
    const dy = (touches?.[0]?.pageY ?? 0) - (touches?.[1]?.pageY ?? 0);
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt?.nativeEvent?.touches ?? [];
        if (touches.length === 2) {
          lastDist.current = getDistance(touches);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt?.nativeEvent?.touches ?? [];
        if (touches.length === 2) {
          // Pinch to zoom
          const dist = getDistance(touches);
          if (lastDist.current > 0) {
            const newScale = Math.max(0.5, Math.min(5, lastScale.current * (dist / lastDist.current)));
            scale.setValue(newScale);
          }
        } else if (touches.length === 1 && lastScale.current > 1) {
          // Pan when zoomed
          translateX.setValue(lastTranslateX.current + (gestureState?.dx ?? 0));
          translateY.setValue(lastTranslateY.current + (gestureState?.dy ?? 0));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const touches = evt?.nativeEvent?.touches ?? [];
        // Save current values
        scale.addListener?.(({ value }) => { lastScale.current = value; });
        // Use a simpler approach — read the animated value
        // @ts-ignore - accessing private _value for state sync
        lastScale.current = (scale as any)?._value ?? 1;
        // @ts-ignore
        lastTranslateX.current = (translateX as any)?._value ?? 0;
        // @ts-ignore
        lastTranslateY.current = (translateY as any)?._value ?? 0;
        scale.removeAllListeners?.();

        // Double tap to reset (if single finger quick tap)
        if (
          Math.abs(gestureState?.dx ?? 0) < 5 &&
          Math.abs(gestureState?.dy ?? 0) < 5 &&
          (gestureState?.numberActiveTouches ?? 0) <= 1
        ) {
          if (lastScale.current > 1.1) {
            // Reset zoom
            Animated.parallel([
              Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
              Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
              Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
            ]).start();
            lastScale.current = 1;
            lastTranslateX.current = 0;
            lastTranslateY.current = 0;
          }
        }

        // Snap back if scale is below 1
        if (lastScale.current < 1) {
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
          lastScale.current = 1;
        }
      },
    })
  ).current;

  const handleClose = () => {
    resetTransforms();
    onClose?.();
  };

  if (!imageUri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />

        {/* Close button */}
        <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={16}>
          <View style={styles.closeBtnCircle}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* Zoomable image */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [
                { scale },
                { translateX },
                { translateY },
              ],
            },
          ]}
          {...(panResponder?.panHandlers ?? {})}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Hint */}
        <View style={styles.hintContainer}>
          <Ionicons name="expand-outline" size={14} color="rgba(255,255,255,0.5)" />
          {Platform.OS !== 'web' ? (
            <Animated.Text style={styles.hintText}>Pellizca para zoom · Toca para resetear</Animated.Text>
          ) : (
            <Animated.Text style={styles.hintText}>Toca para cerrar</Animated.Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    right: 20,
    zIndex: 10,
  },
  closeBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_W,
    height: SCREEN_H * 0.75,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hintContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});