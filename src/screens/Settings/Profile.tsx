import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { type NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuthStore } from '@/stores/authStore'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { type SettingsStackParamList } from '@/navigation/SettingsStack'
import Constants from 'expo-constants'
import { useAlert } from '@/hooks/useAlert'

type Nav = NativeStackNavigationProp<SettingsStackParamList>

const KYC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }> = {
  approved: { label: 'Verified', color: colors.success, icon: 'checkmark-circle' },
  submitted: { label: 'Under Review', color: colors.warning, icon: 'time' },
  rejected:  { label: 'Rejected', color: colors.danger, icon: 'close-circle' },
  pending:   { label: 'Not Started', color: colors.textMuted, icon: 'ellipse-outline' },
}

function SettingsRow({
  icon, iconBg, label, subtitle, onPress, right, isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap
  iconBg: string
  iconColor?: string
  label: string
  subtitle?: string
  onPress?: () => void
  right?: React.ReactNode
  isLast?: boolean
}) {
  const content = (
    <View style={[rows.row, isLast && rows.rowLast]}>
      <View style={[rows.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={19} color={colors.white + 'cc'} />
      </View>
      <View style={rows.body}>
        <Text style={rows.label}>{label}</Text>
        {!!subtitle && <Text style={rows.sub}>{subtitle}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={15} color={colors.textDisabled} />)}
    </View>
  )

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>
  }
  return content
}

export function Profile() {
  const { showAlert } = useAlert()
  const nav = useNavigation<Nav>()
  const { user, clearAuth } = useAuthStore()
  const [notifEnabled, setNotifEnabled] = useState(true)

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'User'
  const initials = ((user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? user?.email?.[0] ?? '')).toUpperCase() || 'U'
  const roleLabel = user?.role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? ''
  const kycStatus = user?.kyc_status ?? 'pending'
  const kyc = KYC_STATUS_CONFIG[kycStatus] ?? KYC_STATUS_CONFIG.pending
  const appVersion = Constants.expoConfig?.version ?? '1.0.0'

  const handleLogout = () => {
    showAlert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: clearAuth },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Identity hero */}
        <LinearGradient colors={['#1a1040', '#0f1a3a']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroCircle} />
          <View style={styles.heroRow}>
            <LinearGradient colors={['#6366F1', '#818CF8']} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>{fullName}</Text>
              <Text style={styles.heroEmail} numberOfLines={1}>{user?.email}</Text>
              {!!roleLabel && (
                <View style={styles.rolePill}>
                  <Text style={styles.roleText}>{roleLabel}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.kycBanner}>
            <View style={[styles.kycDot, { backgroundColor: kyc.color }]} />
            <Text style={styles.kycLabel}>KYC Status:</Text>
            <Text style={[styles.kycValue, { color: kyc.color }]}>{kyc.label}</Text>
          </View>
        </LinearGradient>

        {/* Compliance */}
        <Text style={styles.sectionLabel}>Compliance</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="shield-checkmark-outline"
            iconBg={kyc.color + '30'}
            label="KYC Verification"
            subtitle={kyc.label}
            onPress={() => nav.navigate('KycStatus')}
          />
        </View>

        {/* Payments */}
        <Text style={styles.sectionLabel}>Payments</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="people-outline"
            iconBg={colors.primary + '30'}
            label="Beneficiaries"
            subtitle="Manage saved recipients"
            onPress={() => nav.navigate('BeneficiaryList')}
            isLast
          />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="notifications-outline"
            iconBg={colors.info + '30'}
            label="Push notifications"
            subtitle="Payment alerts and updates"
            isLast
            right={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
              />
            }
          />
        </View>

        {/* Security */}
        <Text style={styles.sectionLabel}>Security</Text>
        <View style={styles.group}>
          <SettingsRow icon="finger-print-outline" iconBg={colors.success + '25'} label="Biometric lock" subtitle="Enabled on resume" isLast />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="information-circle-outline"
            iconBg={colors.surface}
            label="App version"
            isLast
            right={<Text style={styles.version}>v{appVersion}</Text>}
          />
        </View>

        {/* Dev tools */}
        {__DEV__ && (
          <>
            <Text style={styles.sectionLabel}>Developer</Text>
            <View style={styles.group}>
              <SettingsRow
                icon="radio-outline"
                iconBg="#7C3AED30"
                label="Network Inspector"
                subtitle="View all API calls and payloads"
                onPress={() => nav.navigate('NetworkInspector')}
                isLast
              />
            </View>
          </>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient colors={['#EF444420', '#EF444408']} style={styles.logoutGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Sign out</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const rows = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  sub: { fontSize: fontSize.xs, color: colors.textMuted },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: screenPadding, paddingTop: spacing.base, paddingBottom: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  scroll: { paddingBottom: spacing['3xl'] },

  // Hero
  hero: {
    marginHorizontal: screenPadding, marginBottom: spacing.lg,
    borderRadius: radius.xl, padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#ffffff0a',
  },
  heroCircle: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: '#6366F110', top: -40, right: -30,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.base },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: fontSize.xl, fontWeight: '800', color: colors.white },
  heroInfo: { flex: 1, gap: 3 },
  heroName: { fontSize: fontSize.base, fontWeight: '800', color: colors.textPrimary },
  heroEmail: { fontSize: fontSize.xs, color: colors.textMuted },
  rolePill: {
    alignSelf: 'flex-start', backgroundColor: colors.primaryFaded,
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  roleText: { fontSize: 9, fontWeight: '800', color: colors.primaryLight, letterSpacing: 0.8, textTransform: 'uppercase' },

  kycBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#ffffff06', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  kycDot: { width: 6, height: 6, borderRadius: 3 },
  kycLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '500' },
  kycValue: { fontSize: fontSize.xs, fontWeight: '700' },

  // Section
  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: screenPadding, marginBottom: spacing.xs, marginTop: spacing.lg,
  },
  group: {
    marginHorizontal: screenPadding, backgroundColor: colors.card,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },

  version: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '500' },

  logoutBtn: {
    marginHorizontal: screenPadding, marginTop: spacing.xl,
    borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.danger + '30',
  },
  logoutGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.base,
  },
  logoutText: { fontSize: fontSize.base, fontWeight: '700', color: colors.danger },
})
