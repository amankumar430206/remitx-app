import React, { useState, useMemo, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, Animated, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useQuery } from '@tanstack/react-query'
import paymentsApi, { type Payment } from '@/api/payments'
import { useColors, type Colors } from '@/hooks/useColors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatMoney, formatTimeAgo, statusColor } from '@/utils/format'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaymentDetail } from './PaymentDetail'
import { NewPayment } from './NewPayment'

// ─── Types ────────────────────────────────────────────────────────────────────

type Preset = '7d' | '30d' | '3m' | '6m' | 'custom'
type DateRange = { from: Date | null; to: Date | null }
type Section = { title: string; data: Payment[] }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRESETS: { label: string; value: Preset }[] = [
  { label: '7D',  value: '7d'  },
  { label: '30D', value: '30d' },
  { label: '3M',  value: '3m'  },
  { label: '6M',  value: '6m'  },
  { label: 'Custom', value: 'custom' },
]

const STATUS_FILTERS = [
  { label: 'All',        value: '' },
  { label: 'Pending',    value: 'pending_approval' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed',  value: 'completed' },
  { label: 'Rejected',   value: 'rejected' },
]

function presetToRange(preset: Preset): DateRange {
  const to = new Date(); to.setHours(23, 59, 59, 999)
  const from = new Date(); from.setHours(0, 0, 0, 0)
  if (preset === '7d')  from.setDate(from.getDate() - 6)
  if (preset === '30d') from.setDate(from.getDate() - 29)
  if (preset === '3m')  from.setMonth(from.getMonth() - 3)
  if (preset === '6m')  from.setMonth(from.getMonth() - 6)
  return { from, to }
}

function toIso(d: Date) { return d.toISOString().slice(0, 10) }

function fmtShort(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupByDate(payments: Payment[]): Section[] {
  const map = new Map<string, Payment[]>()
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  for (const p of payments) {
    const d = new Date(p.created_at)
    let key: string
    if (d.toDateString() === today.toDateString())     key = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday'
    else key = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
}

// ─── PaymentRow ───────────────────────────────────────────────────────────────

function PaymentRow({ item, isLast, onPress, s, colors }: {
  item: Payment
  isLast: boolean
  onPress: () => void
  s: ReturnType<typeof createStyles>
  colors: Colors
}) {
  const sc = statusColor(item.status)
  return (
    <TouchableOpacity
      style={[s.row, !isLast && s.rowBorder]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View style={[s.rowIcon, { backgroundColor: sc + '18' }]}>
        <Ionicons name="swap-horizontal" size={19} color={sc} />
      </View>
      <View style={s.rowMeta}>
        <Text style={s.rowBene} numberOfLines={1}>{item.beneficiary_name ?? 'Beneficiary'}</Text>
        <View style={s.rowSubRow}>
          <Text style={s.rowRoute}>{item.source_currency}</Text>
          <Ionicons name="arrow-forward" size={10} color={colors.textDisabled} />
          <Text style={s.rowRoute}>{item.dest_currency}</Text>
          <Text style={s.rowDot}>·</Text>
          <Text style={s.rowTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>
      </View>
      <View style={s.rowRight}>
        <Text style={s.rowAmt}>{formatMoney(item.source_amount, item.source_currency)}</Text>
        <Text style={s.rowDestAmt}>{formatMoney(item.dest_amount, item.dest_currency)}</Text>
        <StatusBadge status={item.status} size="sm" />
      </View>
    </TouchableOpacity>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function PaymentHistory() {
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])

  const [selected, setSelected]         = useState<Payment | null>(null)
  const [showNew, setShowNew]           = useState(false)
  const [newPaymentKey, setNewPaymentKey] = useState(0)

  // ── Filter state ──
  const [filtersOpen, setFiltersOpen]   = useState(false)
  const [preset, setPreset]             = useState<Preset>('30d')
  const [dateRange, setDateRange]       = useState<DateRange>(() => presetToRange('30d'))
  const [statusFilter, setStatusFilter] = useState('')
  // Custom date picker state
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null)
  const [pickerDate, setPickerDate]     = useState<Date>(new Date())

  const filterAnim = useRef(new Animated.Value(1)).current

  const toggleFilters = useCallback(() => {
    setFiltersOpen(v => !v)
    Animated.spring(filterAnim, {
      toValue: filtersOpen ? 0 : 1,
      useNativeDriver: false,
      speed: 20,
    }).start()
  }, [filtersOpen])

  // ── Derived filter params ──
  const queryParams = useMemo(() => ({
    limit: 100,
    status:  statusFilter || undefined,
    from:    dateRange.from ? toIso(dateRange.from) : undefined,
    to:      dateRange.to   ? toIso(dateRange.to)   : undefined,
  }), [statusFilter, dateRange])

  const isFiltered = preset !== '30d' || !!statusFilter

  // ── Query ──
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments', queryParams],
    queryFn: () => paymentsApi.list(queryParams).then((r) => r.data.data),
  })

  // ── Stat filter ──
  type StatFilter = 'completed' | 'pending' | 'failed' | null
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>(null)

  const STAT_STATUSES: Record<NonNullable<StatFilter>, string[]> = {
    completed: ['completed'],
    pending:   ['pending_approval', 'processing'],
    failed:    ['rejected', 'failed', 'cancelled'],
  }

  const toggleStatFilter = (key: StatFilter) =>
    setActiveStatFilter(prev => prev === key ? null : key)

  // Counts always from full data (stat chips stay honest)
  const completedCount = useMemo(() => (data ?? []).filter((p) => p.status === 'completed').length, [data])
  const pendingCount   = useMemo(() => (data ?? []).filter((p) => ['pending_approval', 'processing'].includes(p.status)).length, [data])
  const failedCount    = useMemo(() => (data ?? []).filter((p) => ['rejected', 'failed', 'cancelled'].includes(p.status)).length, [data])

  // List filtered by active stat chip (client-side, instant)
  const visibleData = useMemo(() => {
    if (!activeStatFilter) return data ?? []
    const statuses = STAT_STATUSES[activeStatFilter]
    return (data ?? []).filter((p) => statuses.includes(p.status))
  }, [data, activeStatFilter])

  const sections = useMemo(() => groupByDate(visibleData), [visibleData])

  const openNew = () => { setNewPaymentKey(k => k + 1); setShowNew(true) }

  // ── Preset selection ──
  const applyPreset = (p: Preset) => {
    setPreset(p)
    if (p !== 'custom') setDateRange(presetToRange(p))
  }

  // ── Custom date picker ──
  const openPicker = (target: 'from' | 'to') => {
    setPickerDate((target === 'from' ? dateRange.from : dateRange.to) ?? new Date())
    setPickerTarget(target)
  }

  const onPickerChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setPickerTarget(null)
    if (!date || !pickerTarget) return
    setDateRange(prev => ({
      from: pickerTarget === 'from' ? date : prev.from,
      to:   pickerTarget === 'to'   ? date : prev.to,
    }))
  }

  const clearFilters = () => {
    setPreset('30d')
    setDateRange(presetToRange('30d'))
    setStatusFilter('')
    setActiveStatFilter(null)
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Payments</Text>
          {data && data.length > 0 && (
            <Text style={s.subtitle}>{data.length} transaction{data.length !== 1 ? 's' : ''}</Text>
          )}
        </View>
        <View style={s.headerRight}>
          {/* Filter toggle */}
          <TouchableOpacity style={[s.filterBtn, filtersOpen && s.filterBtnActive]} onPress={toggleFilters} activeOpacity={0.8}>
            <Ionicons name="options-outline" size={18} color={filtersOpen ? colors.primary : colors.textSecondary} />
            {isFiltered && <View style={s.filterDot} />}
          </TouchableOpacity>

          {/* New payment */}
          <TouchableOpacity style={s.newBtn} onPress={openNew} activeOpacity={0.85}>
            <LinearGradient colors={['#6366F1', '#818CF8']} style={s.newBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={s.newBtnText}>New</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter panel ── */}
      {filtersOpen && (
        <View style={s.filterPanel}>

          {/* Preset chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.presetRow}>
            {PRESETS.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[s.chip, preset === p.value && s.chipActive]}
                onPress={() => applyPreset(p.value)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, preset === p.value && s.chipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Custom date range row */}
          {preset === 'custom' && (
            <View style={s.dateRow}>
              <TouchableOpacity style={s.dateBtn} onPress={() => openPicker('from')} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                <Text style={s.dateBtnText}>
                  {dateRange.from ? fmtShort(dateRange.from) : 'From date'}
                </Text>
              </TouchableOpacity>
              <Ionicons name="arrow-forward" size={14} color={colors.textDisabled} />
              <TouchableOpacity style={s.dateBtn} onPress={() => openPicker('to')} activeOpacity={0.8}>
                <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                <Text style={s.dateBtnText}>
                  {dateRange.to ? fmtShort(dateRange.to) : 'To date'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.presetRow}>
            {STATUS_FILTERS.map(sf => (
              <TouchableOpacity
                key={sf.value}
                style={[s.chip, statusFilter === sf.value && s.chipActive]}
                onPress={() => setStatusFilter(sf.value)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, statusFilter === sf.value && s.chipTextActive]}>{sf.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Active range summary + clear */}
          <View style={s.filterFooter}>
            <View style={s.activeRangeWrap}>
              <Ionicons name="calendar" size={12} color={colors.primary} />
              <Text style={s.activeRange}>
                {dateRange.from && dateRange.to
                  ? `${fmtShort(dateRange.from)} – ${fmtShort(dateRange.to)}`
                  : 'All time'}
              </Text>
            </View>
            {isFiltered && (
              <TouchableOpacity onPress={clearFilters} activeOpacity={0.7}>
                <Text style={s.clearText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── Stat pills ── */}
      {data && data.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.statPillRow}
          style={s.statPillScroll}
        >
          {([
            { label: 'Total',     key: null,        value: data.length,    icon: 'swap-horizontal',  color: colors.primary },
            { label: 'Completed', key: 'completed', value: completedCount, icon: 'checkmark-circle', color: colors.success },
            { label: 'Pending',   key: 'pending',   value: pendingCount,   icon: 'time',             color: colors.warning },
            { label: 'Failed',    key: 'failed',    value: failedCount,    icon: 'close-circle',     color: colors.danger  },
          ] as const).map(({ label, key, value, icon, color }) => {
            const isActive = activeStatFilter === key
            return (
              <TouchableOpacity
                key={label}
                style={[s.statPill, { borderColor: color + '50' }, isActive && { backgroundColor: color, borderColor: color }]}
                onPress={() => toggleStatFilter(key as StatFilter)}
                activeOpacity={0.75}
              >
                <Ionicons name={icon} size={13} color={isActive ? colors.white : color} />
                <Text style={[s.statPillCount, { color: isActive ? colors.white : color }]}>{value}</Text>
                <Text style={[s.statPillLabel, { color: isActive ? colors.white + 'cc' : colors.textMuted }]}>{label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}

      {/* ── List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={s.scroll}
      >
        {sections.length === 0 && !isLoading ? (
          <EmptyState
            icon="swap-horizontal-outline"
            title={isFiltered ? 'No results' : 'No payments yet'}
            subtitle={isFiltered ? 'Try a different date range or status' : 'Send your first international transfer in minutes'}
            actionLabel={isFiltered ? 'Clear filters' : 'New payment'}
            onAction={isFiltered ? clearFilters : openNew}
          />
        ) : (
          sections.map((section) => (
            <View key={section.title}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionLabel}>{section.title}</Text>
              </View>
              <View style={s.group}>
                {section.data.map((item, idx) => (
                  <PaymentRow
                    key={item.id}
                    item={item}
                    isLast={idx === section.data.length - 1}
                    onPress={() => setSelected(item)}
                    s={s}
                    colors={colors}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Native date picker (Android modal, iOS inline) ── */}
      {pickerTarget !== null && (
        Platform.OS === 'ios' ? (
          <Modal visible animationType="slide" transparent onRequestClose={() => setPickerTarget(null)}>
            <View style={s.iosPickerOverlay}>
              <View style={s.iosPickerSheet}>
                <View style={s.iosPickerHeader}>
                  <Text style={s.iosPickerLabel}>
                    {pickerTarget === 'from' ? 'From date' : 'To date'}
                  </Text>
                  <TouchableOpacity onPress={() => setPickerTarget(null)}>
                    <Text style={s.iosPickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="spinner"
                  onChange={onPickerChange}
                  maximumDate={new Date()}
                  minimumDate={pickerTarget === 'to' && dateRange.from ? dateRange.from : undefined}
                  themeVariant="dark"
                  style={{ backgroundColor: colors.card }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display="default"
            onChange={onPickerChange}
            maximumDate={new Date()}
            minimumDate={pickerTarget === 'to' && dateRange.from ? dateRange.from : undefined}
          />
        )
      )}

      {/* ── Detail modal ── */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && <PaymentDetail payment={selected} onClose={() => setSelected(null)} />}
      </Modal>

      {/* ── New payment modal ── */}
      <Modal visible={showNew} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowNew(false)}>
        <NewPayment key={newPaymentKey} onClose={() => setShowNew(false)} />
      </Modal>
    </SafeAreaView>
  )
}

const createStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: screenPadding, paddingTop: spacing.base, paddingBottom: spacing.sm,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: c.textPrimary },
  subtitle: { fontSize: fontSize.xs, color: c.textMuted, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  filterBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: c.primaryFaded, borderColor: c.primary + '60',
  },
  filterDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: c.primary, borderWidth: 1.5, borderColor: c.bg,
  },
  newBtn: { borderRadius: radius.full, overflow: 'hidden' },
  newBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  newBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: c.white },

  // Filter panel
  filterPanel: {
    backgroundColor: c.card,
    borderBottomWidth: 1, borderBottomColor: c.border,
    paddingBottom: spacing.md, gap: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingTop: spacing.sm,
  },
  chip: {
    borderRadius: radius.full, borderWidth: 1, borderColor: c.border,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    backgroundColor: c.surface,
  },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { fontSize: fontSize.xs, fontWeight: '600', color: c.textMuted },
  chipTextActive: { color: c.white },

  // Custom date range
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding,
  },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: c.primaryFaded, borderRadius: radius.md,
    borderWidth: 1, borderColor: c.primary + '40',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  dateBtnText: { fontSize: fontSize.xs, fontWeight: '600', color: c.primary, flex: 1 },

  // Active range summary
  filterFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: screenPadding,
  },
  activeRangeWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeRange: { fontSize: fontSize.xs, color: c.textMuted, fontWeight: '500' },
  clearText: { fontSize: fontSize.xs, color: c.danger, fontWeight: '600' },

  // Stat pills
  statPillScroll: { marginBottom: spacing.sm },
  statPillRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.xs,
  },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full, borderWidth: 1,
    backgroundColor: c.surface,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  statPillCount: { fontSize: fontSize.sm, fontWeight: '800' },
  statPillLabel: { fontSize: fontSize.xs, fontWeight: '600' },

  // List
  scroll: { paddingBottom: spacing['3xl'], gap: spacing.xs },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: c.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  group: {
    marginHorizontal: screenPadding,
    backgroundColor: c.card,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: c.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  rowIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowMeta: { flex: 1, gap: 3 },
  rowBene: { fontSize: fontSize.sm, fontWeight: '600', color: c.textPrimary },
  rowSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowRoute: { fontSize: fontSize.xs, color: c.textSecondary, fontWeight: '500' },
  rowDot: { color: c.textDisabled, fontSize: fontSize.xs },
  rowTime: { fontSize: fontSize.xs, color: c.textMuted },
  rowRight: { alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  rowAmt: { fontSize: fontSize.sm, fontWeight: '700', color: c.textPrimary },
  rowDestAmt: { fontSize: fontSize.xs, color: c.textMuted },

  // iOS date picker sheet
  iosPickerOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iosPickerSheet: {
    backgroundColor: c.card,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: spacing['3xl'], overflow: 'hidden',
    borderWidth: 1, borderColor: c.border,
  },
  iosPickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: screenPadding, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  iosPickerLabel: { fontSize: fontSize.base, fontWeight: '700', color: c.textPrimary },
  iosPickerDone: { fontSize: fontSize.base, fontWeight: '700', color: c.primary },
})
