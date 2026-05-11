import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'

export interface AuthUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  tenant_id: string
  status: string
  kyc_status?: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  tenantSlug: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string, tenantSlug: string) => void
  updateTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  setHasHydrated: (v: boolean) => void
}

// ── Field-split SecureStore adapter ──────────────────────────────────────────
// Zustand persist serializes state as one JSON blob which can exceed SecureStore's
// 2048-byte limit when two JWTs + user object are combined. Instead we store each
// field under its own key so every individual write stays well below the limit.

const FIELDS = ['accessToken', 'refreshToken', 'user', 'tenantSlug', 'isAuthenticated'] as const

function fieldKey(base: string, field: string) {
  return `${base}__${field}`
}

const splitSecureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const values = await Promise.all(
      FIELDS.map((f) => SecureStore.getItemAsync(fieldKey(key, f)))
    )

    // If all fields are null the store has never been written
    if (values.every((v) => v === null)) return null

    const [accessToken, refreshToken, userJson, tenantSlug, isAuth] = values
    const state = {
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      user: userJson ? (JSON.parse(userJson) as AuthUser) : null,
      tenantSlug: tenantSlug ?? null,
      isAuthenticated: isAuth === 'true',
    }

    // Zustand persist expects { state, version }
    return JSON.stringify({ state, version: 0 })
  },

  setItem: async (key: string, value: string): Promise<void> => {
    const { state } = JSON.parse(value) as { state: Partial<AuthState> }

    await Promise.all([
      state.accessToken
        ? SecureStore.setItemAsync(fieldKey(key, 'accessToken'), state.accessToken)
        : SecureStore.deleteItemAsync(fieldKey(key, 'accessToken')),

      state.refreshToken
        ? SecureStore.setItemAsync(fieldKey(key, 'refreshToken'), state.refreshToken)
        : SecureStore.deleteItemAsync(fieldKey(key, 'refreshToken')),

      state.user
        ? SecureStore.setItemAsync(fieldKey(key, 'user'), JSON.stringify(state.user))
        : SecureStore.deleteItemAsync(fieldKey(key, 'user')),

      state.tenantSlug
        ? SecureStore.setItemAsync(fieldKey(key, 'tenantSlug'), state.tenantSlug)
        : SecureStore.deleteItemAsync(fieldKey(key, 'tenantSlug')),

      SecureStore.setItemAsync(fieldKey(key, 'isAuthenticated'), String(state.isAuthenticated ?? false)),
    ])
  },

  removeItem: async (key: string): Promise<void> => {
    await Promise.all(FIELDS.map((f) => SecureStore.deleteItemAsync(fieldKey(key, f))))
  },
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenantSlug: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, accessToken, refreshToken, tenantSlug) =>
        set({ user, accessToken, refreshToken, tenantSlug, isAuthenticated: true }),

      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, tenantSlug: null, isAuthenticated: false }),

      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'remitx-auth',
      storage: createJSONStorage(() => splitSecureStorage),
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        tenantSlug: s.tenantSlug,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
