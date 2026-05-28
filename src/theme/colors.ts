// Static dark-palette export — use ONLY in non-component code (e.g. receipt HTML)
// Inside React components always call `useColors()` from @/hooks/useColors instead.
export { darkColors as colors } from './palette'
export type { Colors as ColorKey } from './palette'
