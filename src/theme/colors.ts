export const colors = {
  bg: '#0A0E1A',
  card: '#111827',
  surface: '#1C2333',
  surfaceAlt: '#242D40',
  border: '#1F2937',
  borderLight: '#2D3748',

  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryFaded: 'rgba(99, 102, 241, 0.15)',

  success: '#10B981',
  successFaded: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningFaded: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerFaded: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  infoFaded: 'rgba(59, 130, 246, 0.15)',

  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textDisabled: '#4B5563',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const

export type ColorKey = keyof typeof colors
