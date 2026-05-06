import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as LocalAuthentication from 'expo-local-authentication'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius } from '@/theme/spacing'
import { Button } from '@/components/ui/Button'

interface Props {
  onSuccess: () => void
  onFallback: () => void
}

type AuthStatus = 'idle' | 'checking' | 'success' | 'failed'

export function BiometricPrompt({ onSuccess, onFallback }: Props) {
  const [status, setStatus] = useState<AuthStatus>('idle')
  const [biometricType, setBiometricType] = useState<string>('Biometrics')

  useEffect(() => {
    detectAndPrompt()
  }, [])

  const detectAndPrompt = async () => {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('Face ID')
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('Fingerprint')
    }
    triggerAuth()
  }

  const triggerAuth = async () => {
    setStatus('checking')
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()

      if (!hasHardware || !enrolled) {
        onFallback()
        return
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm your identity to continue',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Sign out',
        disableDeviceFallback: false,
      })

      if (result.success) {
        setStatus('success')
        onSuccess()
      } else if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        setStatus('failed')
      } else {
        setStatus('failed')
      }
    } catch {
      setStatus('failed')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            {status === 'checking' ? (
              <ActivityIndicator color={colors.primary} size="large" />
            ) : status === 'failed' ? (
              <Ionicons name="close-circle" size={40} color={colors.danger} />
            ) : (
              <Ionicons
                name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
                size={40}
                color={colors.primary}
              />
            )}
          </View>
        </View>

        <Text style={styles.heading}>
          {status === 'failed' ? 'Authentication failed' : 'Verify your identity'}
        </Text>
        <Text style={styles.sub}>
          {status === 'failed'
            ? 'Biometric authentication was not successful.'
            : `Use ${biometricType} to securely access RemitX`}
        </Text>

        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
          </View>
          <Text style={styles.brand}>RemitX</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={`Use ${biometricType}`}
            onPress={triggerAuth}
            loading={status === 'checking'}
          />
          <TouchableOpacity style={styles.fallback} onPress={onFallback}>
            <Text style={styles.fallbackText}>Sign in with password instead</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },

  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heading: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  logoBox: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: -0.3,
  },

  actions: { width: '100%', gap: spacing.base },
  fallback: { alignItems: 'center', paddingVertical: spacing.sm },
  fallbackText: { fontSize: fontSize.md, color: colors.textMuted },
})
