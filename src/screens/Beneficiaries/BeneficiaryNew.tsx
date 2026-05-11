import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { type NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import beneficiariesApi from '@/api/beneficiaries'
import { getApiError } from '@/utils/apiError'
import { useAlert } from '@/hooks/useAlert'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { type SettingsStackParamList } from '@/navigation/SettingsStack'

type Nav = NativeStackNavigationProp<SettingsStackParamList>

interface Props {
  /** When provided, used instead of nav.goBack() — allows use outside SettingsStack */
  onClose?: () => void
}

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', routing: 'routingNumber', routingLabel: 'Routing number' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', routing: 'sortCode', routingLabel: 'Sort code' },
  { code: 'IN', name: 'India', currency: 'INR', routing: 'ifscCode', routingLabel: 'IFSC code' },
  { code: 'AE', name: 'UAE', currency: 'AED', routing: 'iban', routingLabel: 'IBAN' },
  { code: 'DE', name: 'Europe (SEPA)', currency: 'EUR', routing: 'iban', routingLabel: 'IBAN' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', routing: 'routingNumber', routingLabel: 'Bank code' },
  { code: 'AU', name: 'Australia', currency: 'AUD', routing: 'routingNumber', routingLabel: 'BSB number' },
  { code: 'CA', name: 'Canada', currency: 'CAD', routing: 'routingNumber', routingLabel: 'Transit number' },
]

const PURPOSE_CODES = ['TRADE', 'SUPPLIER', 'SALARY', 'SERVICES', 'CONTRACTOR', 'OTHER']

export function BeneficiaryNew({ onClose }: Props = {}) {
  const { showAlert } = useAlert()
  const nav = useNavigation<Nav>()
  const qc = useQueryClient()

  const dismiss = () => {
    if (onClose) onClose()
    else nav.goBack()
  }

  const [name, setName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [routingValue, setRoutingValue] = useState('')
  const [swiftBic, setSwiftBic] = useState('')
  const [purposeCode, setPurposeCode] = useState('TRADE')
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [showPurposePicker, setShowPurposePicker] = useState(false)

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = {
        name: name.trim(),
        countryCode: selectedCountry.code,
        currency: selectedCountry.currency,
        purposeCode,
      }
      if (bankName.trim()) payload.bankName = bankName.trim()
      if (accountNumber.trim()) payload.accountNumber = accountNumber.trim()
      if (routingValue.trim()) payload[selectedCountry.routing] = routingValue.trim()
      if (swiftBic.trim()) payload.swiftBic = swiftBic.trim()
      return beneficiariesApi.create(payload as any)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beneficiaries'] })
      showAlert('Beneficiary added', `${name} has been saved.`, [
        { text: 'OK', onPress: dismiss },
      ])
    },
    onError: (err) => showAlert('Error', getApiError(err, 'Could not add beneficiary. Please check your details.')),
  })

  const canSubmit = name.trim().length > 0

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={dismiss} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Beneficiary</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Input label="Full name" value={name} onChangeText={setName} placeholder="John Smith" leftIcon="person-outline" />

        {/* Country picker */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Country & Currency</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowCountryPicker((v) => !v)}
          >
            <Text style={styles.pickerValue}>{selectedCountry.name} · {selectedCountry.currency}</Text>
            <Ionicons name={showCountryPicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
          </TouchableOpacity>
          {showCountryPicker && (
            <View style={styles.pickerList}>
              {COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.pickerItem, c.code === selectedCountry.code && styles.pickerItemActive]}
                  onPress={() => { setSelectedCountry(c); setShowCountryPicker(false); setRoutingValue('') }}
                >
                  <Text style={[styles.pickerItemText, c.code === selectedCountry.code && styles.pickerItemTextActive]}>
                    {c.name}
                  </Text>
                  <Text style={styles.pickerItemCcy}>{c.currency}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Input label="Bank name" value={bankName} onChangeText={setBankName} placeholder="e.g. Barclays Bank" leftIcon="business-outline" />
        <Input label="Account number" value={accountNumber} onChangeText={setAccountNumber} placeholder="Account number" leftIcon="card-outline" keyboardType="number-pad" />
        <Input
          label={selectedCountry.routingLabel}
          value={routingValue}
          onChangeText={setRoutingValue}
          placeholder={selectedCountry.routingLabel}
          leftIcon="git-branch-outline"
        />
        <Input label="SWIFT / BIC (optional)" value={swiftBic} onChangeText={setSwiftBic} placeholder="e.g. BARCGB22" leftIcon="globe-outline" autoCapitalize="characters" />

        {/* Purpose code */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Purpose</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowPurposePicker((v) => !v)}
          >
            <Text style={styles.pickerValue}>{purposeCode}</Text>
            <Ionicons name={showPurposePicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
          </TouchableOpacity>
          {showPurposePicker && (
            <View style={styles.pickerList}>
              {PURPOSE_CODES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.pickerItem, p === purposeCode && styles.pickerItemActive]}
                  onPress={() => { setPurposeCode(p); setShowPurposePicker(false) }}
                >
                  <Text style={[styles.pickerItemText, p === purposeCode && styles.pickerItemTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Button
          label="Add beneficiary"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!canSubmit}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.base,
  },
  backBtn: { padding: spacing.xs, marginLeft: -spacing.xs },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  scroll: { padding: screenPadding, gap: spacing.base, paddingBottom: spacing['3xl'] },

  field: { gap: spacing.xs },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.2 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md, minHeight: 52,
  },
  pickerValue: { fontSize: fontSize.md, color: colors.textPrimary },
  pickerList: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pickerItemActive: { backgroundColor: colors.primaryFaded },
  pickerItemText: { fontSize: fontSize.sm, color: colors.textPrimary },
  pickerItemTextActive: { color: colors.primary, fontWeight: '700' },
  pickerItemCcy: { fontSize: fontSize.xs, color: colors.textMuted },
})
