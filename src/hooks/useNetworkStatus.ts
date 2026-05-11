import { useEffect, useRef, useState } from 'react'
import * as Network from 'expo-network'

export function useNetworkStatus() {
  // Start optimistic — avoids a flash of the offline banner on mount
  const [isOnline, setIsOnline] = useState(true)
  const prevOnline = useRef(true)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync()
        const online = !!(state.isConnected && state.isInternetReachable !== false)
        if (!cancelled && online !== prevOnline.current) {
          prevOnline.current = online
          setIsOnline(online)
        }
      } catch {
        // Network API unavailable — assume online
      }
    }

    check()
    // Poll at 3 s — fast enough to feel responsive, not so fast it hammers the API
    const interval = setInterval(check, 3000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return { isOnline }
}
