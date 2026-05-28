import React from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import notificationsApi, { type AppNotification } from '@/api/notifications'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatTimeAgo } from '@/utils/format'
import { EmptyState } from '@/components/ui/EmptyState'

const NOTIF_ICONS: Record<string, { icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; color: string }> = {
  'payment.pending_approval': { icon: 'time-outline',              color: colors.warning },
  'payment.status_changed':   { icon: 'swap-horizontal-outline',   color: colors.info    },
  'kyc.submitted':            { icon: 'document-text-outline',     color: colors.primary },
  'kyc.approved':             { icon: 'checkmark-circle-outline',  color: colors.success },
  'kyc.rejected':             { icon: 'close-circle-outline',      color: colors.danger  },
}

interface Props { onClose: () => void }

export function Notifications({ onClose }: Props) {
  const qc = useQueryClient()

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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            style={styles.markAllBtn}
          >
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          contentContainerStyle={styles.scroll}
        >
          {notifications.length === 0 ? (
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications"
              subtitle="You're all caught up"
            />
          ) : (
            <View style={styles.group}>
              {notifications.map((item, idx) => {
                const isUnread = !item.read_at
                const isLast = idx === notifications.length - 1
                const cfg = NOTIF_ICONS[item.type] ?? { icon: 'notifications-outline' as const, color: colors.textMuted }
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.row, !isLast && styles.rowBorder, isUnread && styles.rowUnread]}
                    onPress={() => { if (isUnread) markReadMutation.mutate(item.id) }}
                    activeOpacity={0.65}
                  >
                    {/* Unread left accent */}
                    {isUnread && <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />}

                    {/* Icon */}
                    <View style={[styles.rowIcon, { backgroundColor: cfg.color + '22' }]}>
                      <Ionicons name={cfg.icon} size={19} color={cfg.color} />
                    </View>

                    {/* Body */}
                    <View style={styles.rowMeta}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.rowTitle, isUnread && styles.rowTitleUnread]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {isUnread && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.rowBody} numberOfLines={2}>{item.body}</Text>
                      <Text style={styles.rowTime}>{formatTimeAgo(item.created_at)}</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.base,
  },
  backBtn: { padding: spacing.xs, marginLeft: -spacing.xs },
  headerMid: { flex: 1 },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600', marginTop: 1 },
  markAllBtn: { paddingHorizontal: spacing.sm },
  markAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },

  scroll: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },

  // Grouped card
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    position: 'relative',
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowUnread: { backgroundColor: colors.primaryFaded + '18' },
  accentBar: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3 },
  rowIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1, marginLeft: spacing.xs,
  },
  rowMeta: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowTitle: { flex: 1, fontSize: fontSize.sm, fontWeight: '500', color: colors.textSecondary },
  rowTitleUnread: { fontWeight: '700', color: colors.textPrimary },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.primary, flexShrink: 0 },
  rowBody: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 17 },
  rowTime: { fontSize: fontSize.xs, color: colors.textDisabled },
})
