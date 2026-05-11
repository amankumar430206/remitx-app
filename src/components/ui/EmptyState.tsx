import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '@/theme/colors'
import { fontSize, spacing, radius } from '@/theme/spacing'

interface Props {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={30} color={colors.primary + '80'} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {!!actionLabel && !!onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.85} style={styles.btnWrap}>
          <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.btnText}>{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.sm },
  iconWrap: {
    width: 68, height: 68, borderRadius: radius.full,
    backgroundColor: colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1, borderColor: colors.primary + '20',
  },
  title: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing['2xl'], lineHeight: 20 },
  btnWrap: { marginTop: spacing.sm, borderRadius: radius.full, overflow: 'hidden' },
  btn: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.xl, borderRadius: radius.full },
  btnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.white },
})
