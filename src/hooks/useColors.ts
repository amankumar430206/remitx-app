import { useColorScheme } from 'react-native'
import { darkColors, lightColors, type Colors } from '@/theme/palette'
import { useThemeStore } from '@/stores/themeStore'
import { useBrandStore } from '@/stores/brandStore'
import { lighten, darken, hexToRgba, isValidHex } from '@/utils/color'

/**
 * Returns the active colour palette, merging in the tenant's brand primary
 * colour when one has been fetched from the API.
 *
 * All components that need colours should use this hook — never import a
 * palette directly, so theme + brand changes propagate everywhere.
 */
export function useColors(): Colors {
  const mode = useThemeStore((s) => s.mode)
  const system = useColorScheme()
  const resolved = mode === 'system' ? (system ?? 'dark') : mode
  // Cast needed because Colors = typeof darkColors (literal type) but lightColors
  // has different literal string values — both have the same shape, cast is safe.
  const base = (resolved === 'light' ? lightColors : darkColors) as Colors

  const primaryColor = useBrandStore((s) => s.primaryColor)

  // No brand colour, invalid hex, or identical to the palette default → passthrough
  if (!primaryColor || !isValidHex(primaryColor) || primaryColor === base.primary) {
    return base
  }

  const fadedAlpha = resolved === 'light' ? 0.10 : 0.15

  // Override the primary family with the brand colour. Cast is safe — we spread
  // base (correct shape) and override four string keys with computed hex strings.
  return {
    ...base,
    primary:      primaryColor,
    primaryDark:  darken(primaryColor, 0.12),
    primaryLight: lighten(primaryColor, 0.20),
    primaryFaded: hexToRgba(primaryColor, fadedAlpha),
  } as unknown as Colors
}

export type { Colors }
