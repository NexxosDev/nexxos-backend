import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '../src/components/LoadingSpinner';
import { useTheme } from '../src/contexts/ThemeContext';

export default function SpinnerDemo() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={[s.h, { color: colors.textPrimary ?? '#000' }]}>Inline (puntos)</Text>
      <View style={[s.box, { borderColor: colors.border }]}>
        <LoadingSpinner fullScreen={false} />
      </View>
      <Text style={[s.h, { color: colors.textPrimary ?? '#000' }]}>Full screen (logo + puntos)</Text>
      <View style={{ flex: 1 }}>
        <LoadingSpinner fullScreen />
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  h: { fontSize: 16, fontWeight: '700', marginTop: 20, marginLeft: 16, marginBottom: 8 },
  box: { height: 120, marginHorizontal: 16, borderWidth: 1, borderRadius: 12, justifyContent: 'center' },
});
