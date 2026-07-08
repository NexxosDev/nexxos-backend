import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Spacing, BorderRadius } from '../../src/theme/colors';
import type { ThemeColors } from '../../src/theme/colors';
import LegalFooter from '../../src/components/LegalFooter';

export default function RegisterTypeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.title}>¿Cómo deseas registrarte?</Text>

      <View style={styles.cards}>
        <Pressable style={styles.card} onPress={() => router.push('/auth/register-client')}>
          <View style={styles.iconBg}>
            <Ionicons name="person-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Cliente</Text>
          <Text style={styles.cardSub}>Busca repuestos fácilmente</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/auth/register-vendor')}>
          <View style={styles.iconBg}>
            <Ionicons name="storefront-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Vendedor</Text>
          <Text style={styles.cardSub}>Ofrece tus productos</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.push('/auth/login')} style={styles.loginLink}>
        <Text style={styles.loginText}>¿Ya tienes cuenta? <Text style={styles.loginBold}>Inicia Sesión</Text></Text>
      </Pressable>

      <LegalFooter style={styles.footer} />
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background, padding: Spacing.lg },
  back: { width: 44, height: 44, justifyContent: 'center', marginBottom: Spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: c.textPrimary, marginBottom: Spacing.xl },
  cards: { gap: Spacing.md },
  card: {
    backgroundColor: c.cardBg, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    alignItems: 'center', borderWidth: 2, borderColor: c.border,
  },
  iconBg: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: `${c.primary}15`,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
  footer: { marginTop: 'auto', paddingTop: Spacing.lg },
  loginLink: { alignItems: 'center', marginTop: Spacing.xl },
  loginText: { fontSize: 15, color: c.textSecondary },
  loginBold: { color: c.primary, fontWeight: '600' },
});
