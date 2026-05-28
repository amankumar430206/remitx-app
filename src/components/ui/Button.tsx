import React, { useMemo } from 'react'
import {
  TouchableOpacity, View,
  Text, ActivityIndicator, StyleSheet,
  type TouchableOpacityProps, type ViewStyle,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useColors, type Colors } from '@/hooks/useColors'
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
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
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
          style={[s.inner, sizeStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={[s.label, s.labelPrimary, labelSizes[size]]}>{label}</Text>
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
          style={[s.inner, sizeStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={[s.label, s.labelPrimary, labelSizes[size]]}>{label}</Text>
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
        s.inner,
        sizeStyle,
        variant === 'outline' && s.outline,
        isDisabled && s.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Text style={[s.label, variantText(colors)[variant], labelSizes[size]]}>
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

const variantText = (c: Colors) => StyleSheet.create({
  primary: { color: c.white },
  outline: { color: c.textPrimary },
  ghost:   { color: c.primary },
  danger:  { color: c.white },
})

const createStyles = (c: Colors) => StyleSheet.create({
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    flexDirection: 'row',
  },
  outline: {
    backgroundColor: c.transparent,
    borderWidth: 1,
    borderColor: c.border,
  },
  disabled: { opacity: 0.45 },
  label: { fontWeight: '700', letterSpacing: 0.3 },
  labelPrimary: { color: c.white },
})
