import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, TextInput, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import paymentsApi, { type Payment } from '@/api/payments'
import { useColors, type Colors } from '@/hooks/useColors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatTimeAgo } from '@/utils/format'
import { getApiError } from '@/utils/apiError'
import { useAlert } from '@/hooks/useAlert'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function ApprovalQueue() {
  const { showAlert } = useAlert()
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
  const sh = useMemo(() => createSheetStyles(colors), [colors])
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Payment | null>(null)
  const [comment, setComment] = useState('')
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['approval-queue'],
    queryFn: () => paymentsApi.approvalQueue().then((r) => r.data.data),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['approval-queue'] })
    qc.invalidateQueries({ queryKey: ['payments'] })
  }

  const approveMutation = useMutation({
    mutationFn: () => paymentsApi.approve(selected!.id, comment || undefined),
    onSuccess: () => { invalidate(); closeModal(); showAlert('Approved', 'Payment has been approved.') },
    onError: (err) => showAlert('Error', getApiError(err, 'Could not approve this payment.')),
  })

  const rejectMutation = useMutation({
    mutationFn: () => paymentsApi.reject(selected!.id, comment),
    onSuccess: () => { invalidate(); closeModal(); showAlert('Rejected', 'Payment has been rejected.') },
    onError: (err) => showAlert('Error', getApiError(err, 'Could not reject this payment.')),
  })

  const closeModal = () => { setSelected(null); setComment(''); setAction(null) }
  const openAction = (p: Payment, act: 'approve' | 'reject') => { setSelected(p); setAction(act) }

  const queue = data ?? []
  const isApproving = action === 'approve'

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.title}>Approval Queue</Text>
          {queue.length > 0 && (
            <Text style={s.subtitle}>{queue.length} pending</Text>
          )}
        </View>
        {queue.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{queue.length}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          contentContainerStyle={s.scroll}
        >
          {queue.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title="Queue is empty"
              subtitle="No payments awaiting your approval"
            />
          ) : (
            <View style={s.group}>
              {queue.map((item, idx) => {
                const isLast = idx === queue.length - 1
                const initial = (item.beneficiary_name ?? 'B')[0].toUpperCase()
                return (
                  <View key={item.id} style={[s.card, !isLast && s.cardBorder]}>
                    {/* Warning accent bar */}
                    <View style={s.accentBar} />

                    {/* Top row: avatar + bene + amount */}
                    <View style={s.cardTop}>
                      <View style={s.avatarWrap}>
                        <Text style={s.avatarText}>{initial}</Text>
                      </View>
                      <View style={s.cardMeta}>
                        <Text style={s.beneName} numberOfLines={1}>
                          {item.beneficiary_name ?? 'Beneficiary'}
                        </Text>
                        <View style={s.cardSubRow}>
                          <Text style={s.cardRoute}>
                            {item.source_currency} → {item.dest_currency}
                          </Text>
                          <Text style={s.cardDot}>·</Text>
                          <Text style={s.cardTime}>{formatTimeAgo(item.created_at)}</Text>
                        </View>
                      </View>
                      <View style={s.amountCol}>
                        <Text style={s.amount}>{formatMoney(item.source_amount, item.source_currency)}</Text>
                        <Text style={s.destAmount}>{formatMoney(item.dest_amount, item.dest_currency)}</Text>
                      </View>
                    </View>

                    {/* Meta chips */}
                    <View style={s.chips}>
                      <View style={s.chip}>
                        <Ionicons name="briefcase-outline" size={11} color={colors.textMuted} />
                        <Text style={s.chipText}>{item.purpose_code}</Text>
                      </View>
                      {item.reference && (
                        <View style={s.chip}>
                          <Ionicons name="document-text-outline" size={11} color={colors.textMuted} />
                          <Text style={s.chipText}>{item.reference}</Text>
                        </View>
                      )}
                    </View>

                    {/* Actions */}
                    <View style={s.actions}>
                      <TouchableOpacity
                        style={[s.actionBtn, s.rejectBtn]}
                        onPress={() => openAction(item, 'reject')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close" size={15} color={colors.danger} />
                        <Text style={[s.actionText, { color: colors.danger }]}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.actionBtn, s.approveBtn]}
                        onPress={() => openAction(item, 'approve')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark" size={15} color={colors.success} />
                        <Text style={[s.actionText, { color: colors.success }]}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Action sheet */}
      <Modal visible={!!selected && !!action} animationType="slide" presentationStyle="pageSheet" transparent onRequestClose={closeModal}>
        <View style={sh.overlay}>
          <View style={sh.container}>
            <View style={sh.handle} />
            <View style={[sh.iconWrap, { backgroundColor: isApproving ? colors.successFaded : colors.dangerFaded }]}>
              <Ionicons
                name={isApproving ? 'checkmark-circle' : 'close-circle'}
                size={32}
                color={isApproving ? colors.success : colors.danger}
              />
            </View>
            <Text style={sh.heading}>{isApproving ? 'Approve payment' : 'Reject payment'}</Text>
            <Text style={sh.sub}>
              {isApproving
                ? `Approve ${formatMoney(selected?.source_amount ?? '0', selected?.source_currency ?? 'USD')} to ${selected?.beneficiary_name}?`
                : 'Reject this payment? Please provide a reason.'}
            </Text>
            <TextInput
              style={sh.input}
              value={comment}
              onChangeText={setComment}
              placeholder={isApproving ? 'Add a note (optional)' : 'Reason for rejection (required)'}
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={3}
            />
            <View style={sh.btnRow}>
              <Button label="Cancel" variant="outline" onPress={closeModal} style={sh.btn} />
              <Button
                label={isApproving ? 'Approve' : 'Reject'}
                variant={isApproving ? 'primary' : 'danger'}
                loading={approveMutation.isPending || rejectMutation.isPending}
                disabled={!isApproving && !comment.trim()}
                onPress={() => isApproving ? approveMutation.mutate() : rejectMutation.mutate()}
                style={sh.btn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const createStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: screenPadding, paddingTop: spacing.base, paddingBottom: spacing.md,
  },
  headerLeft: {},
  title: { fontSize: fontSize.xl, fontWeight: '800', color: c.textPrimary },
  subtitle: { fontSize: fontSize.xs, color: c.textMuted, marginTop: 2 },
  countBadge: {
    backgroundColor: c.warning + '22', borderRadius: radius.full,
    borderWidth: 1, borderColor: c.warning + '44',
    minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm,
  },
  countText: { fontSize: fontSize.xs, fontWeight: '800', color: c.warning },

  scroll: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },

  group: {
    backgroundColor: c.card,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: c.border,
    overflow: 'hidden',
  },

  card: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    gap: spacing.sm, position: 'relative',
  },
  cardBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  accentBar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: c.warning },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingLeft: spacing.xs },
  avatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: c.primaryFaded, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: fontSize.base, fontWeight: '800', color: c.primary },
  cardMeta: { flex: 1, gap: 2 },
  beneName: { fontSize: fontSize.sm, fontWeight: '700', color: c.textPrimary },
  cardSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardRoute: { fontSize: fontSize.xs, color: c.textSecondary, fontWeight: '500' },
  cardDot: { fontSize: fontSize.xs, color: c.textDisabled },
  cardTime: { fontSize: fontSize.xs, color: c.textMuted },
  amountCol: { alignItems: 'flex-end', flexShrink: 0 },
  amount: { fontSize: fontSize.sm, fontWeight: '800', color: c.textPrimary },
  destAmount: { fontSize: fontSize.xs, color: c.textMuted },

  chips: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.surface, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: c.border,
  },
  chipText: { fontSize: 10, color: c.textMuted, fontWeight: '500' },

  actions: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5,
  },
  rejectBtn:  { borderColor: c.danger + '50',  backgroundColor: c.dangerFaded  },
  approveBtn: { borderColor: c.success + '50', backgroundColor: c.successFaded },
  actionText: { fontSize: fontSize.sm, fontWeight: '700' },
})

const createSheetStyles = (c: Colors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  container: {
    backgroundColor: c.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, gap: spacing.base, paddingBottom: spacing['3xl'],
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: spacing.sm },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: c.textPrimary, textAlign: 'center' },
  sub: { fontSize: fontSize.sm, color: c.textMuted, textAlign: 'center', lineHeight: 20 },
  input: {
    backgroundColor: c.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.border,
    padding: spacing.md, color: c.textPrimary, fontSize: fontSize.sm,
    minHeight: 80, textAlignVertical: 'top',
  },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1 },
})
