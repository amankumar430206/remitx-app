import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import beneficiariesApi, { type Beneficiary } from '@/api/beneficiaries'
import fxApi, { type FxQuote } from '@/api/fx'
import paymentsApi from '@/api/payments'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius } from '@/theme/spacing'
import { formatMoney, generateIdempotencyKey } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Card } from '@/components/ui/Card'

type Step = 'beneficiary' | 'amount' | 'review' | 'done'

interface Props { onClose: () => void }

const PURPOSE_CODES = ['TRADE', 'SALARY', 'FAMILY', 'INVEST', 'TRAVEL', 'OTHER']

export function NewPayment({ onClose }: Props) {
  const [step, setStep] = useState<Step>('beneficiary')
  const [selectedBene, setSelectedBene] = useState<Beneficiary | null>(null)
  const [amount, setAmount] = useState('')
  const [purposeCode, setPurposeCode] = useState('TRADE')
  const [reference, setReference] = useState('')
  const [quote, setQuote] = useState<FxQuote | null>(null)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idempotencyKey = useRef(generateIdempotencyKey())

  const { data: benes, isLoading: loadingBenes } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: () => beneficiariesApi.list({ limit: 50 }).then((r) => r.data.data),
  })

  const quoteMutation = useMutation({
    mutationFn: () => fxApi.quote('USD', selectedBene!.currency, amount).then((r) => r.data.data),
    onSuccess: (q) => {
      setQuote(q)
      const secs = Math.floor((new Date(q.expiresAt).getTime() - Date.now()) / 1000)
      setCountdown(secs)
      setStep('review')
    },
    onError: () => Alert.alert('Error', 'Could not get FX quote. Please try again.'),
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      paymentsApi.submit({
        beneficiaryId: selectedBene!.id,
        quoteId: quote!.quoteId,
        sourceAmount: amount,
        sourceCurrency: 'USD',
        destinationCurrency: selectedBene!.currency,
        purposeCode,
        reference: reference || undefined,
      }, idempotencyKey.current).then((r) => r.data.data),
    onSuccess: () => setStep('done'),
    onError: () => Alert.alert('Error', 'Payment submission failed. Please try again.'),
  })

  // Countdown timer for FX quote
  useEffect(() => {
    if (step === 'review' && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current!)
            Alert.alert('Quote expired', 'The FX rate has expired. Please get a new quote.', [
              { text: 'Get new quote', onPress: () => { setStep('amount'); setQuote(null) } },
            ])
            return 0
          }
          return c - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [step, quote])

  // ─── Step: Beneficiary ───────────────────────────────────────────────────
  if (step === 'beneficiary') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="New Payment" subtitle="Step 1 of 3 — Select recipient" onBack={onClose} />
        <StepBar current={0} />
        {loadingBenes ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {(benes ?? []).filter((b) => b.is_active).map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.beneRow}
                onPress={() => { setSelectedBene(b); setStep('amount') }}
                activeOpacity={0.75}
              >
                <View style={styles.beneAvatar}>
                  <Text style={styles.beneAvatarText}>{b.name[0]}</Text>
                </View>
                <View style={styles.beneMeta}>
                  <Text style={styles.beneName}>{b.name}</Text>
                  <Text style={styles.beneInfo}>{b.bank_name ?? b.country_code} · {b.currency}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
            {(benes ?? []).length === 0 && (
              <Text style={styles.emptyText}>No active beneficiaries found.</Text>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    )
  }

  // ─── Step: Amount + purpose ──────────────────────────────────────────────
  if (step === 'amount') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="New Payment" subtitle="Step 2 of 3 — Amount & purpose" onBack={() => setStep('beneficiary')} />
        <StepBar current={1} />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card style={styles.beneCard}>
            <Text style={styles.fieldLabel}>Sending to</Text>
            <Text style={styles.beneName}>{selectedBene?.name}</Text>
            <Text style={styles.beneInfo}>{selectedBene?.bank_name} · {selectedBene?.currency}</Text>
          </Card>

          <View style={styles.amountWrap}>
            <Text style={styles.fieldLabel}>Amount (USD)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textDisabled}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Purpose</Text>
          <View style={styles.purposeGrid}>
            {PURPOSE_CODES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.purposeChip, purposeCode === p && styles.purposeChipActive]}
                onPress={() => setPurposeCode(p)}
              >
                <Text style={[styles.purposeChipText, purposeCode === p && styles.purposeChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Reference (optional)"
            value={reference}
            onChangeText={setReference}
            placeholder="Invoice #, note..."
            leftIcon="document-text-outline"
          />

          <Button
            label="Get FX Quote"
            onPress={() => quoteMutation.mutate()}
            loading={quoteMutation.isPending}
            disabled={!amount || parseFloat(amount) <= 0}
            style={styles.actionBtn}
          />
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─── Step: Review ────────────────────────────────────────────────────────
  if (step === 'review' && quote) {
    const mins = Math.floor(countdown / 60)
    const secs = countdown % 60
    const urgentTimer = countdown < 30

    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="New Payment" subtitle="Step 3 of 3 — Review & confirm" onBack={() => { setStep('amount'); setQuote(null) }} />
        <StepBar current={2} />
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* FX countdown */}
          <View style={[styles.timerBanner, urgentTimer && styles.timerBannerUrgent]}>
            <Ionicons name="time-outline" size={16} color={urgentTimer ? colors.danger : colors.warning} />
            <Text style={[styles.timerText, urgentTimer && styles.timerTextUrgent]}>
              Rate expires in {mins}:{String(secs).padStart(2, '0')}
            </Text>
          </View>

          <Card style={styles.reviewCard}>
            {[
              { label: 'Recipient', value: selectedBene?.name ?? '' },
              { label: 'Bank', value: selectedBene?.bank_name ?? selectedBene?.country_code ?? '' },
              { label: 'You send', value: formatMoney(amount, 'USD') },
              { label: 'They receive', value: formatMoney(quote.toAmount, quote.to) },
              { label: 'Exchange rate', value: `1 USD = ${parseFloat(quote.rate).toFixed(4)} ${quote.to}` },
              { label: 'Purpose', value: purposeCode },
              ...(reference ? [{ label: 'Reference', value: reference }] : []),
            ].map(({ label, value }) => (
              <View key={label} style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{label}</Text>
                <Text style={styles.reviewValue}>{value}</Text>
              </View>
            ))}
          </Card>

          <Button
            label="Confirm & Send"
            onPress={() => submitMutation.mutate()}
            loading={submitMutation.isPending}
            style={styles.actionBtn}
          />
          <Button label="Cancel" variant="ghost" onPress={onClose} style={styles.cancelBtn} />
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─── Step: Done ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.doneContainer}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark-circle" size={56} color={colors.success} />
        </View>
        <Text style={styles.doneTitle}>Payment submitted!</Text>
        <Text style={styles.doneSub}>
          Your payment to {selectedBene?.name} is being processed.
        </Text>
        <Button label="Done" onPress={onClose} style={styles.actionBtn} />
      </View>
    </SafeAreaView>
  )
}

function StepBar({ current }: { current: number }) {
  return (
    <View style={bar.wrap}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[bar.seg, i <= current && bar.segActive]} />
      ))}
    </View>
  )
}

const bar = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  seg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border },
  segActive: { backgroundColor: colors.primary },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, gap: spacing.base, paddingBottom: spacing['3xl'] },
  loader: { marginTop: spacing['2xl'] },

  beneRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.base, marginBottom: spacing.sm,
  },
  beneAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryFaded, alignItems: 'center', justifyContent: 'center',
  },
  beneAvatarText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  beneMeta: { flex: 1 },
  beneName: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  beneInfo: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing['2xl'] },

  beneCard: { marginBottom: spacing.xs },
  fieldLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.xs },

  amountWrap: { gap: spacing.xs },
  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary, paddingHorizontal: spacing.base, minHeight: 64 },
  currencySymbol: { fontSize: fontSize['2xl'], fontWeight: '300', color: colors.textMuted, marginRight: spacing.sm },
  amountInput: { flex: 1, fontSize: fontSize['3xl'], fontWeight: '700', color: colors.textPrimary },

  purposeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  purposeChip: { borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  purposeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  purposeChipText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '500' },
  purposeChipTextActive: { color: colors.white },

  timerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.warningFaded, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.warning + '44',
  },
  timerBannerUrgent: { backgroundColor: colors.dangerFaded, borderColor: colors.danger + '44' },
  timerText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.warning },
  timerTextUrgent: { color: colors.danger },

  reviewCard: { gap: spacing.sm },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  reviewValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, textAlign: 'right', flex: 1, marginLeft: spacing.md },

  actionBtn: { marginTop: spacing.sm },
  cancelBtn: { marginTop: spacing.xs },

  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.base },
  doneIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.successFaded, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  doneTitle: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.textPrimary },
  doneSub: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
})
