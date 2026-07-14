import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchActivePopup,
  markPopupSeen,
  type PromoPopupData,
} from '../services/promoPopup';
import { openActionUrl } from '../utils/actionUrl';

let Haptics: typeof import('expo-haptics') | null = null;
if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch {
    Haptics = null;
  }
}

/**
 * Popup promocional in-app.
 * - Se dispara al montarse (tras el splash): pide el popup activo al backend.
 * - Capping 1/día por usuario/dispositivo (lo maneja el backend).
 * - Cierre solo por la "X" inferior o el botón físico Atrás (Android).
 */
export default function PromoPopup() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [popup, setPopup] = useState<PromoPopupData | null>(null);
  const [visible, setVisible] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  // Cargar el popup activo una sola vez al montar.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchActivePopup(user?.id ?? null);
      if (cancelled || !data) return;
      setPopup(data);
      setVisible(true);
      // Registrar la vista (capping) al mostrarlo.
      markPopupSeen(data.id, user?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
    // Solo una vez; user?.id se lee dentro. No re-disparar por cambios.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animación de entrada (fade + scale).
  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    scale.setValue(0.9);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 160,
        mass: 0.7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, scale]);

  const handleClose = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [opacity]);

  const handleCta = useCallback(() => {
    if (Platform.OS !== 'web' && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const url = popup?.actionUrl ?? null;
    // Cerrar primero y luego navegar/abrir.
    Animated.timing(opacity, {
      toValue: 0,
      duration: 140,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      openActionUrl(url);
    });
  }, [opacity, popup]);

  if (!popup) return null;

  const cardWidth = Math.min(width - 48, 380);
  const ctaText = (popup.ctaText ?? '').trim();
  const hasCta = ctaText.length > 0 && !!(popup.actionUrl ?? '').trim();
  const hasImage = !!(popup.imageUrl ?? '').trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose} // botón físico Atrás (Android)
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        {/* Tarjeta central */}
        <Animated.View
          style={[
            styles.card,
            {
              width: cardWidth,
              backgroundColor: colors.surface,
              transform: [{ scale }],
            },
          ]}
        >
          {hasImage ? (
            <Image
              source={{ uri: popup.imageUrl as string }}
              style={styles.image}
              contentFit="cover"
              transition={250}
              accessibilityLabel="Imagen promocional"
            />
          ) : null}

          <View style={styles.body}>
            <Text
              style={[styles.title, { color: colors.textPrimary }]}
              numberOfLines={3}
            >
              {popup.title}
            </Text>
            <Text
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={5}
            >
              {popup.subtitle}
            </Text>

            {hasCta ? (
              <Pressable
                onPress={handleCta}
                accessibilityRole="button"
                accessibilityLabel={ctaText}
                style={({ pressed }) => [
                  styles.cta,
                  {
                    backgroundColor: colors.accent,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Text style={[styles.ctaText, { color: colors.white }]} numberOfLines={1}>
                  {ctaText}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {/* Botón de cierre: "X" en círculo, fuera y debajo de la tarjeta */}
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  body: {
    padding: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  cta: {
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: 22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
