import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { useNetworkLogStore } from '@/stores/networkLogStore'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Auth headers ──────────────────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const { accessToken, tenantSlug } = useAuthStore.getState()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  if (tenantSlug) config.headers['X-Tenant-Slug'] = tenantSlug
  return config
})

// ── Dev network logger ────────────────────────────────────────────────────────
if (__DEV__) {
  apiClient.interceptors.request.use((config) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    ;(config as any).__logId = id
    ;(config as any).__startedAt = Date.now()

    const headers = { ...(config.headers as Record<string, string>) }
    // Truncate auth token for readability
    if (headers.Authorization) {
      headers.Authorization = headers.Authorization.slice(0, 30) + '…'
    }

    useNetworkLogStore.getState().add({
      id,
      method: (config.method ?? 'GET').toUpperCase(),
      url: (config.baseURL ?? '') + (config.url ?? ''),
      requestHeaders: headers,
      requestBody: config.data ? JSON.parse(JSON.stringify(config.data)) : null,
      status: null,
      responseBody: null,
      error: null,
      duration: null,
      startedAt: Date.now(),
    })
    return config
  })

  apiClient.interceptors.response.use(
    (res) => {
      const id = (res.config as any).__logId
      const start = (res.config as any).__startedAt
      if (id) {
        useNetworkLogStore.getState().update(id, {
          status: res.status,
          responseBody: res.data,
          duration: Date.now() - start,
        })
      }
      return res
    },
    (error) => {
      const id = (error.config as any)?.__logId
      const start = (error.config as any)?.__startedAt
      if (id) {
        useNetworkLogStore.getState().update(id, {
          status: error.response?.status ?? null,
          responseBody: error.response?.data ?? null,
          error: error.message,
          duration: start ? Date.now() - start : null,
        })
      }
      return Promise.reject(error)
    }
  )
}

let refreshPromise: Promise<string> | null = null

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original: InternalAxiosRequestConfig & { _retry?: boolean } = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const { refreshToken, tenantSlug } = useAuthStore.getState()
            const { data } = await axios.post(
              `${BASE_URL}/auth/refresh`,
              { refreshToken },
              { headers: { 'X-Tenant-Slug': tenantSlug } }
            )
            const newAccess: string = data.data.accessToken
            useAuthStore.getState().updateTokens(newAccess, data.data.refreshToken)
            return newAccess
          })().finally(() => { refreshPromise = null })
        }
        const newToken = await refreshPromise
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch {
        useAuthStore.getState().clearAuth()
        // Lazily clear brand without creating a circular import
        const { useBrandStore } = await import('@/stores/brandStore')
        useBrandStore.getState().clearBrand()
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)
