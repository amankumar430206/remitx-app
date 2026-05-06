import React from 'react'
import {
  View, Text, StyleSheet, FlatList,
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
  'payment.pending_approval': { icon: 'time-outline', color: colors.warning },
  'payment.status_changed':   { icon: 'swap-horizontal-outline', color: colors.info },
  'kyc.submitted':            { icon: 'document-text-outline', color: colors.primary },
  'kyc.approved':             { icon: 'checkmark-circle-outline', color: colors.success },
  'kyc.rejected':             { icon: 'close-circle-outline', color: colors.danger },
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

  const renderItem = ({ item }: { item: AppNotification }) => {
    const isUnread = !item.read_at
    const cfg = NOTIF_ICONS[item.type] ?? { icon: 'notifications-outline' as const, color: colors.textMuted }
    return (
      <TouchableOpacity
        style={[styles.item, isUnread && styles.itemUnread]}
        onPress={() => { if (isUnread) markReadMutation.mutate(item.id) }}
        activeOpacity={0.75}
      >
        <View style={[styles.itemIcon, { backgroundColor: cfg.color + '22' }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemTitleRow}>
            <Text style={[styles.itemTitle, isUnread && styles.itemTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.itemBody2} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.itemTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="ellipse" size={8} color={colors.primary} />
          <Text style={styles.unreadBannerText}>{unreadCount} unread</Text>
        </View>
      )}

      <FlatList
        data={data ?? []}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          !isLoading
            ? <EmptyState icon="notifications-off-outline" title="No notifications" subtitle="You're all caught up" />
            : <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
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
  backBtn: { padding: spacing.xs, marginLeft: -spacing.xs, marginRight: spacing.xs },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  markAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },

  unreadBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: screenPadding, marginBottom: spacing.sm,
  },
  unreadBannerText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },

  list: { paddingHorizontal: screenPadding, paddingBottom: spacing['3xl'] },
  sep: { height: spacing.xs },

  item: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start',
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.base,
  },
  itemUnread: { borderColor: colors.primary + '44', backgroundColor: colors.primaryFaded + '22' },
  itemIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  itemBody: { flex: 1, gap: 3 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  itemTitle: { flex: 1, fontSize: fontSize.sm, fontWeight: '500', color: colors.textSecondary },
  itemTitleUnread: { fontWeight: '700', color: colors.textPrimary },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.primary },
  itemBody2: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 17 },
  itemTime: { fontSize: fontSize.xs, color: colors.textDisabled, marginTop: 2 },
})
