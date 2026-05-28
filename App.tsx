import React, { useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus, useColorScheme } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'

import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { AuthStack } from '@/navigation/AuthStack'
import { AppTabs } from '@/navigation/AppTabs'
import { BiometricPrompt } from '@/screens/BiometricPrompt'
import { NetworkBanner } from '@/components/ui/NetworkBanner'
import { AlertProvider } from '@/context/AlertContext'

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
      Settings: {
        screens: {
          KycStatus: 'kyc',
        },
      },
    },
  },
}

export default function App() {
  const { isAuthenticated, clearAuth } = useAuthStore()
  const themeMode = useThemeStore((s) => s.mode)
  const systemScheme = useColorScheme()
  const resolvedTheme = themeMode === 'system' ? (systemScheme ?? 'dark') : themeMode
  const statusBarStyle = resolvedTheme === 'light' ? 'dark' : 'light'
  const [biometricLocked, setBiometricLocked] = useState(false)
  const appState = useRef<AppStateStatus>(AppState.currentState)
  const backgroundedAt = useRef<number | null>(null)

  // Lazy-load expo-local-authentication to avoid startup URL bug
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
          const LocalAuth = await import('expo-local-authentication')
          const hasHardware = await LocalAuth.hasHardwareAsync()
          const enrolled = await LocalAuth.isEnrolledAsync()
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
        <StatusBar style={statusBarStyle} />
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
          <AlertProvider>
            <NavigationContainer linking={linking}>
              <StatusBar style={statusBarStyle} />
              {isAuthenticated ? <AppTabs /> : <AuthStack />}
              <NetworkBanner />
            </NavigationContainer>
          </AlertProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
