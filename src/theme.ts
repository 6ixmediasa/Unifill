export const palette = {
  bg: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2F7',
  text: '#152238',
  muted: '#68758A',
  border: '#DFE5ED',
  primary: '#1857D6',
  primarySoft: '#E8F0FF',
  success: '#198754',
  warning: '#B7791F',
  danger: '#C0392B',
  info: '#246BCE'
} as const;

export type Palette = typeof palette;
