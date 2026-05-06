import React from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { type NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useQuery } from '@tanstack/react-query'
import kycApi from '@/api/kyc'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { formatDateTime } from '@/utils/format'
import { Button } from '@/components/ui/Button'
import { type SettingsStackParamList } from '@/navigation/SettingsStack'

type Nav = NativeStackNavigationProp<SettingsStackParamList>

const DOC_TYPES = [
  { key: 'passport', label: 'Passport', icon: 'book-outline' as const },
  { key: 'national_id', label: 'National ID', icon: 'card-outline' as const },
  { key: 'address_proof', label: 'Address Proof', icon: 'home-outline' as const },
]

const STATUS_CONFIG = {
  approved: { icon: 'checkmark-circle' as const, color: colors.success, label: 'Verified', message: 'Your identity has been verified. You can now make payments without restrictions.' },
  submitted: { icon: 'time' as const, color: colors.warning, label: 'Under Review', message: 'Your documents have been submitted and are being reviewed. This typically takes 1-2 business days.' },
  rejected:  { icon: 'close-circle' as const, color: colors.danger, label: 'Rejected', message: 'Your KYC application was rejected. Please re-submit with clear, valid documents.' },
  pending:   { icon: 'ellipse-outline' as const, color: colors.textMuted, label: 'Not Started', message: 'Complete KYC verification to unlock full payment capabilities.' },
}

export function KycStatus() {
  const nav = useNavigation<Nav>()
  const { data, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => kycApi.status().then((r) => r.data.data),
  })

  const status = data?.status ?? 'pending'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const canUpload = status === 'pending' || status === 'rejected'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>KYC Verification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing['2xl'] }} />
        ) : (
          <>
            {/* Status hero */}
            <View style={[styles.hero, { borderTopColor: cfg.color }]}>
              <View style={[styles.heroIcon, { backgroundColor: cfg.color + '22' }]}>
                <Ionicons name={cfg.icon} size={36} color={cfg.color} />
              </View>
              <Text style={[styles.heroLabel, { color: cfg.color }]}>{cfg.label}</Text>
              <Text style={styles.heroMessage}>{cfg.message}</Text>
              {data?.reviewed_at && (
                <Text style={styles.heroDate}>Reviewed {formatDateTime(data.reviewed_at)}</Text>
              )}
            </View>

            {/* Submitted documents */}
            {(data?.documents ?? []).length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Submitted documents</Text>
                <View style={styles.docList}>
                  {data!.documents.map((doc, i) => (
                    <View key={i} style={styles.docRow}>
                      <Ionicons name="document-outline" size={18} color={colors.textMuted} />
                      <View style={styles.docInfo}>
                        <Text style={styles.docType}>{doc.type.replace(/_/g, ' ')}</Text>
                        <Text style={styles.docFile} numberOfLines={1}>{doc.filename}</Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Upload CTAs */}
            {canUpload && (
              <>
                <Text style={styles.sectionLabel}>Upload documents</Text>
                <View style={styles.docTypeList}>
                  {DOC_TYPES.map((d) => (
                    <TouchableOpacity
                      key={d.key}
                      style={styles.docTypeCard}
                      onPress={() => nav.navigate('KycDocumentUpload', { docType: d.key })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.docTypeIcon}>
                        <Ionicons name={d.icon} size={22} color={colors.primary} />
                      </View>
                      <Text style={styles.docTypeLabel}>{d.label}</Text>
                      <Ionicons name="camera-outline" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
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
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  scroll: { padding: screenPadding, gap: spacing.base, paddingBottom: spacing['3xl'] },

  hero: {
    alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, borderTopWidth: 3,
    padding: spacing.xl,
  },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  heroLabel: { fontSize: fontSize.xl, fontWeight: '800' },
  heroMessage: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  heroDate: { fontSize: fontSize.xs, color: colors.textDisabled, marginTop: spacing.xs },

  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.sm,
  },

  docList: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  docInfo: { flex: 1 },
  docType: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' },
  docFile: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },

  docTypeList: { gap: spacing.sm },
  docTypeCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.base,
  },
  docTypeIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.primaryFaded, alignItems: 'center', justifyContent: 'center',
  },
  docTypeLabel: { flex: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
})
