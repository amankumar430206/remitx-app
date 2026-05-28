import React, { useMemo, useState } from 'react'
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColors, type Colors } from '@/hooks/useColors'
import { radius, spacing, fontSize } from '@/theme/spacing'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  hint?: string
  leftIcon?: keyof typeof Ionicons.glyphMap
}

export function Input({ label, error, hint, leftIcon, secureTextEntry, style, ...rest }: InputProps) {
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
  const [hidden, setHidden] = useState(secureTextEntry ?? false)
  const [focused, setFocused] = useState(false)

  return (
    <View style={s.wrapper}>
      {label && <Text style={s.label}>{label}</Text>}
      <View style={[s.inputRow, focused && s.focused, error && s.errored]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={colors.textMuted} style={s.leftIcon} />
        )}
        <TextInput
          style={[s.input, style]}
          placeholderTextColor={colors.textDisabled}
          selectionColor={colors.primary}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} style={s.eye}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      {hint && !error && <Text style={s.hint}>{hint}</Text>}
    </View>
  )
}

const createStyles = (c: Colors) => StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: c.textSecondary,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: c.border,
    paddingHorizontal: spacing.base,
    minHeight: 52,
  },
  focused: { borderColor: c.primary, backgroundColor: c.primaryFaded + '33' },
  errored: { borderColor: c.danger },
  leftIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: c.textPrimary,
    paddingVertical: spacing.sm,
  },
  eye: { paddingLeft: spacing.sm },
  error: { fontSize: fontSize.xs, color: c.danger },
  hint: { fontSize: fontSize.xs, color: c.textMuted },
})
