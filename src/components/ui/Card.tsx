import React, { useMemo } from 'react'
import { View, StyleSheet, type ViewProps } from 'react-native'
import { useColors, type Colors } from '@/hooks/useColors'
import { radius, spacing } from '@/theme/spacing'

interface Props extends ViewProps {
  children: React.ReactNode
  padded?: boolean
}

export function Card({ children, padded = true, style, ...rest }: Props) {
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={[s.card, padded && s.padded, style]} {...rest}>
      {children}
    </View>
  )
}

const createStyles = (c: Colors) => StyleSheet.create({
  card: {
    backgroundColor: c.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
  },
  padded: { padding: spacing.base },
})
