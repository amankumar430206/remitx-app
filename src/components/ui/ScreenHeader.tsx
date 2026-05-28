import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColors, type Colors } from '@/hooks/useColors'
import { fontSize, spacing } from '@/theme/spacing'

interface Props {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: React.ReactNode
}

export function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={s.header}>
      <View style={s.left}>
        {onBack && (
          <TouchableOpacity style={s.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={s.title}>{title}</Text>
          {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {right && <View>{right}</View>}
    </View>
  )
}

const createStyles = (c: Colors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  backBtn: { padding: spacing.xs, marginLeft: -spacing.xs },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: c.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: c.textMuted, marginTop: 2 },
})
