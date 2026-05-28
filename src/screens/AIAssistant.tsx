import React, { useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '@/theme/colors'
import { spacing, fontSize, radius, screenPadding } from '@/theme/spacing'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: 'swap-horizontal-outline' as const, label: 'Track a payment', prompt: 'What is the status of my recent payments?' },
  { icon: 'trending-up-outline' as const, label: 'FX rates', prompt: 'What are the current exchange rates for USD to EUR and GBP?' },
  { icon: 'people-outline' as const, label: 'Manage beneficiaries', prompt: 'How do I add a new beneficiary?' },
  { icon: 'shield-checkmark-outline' as const, label: 'KYC help', prompt: 'What documents do I need to complete KYC verification?' },
]

// ─── Mock streaming response ──────────────────────────────────────────────────

const MOCK_RESPONSES: Record<string, string> = {
  default: "I'm your RemitX AI assistant. I can help you track payments, understand exchange rates, manage beneficiaries, and navigate KYC requirements. What would you like to know?",
  payment: "Your most recent payment of $2,500 USD to Acme Corp is currently **processing**. It was submitted 2 hours ago and typically completes within 1–2 business days. You'll receive a notification when it's done.",
  fx: "Current exchange rates:\n\n• **USD → EUR**: 1 USD = 0.9234 EUR\n• **USD → GBP**: 1 USD = 0.7891 GBP\n• **USD → INR**: 1 USD = 83.42 INR\n• **USD → AED**: 1 USD = 3.6725 AED\n\nRates are updated every 60 seconds.",
  beneficiary: "To add a new beneficiary:\n\n1. Go to **Settings → Beneficiaries**\n2. Tap the **+** button\n3. Enter recipient details (name, country, currency)\n4. Add bank details (IBAN, account number, or routing info)\n5. Submit — screening takes a few minutes\n\nOnce cleared, they'll appear in your payment flow.",
  kyc: "For KYC verification you'll need:\n\n• **Identity**: Passport or national ID (clear photo, all 4 corners visible)\n• **Address proof**: Utility bill or bank statement dated within 3 months\n• **Selfie**: A clear selfie holding your ID\n\nDocuments are reviewed within 1 business day.",
}

function getMockResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('payment') || lower.includes('status') || lower.includes('track')) return MOCK_RESPONSES.payment
  if (lower.includes('rate') || lower.includes('fx') || lower.includes('exchange')) return MOCK_RESPONSES.fx
  if (lower.includes('beneficiar') || lower.includes('recipient') || lower.includes('add')) return MOCK_RESPONSES.beneficiary
  if (lower.includes('kyc') || lower.includes('document') || lower.includes('verify')) return MOCK_RESPONSES.kyc
  return MOCK_RESPONSES.default
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <View style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
      {!isUser && (
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.aiAvatar}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Ionicons name="sparkles" size={14} color="#fff" />
        </LinearGradient>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {msg.content}
        </Text>
        <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>
          {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function AIAssistant() {
  const nav = useNavigation()
  const scrollRef = useRef<ScrollView>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isTyping) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate streaming delay
    setTimeout(() => {
      const response = getMockResponse(trimmed)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }])
      setIsTyping(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }, 1000 + Math.random() * 800)

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [isTyping])

  const showEmptyState = messages.length === 0

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.headerAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSubtitle}>RemitX · Always available</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setMessages([])}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.messages, showEmptyState && styles.messagesEmpty]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showEmptyState ? (
            <View style={styles.emptyState}>
              <LinearGradient colors={['#6366F122', '#8B5CF614']} style={styles.emptyGlow} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="sparkles" size={36} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>How can I help?</Text>
              <Text style={styles.emptySub}>Ask me anything about your payments, FX rates, or account.</Text>

              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.label}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(s.prompt)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={s.icon} size={15} color={colors.primary} />
                    <Text style={styles.suggestionText}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {isTyping && (
                <View style={styles.bubbleWrap}>
                  <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.aiAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="sparkles" size={14} color="#fff" />
                  </LinearGradient>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.typingText}>Thinking…</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything…"
              placeholderTextColor={colors.textDisabled}
              multiline
              maxLength={1000}
              onSubmitEditing={() => sendMessage(input)}
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={input.trim() && !isTyping ? ['#6366F1', '#8B5CF6'] : [colors.surface, colors.surface]}
              style={styles.sendBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={input.trim() && !isTyping ? '#fff' : colors.textDisabled}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: screenPadding, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs, marginLeft: -spacing.xs },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.xs, color: colors.textMuted },
  clearBtn: { padding: spacing.xs },

  messages: { padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xl },
  messagesEmpty: { flex: 1, justifyContent: 'center' },

  emptyState: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing['2xl'] },
  emptyGlow: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  emptySub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.xl },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.sm },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.card, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  suggestionText: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: '500' },

  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  aiAvatar: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  bubbleAI: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: fontSize.sm, color: colors.textPrimary, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: colors.textDisabled, alignSelf: 'flex-end' },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.6)' },

  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.lg, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  typingText: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  inputWrap: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    minHeight: 44, justifyContent: 'center',
  },
  input: { fontSize: fontSize.sm, color: colors.textPrimary, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
