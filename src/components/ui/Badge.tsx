import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { statusColor, statusLabel } from '@/utils/format'
import { fontSize, radius, spacing } from '@/theme/spacing'
import { useColors, type Colors } from '@/hooks/useColors'

interface Props {
  status: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const color = statusColor(status)
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }, size === 'sm' && styles.sm]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }, size === 'sm' && styles.labelSm]}>
        {statusLabel(status)}
      </Text>
    </View>
  )
}

export function CurrencyBadge({ currency }: { currency: string }) {
  const colors = useColors()
  const s = useMemo(() => createCurrencyStyles(colors), [colors])
  return (
    <View style={s.currencyBadge}>
      <Text style={s.currencyText}>{currency}</Text>
    </View>
  )
}

// StatusBadge styles are all color-prop-driven (inline), no theme colors needed
const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: spacing.xs + 2, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: fontSize.sm, fontWeight: '600' },
  labelSm: { fontSize: fontSize.xs },
})

const createCurrencyStyles = (c: Colors) => StyleSheet.create({
  currencyBadge: {
    backgroundColor: c.primaryFaded,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  currencyText: { fontSize: fontSize.xs, fontWeight: '700', color: c.primaryLight, letterSpacing: 0.5 },
})
