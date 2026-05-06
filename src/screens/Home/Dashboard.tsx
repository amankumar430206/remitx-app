import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { type BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import accountsApi from '@/api/accounts'
import paymentsApi from '@/api/payments'
import { useAuthStore } from '@/stores/authStore'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatTimeAgo, statusColor, currencyColor } from '@/utils/format'
import { StatusBadge } from '@/components/ui/Badge'
import { type AppTabsParamList } from '@/navigation/AppTabs'
import { Notifications } from '@/screens/Notifications'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useQuery } from '@tanstack/react-query'
import notificationsApi from '@/api/notifications'

type Nav = BottomTabNavigationProp<AppTabsParamList>

export function Dashboard() {
  const nav = useNavigation<Nav>()
  const user = useAuthStore((s) => s.user)

  const { data: accountsData, isLoading: loadingAccounts, refetch: refetchAccounts } =
    useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.list().then((r) => r.data.data) })

  const { data: recentPayments, isLoading: loadingPayments, refetch: refetchPayments } =
    useQuery({ queryKey: ['payments', 'recent'], queryFn: () => paymentsApi.list({ limit: 5 }).then((r) => r.data.data) })

  const isLoading = loadingAccounts || loadingPayments
  const onRefresh = () => { refetchAccounts(); refetchPayments() }

  const totalBalanceByCurrency = (accountsData ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] ?? 0) + parseFloat(a.balance)
    return acc
  }, {})

  const { isOnline } = useNetworkStatus()
  const [showNotifs, setShowNotifs] = useState(false)

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 50 }).then((r) => r.data.data),
  })
  const unreadCount = (notifData ?? []).filter((n) => !n.read_at).length

  const firstName = user?.first_name ?? user?.email?.split('@')[0] ?? 'there'
  const roleLabel = user?.role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? ''

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color={colors.white} />
          <Text style={styles.offlineText}>No internet connection</Text>
        </View>
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View style={{ gap: 4 }}>
            <Text style={styles.greetSub}>Good day,</Text>
            <Text style={styles.greetName}>{firstName} <Text style={styles.wave}>👋</Text></Text>
            {!!roleLabel && (
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => setShowNotifs(true)}>
            <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.avatarBtn}>
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
          </View>
        </View>

        <Modal visible={showNotifs} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowNotifs(false)}>
          <Notifications onClose={() => setShowNotifs(false)} />
        </Modal>

        {/* Balance cards */}
        <Text style={styles.sectionLabel}>Your accounts</Text>
        {loadingAccounts ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (accountsData ?? []).length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No accounts found</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsRow} contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.xl }}>
            {(accountsData ?? []).map((acc) => {
              const cColor = currencyColor(acc.currency)
              return (
                <TouchableOpacity
                  key={acc.id}
                  style={styles.balanceCard}
                  onPress={() => nav.navigate('Accounts')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.cardAccent, { backgroundColor: cColor }]} />
                  <View style={styles.cardTop}>
                    <View style={[styles.currencyPill, { backgroundColor: cColor + '22' }]}>
                      <Text style={[styles.currencyPillText, { color: cColor }]}>{acc.currency}</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: acc.status === 'active' ? colors.success : colors.textDisabled }]} />
                  </View>
                  <Text style={styles.balanceAmount}>{formatMoney(acc.balance, acc.currency)}</Text>
                  <Text style={styles.balanceLabel}>Available balance</Text>
                  {acc.account_number && (
                    <Text style={styles.accountNum}>···· {acc.account_number.slice(-4)}</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}

        {/* Quick actions */}
        <Text style={styles.sectionLabel}>Quick actions</Text>
        <View style={styles.quickRow}>
          {[
            { icon: 'send', label: 'Send', tab: 'Payments' as const, color: colors.primary },
            { icon: 'checkmark-circle', label: 'Approve', tab: 'Approve' as const, color: colors.success },
            { icon: 'wallet', label: 'Accounts', tab: 'Accounts' as const, color: colors.warning },
            { icon: 'settings', label: 'Settings', tab: 'Settings' as const, color: colors.textMuted },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={styles.quickBtn} onPress={() => nav.navigate(a.tab)} activeOpacity={0.8}>
              <View style={[styles.quickIcon, { backgroundColor: a.color + '22' }]}>
                <Ionicons name={a.icon as keyof typeof Ionicons.glyphMap} size={22} color={a.color} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent payments */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Recent payments</Text>
          <TouchableOpacity onPress={() => nav.navigate('Payments')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {loadingPayments ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (recentPayments ?? []).length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No payments yet</Text>
          </View>
        ) : (
          <View style={styles.paymentList}>
            {(recentPayments ?? []).map((p) => (
              <TouchableOpacity key={p.id} style={styles.paymentRow} activeOpacity={0.75}>
                <View style={[styles.paymentIcon, { backgroundColor: statusColor(p.status) + '22' }]}>
                  <Ionicons name="swap-horizontal" size={18} color={statusColor(p.status)} />
                </View>
                <View style={styles.paymentMeta}>
                  <Text style={styles.paymentBene} numberOfLines={1}>
                    {p.beneficiary_name ?? 'Beneficiary'}
                  </Text>
                  <Text style={styles.paymentTime}>
                    {p.source_currency} → {p.dest_currency} · {formatTimeAgo(p.created_at)}
                  </Text>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>
                    {formatMoney(p.source_amount, p.source_currency)}
                  </Text>
                  <StatusBadge status={p.status} size="sm" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing['3xl'] },

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.danger,
    paddingVertical: spacing.xs + 2,
  },
  offlineText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.white },

  greeting: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: screenPadding, paddingTop: spacing.base, paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  greetSub: { fontSize: fontSize.sm, color: colors.textMuted },
  greetName: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  wave: { fontSize: fontSize.xl },
  rolePill: {
    alignSelf: 'flex-start', backgroundColor: colors.primaryFaded,
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  roleText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primaryLight, letterSpacing: 0.4 },
  bellBtn: { padding: spacing.xs, position: 'relative' },
  bellBadge: {
    position: 'absolute', top: 2, right: 2,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: colors.white },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryFaded, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.primary + '55',
  },
  avatarText: { fontSize: fontSize.base, fontWeight: '800', color: colors.primary },

  sectionLabel: {
    fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
    paddingHorizontal: screenPadding, marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: spacing.xl },
  seeAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },

  loader: { marginVertical: spacing.xl },
  emptyCard: {
    marginHorizontal: screenPadding, padding: spacing.xl,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm },

  cardsRow: { paddingLeft: spacing.xl, marginBottom: spacing.xs },
  balanceCard: {
    width: 220, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.borderLight, padding: spacing.base, gap: spacing.xs,
    overflow: 'hidden',
  },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  currencyPill: {
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  currencyPillText: { fontSize: fontSize.xs, fontWeight: '800' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  balanceAmount: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm, letterSpacing: -0.5 },
  balanceLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  accountNum: { fontSize: fontSize.xs, color: colors.textDisabled, marginTop: 2 },

  quickRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: spacing.base, marginBottom: spacing.xs,
  },
  quickBtn: { alignItems: 'center', gap: spacing.xs },
  quickIcon: { width: 52, height: 52, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '500' },

  paymentList: { marginHorizontal: screenPadding, gap: spacing.xs },
  paymentRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  paymentIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  paymentMeta: { flex: 1, gap: 2 },
  paymentBene: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  paymentTime: { fontSize: fontSize.xs, color: colors.textMuted },
  paymentRight: { alignItems: 'flex-end', gap: 4 },
  paymentAmount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
})
