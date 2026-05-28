import React, { useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import beneficiariesApi from '@/api/beneficiaries'
import { useColors, type Colors } from '@/hooks/useColors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { currencyColor } from '@/utils/format'
import { type SettingsStackParamList } from '@/navigation/SettingsStack'

type Route = RouteProp<SettingsStackParamList, 'BeneficiaryDetail'>

// Semantic colors — theme-independent
const SCREENING_CONFIG: Record<string, { label: string; color: string }> = {
  cleared: { label: 'Cleared',        color: '#10B981' },
  pending: { label: 'Pending review', color: '#F59E0B' },
  flagged: { label: 'Flagged',        color: '#EF4444' },
}

function InfoRow({ label, value, mono, colors, s }: {
  label: string; value: string; mono?: boolean
  colors: Colors; s: ReturnType<typeof createStyles>
}) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, mono && s.infoValueMono]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  )
}

function SectionHeader({ icon, title, colors, s }: {
  icon: keyof typeof Ionicons.glyphMap; title: string
  colors: Colors; s: ReturnType<typeof createStyles>
}) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionIconWrap}>
        <Ionicons name={icon} size={13} color={colors.primary} />
      </View>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  )
}

export function BeneficiaryDetail() {
  const nav = useNavigation()
  const route = useRoute<Route>()
  const { id } = route.params
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])

  const { data: beneficiary, isLoading } = useQuery({
    queryKey: ['beneficiary', id],
    queryFn: () => beneficiariesApi.get(id).then((r) => r.data.data),
  })

  if (isLoading || !beneficiary) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.title}>Beneficiary</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.loadingWrap}>
          <Ionicons name="person-outline" size={32} color={colors.textDisabled} />
          <Text style={s.loadingText}>{isLoading ? 'Loading…' : 'Not found'}</Text>
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Beneficiary</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[s.hero, { borderTopColor: cColor }]}>
          <View style={[s.heroAvatar, { backgroundColor: cColor + '22' }]}>
            <Text style={[s.heroInitials, { color: cColor }]}>{initials}</Text>
          </View>
          <Text style={s.heroName}>{beneficiary.name}</Text>
          <View style={s.heroBadgeRow}>
            <View style={[s.currencyBadge, { backgroundColor: cColor + '22' }]}>
              <Text style={[s.currencyBadgeText, { color: cColor }]}>{beneficiary.currency}</Text>
            </View>
            <View style={[s.screeningBadge, { backgroundColor: screening.color + '22' }]}>
              <View style={[s.screeningDot, { backgroundColor: screening.color }]} />
              <Text style={[s.screeningText, { color: screening.color }]}>{screening.label}</Text>
            </View>
          </View>
        </View>

        <SectionHeader icon="person-outline" title="Identity" colors={colors} s={s} />
        <View style={s.card}>
          <InfoRow label="Full name" value={beneficiary.name} colors={colors} s={s} />
          <InfoRow label="Country" value={beneficiary.country_code} colors={colors} s={s} />
          <InfoRow label="Currency" value={beneficiary.currency} colors={colors} s={s} />
        </View>

        <SectionHeader icon="business-outline" title="Banking" colors={colors} s={s} />
        <View style={s.card}>
          <InfoRow label="Bank name" value={beneficiary.bank_name ?? '—'} colors={colors} s={s} />
          {accountDisplay && (
            <InfoRow label={beneficiary.iban ? 'IBAN' : 'Account number'} value={accountDisplay} mono colors={colors} s={s} />
          )}
          {routingDisplay && (
            <InfoRow label={routingLabel} value={routingDisplay} mono colors={colors} s={s} />
          )}
          {beneficiary.swift_bic && (
            <InfoRow label="SWIFT / BIC" value={beneficiary.swift_bic} mono colors={colors} s={s} />
          )}
        </View>

        <SectionHeader icon="information-circle-outline" title="Details" colors={colors} s={s} />
        <View style={s.card}>
          <InfoRow label="Status" value={beneficiary.is_active ? 'Active' : 'Inactive'} colors={colors} s={s} />
          <InfoRow label="Added" value={new Date(beneficiary.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} colors={colors} s={s} />
          <InfoRow label="ID" value={beneficiary.id} mono colors={colors} s={s} />
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.base,
  },
  backBtn: { padding: spacing.xs, marginLeft: -spacing.xs },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: '800', color: c.textPrimary },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { fontSize: fontSize.sm, color: c.textMuted },

  scroll: { padding: screenPadding, gap: spacing.md, paddingBottom: spacing['3xl'] },

  hero: {
    alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm,
    backgroundColor: c.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: c.border, borderTopWidth: 3,
  },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  heroInitials: { fontSize: fontSize['2xl'], fontWeight: '800' },
  heroName: { fontSize: fontSize.lg, fontWeight: '800', color: c.textPrimary },
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
    backgroundColor: c.primaryFaded, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '700', color: c.textPrimary },

  card: {
    backgroundColor: c.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.border + '80',
  },
  infoLabel: { fontSize: fontSize.xs, color: c.textMuted, flex: 1, paddingTop: 1 },
  infoValue: { fontSize: fontSize.sm, fontWeight: '600', color: c.textPrimary, textAlign: 'right', flex: 1.5 },
  infoValueMono: { fontFamily: 'monospace', fontSize: fontSize.xs, color: c.textSecondary },
})
