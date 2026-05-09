import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import api, { getErrorMessage } from '../services/api';

interface EmailVerificationProps {
  email: string;
  onVerified: (verified: boolean) => void;
  verified: boolean;
}

export default function EmailVerification({ email, onVerified, verified }: EmailVerificationProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevEmailRef = useRef(email);

  // Reset if email changes
  useEffect(() => {
    if (prevEmailRef.current !== email) {
      prevEmailRef.current = email;
      setCodeSent(false);
      setCode('');
      setError('');
      setCooldown(0);
      onVerified(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [email, onVerified]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const isValidEmail = useCallback(() => {
    return !!(email?.trim?.()) && /\S+@\S+\.\S+/.test(email);
  }, [email]);

  const handleSendCode = useCallback(async () => {
    if (!isValidEmail()) { setError('Ingresa un email válido'); return; }
    setError('');
    setSending(true);
    try {
      await api.post('/auth/send-code', { email: email?.trim?.()?.toLowerCase?.() ?? '' });
      setCodeSent(true);
      startCooldown();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }, [email, isValidEmail, startCooldown]);

  const handleVerifyCode = useCallback(async () => {
    if ((code?.length ?? 0) !== 6) { setError('El código debe tener 6 dígitos'); return; }
    setError('');
    setVerifying(true);
    try {
      const res = await api.post('/auth/verify-code', {
        email: email?.trim?.()?.toLowerCase?.() ?? '',
        code: code?.trim?.() ?? '',
      });
      if (res?.data?.verified) {
        onVerified(true);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  }, [email, code, onVerified]);

  if (verified) {
    return (
      <View style={styles.verifiedRow}>
        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
        <Text style={styles.verifiedText}>Correo verificado</Text>
      </View>
    );
  }

  if (!codeSent) {
    return (
      <View style={styles.container}>
        <Pressable
          style={[styles.sendButton, (!isValidEmail() || sending) && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={!isValidEmail() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="mail-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.sendButtonText}>Verificar correo</Text>
            </>
          )}
        </Pressable>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>Ingresa el código de 6 dígitos enviado a <Text style={styles.emailHighlight}>{email}</Text></Text>
      <View style={styles.codeRow}>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(t) => setCode(t?.replace?.(/[^0-9]/g, '')?.slice?.(0, 6) ?? '')}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={colors.textSecondary}
          autoFocus
        />
        <Pressable
          style={[styles.verifyButton, ((code?.length ?? 0) !== 6 || verifying) && styles.buttonDisabled]}
          onPress={handleVerifyCode}
          disabled={(code?.length ?? 0) !== 6 || verifying}
        >
          {verifying ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verificar</Text>
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Pressable onPress={handleSendCode} disabled={cooldown > 0 || sending} style={styles.resendRow}>
        <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
          {cooldown > 0 ? `Reenviar código en ${cooldown}s` : 'Reenviar código'}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { marginBottom: Spacing.md },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  sendButtonText: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  buttonDisabled: { opacity: 0.5 },
  infoText: { fontSize: 14, color: c.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  emailHighlight: { fontWeight: '600', color: c.textPrimary },
  codeRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: Spacing.sm },
  codeInput: {
    flex: 1,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    color: c.textPrimary,
  },
  verifyButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
  },
  verifyButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  errorText: { color: c.error, fontSize: 13, marginTop: 4 },
  resendRow: { marginTop: 4 },
  resendText: { fontSize: 14, color: c.primary, fontWeight: '500' },
  resendDisabled: { color: c.textSecondary },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md, paddingVertical: 8 },
  verifiedText: { fontSize: 15, fontWeight: '600', color: '#22C55E' },
});
