import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/spacing'

interface Props {
  name: string
}

export function PlaceholderScreen({ name }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.sub}>Coming in Phase 12B</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: fontSize.md, color: colors.textMuted },
})
