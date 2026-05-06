import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import paymentsApi, { type Payment } from '@/api/payments'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatTimeAgo, statusColor } from '@/utils/format'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaymentDetail } from './PaymentDetail'
import { NewPayment } from './NewPayment'

export function PaymentHistory() {
  const [selected, setSelected] = useState<Payment | null>(null)
  const [showNew, setShowNew] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.list({ limit: 50 }).then((r) => r.data.data),
  })

  const renderItem = ({ item }: { item: Payment }) => (
    <TouchableOpacity style={styles.row} onPress={() => setSelected(item)} activeOpacity={0.75}>
      <View style={[styles.icon, { backgroundColor: statusColor(item.status) + '22' }]}>
        <Ionicons name="swap-horizontal" size={20} color={statusColor(item.status)} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.bene} numberOfLines={1}>{item.beneficiary_name ?? 'Beneficiary'}</Text>
        <Text style={styles.time}>
          {item.source_currency} → {item.dest_currency} · {formatTimeAgo(item.created_at)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatMoney(item.source_amount, item.source_currency)}</Text>
        <Text style={styles.destAmount}>{formatMoney(item.dest_amount, item.dest_currency)}</Text>
        <StatusBadge status={item.status} size="sm" />
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowNew(true)}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState icon="swap-horizontal-outline" title="No payments yet" subtitle="Tap New to send your first payment" />
          ) : null
        }
      />

      {/* Payment detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && <PaymentDetail payment={selected} onClose={() => setSelected(null)} />}
      </Modal>

      {/* New payment modal */}
      <Modal visible={showNew} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowNew(false)}>
        <NewPayment onClose={() => setShowNew(false)} />
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: screenPadding, paddingVertical: spacing.base,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md,
  },
  newBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.white },

  list: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },
  sep: { height: spacing.xs },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1, gap: 2 },
  bene: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  time: { fontSize: fontSize.xs, color: colors.textMuted },
  right: { alignItems: 'flex-end', gap: 3 },
  amount: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  destAmount: { fontSize: fontSize.xs, color: colors.textMuted },
})
