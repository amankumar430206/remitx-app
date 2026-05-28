import { useColorScheme } from 'react-native'
import { darkColors, lightColors, type Colors } from '@/theme/palette'
import { useThemeStore } from '@/stores/themeStore'

export function useColors(): Colors {
  const mode = useThemeStore((s) => s.mode)
  const system = useColorScheme()
  const resolved = mode === 'system' ? (system ?? 'dark') : mode
  return resolved === 'light' ? lightColors : darkColors
}

export type { Colors }
