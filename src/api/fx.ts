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

const fx = {
  quote: (from: string, to: string, fromAmount: string) =>
    apiClient.post<{ success: boolean; data: FxQuote }>('/fx/quote', { from, to, fromAmount }),
}

export default fx
