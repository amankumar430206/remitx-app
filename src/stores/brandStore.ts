import { create } from 'zustand'

interface BrandState {
  /** Hex primary colour from tenant branding API. null = use palette default. */
  primaryColor: string | null
  /** Tenant/brand display name from the API. null = not loaded yet. */
  tenantName: string | null
  /** Logo URL for the tenant, if one is configured. */
  logoUrl: string | null

  setBrand: (b: { primaryColor?: string | null; tenantName?: string | null; logoUrl?: string | null }) => void
  clearBrand: () => void
}

/**
 * Holds the tenant's branding fetched from /tenants/theme after login.
 * Intentionally NOT persisted — re-fetched on every session start so
 * brand changes are always fresh without a stale cache to clear.
 */
export const useBrandStore = create<BrandState>()((set) => ({
  primaryColor: null,
  tenantName: null,
  logoUrl: null,

  setBrand: (b) => set(b),
  clearBrand: () => set({ primaryColor: null, tenantName: null, logoUrl: null }),
}))
