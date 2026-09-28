// Design tokens — "Mist & Graphite".
// Brand: black / #808080 / white, with a slight cool bias so the greys feel chosen.
// Light ("Mist") is soft glass on a misty canvas; dark ("Graphite") is deliberately not pure black.

export type Scheme = 'light' | 'dark';

export type Palette = {
  scheme: Scheme;
  canvasTop: string;
  canvas: string;
  glow: string;
  glass: string;
  glassStrong: string;
  glassBorder: string;
  surface: string;
  /** Selected / inverted fill (black pill in light, white pill in dark). */
  ink: string;
  onInk: string;
  text: string;
  textSoft: string;
  textMuted: string;
  brandGrey: string;
  line: string;
  lineStrong: string;
  track: string;
  tabBar: string;
  /** Selection capsule inside the tab bar. */
  pill: string;
  /** Top-edge sheen that makes glass read as glass. */
  specular: string;
  shadow: string;
  shadowSoft: string;
};

export const light: Palette = {
  scheme: 'light',
  canvasTop: '#F5F7F9',
  canvas: '#E4E8EC',
  glow: '#FFFFFF',
  glass: 'rgba(255,255,255,0.60)',
  glassStrong: 'rgba(255,255,255,0.86)',
  glassBorder: 'rgba(255,255,255,0.95)',
  surface: '#FFFFFF',
  ink: '#16181C',
  onInk: '#FFFFFF',
  text: '#16181C',
  textSoft: '#474C55',
  textMuted: '#697079',
  brandGrey: '#808080',
  line: 'rgba(22,24,28,0.07)',
  lineStrong: 'rgba(22,24,28,0.16)',
  track: 'rgba(22,24,28,0.09)',
  tabBar: 'rgba(255,255,255,0.80)',
  pill: 'rgba(22,24,28,0.07)',
  specular: 'rgba(255,255,255,0.9)',
  shadow: '0px 22px 44px -22px rgba(31,43,58,0.30)',
  shadowSoft: '0px 10px 26px -14px rgba(31,43,58,0.22)',
};

export const dark: Palette = {
  scheme: 'dark',
  canvasTop: '#33373E',
  canvas: '#24272C',
  glow: '#4A515B',
  glass: 'rgba(255,255,255,0.07)',
  glassStrong: 'rgba(52,56,62,0.90)',
  glassBorder: 'rgba(255,255,255,0.11)',
  surface: '#2E3137',
  ink: '#F1F2F4',
  onInk: '#16181C',
  text: '#F1F2F4',
  textSoft: '#C3C7CD',
  textMuted: '#969CA5',
  brandGrey: '#808080',
  line: 'rgba(255,255,255,0.07)',
  lineStrong: 'rgba(255,255,255,0.16)',
  track: 'rgba(255,255,255,0.11)',
  tabBar: 'rgba(54,58,64,0.82)',
  pill: 'rgba(255,255,255,0.11)',
  specular: 'rgba(255,255,255,0.14)',
  shadow: '0px 22px 44px -20px rgba(0,0,0,0.60)',
  shadowSoft: '0px 10px 26px -14px rgba(0,0,0,0.45)',
};

/** Colours used on top of photographs — identical in both themes. */
export const onPhoto = {
  text: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.78)',
  chip: 'rgba(255,255,255,0.16)',
  chipBorder: 'rgba(255,255,255,0.28)',
  scrim: ['rgba(14,16,19,0.02)', 'rgba(14,16,19,0.18)', 'rgba(14,16,19,0.84)'] as const,
};

export const radius = { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/** Horizontal screen gutter. */
export const GUTTER = 18;
/** Space reserved at the bottom of scroll views for the floating tab bar. */
export const TAB_BAR_CLEARANCE = 116;
