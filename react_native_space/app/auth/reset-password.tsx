import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { resetPasswordApi } from '../../src/services/auth';
import { getErrorMessage } from '../../src/services/api';
import { Colors, Spacing } from '../../src/theme/colors';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const tokenParam = params?.token as string;
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      Alert.alert('Error', 'Token de recuperación no encontrado');
    }
  }, [params]);

  const handleReset = async () => {
    setError('');
    
    if (!newPassword?.trim?.()) {
      setError('Ingresa una contraseña');
      return;
    }
    
    if ((newPassword?.length ?? 0) < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
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
          <Text style={styles.title}>Nueva Contraseña</Text>
          <Text style={styles.desc}>Ingresa tu nueva contraseña a continuación.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
              <Text style={styles.successText}>Contraseña restablecida exitosamente. Redirigiendo al login...</Text>
            </View>
          ) : (
            <>
              <Input 
                label="Nueva Contraseña" 
                value={newPassword} 
                onChangeText={setNewPassword} 
                secureTextEntry 
              />
              <Input 
                label="Confirmar Contraseña" 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry 
              />
              <Button title="Restablecer Contraseña" onPress={handleReset} loading={loading} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.md },
  back: { marginBottom: Spacing.md, width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  desc: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 22 },
  error: { backgroundColor: '#FEE2E2', color: Colors.error, padding: Spacing.md, borderRadius: 8, fontSize: 14, marginBottom: Spacing.md },
  successBox: { backgroundColor: '#E8F5E9', padding: Spacing.lg, borderRadius: 12, alignItems: 'center', gap: 12 },
  successText: { fontSize: 15, color: Colors.textPrimary, textAlign: 'center', lineHeight: 22 },
});
