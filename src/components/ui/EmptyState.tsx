import React, { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useColors, type Colors } from '@/hooks/useColors'
import { fontSize, spacing, radius } from '@/theme/spacing'

interface Props {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={s.container}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={30} color={colors.primary + '80'} />
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      {!!actionLabel && !!onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.85} style={s.btnWrap}>
          <LinearGradient colors={['#6366F1', '#4F46E5']} style={s.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={s.btnText}>{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  )
}

const createStyles = (c: Colors) => StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.sm },
  iconWrap: {
    width: 68, height: 68, borderRadius: radius.full,
    backgroundColor: c.primaryFaded,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1, borderColor: c.primary + '20',
  },
  title: { fontSize: fontSize.base, fontWeight: '700', color: c.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: c.textMuted, textAlign: 'center', paddingHorizontal: spacing['2xl'], lineHeight: 20 },
  btnWrap: { marginTop: spacing.sm, borderRadius: radius.full, overflow: 'hidden' },
  btn: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.xl, borderRadius: radius.full },
  btnText: { fontSize: fontSize.sm, fontWeight: '700', color: c.white },
})
