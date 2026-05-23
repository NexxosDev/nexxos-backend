import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import StarRating from './StarRating';
import Button from './Button';
import { rateVendorOnRequest } from '../services/requests';
import { getErrorMessage } from '../services/api';

interface VendorOption {
  id: string;
  businessName: string;
  logoUrl?: string | null;
  avgRating?: number | null;
}

interface RateVendorModalProps {
  visible: boolean;
  requestId: string;
  vendors: VendorOption[];
  onClose: () => void;
  onRated: (result: { pointsAwarded: number; bonusFirstRating: boolean }) => void;
}

export default function RateVendorModal({ visible, requestId, vendors = [], onClose, onRated }: RateVendorModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ points: number; bonus: boolean } | null>(null);

  const handleSubmit = async () => {
    setError('');
    if (!selectedVendorId) { setError('Selecciona un vendedor'); return; }
    if (rating < 1) { setError('Selecciona una calificación'); return; }
    setSubmitting(true);
    try {
      const res = await rateVendorOnRequest(requestId, {
        vendorId: selectedVendorId,
        rating,
        comment: comment?.trim?.() || undefined,
      });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success)?.catch?.(() => {});
      }
      setSuccess({ points: res?.pointsAwarded ?? 0, bonus: res?.bonusFirstRating ?? false });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    if (success) {
      onRated({ pointsAwarded: success.points, bonusFirstRating: success.bonus });
    }
    // Reset state
    setSelectedVendorId('');
    setRating(0);
    setComment('');
    setError('');
    setSuccess(null);
    onClose();
  };

  const handleSkip = () => {
    setSelectedVendorId('');
    setRating(0);
    setComment('');
    setError('');
    setSuccess(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleSkip}>
      <Pressable style={styles.overlay} onPress={handleSkip} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.sheet}>
          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>¡Gracias por calificar!</Text>
              <Text style={styles.successPoints}>+{success.points} puntos</Text>
              {success.bonus ? (
                <View style={styles.bonusBadge}>
                  <Ionicons name="trophy" size={16} color={colors.primary} />
                  <Text style={styles.bonusText}>¡Bonus por primera calificación! 🏆</Text>
                </View>
              ) : null}
              <Button title="Continuar" onPress={handleDone} style={styles.doneBtn} />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ref={scrollRef}
            >
              <Text style={styles.title}>⭐ Califica al vendedor</Text>
              <Text style={styles.subtitle}>Gana puntos calificando al vendedor que te ayudó</Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Text style={styles.label}>¿Quién te ayudó?</Text>
              {(vendors ?? []).map((v) => (
                <Pressable
                  key={v?.id}
                  style={[styles.vendorOption, selectedVendorId === v?.id && styles.vendorOptionActive]}
                  onPress={() => setSelectedVendorId(v?.id ?? '')}
                >
                  <View style={styles.vendorInfo}>
                    <Text style={styles.vendorInitial}>{v?.businessName?.[0]?.toUpperCase?.() ?? '?'}</Text>
                    <View>
                      <Text style={styles.vendorName}>{v?.businessName ?? ''}</Text>
                      {typeof v?.avgRating === 'number' ? (
                        <Text style={styles.vendorRating}>⭐ {v.avgRating?.toFixed?.(1) ?? '0'}</Text>
                      ) : null}
                    </View>
                  </View>
                  {selectedVendorId === v?.id ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : null}
                </Pressable>
              ))}

              <Text style={styles.label}>Calificación</Text>
              <View style={styles.ratingRow}>
                <StarRating rating={rating} onChange={setRating} size={32} />
              </View>

              <Text style={styles.label}>Comentario <Text style={styles.optional}>(+10 pts si ≥ 20 caracteres)</Text></Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Cuéntanos tu experiencia..."
                placeholderTextColor={colors.textSecondary}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={500}
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 300)}
              />
              {(comment?.length ?? 0) > 0 && (comment?.length ?? 0) < 20 ? (
                <Text style={styles.charHint}>{20 - (comment?.length ?? 0)} caracteres más para bonus</Text>
              ) : null}

              <View style={styles.pointsPreview}>
                <Ionicons name="star" size={14} color={colors.primary} />
                <Text style={styles.pointsPreviewText}>
                  +20 pts por calificar{(comment?.length ?? 0) >= 20 ? ' + 10 pts por comentario' : ''}
                </Text>
              </View>

              <Button title="Enviar Calificación" onPress={handleSubmit} loading={submitting} style={styles.submitBtn} />
              <Pressable onPress={handleSkip} style={styles.skipBtn}>
                <Text style={styles.skipText}>Ahora no</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: c.overlay },
  keyboardAvoid: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: c.textSecondary,
    marginBottom: Spacing.md,
  },
  error: {
    backgroundColor: c.errorBg,
    color: c.error,
    padding: Spacing.sm,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSubtitle,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  optional: {
    fontSize: 11,
    fontWeight: '400',
    color: c.textSecondary,
  },
  vendorOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: c.backgroundSection,
    marginBottom: 6,
  },
  vendorOptionActive: {
    backgroundColor: `${c.primary}15`,
    borderWidth: 1,
    borderColor: `${c.primary}40`,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  vendorInitial: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${c.primary}20`,
    textAlign: 'center',
    lineHeight: 36,
    fontSize: 16,
    fontWeight: '700',
    color: c.primary,
    overflow: 'hidden',
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textPrimary,
  },
  vendorRating: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 1,
  },
  ratingRow: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: c.textPrimary,
    minHeight: 70,
    backgroundColor: c.inputBg,
    textAlignVertical: 'top',
  },
  charHint: {
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 4,
  },
  pointsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: `${c.primary}10`,
    borderRadius: BorderRadius.sm,
  },
  pointsPreviewText: {
    fontSize: 12,
    color: c.primary,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipText: {
    fontSize: 14,
    color: c.textSecondary,
  },
  // Success state
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: Spacing.sm,
  },
  successPoints: {
    fontSize: 28,
    fontWeight: '800',
    color: c.primary,
    marginBottom: Spacing.md,
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${c.primary}15`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  bonusText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.primary,
  },
  doneBtn: {
    marginTop: Spacing.md,
    width: '100%',
  },
});
