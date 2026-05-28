import React, { useState, useMemo } from 'react'
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
import { useColors, type Colors } from '@/hooks/useColors'
import { useThemeStore, type ThemeMode } from '@/stores/themeStore'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { type SettingsStackParamList } from '@/navigation/SettingsStack'
import Constants from 'expo-constants'
import { useAlert } from '@/hooks/useAlert'

type Nav = NativeStackNavigationProp<SettingsStackParamList>

// Semantic colors — theme-independent hex values
const KYC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }> = {
  approved: { label: 'Verified',      color: '#10B981', icon: 'checkmark-circle' },
  submitted: { label: 'Under Review', color: '#F59E0B', icon: 'time' },
  rejected:  { label: 'Rejected',     color: '#EF4444', icon: 'close-circle' },
  pending:   { label: 'Not Started',  color: '#9CA3AF', icon: 'ellipse-outline' },
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'light',  label: 'Light',  icon: 'sunny-outline' },
  { mode: 'dark',   label: 'Dark',   icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
]

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
  const colors = useColors()
  const rows = useMemo(() => createRowStyles(colors), [colors])

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
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
  const themeMode = useThemeStore((st) => st.mode)
  const setThemeMode = useThemeStore((st) => st.setMode)
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Identity hero */}
        <LinearGradient colors={['#1a1040', '#0f1a3a']} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.heroCircle} />
          <View style={s.heroRow}>
            <LinearGradient colors={['#6366F1', '#818CF8']} style={s.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={s.heroInfo}>
              <Text style={s.heroName} numberOfLines={1}>{fullName}</Text>
              <Text style={s.heroEmail} numberOfLines={1}>{user?.email}</Text>
              {!!roleLabel && (
                <View style={s.rolePill}>
                  <Text style={s.roleText}>{roleLabel}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={s.kycBanner}>
            <View style={[s.kycDot, { backgroundColor: kyc.color }]} />
            <Text style={s.kycLabel}>KYC Status:</Text>
            <Text style={[s.kycValue, { color: kyc.color }]}>{kyc.label}</Text>
          </View>
        </LinearGradient>

        {/* Compliance */}
        <Text style={s.sectionLabel}>Compliance</Text>
        <View style={s.group}>
          <SettingsRow
            icon="shield-checkmark-outline"
            iconBg={kyc.color + '30'}
            label="KYC Verification"
            subtitle={kyc.label}
            onPress={() => nav.navigate('KycStatus')}
            isLast
          />
        </View>

        {/* Payments */}
        <Text style={s.sectionLabel}>Payments</Text>
        <View style={s.group}>
          <SettingsRow
            icon="people-outline"
            iconBg={colors.primary + '30'}
            label="Beneficiaries"
            subtitle="Manage saved recipients"
            onPress={() => nav.navigate('BeneficiaryList')}
            isLast
          />
        </View>

        {/* Tools */}
        <Text style={s.sectionLabel}>Tools</Text>
        <View style={s.group}>
          <SettingsRow
            icon="sparkles-outline"
            iconBg="#8B5CF630"
            label="AI Assistant"
            subtitle="Ask questions about payments & FX"
            onPress={() => nav.navigate('AIAssistant')}
            isLast
          />
        </View>

        {/* Preferences */}
        <Text style={s.sectionLabel}>Preferences</Text>
        <View style={s.group}>
          {/* Appearance / theme toggle */}
          <View style={s.themeRow}>
            <View style={[s.themeIconWrap, { backgroundColor: '#6366F130' }]}>
              <Ionicons name="contrast-outline" size={19} color={colors.white + 'cc'} />
            </View>
            <View style={s.themeBody}>
              <Text style={s.themeLabel}>Appearance</Text>
              <View style={s.themeSegment}>
                {THEME_OPTIONS.map(({ mode, label, icon }) => {
                  const isActive = themeMode === mode
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[s.themeSeg, isActive && s.themeSegActive]}
                      onPress={() => setThemeMode(mode)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={icon}
                        size={13}
                        color={isActive ? colors.white : colors.textMuted}
                      />
                      <Text style={[s.themeSegText, isActive && s.themeSegTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </View>

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
        <Text style={s.sectionLabel}>Security</Text>
        <View style={s.group}>
          <SettingsRow icon="finger-print-outline" iconBg={colors.success + '25'} label="Biometric lock" subtitle="Enabled on resume" isLast />
        </View>

        {/* About */}
        <Text style={s.sectionLabel}>About</Text>
        <View style={s.group}>
          <SettingsRow
            icon="information-circle-outline"
            iconBg={colors.surface}
            label="App version"
            isLast
            right={<Text style={s.version}>v{appVersion}</Text>}
          />
        </View>

        {/* Dev tools */}
        {__DEV__ && (
          <>
            <Text style={s.sectionLabel}>Developer</Text>
            <View style={s.group}>
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
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient colors={['#EF444420', '#EF444408']} style={s.logoutGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={s.logoutText}>Sign out</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const createRowStyles = (c: Colors) => StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: c.textPrimary },
  sub: { fontSize: fontSize.xs, color: c.textMuted },
})

const createStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: screenPadding, paddingTop: spacing.base, paddingBottom: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: c.textPrimary },
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
  avatarText: { fontSize: fontSize.xl, fontWeight: '800', color: c.white },
  heroInfo: { flex: 1, gap: 3 },
  heroName: { fontSize: fontSize.base, fontWeight: '800', color: c.textPrimary },
  heroEmail: { fontSize: fontSize.xs, color: c.textMuted },
  rolePill: {
    alignSelf: 'flex-start', backgroundColor: c.primaryFaded,
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderWidth: 1, borderColor: c.primary + '30',
  },
  roleText: { fontSize: 9, fontWeight: '800', color: c.primaryLight, letterSpacing: 0.8, textTransform: 'uppercase' },

  kycBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#ffffff06', borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  kycDot: { width: 6, height: 6, borderRadius: 3 },
  kycLabel: { fontSize: fontSize.xs, color: c.textMuted, fontWeight: '500' },
  kycValue: { fontSize: fontSize.xs, fontWeight: '700' },

  // Section
  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: c.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: screenPadding, marginBottom: spacing.xs, marginTop: spacing.lg,
  },
  group: {
    marginHorizontal: screenPadding, backgroundColor: c.card,
    borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, overflow: 'hidden',
  },

  // Theme toggle row
  themeRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  themeIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  themeBody: { flex: 1, gap: spacing.sm },
  themeLabel: { fontSize: fontSize.sm, fontWeight: '600', color: c.textPrimary },
  themeSegment: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: c.border,
    overflow: 'hidden',
  },
  themeSeg: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: spacing.sm,
  },
  themeSegActive: { backgroundColor: c.primary },
  themeSegText: { fontSize: fontSize.xs, fontWeight: '600', color: c.textMuted },
  themeSegTextActive: { color: c.white },

  version: { fontSize: fontSize.sm, color: c.textMuted, fontWeight: '500' },

  logoutBtn: {
    marginHorizontal: screenPadding, marginTop: spacing.xl,
    borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: c.danger + '30',
  },
  logoutGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.base,
  },
  logoutText: { fontSize: fontSize.base, fontWeight: '700', color: c.danger },
})
