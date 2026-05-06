import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type NativeStackScreenProps } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius } from '@/theme/spacing'
import { useAuthStore } from '@/stores/authStore'
import authApi from '@/api/auth'
import { type AuthStackParamList } from '@/navigation/AuthStack'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

const DEFAULT_TENANT = process.env.EXPO_PUBLIC_TENANT_SLUG ?? 'default'

export function Login({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantSlug, setTenantSlug] = useState(DEFAULT_TENANT)
  const [showTenant, setShowTenant] = useState(false)
  const [loading, setLoading] = useState(false)

  const setAuth = useAuthStore((s) => s.setAuth)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const { data: res } = await authApi.login({ email: email.trim(), password }, tenantSlug)
      const payload = res.data

      if (payload.mfaRequired && payload.mfaChallengeToken) {
        navigation.navigate('MfaChallenge', {
          challengeToken: payload.mfaChallengeToken,
          tenantSlug,
        })
        return
      }

      setAuth(payload.user, payload.accessToken, payload.refreshToken, tenantSlug)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Invalid credentials. Please try again.'
      Alert.alert('Login failed', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Ionicons name="swap-horizontal" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brand}>RemitX</Text>
          </View>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Sign in to your account</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              keyboardType="email-address"
              leftIcon="mail-outline"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              leftIcon="lock-closed-outline"
              textContentType="password"
              style={styles.inputSpacing}
            />

            {/* Tenant slug toggle */}
            <TouchableOpacity
              style={styles.tenantToggle}
              onPress={() => setShowTenant((v) => !v)}
            >
              <Ionicons
                name={showTenant ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.tenantToggleLabel}>
                {showTenant ? 'Hide' : 'Show'} workspace
              </Text>
            </TouchableOpacity>

            {showTenant && (
              <Input
                label="Workspace"
                value={tenantSlug}
                onChangeText={setTenantSlug}
                placeholder="your-workspace"
                leftIcon="business-outline"
                autoCapitalize="none"
              />
            )}

            <Button
              label="Sign in"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Secured with end-to-end encryption
          </Text>
          <View style={styles.footerBadge}>
            <Ionicons name="shield-checkmark" size={13} color={colors.success} />
            <Text style={styles.footerBadgeText}>PCI-DSS compliant</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  headingBlock: { marginBottom: spacing['2xl'], gap: spacing.xs },
  heading: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  inputSpacing: { marginTop: 0 },

  tenantToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  tenantToggleLabel: { fontSize: fontSize.sm, color: colors.textMuted },

  loginBtn: { marginTop: spacing.xs },

  footer: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textDisabled,
    marginBottom: spacing.xs,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  footerBadgeText: { fontSize: fontSize.xs, color: colors.success },
})
