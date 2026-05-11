import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, Modal, Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useNetworkLogStore, type NetworkEntry } from '@/stores/networkLogStore'
import { colors } from '@/theme/colors'
import { fontSize, radius, screenPadding, spacing } from '@/theme/spacing'

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: number | null, error: string | null): string {
  if (error && !status) return colors.textMuted   // timed out / network error
  if (!status) return colors.warning
  if (status < 300) return colors.success
  if (status < 400) return colors.info
  return colors.danger
}

function methodColor(method: string): string {
  switch (method) {
    case 'GET':    return colors.info
    case 'POST':   return colors.success
    case 'PUT':    return colors.warning
    case 'PATCH':  return '#F97316'
    case 'DELETE': return colors.danger
    default:       return colors.textMuted
  }
}

function shortUrl(url: string): string {
  try { return new URL(url).pathname } catch { return url }
}

function fmt(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function prettyJson(val: unknown): string {
  try { return JSON.stringify(val, null, 2) } catch { return String(val) }
}

function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ── Detail modal ──────────────────────────────────────────────────────────────

type Tab = 'request' | 'response' | 'headers'

function DetailModal({ entry, onClose }: { entry: NetworkEntry; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('response')
  const sc = statusColor(entry.status, entry.error)

  const shareEntry = async () => {
    const text = [
      `${entry.method} ${entry.url}`,
      `Status: ${entry.status ?? 'no response'} | ${fmt(entry.duration)}`,
      '',
      '── Request ──',
      prettyJson(entry.requestBody),
      '',
      '── Response ──',
      prettyJson(entry.responseBody),
      entry.error ? `\n── Error ──\n${entry.error}` : '',
    ].join('\n')
    await Share.share({ message: text })
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={detail.safe} edges={['top']}>
        {/* Header */}
        <View style={detail.header}>
          <TouchableOpacity onPress={onClose} style={detail.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={detail.headerMid}>
            <View style={[detail.methodPill, { backgroundColor: methodColor(entry.method) + '22' }]}>
              <Text style={[detail.method, { color: methodColor(entry.method) }]}>{entry.method}</Text>
            </View>
            <Text style={detail.status} numberOfLines={1}>{shortUrl(entry.url)}</Text>
          </View>
          <TouchableOpacity onPress={shareEntry} style={detail.shareBtn}>
            <Ionicons name="share-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Meta strip */}
        <View style={detail.meta}>
          <View style={[detail.statusPill, { backgroundColor: sc + '22' }]}>
            <Text style={[detail.statusCode, { color: sc }]}>{entry.status ?? entry.error ? 'ERR' : '…'}</Text>
          </View>
          <Text style={detail.metaText}>{fmt(entry.duration)}</Text>
          <Text style={detail.metaText}>{timeLabel(entry.startedAt)}</Text>
        </View>

        {/* Tab bar */}
        <View style={detail.tabs}>
          {(['response', 'request', 'headers'] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={[detail.tab, tab === t && detail.tabActive]} onPress={() => setTab(t)}>
              <Text style={[detail.tabText, tab === t && detail.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={detail.body} contentContainerStyle={detail.bodyContent}>
          {tab === 'response' && (
            <>
              {entry.error && (
                <View style={detail.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                  <Text style={detail.errorText}>{entry.error}</Text>
                </View>
              )}
              <Text style={detail.code}>{prettyJson(entry.responseBody ?? '(no response yet)')}</Text>
            </>
          )}
          {tab === 'request' && (
            <Text style={detail.code}>{prettyJson(entry.requestBody ?? '(empty body)')}</Text>
          )}
          {tab === 'headers' && (
            <>
              <Text style={detail.sectionLabel}>REQUEST HEADERS</Text>
              {Object.entries(entry.requestHeaders).map(([k, v]) => (
                <View key={k} style={detail.headerRow}>
                  <Text style={detail.headerKey}>{k}</Text>
                  <Text style={detail.headerVal} numberOfLines={2}>{String(v)}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function EntryRow({ entry, onPress }: { entry: NetworkEntry; onPress: () => void }) {
  const sc = statusColor(entry.status, entry.error)
  const mc = methodColor(entry.method)
  const isPending = entry.status === null && !entry.error

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.methodTag, { backgroundColor: mc + '18' }]}>
        <Text style={[styles.methodText, { color: mc }]}>{entry.method}</Text>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.path} numberOfLines={1}>{shortUrl(entry.url)}</Text>
        <Text style={styles.time}>{timeLabel(entry.startedAt)}</Text>
      </View>
      <View style={styles.rowRight}>
        {isPending
          ? <Text style={[styles.statusCode, { color: colors.textMuted }]}>…</Text>
          : <Text style={[styles.statusCode, { color: sc }]}>{entry.status ?? 'ERR'}</Text>
        }
        <Text style={styles.duration}>{fmt(entry.duration)}</Text>
      </View>
    </TouchableOpacity>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function NetworkInspector() {
  const nav = useNavigation()
  const { entries, clear } = useNetworkLogStore()
  const [selected, setSelected] = useState<NetworkEntry | null>(null)
  const [filter, setFilter] = useState<'all' | 'errors'>('all')

  const shown = filter === 'errors'
    ? entries.filter((e) => e.error || (e.status !== null && e.status >= 400))
    : entries

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Network</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'errors' && styles.filterBtnActive]}
            onPress={() => setFilter((f) => f === 'errors' ? 'all' : 'errors')}
          >
            <Text style={[styles.filterText, filter === 'errors' && styles.filterTextActive]}>Errors</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clear} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>{entries.length} calls</Text>
        <Text style={styles.statsSep}>·</Text>
        <Text style={[styles.statsText, { color: colors.danger }]}>
          {entries.filter((e) => e.error || (e.status !== null && e.status >= 400)).length} errors
        </Text>
        <Text style={styles.statsSep}>·</Text>
        <Text style={styles.statsText}>
          avg {fmt(
            entries.filter((e) => e.duration !== null).length
              ? Math.round(entries.filter((e) => e.duration !== null).reduce((s, e) => s + e.duration!, 0) /
                  entries.filter((e) => e.duration !== null).length)
              : null
          )}
        </Text>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EntryRow entry={item} onPress={() => setSelected(item)} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="radio-outline" size={32} color={colors.textDisabled} />
            <Text style={styles.emptyText}>No requests yet</Text>
          </View>
        }
      />

      {selected && <DetailModal entry={selected} onClose={() => setSelected(null)} />}
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.base,
  },
  backBtn: { padding: spacing.xs, marginLeft: -spacing.xs },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  filterBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: colors.dangerFaded, borderColor: colors.danger },
  filterText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: colors.danger },
  clearBtn: { padding: spacing.xs },

  statsBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingBottom: spacing.sm,
  },
  statsText: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '500' },
  statsSep: { color: colors.textDisabled },

  list: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },
  sep: { height: 1, backgroundColor: colors.border },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md,
  },
  methodTag: {
    width: 52, paddingVertical: 3, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  methodText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  rowMid: { flex: 1, gap: 3 },
  path: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  time: { fontSize: fontSize.xs, color: colors.textMuted },
  rowRight: { alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  statusCode: { fontSize: fontSize.sm, fontWeight: '800' },
  duration: { fontSize: fontSize.xs, color: colors.textMuted },

  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing['3xl'] },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted },
})

const detail = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.base,
  },
  closeBtn: { padding: spacing.xs, marginLeft: -spacing.xs },
  headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  methodPill: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  method: { fontSize: fontSize.xs, fontWeight: '800' },
  status: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  shareBtn: { padding: spacing.xs },

  meta: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: screenPadding, paddingBottom: spacing.md,
  },
  statusPill: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  statusCode: { fontSize: fontSize.sm, fontWeight: '800' },
  metaText: { fontSize: fontSize.xs, color: colors.textMuted },

  tabs: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: screenPadding,
  },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base, marginRight: spacing.xs },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },

  body: { flex: 1 },
  bodyContent: { padding: screenPadding, paddingBottom: spacing['3xl'] },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.dangerFaded, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.danger + '40',
  },
  errorText: { flex: 1, fontSize: fontSize.sm, color: colors.danger, lineHeight: 18 },

  code: {
    fontFamily: 'monospace', fontSize: 12,
    color: colors.textSecondary, lineHeight: 18,
  },

  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm,
  },
  headerRow: {
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerKey: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  headerVal: { fontSize: fontSize.xs, color: colors.textSecondary, fontFamily: 'monospace' },
})
