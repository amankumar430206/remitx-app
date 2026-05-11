import { create } from 'zustand'

export interface NetworkEntry {
  id: string
  method: string
  url: string
  requestHeaders: Record<string, string>
  requestBody: unknown
  status: number | null       // null = in-flight or errored with no response
  responseBody: unknown
  error: string | null
  duration: number | null     // ms
  startedAt: number           // Date.now()
}

interface NetworkLogState {
  entries: NetworkEntry[]
  add: (entry: NetworkEntry) => void
  update: (id: string, patch: Partial<NetworkEntry>) => void
  clear: () => void
}

export const useNetworkLogStore = create<NetworkLogState>((set) => ({
  entries: [],

  add: (entry) =>
    set((s) => ({ entries: [entry, ...s.entries].slice(0, 200) })),

  update: (id, patch) =>
    set((s) => ({
      entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  clear: () => set({ entries: [] }),
}))
