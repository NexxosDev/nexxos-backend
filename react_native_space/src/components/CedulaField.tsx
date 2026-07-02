import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Input from './Input';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import { formatCedula, type CedulaPrefix } from '../utils/cedula';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  locked?: boolean;
}

export default function CedulaField({ value, onChangeText, error, locked }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [prefix, setPrefix] = useState<CedulaPrefix>(
    (value?.match?.(/^([VE])/i)?.[1]?.toUpperCase?.() as CedulaPrefix) ?? 'V',
  );

  useEffect(() => {
    const p = value?.match?.(/^([VE])/i)?.[1]?.toUpperCase?.();
    if (p && p !== prefix) setPrefix(p as CedulaPrefix);
  }, [value]);

  const choose = (p: CedulaPrefix) => {
    if (locked) return;
    setPrefix(p);
    const digits = (value ?? '').replace(/^[VE]-?/i, '').replace(/[^0-9]/g, '');
    onChangeText(digits ? `${p}-${digits}` : '');
  };

  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.helper}>Tipo de documento</Text>
      <View style={styles.row}>
        {(['V', 'E'] as CedulaPrefix[]).map((p) => {
          const active = prefix === p;
          return (
            <Pressable
              key={p}
              onPress={() => choose(p)}
              disabled={locked}
              style={[styles.btn, active && styles.btnActive, locked && styles.btnDisabled]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.btnText, active && styles.btnTextActive]}>
                {p === 'V' ? 'V — Venezolano' : 'E — Extranjero'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Input
        label="Cédula"
        value={value}
        onChangeText={(v) => onChangeText(formatCedula(v, prefix))}
        placeholder={`${prefix}-12345678`}
        keyboardType="number-pad"
        error={error}
        locked={locked}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    helper: { fontSize: 12, color: c.textSecondary, marginBottom: 6, marginLeft: 4 },
    row: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
    btn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      backgroundColor: c.inputBg,
    },
    btnActive: { borderColor: c.primary, borderWidth: 2, backgroundColor: c.primary + '15' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
    btnTextActive: { color: c.primary, fontWeight: '700' },
  });
