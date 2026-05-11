import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,

  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '@/components/ui/Button'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius } from '@/theme/spacing'
import { useAuthStore } from '@/stores/authStore'
import authApi from '@/api/auth'
import { getApiError } from '@/utils/apiError'
import { useAlert } from '@/hooks/useAlert'
import { type AuthStackParamList } from '@/navigation/AuthStack'

type Props = NativeStackScreenProps<AuthStackParamList, 'MfaChallenge'>

const CODE_LENGTH = 6

export function MfaChallenge({ route, navigation }: Props) {
  const { showAlert } = useAlert()
  const { challengeToken, tenantSlug } = route.params
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(digits)
    if (digits.length === CODE_LENGTH) {
      handleVerify(digits)
    }
  }

  const handleVerify = async (finalCode = code) => {
    if (finalCode.length !== CODE_LENGTH) return
    setLoading(true)
    try {
      const { data: res } = await authApi.mfaChallenge(challengeToken, finalCode)
      const payload = res.data
      setAuth(payload.user, payload.accessToken, payload.refreshToken, tenantSlug)
    } catch (err) {
      showAlert('Invalid code', getApiError(err, 'The code you entered is incorrect. Please try again.'))
      setCode('')
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const digits = code.split('')

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.container}>
          {/* Back */}
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.textMuted} />
            <Text style={styles.backLabel}>Back</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={36} color={colors.primary} />
          </View>

          <Text style={styles.heading}>Two-factor authentication</Text>
          <Text style={styles.sub}>
            Enter the 6-digit code from your authenticator app.
          </Text>

          {/* Code cells */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.cellsRow}
            onPress={() => inputRef.current?.focus()}
          >
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.cell,
                  i < digits.length && styles.cellFilled,
                  i === digits.length && styles.cellActive,
                ]}
              >
                <Text style={styles.cellText}>{digits[i] ?? ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          {/* Hidden real input */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
          />

          <Button
            label="Verify"
            onPress={() => handleVerify()}
            loading={loading}
            disabled={code.length !== CODE_LENGTH}
            style={styles.btn}
          />

          <Text style={styles.hint}>
            Open your authenticator app to find the code for RemitX.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },

  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing['2xl'],
    paddingVertical: spacing.xs,
  },
  backLabel: { fontSize: fontSize.md, color: colors.textMuted },

  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  heading: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sub: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },

  cellsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: colors.primaryLight,
    backgroundColor: colors.primaryFaded,
  },
  cellActive: {
    borderColor: colors.primary,
  },
  cellText: {
    fontSize: fontSize['2xl'],
    fontWeight: '600',
    color: colors.textPrimary,
  },

  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },

  btn: { width: '100%', marginTop: spacing.xl },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 20,
  },
})
