import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Modal, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import accountsApi, { type Account } from '@/api/accounts'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, currencyColor } from '@/utils/format'
import { EmptyState } from '@/components/ui/EmptyState'
import { AccountDetail } from './AccountDetail'

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

function AccountCard({ account, onPress }: { account: Account; onPress: () => void }) {
  const scale = new Animated.Value(1)
  const cc = currencyColor(account.currency)
  const grad = cardGradient(account.currency)
  const balance = parseFloat(account.balance ?? '0')
  const whole = Math.floor(balance).toLocaleString('en-US')
  const cents = (balance % 1).toFixed(2).slice(1)

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()

  return (
    <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={grad} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={[styles.circle1, { backgroundColor: cc + '10' }]} />
          <View style={[styles.circle2, { backgroundColor: cc + '07' }]} />

          <View style={styles.cardHeader}>
            <View style={[styles.ccyBadge, { backgroundColor: cc + '25', borderColor: cc + '40' }]}>
              <Text style={[styles.ccyText, { color: cc }]}>{account.currency}</Text>
            </View>
            <View style={styles.statusChip}>
              <View style={[styles.statusDot, { backgroundColor: account.status === 'active' ? '#10B981' : colors.textDisabled }]} />
              <Text style={styles.statusText}>{account.status === 'active' ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>

          <Text style={styles.balanceLabel}>Available balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceWhole}>{whole}</Text>
            <Text style={styles.balanceCents}>{cents}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View>
              {account.account_number ? (
                <Text style={styles.cardNum}>···· {account.account_number.slice(-4)}</Text>
              ) : (
                <Text style={styles.cardNum}>{account.provider_name ?? 'Account'}</Text>
              )}
              <Text style={styles.cardSub}>Tap to view ledger</Text>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={16} color={colors.white + '60'} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  )
}

export function AccountList() {
  const [selected, setSelected] = useState<Account | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list().then((r) => r.data.data),
  })

  const totalAccounts = (data ?? []).length
  const activeAccounts = (data ?? []).filter((a) => a.status === 'active').length
  const totalUsd = (data ?? []).reduce((s, a) => s + parseFloat(a.balance ?? '0'), 0)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Accounts</Text>
          {totalAccounts > 0 && (
            <Text style={styles.subtitle}>{activeAccounts} of {totalAccounts} active</Text>
          )}
        </View>
        {totalAccounts > 0 && (
          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>Total balance</Text>
            <Text style={styles.totalValue}>${Math.floor(totalUsd).toLocaleString()}</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {(data ?? []).length === 0 && !isLoading ? (
          <EmptyState icon="wallet-outline" title="No accounts" subtitle="No accounts found for your profile" />
        ) : (
          (data ?? []).map((acc) => (
            <AccountCard key={acc.id} account={acc} onPress={() => setSelected(acc)} />
          ))
        )}
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && <AccountDetail account={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: screenPadding, paddingTop: spacing.base, paddingBottom: spacing.lg,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  totalWrap: { alignItems: 'flex-end' },
  totalLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  totalValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary },

  scroll: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'], gap: spacing.md },

  card: {
    borderRadius: radius.xl + 2,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff08',
  },
  circle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -60, right: -50 },
  circle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, bottom: -25, left: -20 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  ccyBadge: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  ccyText: { fontSize: fontSize.sm, fontWeight: '900', letterSpacing: 1 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: fontSize.xs, color: colors.white + '60', fontWeight: '500' },

  balanceLabel: { fontSize: fontSize.xs, color: colors.white + '50', letterSpacing: 0.5, marginBottom: 6 },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.xl },
  balanceWhole: { fontSize: 34, fontWeight: '800', color: colors.white, letterSpacing: -1.2 },
  balanceCents: { fontSize: fontSize.lg, fontWeight: '400', color: colors.white + '65', marginBottom: 4, marginLeft: 2 },

  cardFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  cardNum: { fontSize: fontSize.xs, color: colors.white + '45', letterSpacing: 2, fontWeight: '500', marginBottom: 2 },
  cardSub: { fontSize: 10, color: colors.white + '30' },
  chevronWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white + '10', alignItems: 'center', justifyContent: 'center' },
})
