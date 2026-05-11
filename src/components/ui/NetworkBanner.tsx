import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/spacing'

const PILL_H = 36

export function NetworkBanner() {
  const { isOnline } = useNetworkStatus()
  const insets = useSafeAreaInsets()
  // Start fully above the screen — behind the status bar
  const translateY = useRef(new Animated.Value(-(PILL_H + 16))).current
  const wasOffline = useRef(false)
  const onlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (onlineTimer.current) clearTimeout(onlineTimer.current)

    if (!isOnline) {
      wasOffline.current = true
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }).start()
    } else if (wasOffline.current) {
      // Show "back online" briefly then retract
      onlineTimer.current = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -(PILL_H + 16),
          duration: 280,
          useNativeDriver: true,
        }).start()
      }, 1800)
    }

    return () => { if (onlineTimer.current) clearTimeout(onlineTimer.current) }
  }, [isOnline])

  // top = just below the status bar, pill drops into this spot
  const top = insets.top + spacing.sm

  return (
    <Animated.View
      style={[styles.wrap, { top }, { transform: [{ translateY: translateY }] }]}
      pointerEvents="none"
    >
      <View style={isOnline ? styles.pillOnline : styles.pillOffline}>
        <Ionicons
          name={isOnline ? 'checkmark-circle' : 'wifi-outline'}
          size={14}
          color={isOnline ? '#fff' : '#fff'}
        />
        <Text style={styles.text}>
          {isOnline ? 'Back online' : 'No internet connection'}
        </Text>
      </View>
    </Animated.View>
  )
}

const pill = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  height: PILL_H,
  paddingHorizontal: spacing.base,
  borderRadius: PILL_H / 2,
  // Strong shadow so it reads clearly above any screen content
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.45,
  shadowRadius: 12,
  elevation: 16,
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  pillOffline: {
    ...pill,
    backgroundColor: '#DC2626',   // solid red — unmistakably distinct
  },
  pillOnline: {
    ...pill,
    backgroundColor: '#059669',   // solid green
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
})
