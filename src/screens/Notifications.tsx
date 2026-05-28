import React, { useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import notificationsApi, { type AppNotification } from '@/api/notifications'
import { useColors, type Colors } from '@/hooks/useColors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatTimeAgo } from '@/utils/format'
import { EmptyState } from '@/components/ui/EmptyState'

// Semantic colors — theme-independent
const NOTIF_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  'payment.pending_approval': { icon: 'time-outline',             color: '#F59E0B' },
  'payment.status_changed':   { icon: 'swap-horizontal-outline',  color: '#3B82F6' },
  'kyc.submitted':            { icon: 'document-text-outline',    color: '#6366F1' },
  'kyc.approved':             { icon: 'checkmark-circle-outline', color: '#10B981' },
  'kyc.rejected':             { icon: 'close-circle-outline',     color: '#EF4444' },
}

interface Props { onClose: () => void }

export function Notifications({ onClose }: Props) {
  const qc = useQueryClient()
  const colors = useColors()
  const s = useMemo(() => createStyles(colors), [colors])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 50 }).then((r) => r.data.data),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = (data ?? []).filter((n) => !n.read_at).length
  const notifications = data ?? []

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.title}>Notifications</Text>
          {unreadCount > 0 && <Text style={s.subtitle}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            style={s.markAllBtn}
          >
            <Text style={s.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          contentContainerStyle={s.scroll}
        >
          {notifications.length === 0 ? (
            <EmptyState icon="notifications-off-outline" title="No notifications" subtitle="You're all caught up" />
          ) : (
            <View style={s.group}>
              {notifications.map((item, idx) => {
                const isUnread = !item.read_at
                const isLast = idx === notifications.length - 1
                const cfg = NOTIF_ICONS[item.type] ?? { icon: 'notifications-outline' as const, color: colors.textMuted }
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.row, !isLast && s.rowBorder, isUnread && s.rowUnread]}
                    onPress={() => { if (isUnread) markReadMutation.mutate(item.id) }}
                    activeOpacity={0.65}
                  >
                    {isUnread && <View style={[s.accentBar, { backgroundColor: colors.primary }]} />}
                    <View style={[s.rowIcon, { backgroundColor: cfg.color + '22' }]}>
                      <Ionicons name={cfg.icon} size={19} color={cfg.color} />
                    </View>
                    <View style={s.rowMeta}>
                      <View style={s.titleRow}>
                        <Text style={[s.rowTitle, isUnread && s.rowTitleUnread]} numberOfLines={1}>{item.title}</Text>
                        {isUnread && <View style={s.unreadDot} />}
                      </View>
                      <Text style={s.rowBody} numberOfLines={2}>{item.body}</Text>
                      <Text style={s.rowTime}>{formatTimeAgo(item.created_at)}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </ScrollView>
      )}
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
  subtitle: { fontSize: fontSize.xs, color: c.primary, fontWeight: '600', marginTop: 1 },
  markAllBtn: { paddingHorizontal: spacing.sm },
  markAll: { fontSize: fontSize.sm, color: c.primary, fontWeight: '600' },

  scroll: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },

  group: { backgroundColor: c.card, borderRadius: radius.xl, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md, position: 'relative',
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  rowUnread: { backgroundColor: c.primaryFaded + '18' },
  accentBar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3 },
  rowIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, marginLeft: spacing.xs },
  rowMeta: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowTitle: { flex: 1, fontSize: fontSize.sm, fontWeight: '500', color: c.textSecondary },
  rowTitleUnread: { fontWeight: '700', color: c.textPrimary },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.primary, flexShrink: 0 },
  rowBody: { fontSize: fontSize.xs, color: c.textMuted, lineHeight: 17 },
  rowTime: { fontSize: fontSize.xs, color: c.textDisabled },
})
