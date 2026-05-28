import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { type NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import beneficiariesApi, { type Beneficiary } from '@/api/beneficiaries'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { currencyColor } from '@/utils/format'
import { EmptyState } from '@/components/ui/EmptyState'
import { type SettingsStackParamList } from '@/navigation/SettingsStack'

type Nav = NativeStackNavigationProp<SettingsStackParamList>

const SCREENING_CONFIG = {
  cleared: { color: colors.success, label: 'Cleared' },
  pending: { color: colors.warning, label: 'Pending' },
  flagged:  { color: colors.danger,  label: 'Flagged' },
}

export function BeneficiaryList() {
  const nav = useNavigation<Nav>()
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: () => beneficiariesApi.list({ limit: 100 }).then((r) => r.data.data),
  })

  const filtered = (data ?? []).filter((b) =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.currency.toLowerCase().includes(search.toLowerCase()) ||
    b.country_code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.title}>Beneficiaries</Text>
          {data && data.length > 0 && (
            <Text style={styles.subtitle}>{data.length} saved</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => nav.navigate('BeneficiaryNew')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {filtered.length === 0 && !isLoading ? (
          <EmptyState
            icon="people-outline"
            title={search ? 'No results' : 'No beneficiaries yet'}
            subtitle={search ? 'Try a different search term' : 'Add a recipient to start sending international payments'}
            actionLabel={search ? undefined : 'Add beneficiary'}
            onAction={search ? undefined : () => nav.navigate('BeneficiaryNew')}
          />
        ) : (
          <>
            <View style={styles.group}>
              {filtered.map((item, idx) => {
                const cColor = currencyColor(item.currency)
                const screening = SCREENING_CONFIG[item.screening_status] ?? SCREENING_CONFIG.pending
                const isLast = idx === filtered.length - 1
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.row, !isLast && styles.rowBorder]}
                    onPress={() => nav.navigate('BeneficiaryDetail', { id: item.id })}
                    activeOpacity={0.65}
                  >
                    {/* Left accent */}
                    <View style={[styles.accentBar, { backgroundColor: cColor }]} />

                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: cColor + '22' }]}>
                      <Text style={[styles.avatarText, { color: cColor }]}>
                        {item.name[0]?.toUpperCase()}
                      </Text>
                    </View>

                    {/* Meta */}
                    <View style={styles.meta}>
                      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.sub}>
                        {item.country_code} · {item.currency}
                        {item.bank_name ? ` · ${item.bank_name}` : ''}
                      </Text>
                    </View>

                    {/* Screening + chevron */}
                    <View style={styles.right}>
                      <View style={[styles.screeningPill, { backgroundColor: screening.color + '22' }]}>
                        <View style={[styles.screeningDot, { backgroundColor: screening.color }]} />
                        <Text style={[styles.screeningText, { color: screening.color }]}>{screening.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} style={{ marginTop: 2 }} />
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Add another row */}
            <TouchableOpacity
              style={styles.addRow}
              onPress={() => nav.navigate('BeneficiaryNew')}
              activeOpacity={0.75}
            >
              <View style={styles.addRowIcon}>
                <Ionicons name="person-add-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.addRowText}>Add new beneficiary</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary + '80'} />
            </TouchableOpacity>
          </>
        )}
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
  headerMid: { flex: 1 },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: screenPadding, marginBottom: spacing.base,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary },

  scroll: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'], gap: spacing.md },

  // Grouped card
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    position: 'relative',
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  accentBar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: spacing.xs,
  },
  avatarText: { fontSize: fontSize.base, fontWeight: '800' },
  meta: { flex: 1 },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  screeningPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  screeningDot: { width: 5, height: 5, borderRadius: 3 },
  screeningText: { fontSize: 10, fontWeight: '600' },

  // Add another row
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primaryFaded,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.primary + '30',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  addRowIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center',
  },
  addRowText: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
})
