import React, { useMemo, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { type NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import beneficiariesApi from '@/api/beneficiaries'
import { useColors, type Colors } from '@/hooks/useColors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { currencyColor } from '@/utils/format'
import { EmptyState } from '@/components/ui/EmptyState'
import { type SettingsStackParamList } from '@/navigation/SettingsStack'

type Nav = NativeStackNavigationProp<SettingsStackParamList>

// Semantic colors — theme-independent
const SCREENING_CONFIG = {
  cleared: { color: '#10B981', label: 'Cleared' },
  pending: { color: '#F59E0B', label: 'Pending' },
  flagged: { color: '#EF4444', label: 'Flagged' },
}

type ScreeningFilter = '' | 'cleared' | 'pending' | 'flagged'

const SCREENING_CHIPS: { label: string; value: ScreeningFilter; color: string }[] = [
  { label: 'All',     value: '',        color: '' },
  { label: 'Cleared', value: 'cleared', color: '#10B981' },
  { label: 'Pending', value: 'pending', color: '#F59E0B' },
  { label: 'Flagged', value: 'flagged', color: '#EF4444' },
]

export function BeneficiaryList() {
  const nav = useNavigation<Nav>()
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])
  const [search, setSearch]         = useState('')
  const [screening, setScreening]   = useState<ScreeningFilter>('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: () => beneficiariesApi.list({ limit: 100 }).then((r) => r.data.data),
  })

  const filtered = (data ?? []).filter((b) => {
    const matchSearch = !search
      || b.name.toLowerCase().includes(search.toLowerCase())
      || b.currency.toLowerCase().includes(search.toLowerCase())
      || b.country_code.toLowerCase().includes(search.toLowerCase())
    const matchScreening = !screening || b.screening_status === screening
    return matchSearch && matchScreening
  })

  const isFiltered = !!search || !!screening
  const clearFilters = () => { setSearch(''); setScreening('') }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.title}>Beneficiaries</Text>
          {data && data.length > 0 && (
            <Text style={s.subtitle}>
              {filtered.length}{isFiltered && filtered.length !== data.length ? ` of ${data.length}` : ''} saved
            </Text>
          )}
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => nav.navigate('BeneficiaryNew')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, currency, country…"
          placeholderTextColor={colors.textDisabled}
          autoCapitalize="none"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Screening status chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow}
        style={s.chipScroll}
      >
        {SCREENING_CHIPS.map(chip => {
          const isActive = screening === chip.value
          const accentColor = chip.color || colors.primary
          return (
            <TouchableOpacity
              key={chip.value}
              style={[
                s.chip,
                isActive && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
              onPress={() => setScreening(chip.value)}
              activeOpacity={0.7}
            >
              {chip.color ? (
                <View style={[s.chipDot, { backgroundColor: isActive ? colors.white : chip.color }]} />
              ) : null}
              <Text style={[s.chipText, isActive && s.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          )
        })}

        {isFiltered && (
          <TouchableOpacity style={s.clearChip} onPress={clearFilters} activeOpacity={0.7}>
            <Ionicons name="close" size={12} color={colors.danger} />
            <Text style={s.clearChipText}>Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={s.scroll}
      >
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon="people-outline"
            title={isFiltered ? 'No results' : 'No beneficiaries yet'}
            subtitle={isFiltered ? 'Try a different search or filter' : 'Add a recipient to start sending international payments'}
            actionLabel={isFiltered ? 'Clear filters' : 'Add beneficiary'}
            onAction={isFiltered ? clearFilters : () => nav.navigate('BeneficiaryNew')}
          />
        ) : (
          <>
            <View style={s.group}>
              {filtered.map((item, idx) => {
                const cColor = currencyColor(item.currency)
                const screeningCfg = SCREENING_CONFIG[item.screening_status as keyof typeof SCREENING_CONFIG] ?? SCREENING_CONFIG.pending
                const isLast = idx === filtered.length - 1
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.row, !isLast && s.rowBorder]}
                    onPress={() => nav.navigate('BeneficiaryDetail', { id: item.id })}
                    activeOpacity={0.65}
                  >
                    <View style={[s.accentBar, { backgroundColor: cColor }]} />
                    <View style={[s.avatar, { backgroundColor: cColor + '22' }]}>
                      <Text style={[s.avatarText, { color: cColor }]}>{item.name[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={s.meta}>
                      <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.sub}>
                        {item.country_code} · {item.currency}
                        {item.bank_name ? ` · ${item.bank_name}` : ''}
                      </Text>
                    </View>
                    <View style={s.right}>
                      <View style={[s.screeningPill, { backgroundColor: screeningCfg.color + '22' }]}>
                        <View style={[s.screeningDot, { backgroundColor: screeningCfg.color }]} />
                        <Text style={[s.screeningText, { color: screeningCfg.color }]}>{screeningCfg.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} style={{ marginTop: 2 }} />
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            <TouchableOpacity style={s.addRow} onPress={() => nav.navigate('BeneficiaryNew')} activeOpacity={0.75}>
              <View style={s.addRowIcon}>
                <Ionicons name="person-add-outline" size={18} color={colors.primary} />
              </View>
              <Text style={s.addRowText}>Add new beneficiary</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary + '80'} />
            </TouchableOpacity>
          </>
        )}
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
  headerMid: { flex: 1 },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: c.textPrimary },
  subtitle: { fontSize: fontSize.xs, color: c.textMuted, marginTop: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: screenPadding, marginBottom: spacing.sm,
    backgroundColor: c.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: c.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: c.textPrimary },

  chipScroll: { marginBottom: spacing.sm },
  chipRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: screenPadding,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full, borderWidth: 1, borderColor: c.border,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    backgroundColor: c.surface,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: fontSize.xs, fontWeight: '600', color: c.textMuted },
  chipTextActive: { color: c.white },

  clearChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, borderWidth: 1, borderColor: c.danger + '50',
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    backgroundColor: c.dangerFaded,
  },
  clearChipText: { fontSize: fontSize.xs, fontWeight: '600', color: c.danger },

  scroll: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'], gap: spacing.md },

  group: {
    backgroundColor: c.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md, position: 'relative',
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  accentBar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: spacing.xs },
  avatarText: { fontSize: fontSize.base, fontWeight: '800' },
  meta: { flex: 1 },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: c.textPrimary },
  sub: { fontSize: fontSize.xs, color: c.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  screeningPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  screeningDot: { width: 5, height: 5, borderRadius: 3 },
  screeningText: { fontSize: 10, fontWeight: '600' },

  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: c.primaryFaded, borderRadius: radius.xl,
    borderWidth: 1, borderColor: c.primary + '30',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  addRowIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.primary + '22', alignItems: 'center', justifyContent: 'center' },
  addRowText: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: c.primary },
})
