import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../theme/colors';
import { COMPANY_NAME, COMPANY_RIF, COPYRIGHT_TEXT } from '../config/company';

interface LegalFooterProps {
  style?: StyleProp<ViewStyle>;
}

export default function LegalFooter({ style }: LegalFooterProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const companyLine = COMPANY_RIF
    ? `${COMPANY_NAME} \u2014 ${COMPANY_RIF}`
    : COMPANY_NAME;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.company}>{companyLine}</Text>
      <Text style={styles.copyright}>{COPYRIGHT_TEXT}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  company: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
    textAlign: 'center',
  },
  copyright: {
    fontSize: 11,
    color: c.textSecondary,
    opacity: 0.7,
    textAlign: 'center',
  },
});
