import { apiClient } from './client'

export interface FxQuote {
  quoteId: string
  from: string
  to: string
  fromAmount: string
  toAmount: string
  rate: string
  expiresAt: string
}

export interface FxRate {
  from: string
  to: string
  clientRate: string
  midRate: string
}

const fx = {
  getRates: () =>
    apiClient.get<{ success: boolean; data: FxRate[] }>('/fx/rates'),
  quote: (from: string, to: string, fromAmount: string) =>
    apiClient.post<{ success: boolean; data: FxQuote }>('/fx/quote', { from, to, fromAmount }),
  getQuote: (id: string) =>
    apiClient.get<{ success: boolean; data: FxQuote }>(`/fx/quote/${id}`),
}

export default fx
