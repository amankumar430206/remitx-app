import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
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
  flagged: { color: colors.danger, label: 'Flagged' },
}

export function BeneficiaryList() {
  const nav = useNavigation<Nav>()
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: () => beneficiariesApi.list({ limit: 100 }).then((r) => r.data.data),
  })

  const filtered = (data ?? []).filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.currency.toLowerCase().includes(search.toLowerCase()) ||
    b.country_code.toLowerCase().includes(search.toLowerCase())
  )

  const renderItem = ({ item }: { item: Beneficiary }) => {
    const cColor = currencyColor(item.currency)
    const screening = SCREENING_CONFIG[item.screening_status] ?? SCREENING_CONFIG.pending
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => nav.navigate('BeneficiaryDetail', { id: item.id })}
        activeOpacity={0.75}
      >
        <View style={[styles.cardAccent, { backgroundColor: cColor }]} />
        <View style={[styles.avatar, { backgroundColor: cColor + '22' }]}>
          <Text style={[styles.avatarText, { color: cColor }]}>{item.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.sub}>
            {item.country_code} · {item.currency}
            {item.bank_name ? ` · ${item.bank_name}` : ''}
          </Text>
        </View>
        <View style={[styles.screeningPill, { backgroundColor: screening.color + '22' }]}>
          <View style={[styles.screeningDot, { backgroundColor: screening.color }]} />
          <Text style={[styles.screeningText, { color: screening.color }]}>{screening.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Beneficiaries</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => nav.navigate('BeneficiaryNew')}
        >
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} style={styles.searchIcon} />
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

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          !isLoading
            ? (
              <EmptyState
                icon="people-outline"
                title="No beneficiaries yet"
                subtitle="Add a recipient to start sending international payments"
                actionLabel="Add beneficiary"
                onAction={() => nav.navigate('BeneficiaryNew')}
              />
            )
            : null
        }
      />
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
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: screenPadding, marginBottom: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary },

  list: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.base,
    overflow: 'hidden',
  },
  cardAccent: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 3 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize.base, fontWeight: '800' },
  meta: { flex: 1 },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  screeningPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  screeningDot: { width: 6, height: 6, borderRadius: 3 },
  screeningText: { fontSize: fontSize.xs, fontWeight: '600' },
})
