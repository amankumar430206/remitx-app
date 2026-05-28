import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList, Modal, ScrollView, KeyboardAvoidingView, Platform,
  TouchableOpacity, RefreshControl, ActivityIndicator, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import accountsApi, { type Account, type LedgerEntry } from '@/api/accounts'
import { useAuthStore } from '@/stores/authStore'
import { useAlert } from '@/hooks/useAlert'
import { getApiError } from '@/utils/apiError'
import { Input } from '@/components/ui/Input'
import { useColors, type Colors } from '@/hooks/useColors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatDateTime } from '@/utils/format'
import { EmptyState } from '@/components/ui/EmptyState'

const ADMIN_ROLES = new Set(['super_admin', 'client_admin'])

interface Props { account: Account; onClose: () => void }

export function AccountDetail({ account, onClose }: Props) {
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
  const user = useAuthStore(st => st.user)
  const isAdmin = ADMIN_ROLES.has(user?.role ?? '')
  const { showAlert } = useAlert()
  const qc = useQueryClient()

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustDesc, setAdjustDesc] = useState('')
  const [adjustError, setAdjustError] = useState('')

  const { data: freshAccount, isRefetching: isRefetchingAccount, refetch: refetchAccount } = useQuery({
    queryKey: ['accounts', account.id],
    queryFn: () => accountsApi.get(account.id).then((r) => r.data.data),
  })

  const { data, isLoading, isRefetching: isRefetchingLedger, refetch: refetchLedger } = useQuery({
    queryKey: ['ledger', account.id],
    queryFn: () => accountsApi.ledger(account.id, { limit: 50 }).then((r) => r.data.data),
  })

  const adjustMutation = useMutation({
    mutationFn: (payload: { type: 'credit' | 'debit'; amount: string; description: string }) =>
      accountsApi.adjust(account.id, payload).then(r => r.data.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['accounts', account.id] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['ledger', account.id] })
      closeAdjust()
      showAlert('Success', `Balance ${variables.type === 'credit' ? 'credited' : 'debited'} successfully.`)
    },
    onError: (err) => setAdjustError(getApiError(err, 'Adjustment failed. Please try again.')),
  })

  const isRefetching = isRefetchingAccount || isRefetchingLedger
  const refetch = () => { refetchAccount(); refetchLedger() }
  const displayBalance = freshAccount?.balance ?? account.balance

  const closeAdjust = () => {
    setAdjustOpen(false)
    setAdjustAmount('')
    setAdjustDesc('')
    setAdjustError('')
    setAdjustType('credit')
  }

  const handleAdjust = () => {
    setAdjustError('')
    const amt = parseFloat(adjustAmount)
    if (!adjustAmount || isNaN(amt) || amt <= 0) {
      setAdjustError('Enter a valid positive amount.')
      return
    }
    if (!adjustDesc.trim()) {
      setAdjustError('Description is required.')
      return
    }
    adjustMutation.mutate({ type: adjustType, amount: adjustAmount, description: adjustDesc.trim() })
  }

  const renderEntry = ({ item }: { item: LedgerEntry }) => {
    const isCredit = item.entry_type === 'credit'
    return (
      <View style={s.entry}>
        <View style={[s.entryIcon, isCredit ? s.creditIcon : s.debitIcon]}>
          <Ionicons
            name={isCredit ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={isCredit ? colors.success : colors.danger}
          />
        </View>
        <View style={s.entryMeta}>
          <Text style={s.entryDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={s.entryDate}>{formatDateTime(item.created_at)}</Text>
        </View>
        <View style={s.entryRight}>
          <Text style={[s.entryAmount, isCredit ? s.credit : s.debit]}>
            {isCredit ? '+' : '-'}{formatMoney(item.amount, item.currency)}
          </Text>
          <Text style={s.entryBalance}>{formatMoney(item.balance_after, item.currency)}</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.handleWrap}><View style={s.handle} /></View>

      <View style={s.header}>
        <Text style={s.title}>{account.currency} Account</Text>
        <View style={s.headerActions}>
          {isAdmin && (
            <TouchableOpacity onPress={() => setAdjustOpen(true)} style={s.adjustBtn} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={s.adjustBtnText}>Adjust</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={refetch} disabled={isRefetching} style={s.refreshBtn} activeOpacity={0.7}>
            {isRefetching
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="sync-outline" size={20} color={colors.textMuted} />
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance hero */}
      <View style={s.hero}>
        <Text style={s.heroLabel}>Available balance</Text>
        <Text style={s.heroBalance}>{formatMoney(displayBalance, account.currency)}</Text>
        {account.account_number && (
          <View style={s.acctNumRow}>
            <Ionicons name="card-outline" size={14} color={colors.textMuted} />
            <Text style={s.acctNum}>···· {account.account_number.slice(-4)}</Text>
          </View>
        )}
      </View>

      <Text style={s.sectionLabel}>Transaction history</Text>

      <FlatList
        data={data ?? []}
        keyExtractor={(i) => i.id}
        renderItem={renderEntry}
        refreshControl={<RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={
          !isLoading ? <EmptyState icon="receipt-outline" title="No transactions" subtitle="No ledger entries for this account" /> : null
        }
      />

      {/* Adjust balance modal — admin only */}
      <Modal visible={adjustOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeAdjust}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={s.modalSafe}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Adjust balance</Text>
              <TouchableOpacity onPress={closeAdjust}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>
              Manually credit or debit the {account.currency} account. A ledger entry will be created with the reason you provide.
            </Text>

            <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
              {/* Credit / Debit toggle */}
              <View style={s.typeToggle}>
                {(['credit', 'debit'] as const).map(t => (
                  <Pressable
                    key={t}
                    onPress={() => setAdjustType(t)}
                    style={[
                      s.typeBtn,
                      adjustType === t && (t === 'credit' ? s.typeBtnCredit : s.typeBtnDebit),
                    ]}
                  >
                    <Text style={[
                      s.typeBtnText,
                      adjustType === t && (t === 'credit' ? s.typeBtnTextCredit : s.typeBtnTextDebit),
                    ]}>
                      {t === 'credit' ? '+ Credit' : '− Debit'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label={`Amount (${account.currency})`}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={adjustAmount}
                onChangeText={setAdjustAmount}
              />

              <View style={{ marginTop: spacing.base }}>
                <Input
                  label="Reason / description"
                  placeholder="e.g. Manual top-up, Fee reversal…"
                  value={adjustDesc}
                  onChangeText={setAdjustDesc}
                />
              </View>

              {adjustError ? (
                <Text style={s.formError}>{adjustError}</Text>
              ) : null}
            </ScrollView>

            <View style={s.modalFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeAdjust} activeOpacity={0.7}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, adjustType === 'debit' && s.confirmBtnDebit]}
                onPress={handleAdjust}
                disabled={adjustMutation.isPending}
                activeOpacity={0.8}
              >
                {adjustMutation.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.confirmBtnText}>{adjustType === 'credit' ? 'Credit account' : 'Debit account'}</Text>
                }
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const createStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  handleWrap: { alignItems: 'center', paddingTop: spacing.sm },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: screenPadding, paddingVertical: spacing.base,
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: c.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
  adjustBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, borderWidth: 1, borderColor: c.primary },
  adjustBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: c.primary },

  modalSafe: { flex: 1, backgroundColor: c.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: screenPadding, paddingVertical: spacing.base },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: c.textPrimary },
  modalSub: { fontSize: fontSize.sm, color: c.textMuted, paddingHorizontal: screenPadding, marginBottom: spacing.lg, lineHeight: 20 },
  modalBody: { flex: 1, paddingHorizontal: screenPadding },
  modalFooter: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: screenPadding, paddingVertical: spacing.base, borderTopWidth: 1, borderTopColor: c.border },

  typeToggle: { flexDirection: 'row', borderWidth: 1, borderColor: c.border, borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.lg },
  typeBtn: { flex: 1, paddingVertical: spacing.sm + 2, alignItems: 'center', backgroundColor: c.surface },
  typeBtnCredit: { backgroundColor: c.success + '22' },
  typeBtnDebit: { backgroundColor: c.danger + '22' },
  typeBtnText: { fontSize: fontSize.sm, fontWeight: '600', color: c.textMuted },
  typeBtnTextCredit: { color: c.success },
  typeBtnTextDebit: { color: c.danger },

  formError: { fontSize: fontSize.sm, color: c.danger, marginTop: spacing.sm },

  cancelBtn: { flex: 1, paddingVertical: spacing.base, borderRadius: radius.lg, borderWidth: 1.5, borderColor: c.border, alignItems: 'center' },
  cancelBtnText: { fontSize: fontSize.md, fontWeight: '600', color: c.textSecondary },
  confirmBtn: { flex: 2, paddingVertical: spacing.base, borderRadius: radius.lg, backgroundColor: c.primary, alignItems: 'center' },
  confirmBtnDebit: { backgroundColor: c.danger },
  confirmBtnText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },

  hero: {
    alignItems: 'center', paddingVertical: spacing.xl,
    marginHorizontal: screenPadding, marginBottom: spacing.sm,
    backgroundColor: c.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: c.border, gap: spacing.xs,
  },
  heroLabel: { fontSize: fontSize.sm, color: c.textMuted },
  heroBalance: { fontSize: fontSize['3xl'], fontWeight: '800', color: c.textPrimary },
  acctNumRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  acctNum: { fontSize: fontSize.sm, color: c.textMuted },

  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: c.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: screenPadding, marginBottom: spacing.sm,
  },

  list: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },
  sep: { height: 1, backgroundColor: c.border, marginLeft: 60 },

  entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  entryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  creditIcon: { backgroundColor: c.successFaded },
  debitIcon: { backgroundColor: c.dangerFaded },
  entryMeta: { flex: 1 },
  entryDesc: { fontSize: fontSize.sm, fontWeight: '500', color: c.textPrimary },
  entryDate: { fontSize: fontSize.xs, color: c.textMuted, marginTop: 2 },
  entryRight: { alignItems: 'flex-end', gap: 2 },
  entryAmount: { fontSize: fontSize.sm, fontWeight: '700' },
  credit: { color: c.success },
  debit: { color: c.danger },
  entryBalance: { fontSize: fontSize.xs, color: c.textMuted },
})
