import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, TextInput, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import paymentsApi, { type Payment } from '@/api/payments'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatTimeAgo } from '@/utils/format'
import { getApiError } from '@/utils/apiError'
import { useAlert } from '@/hooks/useAlert'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function ApprovalQueue() {
  const { showAlert } = useAlert()
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Approval Queue</Text>
          {queue.length > 0 && (
            <Text style={styles.subtitle}>{queue.length} pending</Text>
          )}
        </View>
        {queue.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{queue.length}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          contentContainerStyle={styles.scroll}
        >
          {queue.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title="Queue is empty"
              subtitle="No payments awaiting your approval"
            />
          ) : (
            <View style={styles.group}>
              {queue.map((item, idx) => {
                const isLast = idx === queue.length - 1
                const initial = (item.beneficiary_name ?? 'B')[0].toUpperCase()
                return (
                  <View key={item.id} style={[styles.card, !isLast && styles.cardBorder]}>
                    {/* Warning accent bar */}
                    <View style={styles.accentBar} />

                    {/* Top row: avatar + bene + amount */}
                    <View style={styles.cardTop}>
                      <View style={styles.avatarWrap}>
                        <Text style={styles.avatarText}>{initial}</Text>
                      </View>
                      <View style={styles.cardMeta}>
                        <Text style={styles.beneName} numberOfLines={1}>
                          {item.beneficiary_name ?? 'Beneficiary'}
                        </Text>
                        <View style={styles.cardSubRow}>
                          <Text style={styles.cardRoute}>
                            {item.source_currency} → {item.dest_currency}
                          </Text>
                          <Text style={styles.cardDot}>·</Text>
                          <Text style={styles.cardTime}>{formatTimeAgo(item.created_at)}</Text>
                        </View>
                      </View>
                      <View style={styles.amountCol}>
                        <Text style={styles.amount}>{formatMoney(item.source_amount, item.source_currency)}</Text>
                        <Text style={styles.destAmount}>{formatMoney(item.dest_amount, item.dest_currency)}</Text>
                      </View>
                    </View>

                    {/* Meta chips */}
                    <View style={styles.chips}>
                      <View style={styles.chip}>
                        <Ionicons name="briefcase-outline" size={11} color={colors.textMuted} />
                        <Text style={styles.chipText}>{item.purpose_code}</Text>
                      </View>
                      {item.reference && (
                        <View style={styles.chip}>
                          <Ionicons name="document-text-outline" size={11} color={colors.textMuted} />
                          <Text style={styles.chipText}>{item.reference}</Text>
                        </View>
                      )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => openAction(item, 'reject')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close" size={15} color={colors.danger} />
                        <Text style={[styles.actionText, { color: colors.danger }]}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => openAction(item, 'approve')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark" size={15} color={colors.success} />
                        <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
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
        <View style={sheet.overlay}>
          <View style={sheet.container}>
            <View style={sheet.handle} />
            <View style={[sheet.iconWrap, { backgroundColor: isApproving ? colors.successFaded : colors.dangerFaded }]}>
              <Ionicons
                name={isApproving ? 'checkmark-circle' : 'close-circle'}
                size={32}
                color={isApproving ? colors.success : colors.danger}
              />
            </View>
            <Text style={sheet.heading}>{isApproving ? 'Approve payment' : 'Reject payment'}</Text>
            <Text style={sheet.sub}>
              {isApproving
                ? `Approve ${formatMoney(selected?.source_amount ?? '0', selected?.source_currency ?? 'USD')} to ${selected?.beneficiary_name}?`
                : 'Reject this payment? Please provide a reason.'}
            </Text>
            <TextInput
              style={sheet.input}
              value={comment}
              onChangeText={setComment}
              placeholder={isApproving ? 'Add a note (optional)' : 'Reason for rejection (required)'}
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={3}
            />
            <View style={sheet.btnRow}>
              <Button label="Cancel" variant="outline" onPress={closeModal} style={sheet.btn} />
              <Button
                label={isApproving ? 'Approve' : 'Reject'}
                variant={isApproving ? 'primary' : 'danger'}
                loading={approveMutation.isPending || rejectMutation.isPending}
                disabled={!isApproving && !comment.trim()}
                onPress={() => isApproving ? approveMutation.mutate() : rejectMutation.mutate()}
                style={sheet.btn}
              />
            </View>
          </View>
        </View>
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
  headerLeft: {},
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  countBadge: {
    backgroundColor: colors.warning + '22', borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.warning + '44',
    minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm,
  },
  countText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.warning },

  scroll: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },

  // Grouped card container
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },

  // Individual queue item (richer card with actions)
  card: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    gap: spacing.sm, position: 'relative',
  },
  cardBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  accentBar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: colors.warning },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingLeft: spacing.xs },
  avatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primaryFaded, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: fontSize.base, fontWeight: '800', color: colors.primary },
  cardMeta: { flex: 1, gap: 2 },
  beneName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  cardSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardRoute: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '500' },
  cardDot: { fontSize: fontSize.xs, color: colors.textDisabled },
  cardTime: { fontSize: fontSize.xs, color: colors.textMuted },
  amountCol: { alignItems: 'flex-end', flexShrink: 0 },
  amount: { fontSize: fontSize.sm, fontWeight: '800', color: colors.textPrimary },
  destAmount: { fontSize: fontSize.xs, color: colors.textMuted },

  chips: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },

  actions: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5,
  },
  rejectBtn:  { borderColor: colors.danger + '50',  backgroundColor: colors.dangerFaded  },
  approveBtn: { borderColor: colors.success + '50', backgroundColor: colors.successFaded },
  actionText: { fontSize: fontSize.sm, fontWeight: '700' },
})

const sheet = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, gap: spacing.base, paddingBottom: spacing['3xl'],
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, color: colors.textPrimary, fontSize: fontSize.sm,
    minHeight: 80, textAlignVertical: 'top',
  },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1 },
})
