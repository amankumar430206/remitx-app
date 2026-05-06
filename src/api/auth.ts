import { apiClient } from './client'
import type { AuthUser } from '@/stores/authStore'

export interface LoginPayload {
  email: string
  password: string
  mfaCode?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  mfaRequired?: boolean
  mfaChallengeToken?: string
  user: AuthUser
}

const auth = {
  login: (payload: LoginPayload, tenantSlug: string) =>
    apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/login', payload, {
      headers: { 'X-Tenant-Slug': tenantSlug },
    }),

  refresh: (refreshToken: string) =>
    apiClient.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
      '/auth/refresh',
      { refreshToken }
    ),

  logout: () => apiClient.post('/auth/logout'),

  me: () =>
    apiClient.get<{ success: boolean; data: AuthUser }>('/auth/me'),

  mfaChallenge: (token: string, code: string) =>
    apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/mfa/challenge', {
      challengeToken: token,
      code,
    }),
}

export default auth
