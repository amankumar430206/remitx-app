import React, { useEffect, useRef } from 'react'
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Animated, Pressable,
} from 'react-native'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius } from '@/theme/spacing'

export interface AlertButton {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

interface Props {
  visible: boolean
  title: string
  message?: string
  buttons: AlertButton[]
  onDismiss: () => void
}

export function AlertDialog({ visible, title, message, buttons, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0.85)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 280 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start()
    } else {
      scale.setValue(0.85)
      opacity.setValue(0)
    }
  }, [visible])

  const stackButtons = buttons.length > 2

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          style={[styles.dialog, { opacity, transform: [{ scale }] }]}
          // prevent overlay press from closing when tapping inside the dialog
        >
          <Pressable>
            <View style={styles.body}>
              <Text style={styles.title}>{title}</Text>
              {!!message && <Text style={styles.message}>{message}</Text>}
            </View>

            <View style={styles.divider} />

            <View style={[styles.buttonRow, stackButtons && styles.buttonCol]}>
              {buttons.map((btn, i) => {
                const isDestructive = btn.style === 'destructive'
                const isCancel = btn.style === 'cancel'
                const isLast = i === buttons.length - 1

                return (
                  <React.Fragment key={btn.text}>
                    <TouchableOpacity
                      style={[
                        styles.btn,
                        stackButtons ? styles.btnStacked : styles.btnInline,
                        !stackButtons && !isLast && styles.btnBorderRight,
                        stackButtons && !isLast && styles.btnBorderBottom,
                      ]}
                      onPress={() => {
                        onDismiss()
                        btn.onPress?.()
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.btnText,
                          isDestructive && styles.btnTextDanger,
                          isCancel && styles.btnTextCancel,
                          !isDestructive && !isCancel && styles.btnTextDefault,
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                )
              })}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonCol: {
    flexDirection: 'column',
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  btnInline: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  btnStacked: {
    paddingHorizontal: spacing.xl,
  },
  btnBorderRight: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  btnBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  btnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  btnTextDefault: {
    color: colors.primary,
  },
  btnTextCancel: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  btnTextDanger: {
    color: colors.danger,
  },
})
