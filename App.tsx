import 'react-native-url-polyfill/auto'
import React, { useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import * as LocalAuthentication from 'expo-local-authentication'

import { useAuthStore } from '@/stores/authStore'
import { AuthStack } from '@/navigation/AuthStack'
import { AppTabs } from '@/navigation/AppTabs'
import { BiometricPrompt } from '@/screens/BiometricPrompt'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

const linking = {
  prefixes: ['remitx://'],
  config: {
    screens: {
      Approve: 'payments/:id/approve',
      KYC: 'kyc',
    },
  },
}

export default function App() {
  const { isAuthenticated, clearAuth } = useAuthStore()
  const [biometricLocked, setBiometricLocked] = useState(false)
  const appState = useRef<AppStateStatus>(AppState.currentState)
  const backgroundedAt = useRef<number | null>(null)

  // Biometric gate on resume after >30s in background
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      const prev = appState.current
      appState.current = next

      if (prev === 'active' && (next === 'background' || next === 'inactive')) {
        backgroundedAt.current = Date.now()
      }

      if ((prev === 'background' || prev === 'inactive') && next === 'active') {
        const elapsed = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0
        if (isAuthenticated && elapsed > 30_000) {
          const hasHardware = await LocalAuthentication.hasHardwareAsync()
          const enrolled = await LocalAuthentication.isEnrolledAsync()
          if (hasHardware && enrolled) setBiometricLocked(true)
        }
        backgroundedAt.current = null
      }
    })
    return () => sub.remove()
  }, [isAuthenticated])

  if (isAuthenticated && biometricLocked) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <BiometricPrompt
          onSuccess={() => setBiometricLocked(false)}
          onFallback={() => { clearAuth(); setBiometricLocked(false) }}
        />
      </SafeAreaProvider>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer linking={linking}>
            <StatusBar style="light" />
            {isAuthenticated ? <AppTabs /> : <AuthStack />}
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
