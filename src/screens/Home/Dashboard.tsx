import React, { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, Animated,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { type BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import accountsApi from '@/api/accounts'
import paymentsApi from '@/api/payments'
import notificationsApi from '@/api/notifications'
import fxApi from '@/api/fx'
import { useAuthStore } from '@/stores/authStore'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatTimeAgo, statusColor, currencyColor } from '@/utils/format'
import { StatusBadge } from '@/components/ui/Badge'
import { type AppTabsParamList } from '@/navigation/AppTabs'
import { Notifications } from '@/screens/Notifications'

type Nav = BottomTabNavigationProp<AppTabsParamList>

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = SCREEN_W - screenPadding * 2

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Gradient palettes per currency
const CARD_GRADIENTS: Record<string, readonly [string, string, string]> = {
  USD: ['#1a3a2a', '#0d4f35', '#0a2e1f'],
  EUR: ['#0f2a4a', '#0a3660', '#071d3d'],
  GBP: ['#2a1a4a', '#3a0f6a', '#1d0a3d'],
  INR: ['#3a2a0a', '#4a3510', '#2e1f07'],
  AED: ['#0a3a3a', '#0d5050', '#072e2e'],
  DEFAULT: ['#1a1040', '#251565', '#0f0a2e'],
}

function cardGradient(currency: string): readonly [string, string, string] {
  return CARD_GRADIENTS[currency.toUpperCase()] ?? CARD_GRADIENTS.DEFAULT
}

const QUICK_ACTIONS = [
  { icon: 'paper-plane' as const,    label: 'Send',     tab: 'Payments' as const,  colors: ['#6366F1', '#818CF8'] as [string, string] },
  { icon: 'checkmark-circle' as const, label: 'Approve', tab: 'Approve' as const,  colors: ['#10B981', '#34D399'] as [string, string] },
  { icon: 'wallet' as const,          label: 'Accounts', tab: 'Accounts' as const, colors: ['#F59E0B', '#FCD34D'] as [string, string] },
  { icon: 'settings' as const,        label: 'Settings', tab: 'Settings' as const, colors: ['#3B82F6', '#60A5FA'] as [string, string] },
]

function PressableIcon({ item, onPress }: { item: typeof QUICK_ACTIONS[0]; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 50 }).start()
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.quickBtn}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={item.colors} style={styles.quickIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name={item.icon} size={24} color={colors.white} />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.quickLabel}>{item.label}</Text>
    </TouchableOpacity>
  )
}

function AccountCard({ acc, onPress }: { acc: any; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current
  const grad = cardGradient(acc.currency)
  const cc = currencyColor(acc.currency)

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()

  const balance = parseFloat(acc.balance ?? '0')
  const whole = Math.floor(balance).toLocaleString('en-US')
  const cents = (balance % 1).toFixed(2).slice(1)

  return (
    <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={grad} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Decorative circles */}
          <View style={[styles.cardCircle, styles.cardCircle1, { backgroundColor: cc + '10' }]} />
          <View style={[styles.cardCircle, styles.cardCircle2, { backgroundColor: cc + '08' }]} />

          <View style={styles.cardTopRow}>
            <View style={[styles.ccyBadge, { backgroundColor: cc + '25', borderColor: cc + '40' }]}>
              <Text style={[styles.ccyText, { color: cc }]}>{acc.currency}</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: acc.status === 'active' ? '#10B981' : colors.textDisabled }]} />
              <Text style={styles.statusText}>{acc.status === 'active' ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>

          <View style={styles.cardBalanceWrap}>
            <Text style={styles.cardBalanceLabel}>Available balance</Text>
            <View style={styles.cardBalanceRow}>
              <Text style={styles.cardBalanceWhole}>{whole}</Text>
              <Text style={styles.cardBalanceCents}>{cents}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            {acc.account_number ? (
              <Text style={styles.cardNum}>···· {acc.account_number.slice(-4)}</Text>
            ) : (
              <Text style={styles.cardNum}>{acc.provider_name ?? ''}</Text>
            )}
            <View style={styles.cardChevron}>
              <Ionicons name="chevron-forward" size={14} color={colors.white + '60'} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  )
}

function FxTicker({ rates }: { rates: any[] }) {
  if (!rates?.length) return null
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fxContent} style={styles.fxScroll}>
      {rates.slice(0, 6).map((r) => (
        <View key={`${r.from}-${r.to}`} style={styles.fxPill}>
          <Text style={styles.fxPair}>{r.from}/{r.to}</Text>
          <Text style={styles.fxRate}>{parseFloat(r.clientRate).toFixed(4)}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

export function Dashboard() {
  const nav = useNavigation<Nav>()
  const user = useAuthStore((s) => s.user)
  const [showNotifs, setShowNotifs] = useState(false)

  const { data: accounts, isLoading: loadingAccounts, refetch: refetchAccounts } =
    useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.list().then((r) => r.data.data) })

  const { data: recentPayments, isLoading: loadingPayments, refetch: refetchPayments } =
    useQuery({ queryKey: ['payments', 'recent'], queryFn: () => paymentsApi.list({ limit: 5 }).then((r) => r.data.data) })

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 50 }).then((r) => r.data.data),
  })

  const { data: fxRates } = useQuery({
    queryKey: ['fx-rates'],
    queryFn: () => fxApi.getRates().then((r) => r.data.data),
    staleTime: 60_000,
  })

  const isLoading = loadingAccounts || loadingPayments
  const unreadCount = (notifData ?? []).filter((n) => !n.read_at).length
  const firstName = user?.first_name ?? user?.email?.split('@')[0] ?? 'there'
  const initials = ((user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')).toUpperCase() || firstName[0]?.toUpperCase() || 'U'
  const roleLabel = user?.role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? ''

  // Aggregate total USD balance across accounts (rough estimate for hero display)
  const totalUsd = (accounts ?? []).reduce((sum, a) => sum + parseFloat(a.balance ?? '0'), 0)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refetchAccounts(); refetchPayments() }} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <LinearGradient colors={['#6366F1', '#818CF8']} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.headerMid}>
            <Text style={styles.greetSub}>{getGreeting()},</Text>
            <View style={styles.nameRow}>
              <Text style={styles.greetName} numberOfLines={1}>{firstName}</Text>
              {!!roleLabel && (
                <View style={styles.rolePill}>
                  <Text style={styles.roleText}>{roleLabel}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.bellWrap} onPress={() => setShowNotifs(true)} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={21} color={colors.textSecondary} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Total balance hero ── */}
        {!loadingAccounts && (accounts ?? []).length > 0 && (
          <View style={styles.heroWrap}>
            <LinearGradient colors={['#1a1040', '#0f1a3a', '#0a0e1a']} style={styles.heroGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.heroCircle1} />
              <View style={styles.heroCircle2} />
              <Text style={styles.heroLabel}>Total portfolio</Text>
              <View style={styles.heroBalanceRow}>
                <Text style={styles.heroCurrency}>$</Text>
                <Text style={styles.heroAmount}>{Math.floor(totalUsd).toLocaleString('en-US')}</Text>
                <Text style={styles.heroAmountCents}>.{(totalUsd % 1).toFixed(2).slice(1)}</Text>
              </View>
              <View style={styles.heroFooter}>
                <View style={styles.heroStat}>
                  <View style={[styles.heroDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.heroStatText}>{(accounts ?? []).filter((a) => a.status === 'active').length} active accounts</Text>
                </View>
                <View style={styles.heroStat}>
                  <Ionicons name="trending-up" size={13} color='#10B981' />
                  <Text style={[styles.heroStatText, { color: '#10B981' }]}>All systems normal</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ── Account cards ── */}
        {loadingAccounts
          ? <ActivityIndicator color={colors.primary} style={styles.loader} />
          : (accounts ?? []).length > 0 && (
            <>
              <Text style={styles.sectionTitle2}>Your accounts</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsContent} style={styles.cardsScroll}>
                {(accounts ?? []).map((acc) => (
                  <AccountCard key={acc.id} acc={acc} onPress={() => nav.navigate('Accounts')} />
                ))}
              </ScrollView>
            </>
          )
        }

        {/* ── FX rates ticker ── */}
        {(fxRates ?? []).length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Live rates</Text>
              <View style={styles.liveDot}>
                <View style={styles.liveDotInner} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <FxTicker rates={fxRates ?? []} />
          </>
        )}

        {/* ── Quick actions ── */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: screenPadding, marginBottom: spacing.md }]}>Quick actions</Text>
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((a) => (
            <PressableIcon key={a.label} item={a} onPress={() => nav.navigate(a.tab)} />
          ))}
        </View>

        {/* ── Recent payments ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent payments</Text>
          <TouchableOpacity onPress={() => nav.navigate('Payments')} style={styles.seeAllBtn}>
            <Text style={styles.seeAll}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loadingPayments
          ? <ActivityIndicator color={colors.primary} style={styles.loader} />
          : (recentPayments ?? []).length === 0
            ? (
              <View style={styles.emptyBox}>
                <LinearGradient colors={['#6366F115', '#6366F108']} style={styles.emptyIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="swap-horizontal-outline" size={28} color={colors.primary + '80'} />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No payments yet</Text>
                <Text style={styles.emptyText}>Your transactions will appear here</Text>
              </View>
            )
            : (
              <View style={styles.paymentGroup}>
                {(recentPayments ?? []).map((p, i) => {
                  const sc = statusColor(p.status)
                  const isLast = i === (recentPayments?.length ?? 0) - 1
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.paymentRow, !isLast && styles.paymentRowBorder]}
                      activeOpacity={0.65}
                    >
                      <View style={[styles.paymentIcon, { backgroundColor: sc + '15' }]}>
                        <Ionicons name="swap-horizontal" size={18} color={sc} />
                      </View>
                      <View style={styles.paymentMeta}>
                        <Text style={styles.paymentBene} numberOfLines={1}>{p.beneficiary_name ?? 'Beneficiary'}</Text>
                        <Text style={styles.paymentRoute}>{p.source_currency} → {p.dest_currency}</Text>
                        <Text style={styles.paymentTime}>{formatTimeAgo(p.created_at)}</Text>
                      </View>
                      <View style={styles.paymentRight}>
                        <Text style={styles.paymentAmt}>{formatMoney(p.source_amount, p.source_currency)}</Text>
                        <StatusBadge status={p.status} size="sm" />
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )
        }

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal visible={showNotifs} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowNotifs(false)}>
        <Notifications onClose={() => setShowNotifs(false)} />
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing['3xl'] },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.md, paddingBottom: spacing.lg,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: fontSize.base, fontWeight: '800', color: colors.white },
  headerMid: { flex: 1 },
  greetSub: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'nowrap' },
  greetName: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, flexShrink: 1 },
  rolePill: {
    backgroundColor: colors.primaryFaded,
    borderRadius: radius.full,
    paddingHorizontal: 9, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.primary + '30',
    flexShrink: 0,
  },
  roleText: { fontSize: 9, fontWeight: '800', color: colors.primaryLight, letterSpacing: 0.8, textTransform: 'uppercase' },
  bellWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
    flexShrink: 0,
  },
  bellBadge: {
    position: 'absolute', top: 8, right: 8,
    minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: colors.bg,
  },
  bellBadgeText: { fontSize: 8, fontWeight: '900', color: colors.white },

  loader: { marginVertical: spacing.xl },

  // ── Hero ──
  heroWrap: { paddingHorizontal: screenPadding, marginBottom: spacing.xl },
  heroGrad: {
    borderRadius: radius.xl + 4,
    padding: spacing.xl,
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#ffffff0a',
  },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#6366F112', top: -60, right: -60,
  },
  heroCircle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#818CF808', bottom: -30, left: 20,
  },
  heroLabel: { fontSize: fontSize.xs, color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600', marginBottom: spacing.sm },
  heroBalanceRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  heroCurrency: { fontSize: fontSize['2xl'], fontWeight: '300', color: colors.textSecondary, marginTop: 8, marginRight: 2 },
  heroAmount: { fontSize: 52, fontWeight: '800', color: colors.textPrimary, letterSpacing: -2, lineHeight: 58 },
  heroAmountCents: { fontSize: fontSize.xl, fontWeight: '400', color: colors.textMuted, marginTop: 14, marginLeft: 2 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroDot: { width: 6, height: 6, borderRadius: 3 },
  heroStatText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '500' },

  // ── Account cards ──
  sectionTitle2: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: screenPadding, marginBottom: spacing.sm },
  cardsScroll: { marginBottom: spacing.xl },
  cardsContent: { paddingHorizontal: screenPadding, gap: spacing.md },
  card: {
    width: CARD_W * 0.78,
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  cardCircle: { position: 'absolute', borderRadius: 9999 },
  cardCircle1: { width: 160, height: 160, top: -50, right: -40 },
  cardCircle2: { width: 90, height: 90, bottom: -20, left: -20 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  ccyBadge: {
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1,
  },
  ccyText: { fontSize: fontSize.xs, fontWeight: '900', letterSpacing: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: fontSize.xs, color: colors.white + '60', fontWeight: '500' },
  cardBalanceWrap: { marginBottom: spacing.lg },
  cardBalanceLabel: { fontSize: fontSize.xs, color: colors.white + '50', letterSpacing: 0.5, marginBottom: 6 },
  cardBalanceRow: { flexDirection: 'row', alignItems: 'flex-end' },
  cardBalanceWhole: { fontSize: 30, fontWeight: '800', color: colors.white, letterSpacing: -1 },
  cardBalanceCents: { fontSize: fontSize.md, fontWeight: '400', color: colors.white + '70', marginBottom: 4, marginLeft: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardNum: { fontSize: fontSize.xs, color: colors.white + '45', letterSpacing: 2, fontWeight: '500' },
  cardChevron: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.white + '10',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── FX rates ──
  fxScroll: { marginBottom: spacing.xl },
  fxContent: { paddingHorizontal: screenPadding, gap: spacing.sm },
  fxPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  fxPair: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600', letterSpacing: 0.3 },
  fxRate: { fontSize: fontSize.xs, color: colors.textPrimary, fontWeight: '800' },

  // ── Quick actions ──
  quickRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: screenPadding, marginBottom: spacing.xl,
  },
  quickBtn: { alignItems: 'center', gap: spacing.sm, flex: 1 },
  quickIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },

  // ── Section headers ──
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: screenPadding, marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  liveDot: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText: { fontSize: 10, color: '#10B981', fontWeight: '800', letterSpacing: 1 },

  // ── Empty state ──
  emptyBox: {
    marginHorizontal: screenPadding,
    paddingVertical: spacing['2xl'] + spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', gap: spacing.sm,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
  emptyTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted },

  // ── Payments ──
  paymentGroup: {
    marginHorizontal: screenPadding,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  paymentRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  paymentRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  paymentIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  paymentMeta: { flex: 1, gap: 2 },
  paymentBene: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  paymentRoute: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '500' },
  paymentTime: { fontSize: fontSize.xs, color: colors.textMuted },
  paymentRight: { alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  paymentAmt: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },

  bottomSpacer: { height: spacing.xl },
})
