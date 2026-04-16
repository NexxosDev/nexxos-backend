import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import MaskInput from 'react-native-mask-input';
import { Colors, Spacing, BorderRadius } from '../theme/colors';

interface PhoneInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

// Máscara para +58-999-999-99-99
const PHONE_MASK = ['+', '5', '8', '-', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, '-', /\d/, /\d/, '-', /\d/, /\d/];

export default function PhoneInput({ label, value, onChangeText, error, containerStyle }: PhoneInputProps) {
  const [focused, setFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(labelAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    if (!value) {
      Animated.timing(labelAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    }
  };

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, -10] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] });
  const hasValue = (value?.length ?? 0) > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[
        styles.inputContainer,
        focused && styles.focused,
        error ? styles.errorBorder : null,
      ]}>
        <Animated.Text style={[
          styles.label,
          { top: labelTop, fontSize: labelSize },
          (focused || hasValue) && styles.labelFocused,
          error ? styles.labelError : null,
        ]}>
          {label ?? ''}
        </Animated.Text>
        <MaskInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          mask={PHONE_MASK}
          keyboardType="phone-pad"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingTop: 18,
    paddingBottom: 8,
    position: 'relative',
  },
  focused: { borderColor: Colors.primary, borderWidth: 2 },
  errorBorder: { borderColor: Colors.error },
  label: {
    position: 'absolute',
    left: Spacing.md,
    color: Colors.textSecondary,
    backgroundColor: Colors.white,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  labelFocused: { color: Colors.primary },
  labelError: { color: Colors.error },
  input: { fontSize: 16, color: Colors.textPrimary, paddingVertical: 0 },
  errorText: { color: Colors.error, fontSize: 12, marginTop: 4, marginLeft: 4 },
});
