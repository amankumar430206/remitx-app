import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/spacing'

export function NetworkBanner() {
  const { isOnline } = useNetworkStatus()
  const insets = useSafeAreaInsets()
  const slideY = useRef(new Animated.Value(-80)).current
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start()
    } else if (wasOffline.current) {
      // Came back online — slide out after a brief "Connected" moment
      Animated.timing(slideY, {
        toValue: -80,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [isOnline])

  return (
    <Animated.View
      style={[styles.banner, { paddingTop: insets.top + spacing.xs, transform: [{ translateY: slideY }] }]}
      pointerEvents="none"
    >
      {isOnline ? (
        <View style={[styles.inner, styles.onlineInner]}>
          <Ionicons name="checkmark-circle" size={15} color={colors.success} />
          <Text style={[styles.text, styles.onlineText]}>Back online</Text>
        </View>
      ) : (
        <View style={[styles.inner, styles.offlineInner]}>
          <Ionicons name="cloud-offline-outline" size={15} color={colors.white} />
          <Text style={[styles.text, styles.offlineText]}>No internet — check your connection</Text>
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  offlineInner: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: colors.danger + '60' },
  onlineInner:  { backgroundColor: '#0d2e1a', borderWidth: 1, borderColor: colors.success + '60' },
  text: { fontSize: fontSize.xs, fontWeight: '700' },
  offlineText: { color: colors.white },
  onlineText:  { color: colors.success },
})
