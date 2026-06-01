import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Modal,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type RouteProp } from '@react-navigation/native'
import { type NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { useColors, type Colors } from '@/hooks/useColors'
import { useAuthStore } from '@/stores/authStore'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatDateTime, statusColor, statusLabel } from '@/utils/format'
import { buildReceiptHtml } from '@/utils/receipt'
import paymentsApi from '@/api/payments'
import adminApi from '@/api/admin'
import { type PaymentsStackParamList } from '@/navigation/PaymentsStack'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusIcon(status: string): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case 'completed':                return 'checkmark-circle'
    case 'approved':                 return 'checkmark-circle-outline'
    case 'processing':               return 'sync-outline'
    case 'pending_approval':         return 'time-outline'
    case 'pending_compliance':       return 'shield-checkmark-outline'
    case 'pending_manual_processing':return 'card-outline'
    case 'rejected':                 return 'close-circle'
    case 'failed':                   return 'warning'
    case 'cancelled':                return 'ban-outline'
    default:                         return 'ellipse-outline'
  }
}

function heroGradient(status: string, bg: string): [string, string, string] {
  const c = statusColor(status)
  return [`${c}22`, `${c}08`, bg]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, s, colors }: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  s: ReturnType<typeof createStyles>
  colors: Colors
}) {
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
  label, value, mono, copyable, last, s, colors,
}: {
  label: string
  value: string
  mono?: boolean
  copyable?: boolean
  last?: boolean
  s: ReturnType<typeof createStyles>
  colors: Colors
}) {
  const handleCopy = () => {
    // expo-clipboard or fallback
    Alert.alert('Copied', `${label} copied to clipboard.`, [{ text: 'OK' }])
  }
  return (
    <View style={[s.infoRow, last && s.infoRowLast]}>
      <Text style={s.infoLabel}>{label}</Text>
      <TouchableOpacity
        style={s.infoValueWrap}
        onPress={copyable ? handleCopy : undefined}
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

/** Named person row with email sub-label */
function PersonRow({ label, name, email, last, s, colors }: {
  label: string
  name?: string | null
  email?: string | null
  last?: boolean
  s: ReturnType<typeof createStyles>
  colors: Colors
}) {
  if (!email && !name) return null
  return (
    <View style={[s.infoRow, last && s.infoRowLast]}>
      <Text style={s.infoLabel}>{label}</Text>
      <View style={s.personValueWrap}>
        {name ? <Text style={s.infoValue}>{name}</Text> : null}
        {email ? <Text style={[s.infoValue, { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '500' }]}>{email}</Text> : null}
      </View>
    </View>
  )
}

// ─── Status banner ────────────────────────────────────────────────────────────

function StatusBanner({ icon, iconColor, bgColor, borderColor, title, body, extra, s, colors }: {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  bgColor: string
  borderColor: string
  title: string
  body: string
  extra?: React.ReactNode
  s: ReturnType<typeof createStyles>
  colors: Colors
}) {
  return (
    <View style={[s.banner, { backgroundColor: bgColor, borderColor }]}>
      <View style={[s.bannerIconWrap, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.bannerTitle, { color: iconColor }]}>{title}</Text>
        <Text style={[s.bannerBody, { color: colors.textSecondary }]}>{body}</Text>
        {extra}
      </View>
    </View>
  )
}

// ─── Action modal (for inputs: reject, fail, complete) ───────────────────────

interface ActionModalProps {
  visible: boolean
  title: string
  description: string
  confirmLabel: string
  confirmColor: string
  loading: boolean
  disabled?: boolean
  onClose: () => void
  onConfirm: () => void
  children: React.ReactNode
  colors: Colors
  s: ReturnType<typeof createStyles>
}

function ActionModal({
  visible, title, description, confirmLabel, confirmColor,
  loading, disabled, onClose, onConfirm, children, colors, s,
}: ActionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.modalOverlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={[s.modalSheet, { backgroundColor: colors.card }]}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{title}</Text>
          <Text style={s.modalDescription}>{description}</Text>
          <View style={s.modalBody}>{children}</View>
          <View style={s.modalActions}>
            <TouchableOpacity style={[s.modalBtn, s.modalBtnCancel, { borderColor: colors.border }]} onPress={onClose} activeOpacity={0.7}>
              <Text style={[s.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalBtn, s.modalBtnConfirm, { backgroundColor: confirmColor, opacity: (disabled || loading) ? 0.5 : 1 }]}
              onPress={onConfirm}
              disabled={disabled || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={[s.modalBtnText, { color: '#fff' }]}>{confirmLabel}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Nav   = NativeStackNavigationProp<PaymentsStackParamList, 'PaymentDetail'>
type Route = RouteProp<PaymentsStackParamList, 'PaymentDetail'>

interface Props { navigation: Nav; route: Route }

export function PaymentDetail({ navigation, route }: Props) {
  const p = route.params.payment
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
  const qc = useQueryClient()
  const user = useAuthStore(s => s.user)

  const history  = p.status_history ?? []
  const sc       = statusColor(p.status)
  const [sharing, setSharing] = useState(false)

  // ── modal state ──────────────────────────────────────────────────────────
  const [showReject,   setShowReject]   = useState(false)
  const [rejectNote,   setRejectNote]   = useState('')
  const [showComplete, setShowComplete] = useState(false)
  const [providerRef,  setProviderRef]  = useState('')
  const [completeNote, setCompleteNote] = useState('')
  const [showFail,     setShowFail]     = useState(false)
  const [failReason,   setFailReason]   = useState('')

  // ── role derivations ─────────────────────────────────────────────────────
  const isSuperAdmin = user?.role === 'super_admin'
  const isAdminRole  = isSuperAdmin || user?.role === 'client_admin'
  const isOwnPayment = p.user_id === user?.id

  const canApprove = ['pending_approval', 'pending_compliance'].includes(p.status) &&
    (isSuperAdmin || user?.role === 'client_admin' || user?.role === 'checker')

  const canProcess = isSuperAdmin &&
    ['pending_manual_processing', 'processing'].includes(p.status)

  const canCancel = ['pending_approval', 'pending_compliance', 'pending_manual_processing'].includes(p.status) &&
    isOwnPayment

  // ── status history helpers ────────────────────────────────────────────────
  const lastNotesFor = (status: string) =>
    [...history].reverse().find(h => h.status === status)?.notes

  const rejectionReason = lastNotesFor('rejected')
  const failureReason   = lastNotesFor('failed')
  const amlNote         = history.find(h => h.status === 'pending_compliance')?.notes

  const hasFirstApproval = p.status === 'pending_approval' && !!p.checker_id
  const checkerName = p.checker_first_name
    ? `${p.checker_first_name} ${p.checker_last_name ?? ''}`.trim()
    : p.checker_email ?? null
  const submitterName = p.submitter_first_name
    ? `${p.submitter_first_name} ${p.submitter_last_name ?? ''}`.trim()
    : p.submitter_email ?? null

  // ── mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['payments'] })
    qc.invalidateQueries({ queryKey: ['payment', p.id] })
  }

  const approveMutation = useMutation({
    mutationFn: () => paymentsApi.approve(p.id),
    onSuccess: () => { invalidate(); navigation.goBack() },
    onError: (err: unknown) => Alert.alert('Error', String(err)),
  })

  const rejectMutation = useMutation({
    mutationFn: () => paymentsApi.reject(p.id, rejectNote),
    onSuccess: () => { invalidate(); setShowReject(false); navigation.goBack() },
    onError: (err: unknown) => { setShowReject(false); Alert.alert('Error', String(err)) },
  })

  const cancelMutation = useMutation({
    mutationFn: () => paymentsApi.cancel(p.id),
    onSuccess: () => { invalidate(); navigation.goBack() },
    onError: (err: unknown) => Alert.alert('Error', String(err)),
  })

  const completeMutation = useMutation({
    mutationFn: () => adminApi.payments.process(p.id, 'complete', completeNote || undefined, providerRef || undefined),
    onSuccess: () => { invalidate(); setShowComplete(false); navigation.goBack() },
    onError: (err: unknown) => { setShowComplete(false); Alert.alert('Error', String(err)) },
  })

  const failMutation = useMutation({
    mutationFn: () => adminApi.payments.process(p.id, 'fail', failReason),
    onSuccess: () => { invalidate(); setShowFail(false); navigation.goBack() },
    onError: (err: unknown) => { setShowFail(false); Alert.alert('Error', String(err)) },
  })

  const anyPending = approveMutation.isPending || rejectMutation.isPending ||
    cancelMutation.isPending || completeMutation.isPending || failMutation.isPending

  // ── share receipt ─────────────────────────────────────────────────────────
  const handleShareReceipt = async () => {
    try {
      setSharing(true)
      const html = buildReceiptHtml(p)
      const { uri } = await Print.printToFileAsync({ html, base64: false })
      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Payment Receipt', UTI: 'com.adobe.pdf' })
      } else {
        Alert.alert('Sharing unavailable', 'Sharing is not supported on this device.')
      }
    } catch {
      Alert.alert('Error', 'Could not generate the receipt. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  const hasFee     = parseFloat(p.fee_amount) > 0
  const totalDebit = parseFloat(p.source_amount) + parseFloat(p.fee_amount)

  // ── approve confirm ───────────────────────────────────────────────────────
  const handleApprove = () => {
    Alert.alert(
      'Approve payment',
      `Approve ${formatMoney(p.source_amount, p.source_currency)} to ${p.beneficiary_name ?? 'recipient'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', style: 'default', onPress: () => approveMutation.mutate() },
      ],
    )
  }

  const handleCancel = () => {
    Alert.alert(
      'Cancel payment',
      'Are you sure you want to cancel this payment? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, cancel it', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ],
    )
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payment details</Text>
        <TouchableOpacity style={s.headerBtn} onPress={handleShareReceipt} disabled={sharing} activeOpacity={0.7}>
          <Ionicons
            name={sharing ? 'hourglass-outline' : 'share-outline'}
            size={17}
            color={sharing ? colors.textDisabled : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ══════════════════════════════════════════════════════════════════
            STATUS BANNERS
        ══════════════════════════════════════════════════════════════════ */}

        {/* Completed */}
        {p.status === 'completed' && (
          <StatusBanner
            icon="checkmark-circle"
            iconColor={colors.success}
            bgColor={colors.success + '15'}
            borderColor={colors.success + '40'}
            title="Transfer complete"
            body={`Funds delivered to ${p.beneficiary_name ?? 'the recipient'}.${p.completed_at ? ` Settled ${formatDateTime(p.completed_at)}.` : ''}${p.provider_payment_id ? ` Ref: ${p.provider_payment_id}` : ''}`}
            s={s} colors={colors}
          />
        )}

        {/* Rejected */}
        {p.status === 'rejected' && (
          <StatusBanner
            icon="close-circle"
            iconColor={colors.danger}
            bgColor={colors.danger + '15'}
            borderColor={colors.danger + '40'}
            title="Payment rejected"
            body={rejectionReason ? `Reason: ${rejectionReason}` : 'No reason was recorded.'}
            s={s} colors={colors}
          />
        )}

        {/* Failed */}
        {p.status === 'failed' && (
          <StatusBanner
            icon="warning"
            iconColor={colors.danger}
            bgColor={colors.danger + '15'}
            borderColor={colors.danger + '40'}
            title="Payment failed"
            body={failureReason
              ? `${failureReason} — The debit has been reversed.`
              : 'The payment could not be completed. The debit has been reversed.'}
            s={s} colors={colors}
          />
        )}

        {/* Cancelled */}
        {p.status === 'cancelled' && (
          <StatusBanner
            icon="ban-outline"
            iconColor={colors.textMuted}
            bgColor={colors.surface}
            borderColor={colors.border}
            title="Payment cancelled"
            body="This payment was cancelled before it was processed."
            s={s} colors={colors}
          />
        )}

        {/* Awaiting approval — own payment */}
        {canApprove && isOwnPayment && !isSuperAdmin && (
          <StatusBanner
            icon="time-outline"
            iconColor={colors.warning}
            bgColor={colors.warning + '15'}
            borderColor={colors.warning + '40'}
            title="Awaiting approval"
            body="You submitted this payment. Another authorised user must approve it before processing."
            s={s} colors={colors}
          />
        )}

        {/* Dual approval: first approval done */}
        {hasFirstApproval && !isOwnPayment && (
          <StatusBanner
            icon="people-outline"
            iconColor={colors.primary}
            bgColor={colors.primary + '12'}
            borderColor={colors.primary + '30'}
            title="First approval recorded"
            body={`${checkerName ?? 'A checker'} provided the first approval. A second checker must approve to finalise.`}
            s={s} colors={colors}
          />
        )}

        {/* Compliance */}
        {p.status === 'pending_compliance' && (isAdminRole || canApprove) && (
          <StatusBanner
            icon="shield-checkmark-outline"
            iconColor={colors.warning}
            bgColor={colors.warning + '12'}
            borderColor={colors.warning + '30'}
            title="Compliance review required"
            body="Flagged by AML screening. Review and approve to release, or reject to return the payment."
            extra={amlNote
              ? <Text style={[s.bannerNote, { color: colors.warning, borderColor: colors.warning + '30', backgroundColor: colors.warning + '12' }]}>{amlNote}</Text>
              : undefined}
            s={s} colors={colors}
          />
        )}

        {/* Manual settlement */}
        {p.status === 'pending_manual_processing' && isAdminRole && (
          <StatusBanner
            icon="card-outline"
            iconColor={colors.primary}
            bgColor={colors.primary + '10'}
            borderColor={colors.primary + '30'}
            title="Awaiting manual settlement"
            body="Approved and queued for manual transfer. Execute externally, then mark complete with the provider reference."
            s={s} colors={colors}
          />
        )}

        {/* Processing */}
        {p.status === 'processing' && isAdminRole && (
          <StatusBanner
            icon="sync-outline"
            iconColor={colors.primary}
            bgColor={colors.primary + '10'}
            borderColor={colors.primary + '30'}
            title="Payment is processing"
            body="Dispatched to the provider. Mark complete once settled, or fail to reverse the debit."
            s={s} colors={colors}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════════
            HERO CARD
        ══════════════════════════════════════════════════════════════════ */}
        <LinearGradient colors={heroGradient(p.status, colors.bg)} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
          <View style={[s.heroGlow, { backgroundColor: sc + '18' }]} />
          <View style={[s.heroStatusIcon, { backgroundColor: sc + '22', borderColor: sc + '44' }]}>
            <Ionicons name={statusIcon(p.status)} size={26} color={sc} />
          </View>
          <Text style={s.heroAmount}>{formatMoney(p.source_amount, p.source_currency)}</Text>
          <View style={[s.statusPill, { backgroundColor: sc + '22', borderColor: sc + '44' }]}>
            <View style={[s.statusDot, { backgroundColor: sc }]} />
            <Text style={[s.statusText, { color: sc }]}>{statusLabel(p.status)}</Text>
          </View>
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
        <SectionHeader icon="swap-horizontal-outline" title="Transaction" s={s} colors={colors} />
        <View style={s.card}>
          <InfoRow label="Transfer amount" value={formatMoney(p.source_amount, p.source_currency)} s={s} colors={colors} />
          <InfoRow label="Fee" value={formatMoney(hasFee ? p.fee_amount : '0', p.source_currency)} s={s} colors={colors} />
          {hasFee && (
            <InfoRow label="Total debit" value={formatMoney(String(totalDebit), p.source_currency)} s={s} colors={colors} />
          )}
          <InfoRow
            label="Exchange rate"
            value={`1 ${p.source_currency} = ${parseFloat(p.exchange_rate).toFixed(4)} ${p.dest_currency}`}
            s={s} colors={colors}
          />
          <InfoRow label="They receive" value={formatMoney(p.dest_amount, p.dest_currency)} s={s} colors={colors} />
          <InfoRow label="Purpose" value={p.purpose_code} s={s} colors={colors} />
          {p.note && <InfoRow label="Note" value={p.note} s={s} colors={colors} />}
          {p.reference && <InfoRow label="Reference" value={p.reference} mono copyable s={s} colors={colors} />}
          <InfoRow label="Submitted" value={formatDateTime(p.created_at)} s={s} colors={colors} />
          {p.completed_at && (
            <InfoRow label="Completed" value={formatDateTime(p.completed_at)} s={s} colors={colors} />
          )}
          <InfoRow label="Payment ID" value={p.id} mono copyable last s={s} colors={colors} />
        </View>

        {/* ── Recipient ── */}
        <SectionHeader icon="person-outline" title="Recipient" s={s} colors={colors} />
        <View style={s.card}>
          <InfoRow label="Name"    value={p.beneficiary_name    ?? '—'} s={s} colors={colors} />
          <InfoRow label="Country" value={p.beneficiary_country_code ?? '—'} s={s} colors={colors} />
          {p.beneficiary_currency && (
            <InfoRow label="Currency" value={p.beneficiary_currency} s={s} colors={colors} />
          )}
          {p.beneficiary_bank_name && (
            <InfoRow label="Bank" value={p.beneficiary_bank_name} s={s} colors={colors} />
          )}
          {p.beneficiary_account_number && (
            <InfoRow label="Account no." value={p.beneficiary_account_number} mono copyable s={s} colors={colors} />
          )}
          {p.beneficiary_iban && (
            <InfoRow label="IBAN" value={p.beneficiary_iban} mono copyable s={s} colors={colors} />
          )}
          {p.beneficiary_swift_bic && (
            <InfoRow label="SWIFT / BIC" value={p.beneficiary_swift_bic} mono last={!p.account_currency && !p.account_number_ref} s={s} colors={colors} />
          )}
          {p.account_currency && (
            <InfoRow label="Source currency" value={p.account_currency} s={s} colors={colors} />
          )}
          {p.account_number_ref && (
            <InfoRow label="Source account" value={p.account_number_ref} mono last s={s} colors={colors} />
          )}
        </View>

        {/* ── People ── */}
        {(p.submitter_email || p.checker_email) && (
          <>
            <SectionHeader icon="people-outline" title="People" s={s} colors={colors} />
            <View style={s.card}>
              {p.submitter_email && (
                <PersonRow
                  label="Submitted by"
                  name={submitterName}
                  email={p.submitter_email}
                  last={!p.checker_email}
                  s={s} colors={colors}
                />
              )}
              {p.checker_email && (
                <PersonRow
                  label={p.status === 'pending_approval' && p.checker_id ? 'First approver' : 'Approved by'}
                  name={checkerName}
                  email={p.checker_email}
                  last
                  s={s} colors={colors}
                />
              )}
            </View>
          </>
        )}

        {/* ── Provider details (admin only) ── */}
        {isAdminRole && (
          <>
            <SectionHeader icon="server-outline" title="Provider details" s={s} colors={colors} />
            <View style={s.card}>
              <InfoRow label="Provider" value={p.provider_name ?? 'manual'} mono s={s} colors={colors} />
              <InfoRow
                label="Provider payment ID"
                value={p.provider_payment_id ?? '—'}
                mono={!!p.provider_payment_id}
                copyable={!!p.provider_payment_id}
                s={s} colors={colors}
              />
              {p.ops_notes && <InfoRow label="Ops notes" value={p.ops_notes} s={s} colors={colors} />}
              {isSuperAdmin && p.tenant_name && (
                <InfoRow label="Client" value={p.tenant_name} last s={s} colors={colors} />
              )}
              {!(isSuperAdmin && p.tenant_name) && !p.ops_notes && (
                <InfoRow label="Provider payment ID" value={p.provider_payment_id ?? '—'} last s={s} colors={colors} />
              )}
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ADMIN ACTION BUTTONS
        ══════════════════════════════════════════════════════════════════ */}

        {/* Approve + Reject */}
        {canApprove && (!isOwnPayment || isSuperAdmin) && (
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnDanger, { opacity: anyPending ? 0.5 : 1 }]}
              onPress={() => { setRejectNote(''); setShowReject(true) }}
              disabled={anyPending}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
              <Text style={[s.actionBtnText, { color: colors.danger }]}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnPrimary, { opacity: anyPending ? 0.5 : 1 }]}
              onPress={handleApprove}
              disabled={anyPending}
              activeOpacity={0.8}
            >
              {approveMutation.isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                    <Text style={[s.actionBtnText, { color: '#fff' }]}>Approve</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Complete + Fail (ops) */}
        {canProcess && (
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnDanger, { opacity: anyPending ? 0.5 : 1 }]}
              onPress={() => { setFailReason(''); setShowFail(true) }}
              disabled={anyPending}
              activeOpacity={0.8}
            >
              <Ionicons name="close-outline" size={16} color={colors.danger} />
              <Text style={[s.actionBtnText, { color: colors.danger }]}>Mark as failed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnSuccess, { opacity: anyPending ? 0.5 : 1 }]}
              onPress={() => { setProviderRef(''); setCompleteNote(''); setShowComplete(true) }}
              disabled={anyPending}
              activeOpacity={0.8}
            >
              {completeMutation.isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="checkmark-outline" size={16} color="#fff" />
                    <Text style={[s.actionBtnText, { color: '#fff' }]}>Mark as complete</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel (initiator) */}
        {canCancel && (
          <TouchableOpacity
            style={[s.cancelBtn, { borderColor: colors.border, opacity: anyPending ? 0.5 : 1 }]}
            onPress={handleCancel}
            disabled={anyPending}
            activeOpacity={0.7}
          >
            <Text style={[s.cancelBtnText, { color: colors.textMuted }]}>Cancel payment</Text>
          </TouchableOpacity>
        )}

        {/* ── Share receipt ── */}
        <TouchableOpacity style={s.shareBtn} onPress={handleShareReceipt} disabled={sharing} activeOpacity={0.8}>
          <LinearGradient
            colors={sharing ? [colors.surface, colors.surface] : ['#6366F1', '#818CF8']}
            style={s.shareBtnInner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Ionicons name={sharing ? 'hourglass-outline' : 'document-text-outline'} size={18} color={sharing ? colors.textDisabled : colors.white} />
            <Text style={[s.shareBtnText, sharing && { color: colors.textDisabled }]}>
              {sharing ? 'Generating PDF…' : 'Share receipt'}
            </Text>
            {!sharing && <Ionicons name="share-outline" size={16} color={colors.white + 'cc'} />}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Timeline ── */}
        {history.length > 0 && (
          <>
            <SectionHeader icon="time-outline" title="Status history" s={s} colors={colors} />
            <View style={s.card}>
              {history.map((h, idx) => {
                const isLast    = idx === history.length - 1
                const isCurrent = idx === 0
                const hc = statusColor(h.status)
                return (
                  <View key={h.id} style={s.timelineRow}>
                    <View style={s.timelineTrack}>
                      <View style={[
                        s.timelineDot,
                        { backgroundColor: isCurrent ? hc : hc + '60', borderColor: isCurrent ? hc + '44' : 'transparent' },
                      ]}>
                        <Ionicons name={statusIcon(h.status)} size={10} color={isCurrent ? colors.white : hc} />
                      </View>
                      {!isLast && <View style={s.timelineLine} />}
                    </View>
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

      {/* ══════════════════════════════════════════════════════════════════════
          ACTION MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Reject */}
      <ActionModal
        visible={showReject}
        title="Reject payment"
        description="Provide a reason. The submitter will see this message."
        confirmLabel="Reject"
        confirmColor={colors.danger}
        loading={rejectMutation.isPending}
        disabled={rejectNote.trim().length < 5}
        onClose={() => setShowReject(false)}
        onConfirm={() => rejectMutation.mutate()}
        colors={colors} s={s}
      >
        <TextInput
          style={[s.modalInput, s.modalTextarea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={rejectNote}
          onChangeText={setRejectNote}
          placeholder="Rejection reason (min 5 characters)…"
          placeholderTextColor={colors.textDisabled}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </ActionModal>

      {/* Mark as complete */}
      <ActionModal
        visible={showComplete}
        title="Mark as complete"
        description="Confirm funds were transferred successfully."
        confirmLabel="Mark as complete"
        confirmColor={colors.success}
        loading={completeMutation.isPending}
        onClose={() => setShowComplete(false)}
        onConfirm={() => completeMutation.mutate()}
        colors={colors} s={s}
      >
        <View style={{ gap: spacing.sm }}>
          <View>
            <Text style={[s.modalFieldLabel, { color: colors.textSecondary }]}>Provider reference (optional)</Text>
            <TextInput
              style={[s.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={providerRef}
              onChangeText={setProviderRef}
              placeholder="Transaction ID from banking portal…"
              placeholderTextColor={colors.textDisabled}
            />
          </View>
          <View>
            <Text style={[s.modalFieldLabel, { color: colors.textSecondary }]}>Notes (optional)</Text>
            <TextInput
              style={[s.modalInput, s.modalTextarea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={completeNote}
              onChangeText={setCompleteNote}
              placeholder="Any notes for the audit trail…"
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ActionModal>

      {/* Mark as failed */}
      <ActionModal
        visible={showFail}
        title="Mark as failed"
        description="The debit will be reversed and balance restored."
        confirmLabel="Mark as failed"
        confirmColor={colors.danger}
        loading={failMutation.isPending}
        disabled={failReason.trim().length < 3}
        onClose={() => setShowFail(false)}
        onConfirm={() => failMutation.mutate()}
        colors={colors} s={s}
      >
        <View>
          <Text style={[s.modalFieldLabel, { color: colors.textSecondary }]}>Reason *</Text>
          <TextInput
            style={[s.modalInput, s.modalTextarea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={failReason}
            onChangeText={setFailReason}
            placeholder="Why did this payment fail?…"
            placeholderTextColor={colors.textDisabled}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={[s.modalHint, { color: colors.textDisabled }]}>Minimum 3 characters required.</Text>
        </View>
      </ActionModal>

    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm, paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerTitle: { flex: 1, fontSize: fontSize.base, fontWeight: '700', color: c.textPrimary },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.primaryFaded, borderWidth: 1, borderColor: c.primary + '40',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  scroll: { paddingHorizontal: screenPadding, paddingBottom: spacing['4xl'], gap: spacing.md },

  // ── Banner ──
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    borderRadius: radius.xl, borderWidth: 1, padding: spacing.base,
  },
  bannerIconWrap: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    marginTop: 1,
  },
  bannerTitle: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: 2 },
  bannerBody:  { fontSize: fontSize.xs, lineHeight: 18 },
  bannerNote: {
    marginTop: spacing.xs, fontSize: fontSize.xs, lineHeight: 16,
    borderRadius: radius.sm, borderWidth: 1,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },

  // ── Hero ──
  hero: {
    borderRadius: radius.xl, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', gap: spacing.md,
    paddingTop: spacing['2xl'], paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  heroGlow: { position: 'absolute', top: -60, width: 200, height: 200, borderRadius: 100 },
  heroStatusIcon: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  heroAmount: { fontSize: 40, fontWeight: '800', color: c.textPrimary, letterSpacing: -1.5, lineHeight: 46 },
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
    flex: 1, backgroundColor: c.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: c.border,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: 3,
  },
  routeBoxRight: { alignItems: 'flex-end' },
  routeCcy: { fontSize: fontSize.xs, color: c.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  routeAmt: { fontSize: fontSize.sm, fontWeight: '800', color: c.textPrimary },
  routeArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Section header ──
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  sectionIconWrap: {
    width: 20, height: 20, borderRadius: 6,
    backgroundColor: c.primaryFaded, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', color: c.textPrimary, letterSpacing: 0.3 },

  // ── Info card ──
  card: {
    backgroundColor: c.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.border, gap: spacing.md,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: fontSize.xs, color: c.textMuted, flex: 1 },
  infoValueWrap: { flexDirection: 'row', alignItems: 'center', flex: 1.6, justifyContent: 'flex-end' },
  infoValue: { fontSize: fontSize.sm, fontWeight: '600', color: c.textPrimary, textAlign: 'right' },
  infoValueMono: { fontFamily: 'monospace', fontSize: 10, color: c.textSecondary, letterSpacing: 0.3 },
  personValueWrap: { flex: 1.6, alignItems: 'flex-end', gap: 2 },

  // ── Action buttons ──
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, height: 46, borderRadius: radius.xl, borderWidth: 1,
  },
  actionBtnDanger:  { backgroundColor: c.danger + '12',  borderColor: c.danger  + '40' },
  actionBtnPrimary: { backgroundColor: c.primary,         borderColor: 'transparent' },
  actionBtnSuccess: { backgroundColor: c.success,         borderColor: 'transparent' },
  actionBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
  cancelBtn: {
    height: 44, borderRadius: radius.xl, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: fontSize.sm, fontWeight: '600' },

  // ── Share receipt ──
  shareBtn: { borderRadius: radius.xl, overflow: 'hidden' },
  shareBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.xl,
  },
  shareBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: c.white },

  // ── Timeline ──
  timelineRow: { flexDirection: 'row' },
  timelineTrack: { width: 44, alignItems: 'center', paddingTop: spacing.md },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, zIndex: 1,
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: c.border, marginVertical: 2 },
  timelineContent: {
    flex: 1, paddingVertical: spacing.md, paddingRight: spacing.base,
    borderBottomWidth: 1, borderBottomColor: c.border, gap: 3,
  },
  timelineContentLast: { borderBottomWidth: 0 },
  timelineStatus: { fontSize: fontSize.sm, fontWeight: '700' },
  timelineDate: { fontSize: fontSize.xs, color: c.textMuted },
  timelineNoteWrap: {
    marginTop: 4, backgroundColor: c.surface,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  timelineNote: { fontSize: fontSize.xs, color: c.textSecondary, lineHeight: 16 },

  // ── Modals ──
  modalOverlay: {
    flex: 1, backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: spacing.md, paddingHorizontal: screenPadding, paddingBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#ffffff30',
    alignSelf: 'center', marginBottom: spacing.xs,
  },
  modalTitle: { fontSize: fontSize.base, fontWeight: '700', color: '#F9FAFB' },
  modalDescription: { fontSize: fontSize.sm, color: '#9CA3AF', lineHeight: 20 },
  modalBody: { marginTop: spacing.sm },
  modalFieldLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.xs },
  modalInput: {
    borderWidth: 1, borderRadius: radius.lg,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
  },
  modalTextarea: { height: 88, paddingTop: spacing.sm },
  modalHint: { fontSize: fontSize.xs, marginTop: spacing.xs },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalBtn: {
    flex: 1, height: 46, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBtnCancel:  { borderWidth: 1 },
  modalBtnConfirm: {},
  modalBtnText: { fontSize: fontSize.sm, fontWeight: '700' },
})
