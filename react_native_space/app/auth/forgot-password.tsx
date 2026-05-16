import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { forgotPasswordApi, verifyResetCodeApi, resetPasswordApi } from '../../src/services/auth';
import { useTheme } from '../../src/contexts/ThemeContext';
import { getErrorMessage } from '../../src/services/api';
import { Spacing, BorderRadius } from '../../src/theme/colors';
import type { ThemeColors } from '../../src/theme/colors';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const codeRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((p) => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = useCallback(async () => {
    setError('');
    const trimmed = email?.trim?.() ?? '';
    if (!trimmed) { setError('Ingresa tu email'); return; }
    setLoading(true);
    try {
      await forgotPasswordApi(trimmed);
      setStep('code');
      setCountdown(60);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleResendCode = useCallback(async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      await forgotPasswordApi(email?.trim?.() ?? '');
      setCode(['', '', '', '', '', '']);
      setCountdown(60);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [email, countdown]);

  const handleCodeChange = useCallback((text: string, index: number) => {
    // Handle paste of full code
    if (text?.length === 6) {
      const digits = text.split('').slice(0, 6);
      setCode(digits);
      codeRefs.current?.[5]?.focus?.();
      return;
    }
    const digit = text?.replace?.(/[^0-9]/g, '')?.slice?.(-1) ?? '';
    setCode((prev) => {
      const newCode = [...(prev ?? [])];
      newCode[index] = digit;
      return newCode;
    });
    if (digit && index < 5) {
      codeRefs.current?.[index + 1]?.focus?.();
    }
  }, []);

  const handleCodeKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !code?.[index] && index > 0) {
      codeRefs.current?.[index - 1]?.focus?.();
    }
  }, [code]);

  const handleVerifyCode = useCallback(async () => {
    setError('');
    const fullCode = (code ?? []).join('');
    if ((fullCode?.length ?? 0) !== 6) { setError('Ingresa el código completo de 6 dígitos'); return; }
    setLoading(true);
    try {
      await verifyResetCodeApi(email?.trim?.() ?? '', fullCode);
      setStep('password');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [email, code]);

  const handleResetPassword = useCallback(async () => {
    setError('');
    if (!newPassword?.trim?.()) { setError('Ingresa una contraseña'); return; }
    if ((newPassword?.length ?? 0) < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      const fullCode = (code ?? []).join('');
      await resetPasswordApi(email?.trim?.() ?? '', fullCode, newPassword);
      setSuccess(true);
      setTimeout(() => { router.replace('/auth/login'); }, 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [email, code, newPassword, confirmPassword, router]);

  const handleBack = useCallback(() => {
    if (step === 'code') { setStep('email'); setError(''); }
    else if (step === 'password') { setStep('code'); setError(''); }
    else { router.back(); }
  }, [step, router]);

  const stepNumber = step === 'email' ? 1 : step === 'code' ? 2 : 3;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={handleBack} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>

          {/* Step indicator */}
          <View style={styles.stepsRow}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepCircle, s <= stepNumber ? styles.stepActive : styles.stepInactive]}>
                  {s < stepNumber ? (
                    <Ionicons name="checkmark" size={14} color="#121212" />
                  ) : (
                    <Text style={[styles.stepNum, s <= stepNumber && styles.stepNumActive]}>{s}</Text>
                  )}
                </View>
                {s < 3 && <View style={[styles.stepLine, s < stepNumber ? styles.stepLineActive : styles.stepLineInactive]} />}
              </View>
            ))}
          </View>

          <Text style={styles.title}>
            {step === 'email' ? 'Recuperar Contraseña' : step === 'code' ? 'Ingresa el Código' : 'Nueva Contraseña'}
          </Text>
          <Text style={styles.desc}>
            {step === 'email'
              ? 'Ingresa tu email y te enviaremos un código de 6 dígitos.'
              : step === 'code'
                ? `Enviamos un código de 6 dígitos a ${email?.trim?.() ?? ''}. Revisa tu bandeja de entrada.`
                : 'Ingresa tu nueva contraseña.'}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              <Text style={styles.successText}>¡Contraseña restablecida exitosamente!</Text>
              <Text style={[styles.desc, { marginBottom: 0 }]}>Redirigiendo al login...</Text>
            </View>
          ) : step === 'email' ? (
            <>
              <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Button title="Enviar Código" onPress={handleSendCode} loading={loading} />
            </>
          ) : step === 'code' ? (
            <>
              {/* 6-digit code inputs */}
              <View style={styles.codeRow}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <TextInput
                    key={i}
                    ref={(r) => { codeRefs.current[i] = r; }}
                    style={[
                      styles.codeInput,
                      code?.[i] ? styles.codeInputFilled : null,
                    ]}
                    value={code?.[i] ?? ''}
                    onChangeText={(t) => handleCodeChange(t, i)}
                    onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent?.key ?? '', i)}
                    keyboardType="number-pad"
                    maxLength={Platform.OS === 'web' ? 6 : 1}
                    textContentType="oneTimeCode"
                    autoComplete={Platform.OS === 'android' ? 'sms-otp' as any : undefined}
                    selectionColor={colors.primary}
                    placeholderTextColor={colors.textSecondary}
                  />
                ))}
              </View>

              <Button title="Verificar Código" onPress={handleVerifyCode} loading={loading} />

              <Pressable onPress={handleResendCode} disabled={countdown > 0} style={styles.resendBtn}>
                <Text style={[styles.resendText, countdown > 0 && { opacity: 0.5 }]}>
                  {countdown > 0 ? `Reenviar código en ${countdown}s` : 'Reenviar código'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Input label="Nueva Contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
              <Input label="Confirmar Contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
              <Button title="Restablecer Contraseña" onPress={handleResetPassword} loading={loading} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.md },
  back: { marginBottom: Spacing.md, width: 44, height: 44, justifyContent: 'center' },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stepActive: { backgroundColor: c.primary },
  stepInactive: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  stepNum: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
  stepNumActive: { color: '#121212' },
  stepLine: { width: 40, height: 2, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: c.primary },
  stepLineInactive: { backgroundColor: c.border },
  title: { fontSize: 24, fontWeight: '700', color: c.textPrimary, marginBottom: Spacing.sm },
  desc: { fontSize: 15, color: c.textSecondary, marginBottom: Spacing.lg, lineHeight: 22 },
  error: { backgroundColor: c.errorBg, color: c.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
  successBox: { backgroundColor: c.successBg, padding: Spacing.xl, borderRadius: BorderRadius.lg, alignItems: 'center', gap: 12 },
  successText: { fontSize: 18, fontWeight: '700', color: c.textPrimary, textAlign: 'center' },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing.lg },
  codeInput: {
    width: 48, height: 56, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: c.border,
    textAlign: 'center', fontSize: 22, fontWeight: '700',
    color: c.textPrimary, backgroundColor: c.surface,
  },
  codeInputFilled: { borderColor: c.primary },
  resendBtn: { alignSelf: 'center', marginTop: Spacing.md, padding: Spacing.sm },
  resendText: { fontSize: 14, color: c.primary, fontWeight: '600' },
});
