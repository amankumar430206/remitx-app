import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { type NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuthStore } from '@/stores/authStore'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { type SettingsStackParamList } from '@/navigation/SettingsStack'
import Constants from 'expo-constants'

type Nav = NativeStackNavigationProp<SettingsStackParamList>

const KYC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }> = {
  approved: { label: 'Verified', color: colors.success, icon: 'checkmark-circle' },
  submitted: { label: 'Under Review', color: colors.warning, icon: 'time' },
  rejected:  { label: 'Rejected', color: colors.danger, icon: 'close-circle' },
  pending:   { label: 'Not Started', color: colors.textMuted, icon: 'ellipse-outline' },
}

export function Profile() {
  const nav = useNavigation<Nav>()
  const { user, clearAuth } = useAuthStore()
  const [notifEnabled, setNotifEnabled] = useState(true)

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'User'
  const initials = (user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? user?.email?.[0] ?? '')
  const roleLabel = user?.role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? ''
  const kycStatus = user?.kyc_status ?? 'pending'
  const kyc = KYC_STATUS_CONFIG[kycStatus] ?? KYC_STATUS_CONFIG.pending
  const appVersion = Constants.expoConfig?.version ?? '1.0.0'

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
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
        {/* Avatar + Identity */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {/* KYC */}
        <Text style={styles.sectionLabel}>Compliance</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={() => nav.navigate('KycStatus')}>
            <View style={[styles.rowIcon, { backgroundColor: kyc.color + '22' }]}>
              <Ionicons name={kyc.icon} size={20} color={kyc.color} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>KYC Verification</Text>
              <Text style={[styles.rowSub, { color: kyc.color }]}>{kyc.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Payments */}
        <Text style={styles.sectionLabel}>Payments</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={() => nav.navigate('BeneficiaryList')}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryFaded }]}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Beneficiaries</Text>
              <Text style={styles.rowSub}>Manage saved recipients</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.group}>
          <View style={[styles.row, styles.rowLast]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.infoFaded }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.info} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Push notifications</Text>
              <Text style={styles.rowSub}>Payment alerts and updates</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.group}>
          <View style={[styles.row, styles.rowLast]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>App version</Text>
            </View>
            <Text style={styles.rowValue}>v{appVersion}</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: screenPadding, paddingVertical: spacing.base },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  scroll: { paddingBottom: spacing['3xl'] },

  identity: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.base,
    marginHorizontal: screenPadding, marginBottom: spacing.xl,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.base,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primaryFaded, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary + '55',
  },
  avatarText: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
  identityInfo: { flex: 1, gap: 3 },
  name: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  email: { fontSize: fontSize.sm, color: colors.textMuted },
  rolePill: {
    alignSelf: 'flex-start', backgroundColor: colors.primaryFaded,
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: 2,
  },
  roleText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primaryLight },

  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: screenPadding, marginBottom: spacing.xs, marginTop: spacing.lg,
  },
  group: {
    marginHorizontal: screenPadding, backgroundColor: colors.card,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  rowSub: { fontSize: fontSize.xs, color: colors.textMuted },
  rowValue: { fontSize: fontSize.sm, color: colors.textMuted },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginHorizontal: screenPadding, marginTop: spacing.xl,
    backgroundColor: colors.dangerFaded, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.danger + '44', padding: spacing.base,
  },
  logoutText: { fontSize: fontSize.base, fontWeight: '700', color: colors.danger },
})
