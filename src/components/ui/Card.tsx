import React from 'react'
import { View, StyleSheet, type ViewProps } from 'react-native'
import { colors } from '@/theme/colors'
import { radius, spacing } from '@/theme/spacing'

interface Props extends ViewProps {
  children: React.ReactNode
  padded?: boolean
}

export function Card({ children, padded = true, style, ...rest }: Props) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: { padding: spacing.base },
})
