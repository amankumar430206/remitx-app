import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Clipboard, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { type Payment } from '@/api/payments'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatDateTime, statusColor, statusLabel } from '@/utils/format'
import { buildReceiptHtml } from '@/utils/receipt'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusIcon(status: string): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case 'completed':        return 'checkmark-circle'
    case 'approved':         return 'checkmark-circle-outline'
    case 'processing':       return 'sync-outline'
    case 'pending_approval': return 'time-outline'
    case 'rejected':         return 'close-circle'
    case 'failed':           return 'warning'
    case 'cancelled':        return 'ban-outline'
    default:                 return 'ellipse-outline'
  }
}

function heroGradient(status: string): [string, string, string] {
  const c = statusColor(status)
  return [`${c}22`, `${c}08`, colors.bg]
}

function copyToClipboard(text: string, label: string) {
  Clipboard.setString(text)
  Alert.alert('Copied', `${label} copied to clipboard.`, [{ text: 'OK' }])
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionIconWrap}>
        <Ionicons name={icon} size={12} color={colors.primary} />
      </View>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  )
}

function InfoRow({
  label, value, mono, copyable, last,
}: {
  label: string
  value: string
  mono?: boolean
  copyable?: boolean
  last?: boolean
}) {
  return (
    <View style={[s.infoRow, last && s.infoRowLast]}>
      <Text style={s.infoLabel}>{label}</Text>
      <TouchableOpacity
        style={s.infoValueWrap}
        onPress={copyable ? () => copyToClipboard(value, label) : undefined}
        activeOpacity={copyable ? 0.6 : 1}
      >
        <Text style={[s.infoValue, mono && s.infoValueMono]} numberOfLines={2}>
          {value}
        </Text>
        {copyable && (
          <Ionicons name="copy-outline" size={13} color={colors.textDisabled} style={{ marginLeft: 5 }} />
        )}
      </TouchableOpacity>
    </View>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props { payment: Payment; onClose: () => void }

export function PaymentDetail({ payment: p, onClose }: Props) {
  const history = p.status_history ?? []
  const sc = statusColor(p.status)
  const [sharing, setSharing] = useState(false)

  const handleShareReceipt = async () => {
    try {
      setSharing(true)
      const html = buildReceiptHtml(p)
      const { uri } = await Print.printToFileAsync({ html, base64: false })
      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Payment Receipt',
          UTI: 'com.adobe.pdf',
        })
      } else {
        Alert.alert('Sharing unavailable', 'Sharing is not supported on this device.')
      }
    } catch {
      Alert.alert('Error', 'Could not generate the receipt. Please try again.')
    } finally {
      setSharing(false)
    }
  }
  const totalDebit = parseFloat(p.source_amount) + parseFloat(p.fee_amount)
  const hasFee = parseFloat(p.fee_amount) > 0

  return (
    <SafeAreaView style={s.safe}>
      {/* Drag handle */}
      <View style={s.handleBar}><View style={s.handle} /></View>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Payment details</Text>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.headerBtn} onPress={handleShareReceipt} disabled={sharing} activeOpacity={0.7}>
            <Ionicons name={sharing ? 'hourglass-outline' : 'share-outline'} size={17} color={sharing ? colors.textDisabled : colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={heroGradient(p.status)}
          style={s.hero}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        >
          {/* Decorative glow */}
          <View style={[s.heroGlow, { backgroundColor: sc + '18' }]} />

          {/* Status icon */}
          <View style={[s.heroStatusIcon, { backgroundColor: sc + '22', borderColor: sc + '44' }]}>
            <Ionicons name={statusIcon(p.status)} size={26} color={sc} />
          </View>

          {/* Big amount */}
          <Text style={s.heroAmount}>{formatMoney(p.source_amount, p.source_currency)}</Text>

          {/* Status label */}
          <View style={[s.statusPill, { backgroundColor: sc + '22', borderColor: sc + '44' }]}>
            <View style={[s.statusDot, { backgroundColor: sc }]} />
            <Text style={[s.statusText, { color: sc }]}>{statusLabel(p.status)}</Text>
          </View>

          {/* Transfer route */}
          <View style={s.routeRow}>
            <View style={s.routeBox}>
              <Text style={s.routeCcy}>{p.source_currency}</Text>
              <Text style={s.routeAmt}>{formatMoney(p.source_amount, p.source_currency)}</Text>
            </View>
            <View style={s.routeArrow}>
              <Ionicons name="arrow-forward" size={16} color={colors.textDisabled} />
            </View>
            <View style={[s.routeBox, s.routeBoxRight]}>
              <Text style={s.routeCcy}>{p.dest_currency}</Text>
              <Text style={[s.routeAmt, { color: colors.success }]}>{formatMoney(p.dest_amount, p.dest_currency)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Transaction ── */}
        <SectionHeader icon="swap-horizontal-outline" title="Transaction" />
        <View style={s.card}>
          <InfoRow label="Transfer amount" value={formatMoney(p.source_amount, p.source_currency)} />
          <InfoRow
            label="Transfer fee"
            value={hasFee ? formatMoney(p.fee_amount, p.source_currency) : 'Free'}
          />
          {hasFee && (
            <InfoRow label="Total debit" value={formatMoney(String(totalDebit), p.source_currency)} />
          )}
          <InfoRow
            label="Exchange rate"
            value={`1 ${p.source_currency} = ${parseFloat(p.exchange_rate).toFixed(4)} ${p.dest_currency}`}
          />
          <InfoRow label="They receive" value={formatMoney(p.dest_amount, p.dest_currency)} last />
        </View>

        {/* ── Recipient ── */}
        <SectionHeader icon="person-outline" title="Recipient" />
        <View style={s.card}>
          <InfoRow label="Name" value={p.beneficiary_name ?? '—'} />
          <InfoRow label="Country" value={p.beneficiary_country_code ?? '—'} last />
        </View>

        {/* ── Details ── */}
        <SectionHeader icon="document-text-outline" title="Details" />
        <View style={s.card}>
          <InfoRow label="Purpose" value={p.purpose_code} />
          {p.reference && (
            <InfoRow label="Reference" value={p.reference} mono copyable />
          )}
          <InfoRow label="Submitted" value={formatDateTime(p.created_at)} />
          {p.completed_at && (
            <InfoRow label="Completed" value={formatDateTime(p.completed_at)} />
          )}
          <InfoRow label="Payment ID" value={p.id} mono copyable last />
        </View>

        {/* ── Share receipt CTA ── */}
        <TouchableOpacity style={s.shareBtn} onPress={handleShareReceipt} disabled={sharing} activeOpacity={0.8}>
          <LinearGradient
            colors={sharing ? [colors.surface, colors.surface] : ['#6366F1', '#818CF8']}
            style={s.shareBtnInner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Ionicons
              name={sharing ? 'hourglass-outline' : 'document-text-outline'}
              size={18}
              color={sharing ? colors.textDisabled : colors.white}
            />
            <Text style={[s.shareBtnText, sharing && { color: colors.textDisabled }]}>
              {sharing ? 'Generating PDF…' : 'Share receipt'}
            </Text>
            {!sharing && <Ionicons name="share-outline" size={16} color={colors.white + 'cc'} />}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Timeline ── */}
        {history.length > 0 && (
          <>
            <SectionHeader icon="time-outline" title="Timeline" />
            <View style={s.card}>
              {history.map((h, idx) => {
                const isLast = idx === history.length - 1
                const isCurrent = idx === 0
                const hc = statusColor(h.status)
                return (
                  <View key={h.id} style={s.timelineRow}>
                    {/* Connector column */}
                    <View style={s.timelineTrack}>
                      <View style={[
                        s.timelineDot,
                        { backgroundColor: isCurrent ? hc : hc + '60', borderColor: isCurrent ? hc + '44' : 'transparent' },
                      ]}>
                        <Ionicons name={statusIcon(h.status)} size={10} color={isCurrent ? colors.white : hc} />
                      </View>
                      {!isLast && <View style={s.timelineLine} />}
                    </View>

                    {/* Content */}
                    <View style={[s.timelineContent, isLast && s.timelineContentLast]}>
                      <Text style={[s.timelineStatus, { color: isCurrent ? hc : colors.textSecondary }]}>
                        {statusLabel(h.status)}
                      </Text>
                      <Text style={s.timelineDate}>{formatDateTime(h.created_at)}</Text>
                      {h.notes && (
                        <View style={s.timelineNoteWrap}>
                          <Text style={s.timelineNote}>{h.notes}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  handleBar: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.xs },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: screenPadding, paddingBottom: spacing.md,
  },
  headerTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primaryFaded, borderWidth: 1, borderColor: colors.primary + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  shareBtn: { borderRadius: radius.xl, overflow: 'hidden' },
  shareBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.md,
    borderRadius: radius.xl,
  },
  shareBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.white },

  scroll: { paddingHorizontal: screenPadding, paddingBottom: spacing['4xl'], gap: spacing.md },

  // ── Hero ──
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', gap: spacing.md,
    paddingTop: spacing['2xl'], paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: -60, width: 200, height: 200, borderRadius: 100,
  },
  heroStatusIcon: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  heroAmount: {
    fontSize: 40, fontWeight: '800', color: colors.textPrimary,
    letterSpacing: -1.5, lineHeight: 46,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.3 },

  routeRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.xs, marginHorizontal: screenPadding, width: '100%',
    paddingHorizontal: spacing.lg,
  },
  routeBox: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    gap: 3,
  },
  routeBoxRight: { alignItems: 'flex-end' },
  routeCcy: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  routeAmt: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textPrimary },
  routeArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs,
  },
  sectionIconWrap: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: colors.primaryFaded, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.3 },

  // ── Info card ──
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.md,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted, flex: 1 },
  infoValueWrap: { flexDirection: 'row', alignItems: 'center', flex: 1.6, justifyContent: 'flex-end' },
  infoValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  infoValueMono: {
    fontFamily: 'monospace', fontSize: 10,
    color: colors.textSecondary, letterSpacing: 0.3,
  },

  // ── Timeline ──
  timelineRow: { flexDirection: 'row' },
  timelineTrack: { width: 44, alignItems: 'center', paddingTop: spacing.md },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, zIndex: 1,
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  timelineContent: {
    flex: 1, paddingVertical: spacing.md, paddingRight: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: 3,
  },
  timelineContentLast: { borderBottomWidth: 0 },
  timelineStatus: { fontSize: fontSize.sm, fontWeight: '700' },
  timelineDate: { fontSize: fontSize.xs, color: colors.textMuted },
  timelineNoteWrap: {
    marginTop: 4, backgroundColor: colors.surface,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  timelineNote: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 16 },
})
