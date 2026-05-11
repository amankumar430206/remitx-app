import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
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

  const openAction = (p: Payment, act: 'approve' | 'reject') => {
    setSelected(p); setAction(act)
  }

  const renderItem = ({ item }: { item: Payment }) => (
    <View style={styles.card}>
      <View style={styles.cardAccent} />
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(item.beneficiary_name ?? 'B')[0]}</Text>
          </View>
          <View>
            <Text style={styles.bene} numberOfLines={1}>{item.beneficiary_name ?? 'Beneficiary'}</Text>
            <Text style={styles.time}>{formatTimeAgo(item.created_at)}</Text>
          </View>
        </View>
        <View style={styles.amountCol}>
          <Text style={styles.amount}>{formatMoney(item.source_amount, item.source_currency)}</Text>
          <Text style={styles.dest}>→ {formatMoney(item.dest_amount, item.dest_currency)}</Text>
        </View>
      </View>

      <View style={styles.meta}>
        <View style={styles.metaChip}>
          <Ionicons name="briefcase-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{item.purpose_code}</Text>
        </View>
        {item.reference && (
          <View style={styles.metaChip}>
            <Ionicons name="document-text-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.reference}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => openAction(item, 'reject')}
        >
          <Ionicons name="close" size={16} color={colors.danger} />
          <Text style={[styles.actionText, { color: colors.danger }]}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => openAction(item, 'approve')}
        >
          <Ionicons name="checkmark" size={16} color={colors.success} />
          <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const isApproving = action === 'approve'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Approval Queue</Text>
        {data && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{data.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState icon="checkmark-circle-outline" title="Queue is empty" subtitle="No payments awaiting your approval" />
          ) : <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
        }
      />

      {/* Action modal */}
      <Modal visible={!!selected && !!action} animationType="slide" presentationStyle="pageSheet" transparent onRequestClose={closeModal}>
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <View style={modal.handle} />
            <View style={[modal.iconRow, { backgroundColor: isApproving ? colors.successFaded : colors.dangerFaded }]}>
              <Ionicons name={isApproving ? 'checkmark-circle' : 'close-circle'} size={32} color={isApproving ? colors.success : colors.danger} />
            </View>
            <Text style={modal.heading}>{isApproving ? 'Approve payment' : 'Reject payment'}</Text>
            <Text style={modal.sub}>
              {isApproving
                ? `Approve ${formatMoney(selected?.source_amount ?? '0', selected?.source_currency ?? 'USD')} to ${selected?.beneficiary_name}?`
                : `Reject this payment? Please provide a reason.`}
            </Text>

            <TextInput
              style={modal.input}
              value={comment}
              onChangeText={setComment}
              placeholder={isApproving ? 'Add a note (optional)' : 'Reason for rejection (required)'}
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={3}
            />

            <View style={modal.btns}>
              <Button label="Cancel" variant="outline" onPress={closeModal} style={modal.btn} />
              <Button
                label={isApproving ? 'Approve' : 'Reject'}
                variant={isApproving ? 'primary' : 'danger'}
                loading={approveMutation.isPending || rejectMutation.isPending}
                disabled={!isApproving && !comment.trim()}
                onPress={() => isApproving ? approveMutation.mutate() : rejectMutation.mutate()}
                style={modal.btn}
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
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.base,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  countBadge: { backgroundColor: colors.primary, borderRadius: radius.full, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs },
  countText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.white },

  list: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.base, gap: spacing.md, overflow: 'hidden' },
  cardAccent: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, backgroundColor: colors.warning },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryFaded, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize.base, fontWeight: '700', color: colors.primary },
  bene: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, maxWidth: 140 },
  time: { fontSize: fontSize.xs, color: colors.textMuted },
  amountCol: { alignItems: 'flex-end' },
  amount: { fontSize: fontSize.base, fontWeight: '800', color: colors.textPrimary },
  dest: { fontSize: fontSize.xs, color: colors.textMuted },

  meta: { flexDirection: 'row', gap: spacing.sm },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  metaText: { fontSize: fontSize.xs, color: colors.textMuted },

  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1.5 },
  rejectBtn: { borderColor: colors.danger, backgroundColor: colors.dangerFaded },
  approveBtn: { borderColor: colors.success, backgroundColor: colors.successFaded },
  actionText: { fontSize: fontSize.sm, fontWeight: '700' },
})

const modal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, gap: spacing.base, paddingBottom: spacing['3xl'] },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm },
  iconRow: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, color: colors.textPrimary, fontSize: fontSize.sm, minHeight: 80, textAlignVertical: 'top',
  },
  btns: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1 },
})
