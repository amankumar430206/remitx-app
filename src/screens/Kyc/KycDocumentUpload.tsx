import React, { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import { type NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import kycApi from '@/api/kyc'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'
import { Button } from '@/components/ui/Button'
import { type SettingsStackParamList } from '@/navigation/SettingsStack'

type Nav = NativeStackNavigationProp<SettingsStackParamList>
type Route = RouteProp<SettingsStackParamList, 'KycDocumentUpload'>

const DOC_LABELS: Record<string, string> = {
  passport: 'Passport',
  national_id: 'National ID',
  address_proof: 'Address Proof',
}

export function KycDocumentUpload() {
  const nav = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { docType } = route.params
  const qc = useQueryClient()

  const [permission, requestPermission] = useCameraPermissions()
  const [capturedUri, setCapturedUri] = useState<string | null>(null)
  const [facing, setFacing] = useState<'back' | 'front'>('back')
  const cameraRef = useRef<CameraView>(null)

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!capturedUri) throw new Error('No image captured')
      const filename = `${docType}_${Date.now()}.jpg`
      await kycApi.submit([{ filename, type: docType, path: capturedUri }])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc-status'] })
      Alert.alert('Submitted', 'Your document has been submitted for review.', [
        { text: 'OK', onPress: () => nav.navigate('KycStatus') },
      ])
    },
    onError: () => Alert.alert('Error', 'Could not submit document. Please try again.'),
  })

  const capture = async () => {
    if (!cameraRef.current) return
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false })
      if (photo) setCapturedUri(photo.uri)
    } catch {
      Alert.alert('Error', 'Could not capture photo.')
    }
  }

  if (!permission) return <View style={styles.safe} />

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Document</Text>
        </View>
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permSub}>RemitX needs camera access to scan your documents for KYC verification.</Text>
          <Button label="Grant camera access" onPress={requestPermission} style={{ marginTop: spacing.base }} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{DOC_LABELS[docType] ?? 'Document'}</Text>
        {!capturedUri && (
          <TouchableOpacity onPress={() => setFacing((f) => f === 'back' ? 'front' : 'back')}>
            <Ionicons name="camera-reverse-outline" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {!capturedUri ? (
        <>
          <View style={styles.cameraWrap}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
              <View style={styles.overlay}>
                <View style={styles.frame} />
              </View>
            </CameraView>
          </View>
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={styles.hintText}>Position your {DOC_LABELS[docType]?.toLowerCase()} within the frame</Text>
          </View>
          <View style={styles.captureRow}>
            <TouchableOpacity style={styles.captureBtn} onPress={capture}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.preview}>
          <View style={styles.previewCard}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.previewTitle}>Photo captured</Text>
            <Text style={styles.previewSub}>Your {DOC_LABELS[docType]?.toLowerCase()} photo looks good.</Text>
          </View>
          <View style={styles.previewActions}>
            <Button
              label="Retake"
              variant="outline"
              onPress={() => setCapturedUri(null)}
              style={{ flex: 1 }}
            />
            <Button
              label="Submit"
              variant="primary"
              loading={submitMutation.isPending}
              onPress={() => submitMutation.mutate()}
              style={{ flex: 1 }}
            />
          </View>
        </View>
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
  backBtn: { padding: spacing.xs, marginLeft: -spacing.xs, marginRight: spacing.xs },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },

  permissionBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: screenPadding, gap: spacing.base,
  },
  permTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  permSub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  cameraWrap: { flex: 1, marginHorizontal: screenPadding, borderRadius: radius.xl, overflow: 'hidden' },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 260, height: 180, borderRadius: radius.lg,
    borderWidth: 2, borderColor: colors.primary,
    borderStyle: 'dashed',
  },

  hint: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    justifyContent: 'center', paddingVertical: spacing.md,
  },
  hintText: { fontSize: fontSize.xs, color: colors.textMuted },

  captureRow: { alignItems: 'center', paddingBottom: spacing['2xl'], paddingTop: spacing.sm },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white },

  preview: { flex: 1, padding: screenPadding, gap: spacing.xl },
  previewCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
  },
  previewTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  previewSub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  previewActions: { flexDirection: 'row', gap: spacing.md },
})
