import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title, onPress, variant = 'primary', size = 'md',
  disabled, loading, icon, style, textStyle, fullWidth
}: ButtonProps) {

  const sizeStyles = {
    sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, fontSize: Typography.sm },
    md: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.base },
    lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, fontSize: Typography.md },
  };

  const variantStyles: Record<string, { bg: string; text: string; border?: string }> = {
    primary: { bg: Colors.primary, text: Colors.textPrimary },
    secondary: { bg: Colors.surfaceElevated, text: Colors.textPrimary },
    outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
    ghost: { bg: 'transparent', text: Colors.textSecondary },
    danger: { bg: Colors.error, text: Colors.textPrimary },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          paddingHorizontal: ss.paddingHorizontal,
          paddingVertical: ss.paddingVertical,
          borderWidth: vs.border ? 1 : 0,
          borderColor: vs.border || 'transparent',
          opacity: disabled || loading ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: vs.text, fontSize: ss.fontSize }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  text: {
    fontWeight: Typography.semiBold,
    textAlign: 'center',
  },
});
