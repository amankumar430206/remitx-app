import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native'
import { colors } from '@/theme/colors'
import { radius, spacing, fontSize } from '@/theme/spacing'

interface ButtonProps extends TouchableOpacityProps {
  label: string
  loading?: boolean
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  label,
  loading = false,
  variant = 'primary',
  size = 'lg',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[styles.base, styles[variant], styles[`size_${size}`], isDisabled && styles.disabled, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} size="small" />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  size_sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.base, minHeight: 36 },
  size_md: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, minHeight: 44 },
  size_lg: { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl, minHeight: 52 },
  disabled: { opacity: 0.45 },

  label: { fontWeight: '600', letterSpacing: 0.3 },
  label_primary: { color: colors.white },
  label_outline: { color: colors.textPrimary },
  label_ghost: { color: colors.primary },
  label_danger: { color: colors.white },
  labelSize_sm: { fontSize: fontSize.sm },
  labelSize_md: { fontSize: fontSize.md },
  labelSize_lg: { fontSize: fontSize.base },
})
