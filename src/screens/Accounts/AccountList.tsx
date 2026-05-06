import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import accountsApi, { type Account } from '@/api/accounts'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius } from '@/theme/spacing'
import { formatMoney } from '@/utils/format'
import { EmptyState } from '@/components/ui/EmptyState'
import { AccountDetail } from './AccountDetail'

export function AccountList() {
  const [selected, setSelected] = useState<Account | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list().then((r) => r.data.data),
  })

  const renderItem = ({ item }: { item: Account }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={styles.currencyCircle}>
          <Text style={styles.currencyText}>{item.currency}</Text>
        </View>
        <View>
          <Text style={styles.currency}>{item.currency} Account</Text>
          {item.account_number && (
            <Text style={styles.accountNum}>···· {item.account_number.slice(-4)}</Text>
          )}
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.balance}>{formatMoney(item.balance, item.currency)}</Text>
        <View style={[styles.statusPill, item.status === 'active' ? styles.pillActive : styles.pillInactive]}>
          <Text style={[styles.statusText, item.status === 'active' ? styles.statusTextActive : styles.statusTextInactive]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Accounts</Text>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          !isLoading ? <EmptyState icon="wallet-outline" title="No accounts" subtitle="No accounts found for your profile" /> : null
        }
      />

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && <AccountDetail account={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.base },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },

  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.base,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  currencyCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primaryFaded, alignItems: 'center', justifyContent: 'center',
  },
  currencyText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.primary },
  currency: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  accountNum: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: spacing.xs },
  balance: { fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary },
  statusPill: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  pillActive: { backgroundColor: colors.successFaded },
  pillInactive: { backgroundColor: colors.surface },
  statusText: { fontSize: fontSize.xs, fontWeight: '600', textTransform: 'capitalize' },
  statusTextActive: { color: colors.success },
  statusTextInactive: { color: colors.textMuted },
})
