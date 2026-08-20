import { useColorScheme } from 'react-native';

/**
 * Exact values lifted from the approved Figma file (teal accent, Tailwind scale).
 * Dark is the primary look; light follows the phone setting.
 */

export const dark = {
  bg: '#111111',
  card: '#1A1A1A',
  cardRaised: '#1A1A1A',
  border: '#2D2D2D',
  text: '#F9FAFB',
  textDim: '#9CA3AF',
  textFaint: '#4B5563',
  accent: '#14B8A6',
  accentText: '#FFFFFF',
  accentSoft: '#115E59',
  track: '#2D2D2D',
  danger: '#F87171',
  warning: '#FBBF24',
};

export const light = {
  bg: '#FFFFFF',
  card: '#F3F4F6',
  cardRaised: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textDim: '#6B7280',
  textFaint: '#9CA3AF',
  accent: '#0D9488',
  accentText: '#FFFFFF',
  accentSoft: '#CCFBF1',
  track: '#E5E7EB',
  danger: '#DC2626',
  warning: '#B45309',
};

export type Palette = typeof dark;

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  hero: { fontSize: 34, fontWeight: '700' as const },
  title: { fontSize: 28, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8 },
};

export function usePalette(): Palette {
  return useColorScheme() === 'light' ? light : dark;
}
