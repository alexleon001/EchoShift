import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const variantStyles = VARIANT_STYLES[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, variantStyles.container, disabled && styles.disabled, style]}
    >
      <Text style={[styles.text, variantStyles.text]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  disabled: {
    opacity: 0.4,
  },
});

const VARIANT_STYLES = {
  primary: {
    container: { backgroundColor: COLORS.cyan } as ViewStyle,
    text: { color: '#07080f' } as TextStyle,
  },
  secondary: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.cyan } as ViewStyle,
    text: { color: COLORS.cyan } as TextStyle,
  },
  ghost: {
    container: { backgroundColor: 'transparent' } as ViewStyle,
    text: { color: '#888' } as TextStyle,
  },
};
