import React from 'react'
import {
  TouchableOpacity, View,
  Text, ActivityIndicator, StyleSheet,
  type TouchableOpacityProps, type ViewStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '@/theme/colors'
import { radius, spacing, fontSize } from '@/theme/spacing'

interface ButtonProps extends TouchableOpacityProps {
  label: string
  loading?: boolean
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
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
  const sizeStyle = sizeStyles[size]

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isDisabled}
        style={[{ opacity: isDisabled ? 0.45 : 1, borderRadius: radius.xl, overflow: 'hidden' }, style]}
        {...rest}
      >
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          style={[styles.inner, sizeStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={[styles.label, styles.labelPrimary, labelSizes[size]]}>{label}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isDisabled}
        style={[{ opacity: isDisabled ? 0.45 : 1, borderRadius: radius.xl, overflow: 'hidden' }, style]}
        {...rest}
      >
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          style={[styles.inner, sizeStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={[styles.label, styles.labelPrimary, labelSizes[size]]}>{label}</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.inner,
        sizeStyle,
        variant === 'outline' && styles.outline,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Text style={[styles.label, variantTextStyles[variant], labelSizes[size]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.base, minHeight: 36 },
  md: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, minHeight: 44 },
  lg: { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl, minHeight: 52 },
}

const labelSizes = StyleSheet.create({
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.base },
})

const variantTextStyles = StyleSheet.create({
  primary: { color: colors.white },
  outline: { color: colors.textPrimary },
  ghost: { color: colors.primary },
  danger: { color: colors.white },
})

const styles = StyleSheet.create({
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    flexDirection: 'row',
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.45 },
  label: { fontWeight: '700', letterSpacing: 0.3 },
  labelPrimary: { color: colors.white },
})
