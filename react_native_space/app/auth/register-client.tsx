import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { getErrorMessage } from '../../src/services/api';
import { Colors, Spacing } from '../../src/theme/colors';
import Input from '../../src/components/Input';
import PhoneInput from '../../src/components/PhoneInput';
import Button from '../../src/components/Button';

export default function RegisterClientScreen() {
  const router = useRouter();
  const { signup, user } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', documentId: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) router.replace('/role-selection');
  }, [user]);

  const update = (key: string, val: string) => {
    setForm((prev) => ({ ...(prev ?? {}), [key]: val }));
    setFieldErrors((prev) => ({ ...(prev ?? {}), [key]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form?.firstName?.trim?.()) errs.firstName = 'Requerido';
    if (!form?.lastName?.trim?.()) errs.lastName = 'Requerido';
    if (!form?.documentId?.trim?.()) errs.documentId = 'Requerido';
    if (!form?.phone?.trim?.()) errs.phone = 'Requerido';
    if (!form?.email?.trim?.()) errs.email = 'Requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email inválido';
    if (!form?.password) errs.password = 'Requerido';
    else if ((form?.password?.length ?? 0) < 6) errs.password = 'Mínimo 6 caracteres';
    if (form?.password !== form?.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await signup({
        email: form?.email?.trim?.() ?? '',
        password: form?.password ?? '',
        name: `${form?.firstName?.trim?.() ?? ''} ${form?.lastName?.trim?.() ?? ''}`,
        firstName: form?.firstName?.trim?.() ?? '',
        lastName: form?.lastName?.trim?.() ?? '',
        phone: form?.phone?.trim?.() ?? '',
        documentId: form?.documentId?.trim?.() ?? '',
        role: 'CLIENTE',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Registro de Cliente</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Input label="Nombre" value={form.firstName} onChangeText={(v) => update('firstName', v)} error={fieldErrors?.firstName} />
          <Input label="Apellido" value={form.lastName} onChangeText={(v) => update('lastName', v)} error={fieldErrors?.lastName} />
          <Input label="Cédula" value={form.documentId} onChangeText={(v) => update('documentId', v)} keyboardType="numeric" error={fieldErrors?.documentId} />
          <PhoneInput label="Teléfono" value={form.phone} onChangeText={(v) => update('phone', v)} error={fieldErrors?.phone} />
          <Input label="Email" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" error={fieldErrors?.email} />
          <Input label="Contraseña" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry error={fieldErrors?.password} />
          <Input label="Confirmar Contraseña" value={form.confirmPassword} onChangeText={(v) => update('confirmPassword', v)} secureTextEntry error={fieldErrors?.confirmPassword} />

          <Button title="Registrarme como Cliente" onPress={handleRegister} loading={loading} />

          <Pressable onPress={() => router.push('/auth/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? <Text style={styles.loginBold}>Inicia Sesión</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  back: { width: 44, height: 44, justifyContent: 'center', marginBottom: Spacing.sm },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  error: { backgroundColor: '#FEE2E2', color: Colors.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
  loginLink: { alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
  loginText: { fontSize: 15, color: Colors.textSecondary },
  loginBold: { color: Colors.primary, fontWeight: '600' },
});
