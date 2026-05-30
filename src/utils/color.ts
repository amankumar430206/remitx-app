/** Parse a 6-digit hex string (#rrggbb) into [r, g, b]. */
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function toHex(r: number, g: number, b: number): string {
  return (
    '#' +
    Math.round(r).toString(16).padStart(2, '0') +
    Math.round(g).toString(16).padStart(2, '0') +
    Math.round(b).toString(16).padStart(2, '0')
  )
}

/** Lighten a hex colour by mixing toward white. amount in [0, 1]. */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex)
  return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}

/** Darken a hex colour by mixing toward black. amount in [0, 1]. */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex)
  return toHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

/** Convert a hex colour to rgba() string. */
export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Returns true if the string looks like a valid 6-digit hex colour. */
export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex)
}
