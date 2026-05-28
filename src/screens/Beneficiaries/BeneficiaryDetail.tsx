import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import beneficiariesApi from '@/api/beneficiaries'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { currencyColor } from '@/utils/format'
import { type SettingsStackParamList } from '@/navigation/SettingsStack'

type Route = RouteProp<SettingsStackParamList, 'BeneficiaryDetail'>

const SCREENING_CONFIG: Record<string, { label: string; color: string }> = {
  cleared: { label: 'Cleared', color: colors.success },
  pending: { label: 'Pending review', color: colors.warning },
  flagged:  { label: 'Flagged', color: colors.danger },
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.infoValueMono]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  )
}

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={icon} size={13} color={colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

export function BeneficiaryDetail() {
  const nav = useNavigation()
  const route = useRoute<Route>()
  const { id } = route.params

  const { data: beneficiary, isLoading } = useQuery({
    queryKey: ['beneficiary', id],
    queryFn: () => beneficiariesApi.get(id).then((r) => r.data.data),
  })

  if (isLoading || !beneficiary) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Beneficiary</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingWrap}>
          <Ionicons name="person-outline" size={32} color={colors.textDisabled} />
          <Text style={styles.loadingText}>{isLoading ? 'Loading…' : 'Not found'}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const cColor = currencyColor(beneficiary.currency)
  const screening = SCREENING_CONFIG[beneficiary.screening_status] ?? SCREENING_CONFIG.pending
  const initials = beneficiary.name[0]?.toUpperCase() ?? '?'

  const accountDisplay = beneficiary.iban ?? beneficiary.account_number ?? null
  const routingLabel = beneficiary.sort_code
    ? 'Sort code'
    : beneficiary.ifsc_code
    ? 'IFSC code'
    : 'Routing number'
  const routingDisplay = beneficiary.routing_number ?? beneficiary.sort_code ?? beneficiary.ifsc_code ?? null

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Beneficiary</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[styles.hero, { borderTopColor: cColor }]}>
          <View style={[styles.heroAvatar, { backgroundColor: cColor + '22' }]}>
            <Text style={[styles.heroInitials, { color: cColor }]}>{initials}</Text>
          </View>
          <Text style={styles.heroName}>{beneficiary.name}</Text>
          <View style={styles.heroBadgeRow}>
            <View style={[styles.currencyBadge, { backgroundColor: cColor + '22' }]}>
              <Text style={[styles.currencyBadgeText, { color: cColor }]}>{beneficiary.currency}</Text>
            </View>
            <View style={[styles.screeningBadge, { backgroundColor: screening.color + '22' }]}>
              <View style={[styles.screeningDot, { backgroundColor: screening.color }]} />
              <Text style={[styles.screeningText, { color: screening.color }]}>{screening.label}</Text>
            </View>
          </View>
        </View>

        {/* Identity */}
        <SectionHeader icon="person-outline" title="Identity" />
        <View style={styles.card}>
          <InfoRow label="Full name" value={beneficiary.name} />
          <InfoRow label="Country" value={beneficiary.country_code} />
          <InfoRow label="Currency" value={beneficiary.currency} />
        </View>

        {/* Banking */}
        <SectionHeader icon="business-outline" title="Banking" />
        <View style={styles.card}>
          <InfoRow label="Bank name" value={beneficiary.bank_name ?? '—'} />
          {accountDisplay && (
            <InfoRow label={beneficiary.iban ? 'IBAN' : 'Account number'} value={accountDisplay} mono />
          )}
          {routingDisplay && (
            <InfoRow label={routingLabel} value={routingDisplay} mono />
          )}
          {beneficiary.swift_bic && (
            <InfoRow label="SWIFT / BIC" value={beneficiary.swift_bic} mono />
          )}
        </View>

        {/* Meta */}
        <SectionHeader icon="information-circle-outline" title="Details" />
        <View style={styles.card}>
          <InfoRow label="Status" value={beneficiary.is_active ? 'Active' : 'Inactive'} />
          <InfoRow label="Added" value={new Date(beneficiary.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
          <InfoRow label="ID" value={beneficiary.id} mono />
        </View>

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
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { fontSize: fontSize.sm, color: colors.textMuted },

  scroll: { padding: screenPadding, gap: spacing.md, paddingBottom: spacing['3xl'] },

  hero: {
    alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, borderTopWidth: 3,
  },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  heroInitials: { fontSize: fontSize['2xl'], fontWeight: '800' },
  heroName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.textPrimary },
  heroBadgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  currencyBadge: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3 },
  currencyBadgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  screeningBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 3 },
  screeningDot: { width: 6, height: 6, borderRadius: 3 },
  screeningText: { fontSize: fontSize.xs, fontWeight: '600' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs,
  },
  sectionIconWrap: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: colors.primaryFaded, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },

  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border + '80',
  },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted, flex: 1, paddingTop: 1 },
  infoValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, textAlign: 'right', flex: 1.5 },
  infoValueMono: { fontFamily: 'monospace', fontSize: fontSize.xs, color: colors.textSecondary },
})
