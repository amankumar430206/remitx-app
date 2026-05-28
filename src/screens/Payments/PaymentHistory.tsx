import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Modal, SectionList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import paymentsApi, { type Payment } from '@/api/payments'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatTimeAgo, statusColor } from '@/utils/format'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaymentDetail } from './PaymentDetail'
import { NewPayment } from './NewPayment'

type Section = { title: string; data: Payment[] }

function groupByDate(payments: Payment[]): Section[] {
  const map = new Map<string, Payment[]>()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  for (const p of payments) {
    const d = new Date(p.created_at)
    let key: string
    if (d.toDateString() === today.toDateString()) key = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday'
    else key = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }

  return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
}

function PaymentRow({ item, onPress }: { item: Payment; onPress: () => void }) {
  const sc = statusColor(item.status)

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: sc + '18' }]}>
        <Ionicons name="swap-horizontal" size={19} color={sc} />
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowBene} numberOfLines={1}>{item.beneficiary_name ?? 'Beneficiary'}</Text>
        <View style={styles.rowRouteRow}>
          <Text style={styles.rowRoute}>{item.source_currency}</Text>
          <Ionicons name="arrow-forward" size={10} color={colors.textDisabled} />
          <Text style={styles.rowRoute}>{item.dest_currency}</Text>
          <Text style={styles.rowDot}>·</Text>
          <Text style={styles.rowTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmt}>{formatMoney(item.source_amount, item.source_currency)}</Text>
        <Text style={styles.rowDestAmt}>{formatMoney(item.dest_amount, item.dest_currency)}</Text>
        <StatusBadge status={item.status} size="sm" />
      </View>
    </TouchableOpacity>
  )
}

export function PaymentHistory() {
  const [selected, setSelected] = useState<Payment | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newPaymentKey, setNewPaymentKey] = useState(0)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.list({ limit: 50 }).then((r) => r.data.data),
  })

  const sections = useMemo(() => groupByDate(data ?? []), [data])

  const totalVol = useMemo(() => {
    return (data ?? []).reduce((s, p) => s + parseFloat(p.source_amount ?? '0'), 0)
  }, [data])

  const completedCount = (data ?? []).filter((p) => p.status === 'completed').length

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Payments</Text>
          {data && data.length > 0 && (
            <Text style={styles.subtitle}>{data.length} transaction{data.length !== 1 ? 's' : ''}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => { setNewPaymentKey(k => k + 1); setShowNew(true) }} activeOpacity={0.85}>
          <LinearGradient colors={['#6366F1', '#818CF8']} style={styles.newBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.newBtnText}>New payment</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      {data && data.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>${Math.floor(totalVol).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Volume (USD)</Text>
          </View>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <PaymentRow item={item} onPress={() => setSelected(item)} />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.sectionLine} />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="swap-horizontal-outline"
              title="No payments yet"
              subtitle="Send your first international transfer in minutes"
              actionLabel="New payment"
              onAction={() => { setNewPaymentKey(k => k + 1); setShowNew(true) }}
            />
          ) : null
        }
      />

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && <PaymentDetail payment={selected} onClose={() => setSelected(null)} />}
      </Modal>

      <Modal visible={showNew} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowNew(false)}>
        <NewPayment key={newPaymentKey} onClose={() => setShowNew(false)} />
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: screenPadding, paddingTop: spacing.base, paddingBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  newBtn: { borderRadius: radius.full, overflow: 'hidden' },
  newBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.base,
    borderRadius: radius.full,
  },
  newBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.white },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: screenPadding, marginBottom: spacing.base,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },

  list: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.border },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  rowIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowMeta: { flex: 1, gap: 4 },
  rowBene: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  rowRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowRoute: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '500' },
  rowDot: { color: colors.textDisabled },
  rowTime: { fontSize: fontSize.xs, color: colors.textMuted },
  rowRight: { alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  rowAmt: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  rowDestAmt: { fontSize: fontSize.xs, color: colors.textMuted },
})
