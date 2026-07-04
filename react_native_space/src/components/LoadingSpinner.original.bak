import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../theme/colors';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export default function LoadingSpinner({ fullScreen = true }: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={fullScreen ? styles.fullScreen : styles.inline}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
  inline: { padding: 24, justifyContent: 'center', alignItems: 'center' },
});
