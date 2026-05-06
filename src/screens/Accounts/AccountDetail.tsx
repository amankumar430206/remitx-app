import React from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import accountsApi, { type Account, type LedgerEntry } from '@/api/accounts'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatDateTime } from '@/utils/format'
import { EmptyState } from '@/components/ui/EmptyState'

interface Props { account: Account; onClose: () => void }

export function AccountDetail({ account, onClose }: Props) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ledger', account.id],
    queryFn: () => accountsApi.ledger(account.id, { limit: 50 }).then((r) => r.data.data),
  })

  const renderEntry = ({ item }: { item: LedgerEntry }) => {
    const isCredit = item.entry_type === 'credit'
    return (
      <View style={styles.entry}>
        <View style={[styles.entryIcon, isCredit ? styles.creditIcon : styles.debitIcon]}>
          <Ionicons
            name={isCredit ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={isCredit ? colors.success : colors.danger}
          />
        </View>
        <View style={styles.entryMeta}>
          <Text style={styles.entryDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.entryDate}>{formatDateTime(item.created_at)}</Text>
        </View>
        <View style={styles.entryRight}>
          <Text style={[styles.entryAmount, isCredit ? styles.credit : styles.debit]}>
            {isCredit ? '+' : '-'}{formatMoney(item.amount, item.currency)}
          </Text>
          <Text style={styles.entryBalance}>{formatMoney(item.balance_after, item.currency)}</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.handleWrap}><View style={styles.handle} /></View>

      <View style={styles.header}>
        <Text style={styles.title}>{account.currency} Account</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Balance hero */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Available balance</Text>
        <Text style={styles.heroBalance}>{formatMoney(account.balance, account.currency)}</Text>
        {account.account_number && (
          <View style={styles.acctNumRow}>
            <Ionicons name="card-outline" size={14} color={colors.textMuted} />
            <Text style={styles.acctNum}>···· {account.account_number.slice(-4)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionLabel}>Transaction history</Text>

      <FlatList
        data={data ?? []}
        keyExtractor={(i) => i.id}
        renderItem={renderEntry}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          !isLoading ? <EmptyState icon="receipt-outline" title="No transactions" subtitle="No ledger entries for this account" /> : null
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: spacing.sm },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: screenPadding, paddingVertical: spacing.base,
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },

  hero: {
    alignItems: 'center', paddingVertical: spacing.xl,
    marginHorizontal: screenPadding, marginBottom: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, gap: spacing.xs,
  },
  heroLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  heroBalance: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.textPrimary },
  acctNumRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  acctNum: { fontSize: fontSize.sm, color: colors.textMuted },

  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: screenPadding, marginBottom: spacing.sm,
  },

  list: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: 60 },

  entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  entryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  creditIcon: { backgroundColor: colors.successFaded },
  debitIcon: { backgroundColor: colors.dangerFaded },
  entryMeta: { flex: 1 },
  entryDesc: { fontSize: fontSize.sm, fontWeight: '500', color: colors.textPrimary },
  entryDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  entryRight: { alignItems: 'flex-end', gap: 2 },
  entryAmount: { fontSize: fontSize.sm, fontWeight: '700' },
  credit: { color: colors.success },
  debit: { color: colors.danger },
  entryBalance: { fontSize: fontSize.xs, color: colors.textMuted },
})
