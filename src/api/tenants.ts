import { apiClient } from './client'

export interface TenantTheme {
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
  faviconUrl: string | null
  tenantName: string
  fontFamily: string
  hasCustomTheme?: boolean
}

const tenants = {
  /** GET /tenants/theme — returns the active theme for the current tenant */
  theme: () =>
    apiClient.get<{ success: boolean; data: TenantTheme }>('/tenants/theme'),
}

export default tenants
