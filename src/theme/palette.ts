// ─── Color palettes ───────────────────────────────────────────────────────────
// Both palettes share the exact same key shape. Semantic brand colors (primary,
// success, warning, danger, info) are intentionally identical in both themes.

export const darkColors = {
  bg:          '#0A0E1A',
  card:        '#111827',
  surface:     '#1C2333',
  surfaceAlt:  '#242D40',
  border:      '#1F2937',
  borderLight: '#2D3748',

  primary:      '#6366F1',
  primaryDark:  '#4F46E5',
  primaryLight: '#818CF8',
  primaryFaded: 'rgba(99, 102, 241, 0.15)',

  success:      '#10B981',
  successFaded: 'rgba(16, 185, 129, 0.15)',
  warning:      '#F59E0B',
  warningFaded: 'rgba(245, 158, 11, 0.15)',
  danger:       '#EF4444',
  dangerFaded:  'rgba(239, 68, 68, 0.15)',
  info:         '#3B82F6',
  infoFaded:    'rgba(59, 130, 246, 0.15)',

  textPrimary:   '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted:     '#9CA3AF',
  textDisabled:  '#4B5563',

  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
} as const

export const lightColors = {
  bg:          '#F8FAFC',
  card:        '#FFFFFF',
  surface:     '#F1F5F9',
  surfaceAlt:  '#E8EFF7',
  border:      '#E2E8F0',
  borderLight: '#CBD5E1',

  primary:      '#6366F1',
  primaryDark:  '#4F46E5',
  primaryLight: '#818CF8',
  primaryFaded: 'rgba(99, 102, 241, 0.10)',

  success:      '#10B981',
  successFaded: 'rgba(16, 185, 129, 0.12)',
  warning:      '#F59E0B',
  warningFaded: 'rgba(245, 158, 11, 0.12)',
  danger:       '#EF4444',
  dangerFaded:  'rgba(239, 68, 68, 0.12)',
  info:         '#3B82F6',
  infoFaded:    'rgba(59, 130, 246, 0.12)',

  textPrimary:   '#0F172A',
  textSecondary: '#334155',
  textMuted:     '#64748B',
  textDisabled:  '#94A3B8',

  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
} as const

export type Colors = typeof darkColors
