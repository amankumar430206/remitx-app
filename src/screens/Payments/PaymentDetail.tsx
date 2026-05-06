import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { type Payment } from '@/api/payments'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatDateTime, statusColor, statusLabel } from '@/utils/format'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

const STATUS_ORDER = ['pending_approval', 'approved', 'processing', 'completed', 'rejected', 'failed']

interface Props { payment: Payment; onClose: () => void }

export function PaymentDetail({ payment: p, onClose }: Props) {
  const history = p.status_history ?? []

  return (
    <SafeAreaView style={styles.safe}>
      {/* Handle bar */}
      <View style={styles.handleWrap}><View style={styles.handle} /></View>

      <View style={styles.header}>
        <Text style={styles.title}>Payment details</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero amount */}
        <View style={[styles.hero, { borderTopColor: statusColor(p.status) }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: statusColor(p.status) + '22' }]}>
            <Ionicons name="swap-horizontal" size={22} color={statusColor(p.status)} />
          </View>
          <Text style={styles.heroAmount}>{formatMoney(p.source_amount, p.source_currency)}</Text>
          <View style={styles.heroRoute}>
            <Text style={styles.heroRouteCcy}>{p.source_currency}</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.textMuted} />
            <Text style={styles.heroRouteCcy}>{p.dest_currency}</Text>
            <Text style={styles.heroRouteDest}>{formatMoney(p.dest_amount, p.dest_currency)}</Text>
          </View>
          <StatusBadge status={p.status} />
        </View>

        {/* Details */}
        <Card style={styles.detailsCard}>
          {[
            { label: 'Recipient', value: p.beneficiary_name ?? '—' },
            { label: 'Exchange rate', value: `1 ${p.source_currency} = ${parseFloat(p.exchange_rate).toFixed(4)} ${p.dest_currency}` },
            { label: 'Fee', value: formatMoney(p.fee_amount, p.source_currency) },
            { label: 'Purpose', value: p.purpose_code },
            ...(p.reference ? [{ label: 'Reference', value: p.reference }] : []),
            { label: 'Created', value: formatDateTime(p.created_at) },
            ...(p.completed_at ? [{ label: 'Completed', value: formatDateTime(p.completed_at) }] : []),
            { label: 'Payment ID', value: p.id.slice(0, 16) + '…' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
            </View>
          ))}
        </Card>

        {/* Status timeline */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Timeline</Text>
            <Card padded={false} style={styles.timelineCard}>
              {history.map((h, idx) => {
                const isLast = idx === history.length - 1
                const color = statusColor(h.status)
                return (
                  <View key={h.id} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.dot, { backgroundColor: color }]} />
                      {!isLast && <View style={styles.line} />}
                    </View>
                    <View style={[styles.timelineContent, isLast && styles.timelineContentLast]}>
                      <Text style={[styles.timelineStatus, { color }]}>{statusLabel(h.status)}</Text>
                      <Text style={styles.timelineDate}>{formatDateTime(h.created_at)}</Text>
                      {h.notes && <Text style={styles.timelineNote}>{h.notes}</Text>}
                    </View>
                  </View>
                )
              })}
            </Card>
          </>
        )}
      </ScrollView>
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
  scroll: { padding: spacing.xl, gap: spacing.base, paddingBottom: spacing['3xl'] },

  hero: {
    alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, borderTopWidth: 3,
  },
  heroIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  heroAmount: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  heroRoute: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  heroRouteCcy: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  heroRouteDest: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', marginLeft: spacing.xs },

  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  detailsCard: { gap: spacing.xs },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
  detailValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, textAlign: 'right', flex: 1.5 },

  timelineCard: { overflow: 'hidden' },
  timelineRow: { flexDirection: 'row' },
  timelineLeft: { width: 40, alignItems: 'center', paddingTop: spacing.base },
  dot: { width: 10, height: 10, borderRadius: 5, zIndex: 1 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
  timelineContent: {
    flex: 1, paddingVertical: spacing.md, paddingRight: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: 2,
  },
  timelineContentLast: { borderBottomWidth: 0 },
  timelineStatus: { fontSize: fontSize.sm, fontWeight: '700' },
  timelineDate: { fontSize: fontSize.xs, color: colors.textMuted },
  timelineNote: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
})
